import asyncio
from livekit import rtc
from livekit.api import AccessToken, VideoGrants
import cv2
import pyaudio
import subprocess
import threading
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv('.env')

def generate_token(identity="copilot-officer", name="Copilot Officer", roomName="copilot-room"):
    api_key = os.getenv('LIVEKIT_API_KEY')
    api_secret = os.getenv('LIVEKIT_API_SECRET')
    
    token = AccessToken(api_key, api_secret) \
        .with_identity(identity) \
        .with_name(name) \
        .with_grants(VideoGrants(
            room_join=True,
            room=roomName,
        ))
    return token.to_jwt()

async def publish_stream():
    room = rtc.Room()
    
    # Set up event handlers BEFORE connecting
    @room.on("connected")
    def on_connected():
        print("✅ Connected to LiveKit room - ready to receive alerts!")
    
    @room.on("disconnected")
    def on_disconnected():
        print("❌ Disconnected from LiveKit room")
    
    @room.on("participant_connected")
    def on_participant_connected(participant):
        print(f"👥 Participant joined: {participant.identity}")
    
    @room.on("participant_disconnected")
    def on_participant_disconnected(participant):
        print(f"👋 Participant left: {participant.identity}")
    
    def play_alert_audio(text):
        """Play TTS alert audio using espeak via subprocess - direct speaker output"""
        try:
            print(f"🔊 Speaking alert: {text}")
            subprocess.run(["espeak", "-s", "150", "-a", "200", text], check=True)
            print(f"✅ Alert spoken successfully through headphone jack")
        except subprocess.CalledProcessError as e:
            print(f"❌ Error playing TTS alert: {e}")
            import traceback
            traceback.print_exc()
    
    def play_mp3_alert(mp3_data):
        """Play MP3 alert audio directly from bytes - direct speaker output"""
        try:
            print(f"🎵 Playing MP3 alert ({len(mp3_data)} bytes)")
            import tempfile
            with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as temp_file:
                temp_file.write(mp3_data)
                temp_file_path = temp_file.name
            
            result = subprocess.run(["mpg123", "-q", temp_file_path], 
                                    capture_output=True, text=True)
            
            os.unlink(temp_file_path)
            
            if result.returncode == 0:
                print(f"✅ MP3 alert played successfully through headphone jack")
            else:
                print(f"❌ Error playing MP3: {result.stderr}")
                play_alert_audio("Audio alert received")
                
        except Exception as e:
            print(f"❌ Error playing MP3 alert: {e}")
            import traceback
            traceback.print_exc()
            play_alert_audio("Audio alert received")

    @room.on("data_received")
    def on_data_received(data: rtc.DataPacket):
        print(f"📨 Data received: {data.topic}")
        if data.topic == "audio_alert":
            mp3_data = data.data
            print(f"🎵 MP3 alert received ({len(mp3_data)} bytes)")
            audio_thread = threading.Thread(target=play_mp3_alert, args=(mp3_data,))
            audio_thread.daemon = False
            audio_thread.start()
            print(f"🎵 Started audio thread for MP3 alert")
        elif data.topic == "alert":
            text = data.data.decode()
            print(f"🚨 Alert message: {text}")
            audio_thread = threading.Thread(target=play_alert_audio, args=(text,))
            audio_thread.daemon = False
            audio_thread.start()
            print(f"🎵 Started audio thread for text alert")
    
    url = os.getenv("LIVEKIT_URL")
    token = generate_token(identity="copilot-officer", name="Copilot Officer", roomName="copilot-room")

    # Debug connection info
    print(f"🔗 Connecting to LiveKit server: {url}")
    print(f"🏠 Room: copilot-room")
    print(f"👤 Identity: copilot-officer")

    # Connect to room
    await room.connect(url, token)

    # Video track
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("❌ Error: Could not open webcam")
        return
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    video_source = rtc.VideoSource(640, 480)
    video_track = rtc.LocalVideoTrack.create_video_track("webcam", video_source)
    await room.local_participant.publish_track(video_track)
    print("📹 Video track published")

    # Audio track
    p = pyaudio.PyAudio()
    stream = p.open(format=pyaudio.paInt16, channels=1, rate=48000, input=True, frames_per_buffer=1024)
    audio_source = rtc.AudioSource(48000, 1)
    audio_track = rtc.LocalAudioTrack.create_audio_track("mic", audio_source)
    await room.local_participant.publish_track(audio_track)
    print("🎙️ Audio track published")

    # Ready to receive alerts
    print("🎯 PDA Publisher ready - waiting for alerts...")

    # Stream loop
    try:
        while cap.isOpened():
            ret, frame = cap.read()
            if ret:
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                frame_bytes = frame_rgb.tobytes()
                video_frame = rtc.VideoFrame(640, 480, rtc.VideoBufferType.RGB24, frame_bytes)
                video_source.capture_frame(video_frame)
                # print("📷 Video frame captured")  # Commented out to reduce log spam
            
            audio_data = stream.read(1024, exception_on_overflow=False)
            audio_frame = rtc.AudioFrame(data=audio_data, sample_rate=48000, num_channels=1, samples_per_channel=1024)
            await audio_source.capture_frame(audio_frame)
            # print("🎵 Audio frame captured")  # Commented out to reduce log spam
            
            await asyncio.sleep(0.066)  # ~15fps
    finally:
        cap.release()
        print("📹 Video track stopped")
        stream.stop_stream()
        stream.close()
        p.terminate()
        await room.disconnect()
        print("👋 Disconnected from room")

if __name__ == "__main__":
    asyncio.run(publish_stream())