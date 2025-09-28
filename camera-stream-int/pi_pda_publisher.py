import asyncio
from livekit import rtc
import cv2
import pyaudio

async def publish_stream():
    room = rtc.Room()
    
    # Shared audio resources
    p = pyaudio.PyAudio()
    playback_stream = None
    playback_params = {"sample_rate": None, "channels": None}
    playback_tasks = {}

    # Set up event handlers
    @room.on("connected")
    def on_connected():
        print("✅ Connected to LiveKit room - ready to receive alerts!")
    
    async def play_remote_audio(track: rtc.Track, participant: rtc.RemoteParticipant):
        nonlocal playback_stream
        audio_stream = rtc.AudioStream(track)
        print(f"🎧 Listening to audio from {participant.identity}")

        try:
            async for frame_event in audio_stream:
                frame = frame_event.frame
                try:
                    sample_rate = frame.sample_rate
                    channels = frame.num_channels
                    data = frame.data

                    if playback_stream is None or playback_params["sample_rate"] != sample_rate or playback_params["channels"] != channels:
                        if playback_stream is not None:
                            playback_stream.stop_stream()
                            playback_stream.close()

                        playback_stream = p.open(
                            format=pyaudio.paInt16,
                            channels=channels,
                            rate=sample_rate,
                            output=True,
                        )
                        playback_params["sample_rate"] = sample_rate
                        playback_params["channels"] = channels
                        print(f"🔊 Playback stream ready ({channels}ch @ {sample_rate}Hz)")

                    if playback_stream is not None:
                        playback_stream.write(data)
                except Exception as playback_error:  # noqa: BLE001
                    print(f"❌ Playback error: {playback_error}")
        except Exception as stream_error:  # noqa: BLE001
            print(f"❌ Remote audio stream error: {stream_error}")
        finally:
            await audio_stream.aclose()
            print(f"🛑 Stopped listening to {participant.identity}")

    @room.on("data_received")
    def on_data_received(data: rtc.DataPacket):
        print(f"📨 Data received: {data.topic}")
        if data.topic == "alert":
            text = data.data.decode()
            print(f"🚨 Alert message: {text}")

    @room.on("track_subscribed")
    def on_track_subscribed(
        track: rtc.Track,
        publication: rtc.TrackPublication,
        participant: rtc.RemoteParticipant,
    ) -> None:
        if participant.is_local:
            return
        if track.kind != rtc.TrackKind.KIND_AUDIO:
            return

        task = asyncio.create_task(play_remote_audio(track, participant))
        playback_tasks[publication.sid] = task

    @room.on("track_unsubscribed")
    def on_track_unsubscribed(
        track: rtc.Track,
        publication: rtc.TrackPublication,
        participant: rtc.RemoteParticipant,
    ) -> None:
        task = playback_tasks.pop(publication.sid, None)
        if task is not None:
            task.cancel()
    
    url = "ws://localhost:7880"
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NTkwODk0OTEsImlkZW50aXR5Ijoic2VydmVyIiwiaXNzIjoiZGV2a2V5IiwibmFtZSI6IlNlcnZlciIsIm5iZiI6MTc1OTAwMzA5MSwic3ViIjoic2VydmVyIiwidmlkZW8iOnsicm9vbSI6InBkYS1yb29tIiwicm9vbUpvaW4iOnRydWV9fQ.u0wmop3j4MYAGKhgpp6VeH1FMr4fpAOAQo0cJ12yrPk"
    await room.connect(url, token)

    # Skip video/audio publishing for now - just listen for remote audio
    print("🎧 Ready to listen for remote audio tracks...")

    # Ready to receive alerts
    print("🎯 PDA Publisher ready - waiting for alerts...")

    # Keep connection alive
    try:
        while True:
            await asyncio.sleep(1)
    except KeyboardInterrupt:
        print("🛑 Stopping...")
    finally:
        p.terminate()
        await room.disconnect()
        print("👋 Disconnected from room")

if __name__ == "__main__":
    asyncio.run(publish_stream())