import asyncio
import base64
import json
import logging
import os
import time
from dataclasses import dataclass
from typing import Literal, Optional, TypedDict

from dotenv import load_dotenv

from livekit import rtc
from livekit.agents import (
    Agent,
    AgentSession,
    ChatContext,
    JobContext,
    RunContext,
    RoomInputOptions,
    function_tool,
    get_job_context,
)
from livekit.agents.llm import ChatMessage, ImageContent
from livekit.plugins import openai, noise_cancellation

from supabase import Client, create_client


load_dotenv(".env.local")

logger = logging.getLogger(__name__)


class RiskInsightPayload(TypedDict):
    risk_score: float
    risk_label: str
    threats: int
    summary: str
    officer_badge: str


class SupabaseConfig(TypedDict):
    url: str
    anon_key: str


class RiskModelResult(TypedDict):
    score: float
    label: str
    threats: int
    officer_message: str
    dashboard_summary: str


@dataclass
class SessionState:
    threshold: float = 0.6
    last_high_risk_at: float = 0.0
    cooldown_seconds: float = 5.0
    officer_badge: Optional[str] = None
    supabase: Optional[Client] = None


def _load_supabase_config() -> Optional[SupabaseConfig]:
    url = os.getenv("SUPABASE_URL")
    anon_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not anon_key:
        logger.warning("Supabase credentials not set; dashboard updates disabled")
        return None
    return {"url": url, "anon_key": anon_key}


async def _ensure_officer_badge(state: SessionState) -> None:
    if state.officer_badge:
        return
    job_ctx = get_job_context()
    remote_participants = list(job_ctx.room.remote_participants.values())
    if remote_participants:
        state.officer_badge = remote_participants[0].identity


def _create_supabase_client(config: SupabaseConfig) -> Client:
    return create_client(config["url"], config["anon_key"])


async def _insert_dashboard_records(
    state: SessionState,
    payload: RiskInsightPayload,
) -> None:
    if not state.supabase:
        config = _load_supabase_config()
        if not config:
            return
        state.supabase = _create_supabase_client(config)

    client = state.supabase
    try:
        officer_filter = {"badge_number": payload["officer_badge"]}
        officer_resp = client.table("officers").select("id").match(officer_filter).execute()
        officer_rows = officer_resp.data or []
        if not officer_rows:
            logger.warning("Officer badge %s not found", payload["officer_badge"])
            return
        officer_id = officer_rows[0]["id"]

        incident_resp = client.table("incidents").insert(
            {
                "officer_id": officer_id,
                "escalation_type": payload["risk_label"],
                "risk_level": _score_to_risk_level(payload["risk_score"]),
                "description": payload["summary"],
            }
        ).execute()
        incident_rows = incident_resp.data or []
        if not incident_rows:
            logger.warning("Failed to insert incident")
            return
        incident_id = incident_rows[0]["id"]

        client.table("alerts").insert(
            {
                "officer_id": officer_id,
                "incident_id": incident_id,
                "alert_type": payload["risk_label"],
                "message": payload["summary"],
            }
        ).execute()
    except Exception as exc:  # noqa: BLE001
        logger.exception("Supabase insert failed: %s", exc)


def _score_to_risk_level(score: float) -> Literal["low", "medium", "high", "critical"]:
    if score >= 0.85:
        return "critical"
    if score >= 0.7:
        return "high"
    if score >= 0.5:
        return "medium"
    return "low"


def _risk_prompt(threshold: float) -> str:
    return (
        "You are a real‑time police‑safety analyst embedded in a LiveKit call. "
        "Use only the most recent body‑cam video and audio to assess immediate risk, "
        "favoring precise, actionable output over speculation. Your goal is to reduce harm, "
        "prevent unnecessary force, and suggest de‑escalation when appropriate.\n"
        "\n"
        "Output a SINGLE compact JSON object with these fields: \n"
        "  score: float in [0.0, 1.0] — probability of imminent harm given CURRENT evidence;\n"
        "  label: one of {officer_aggression, suspect_weapon_detected, verbal_escalation, multiple_officers_needed, suspect_aggression, officer_in_danger, crowd_control_needed, medical_emergency};\n"
        "  threats: integer ≥ 0 — count of persons posing an immediate threat (0 if uncertain);\n"
        "  officer_message: <= 10 words, ENGLISH ONLY, explicitly name the risk then the action (e.g., 'Weapon risk—create distance', 'Verbal escalation—lower voice');\n"
        "  dashboard_summary: 1–2 sentences (≤ 200 chars), neutral, factual.\n"
        "\n"
        f"Calibration (guideline): 0.00–0.19 none/low, 0.20–0.49 potential, 0.50–0.69 elevated, 0.70–0.84 high, 0.85–1.00 critical. "
        f"If score < {threshold:.2f}, set officer_message to 'clear'.\n"
        "Rules: Speak and write ONLY in English. Do NOT invent objects or intent; base counts and labels only on what is visible/audible now. "
        "When addressing the officer, the spoken message must identify the risk (weapon, aggression, etc.) and the recommended action. "
        "Prefer de‑escalation suggestions when feasible. Return ONLY the JSON object — no markdown, no extra text."
    )


def _parse_model_json(raw: str) -> Optional[RiskModelResult]:
    try:
        data = json.loads(raw)
        score = float(data.get("score", 0.0))
        label = str(data.get("label", "verbal_escalation"))
        threats = int(data.get("threats", 0))
        officer_message = str(data.get("officer_message", "clear"))[:50]
        dashboard_summary = str(data.get("dashboard_summary", ""))[:280]
        return {
            "score": max(0.0, min(1.0, score)),
            "label": label,
            "threats": max(0, threats),
            "officer_message": officer_message,
            "dashboard_summary": dashboard_summary,
        }
    except Exception as exc:  # noqa: BLE001
        logger.warning("Failed to parse risk JSON: %s", exc)
        return None


class RiskAwareAssistant(Agent):
    def __init__(self, threshold: float) -> None:
        super().__init__(
            instructions=_risk_prompt(threshold),
            llm=openai.realtime.RealtimeModel(voice="coral"),
        )
        self.state = SessionState(threshold=threshold)
        self._latest_frame: Optional[bytes] = None
        self._video_stream: Optional[rtc.VideoStream] = None
        self._stream_task: Optional[asyncio.Task] = None

    async def on_enter(self) -> None:
        await self.session.generate_reply(
            instructions="Greet the officer briefly and announce you are monitoring for safety."
        )
        await _ensure_officer_badge(self.state)
        self._subscribe_to_video()

    def _subscribe_to_video(self) -> None:
        job_ctx = get_job_context()
        room = job_ctx.room

        def watch(track: rtc.Track) -> None:
            if track.kind != rtc.TrackKind.KIND_VIDEO:
                return
            if self._video_stream is not None:
                self._video_stream.close()
            self._video_stream = rtc.VideoStream(track)

            async def read_stream() -> None:
                assert self._video_stream
                async for event in self._video_stream:
                    self._latest_frame = base64.b64encode(event.frame).decode("utf-8")

            if self._stream_task:
                self._stream_task.cancel()
            self._stream_task = asyncio.create_task(read_stream())

        participants = list(room.remote_participants.values())
        if participants:
            for pub in participants[0].track_publications.values():
                if pub.track:
                    watch(pub.track)

        @room.on("track_subscribed")
        def _on_track_subscribed(
            track: rtc.Track,
            publication: rtc.RemoteTrackPublication,
            participant: rtc.RemoteParticipant,
        ) -> None:
            watch(track)

    async def on_user_turn_completed(
        self,
        turn_ctx: ChatContext,
        new_message: ChatMessage,
    ) -> None:
        if self._latest_frame:
            image = f"data:image/jpeg;base64,{self._latest_frame}"
            new_message.content.append(ImageContent(image=image))

    async def respond_with_risk(self, text: str) -> None:
        state = self.state
        result = _parse_model_json(text)
        if not result:
            return

        if result["score"] >= state.threshold:
            now = time.time()
            if now - state.last_high_risk_at < state.cooldown_seconds:
                return
            state.last_high_risk_at = now

            officer_message = result["officer_message"]
            if officer_message.lower() != "clear":
                await self.session.generate_reply(
                    instructions=f"Speak this exact alert to the officer: '{officer_message[:10]}'"
                )

            badge = state.officer_badge or "unknown"
            payload: RiskInsightPayload = {
                "risk_score": result["score"],
                "risk_label": result["label"],
                "threats": result["threats"],
                "summary": result["dashboard_summary"],
                "officer_badge": badge,
            }
            await _insert_dashboard_records(state, payload)

    @function_tool()
    async def set_risk_threshold(self, context: RunContext, value: float) -> str:  # type: ignore[override]
        state = self.state
        value = max(0.0, min(1.0, value))
        state.threshold = value
        await self.session.generate_reply(
            instructions=f"Acknowledge that the new risk threshold is {value:.2f}."
        )
        return "threshold updated"


async def entrypoint(ctx: JobContext) -> None:
    threshold = float(os.getenv("RISK_THRESHOLD", "0.6"))

    session = AgentSession()

    await session.start(
        room=ctx.room,
        agent=RiskAwareAssistant(threshold),
        room_input_options=RoomInputOptions(
            video_enabled=True,
            noise_cancellation=noise_cancellation.BVC(),
        ),
    )


if __name__ == "__main__":
    from livekit import agents

    agents.cli.run_app(agents.WorkerOptions(entrypoint_fnc=entrypoint))