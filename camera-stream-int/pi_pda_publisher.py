import asyncio
from livekit import rtc
import cv2
import pyaudio
import pyttsx3
import threading

async def publish_stream():
    room = rtc.Room()
    
    # Set up event handlers
    @room.on("connected")
    def on_connected():
        print("✅ Connected to LiveKit room - ready to receive alerts!")
    
    def play_alert_audio(text):
        """Play TTS alert audio using pyttsx3 - direct speaker output"""
        try:
            print(f"🔊 Speaking alert: {text}")
            
            # Initialize TTS engine
            engine = pyttsx3.init()
            
            # Configure voice settings
            engine.setProperty('rate', 150)  # Speed of speech
            engine.setProperty('volume', 1.0)  # Maximum volume
            
            # Speak the alert directly through speakers
            engine.say(text)
            engine.runAndWait()
            
            print(f"✅ Alert spoken successfully through speakers")
                
        except Exception as e:
            print(f"❌ Error playing TTS alert: {e}")
            import traceback
            traceback.print_exc()

    @room.on("data_received")
    def on_data_received(data: rtc.DataPacket):
        print(f"📨 Data received: {data.topic}")
        if data.topic == "alert":
            text = data.data.decode()
            print(f"🚨 Alert message: {text}")
            
            # Play audio in a separate thread to avoid blocking
            audio_thread = threading.Thread(target=play_alert_audio, args=(text,))
            audio_thread.daemon = False  # Don't kill thread when main exits
            audio_thread.start()
            print(f"🎵 Started audio thread for alert")
    
    url = "ws://172.20.10.2:7880"
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NTkwNDcxMDMsImlkZW50aXR5IjoicGRhLW9mZmljZXIiLCJpc3MiOiJkZXZrZXkiLCJuYW1lIjoicGRhLW9mZmljZXIiLCJuYmYiOjE3NTg5NjA3MDMsInN1YiI6InBkYS1vZmZpY2VyIiwidmlkZW8iOnsicm9vbSI6InBkYS1yb29tIiwicm9vbUpvaW4iOnRydWV9fQ.iVNQM0ycYHHhm45gUk5GIyYUg_2PqEkSkKncC2v535k"
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
                # print("📷 Video frame captured") # Commented out to reduce log spam
            
            audio_data = stream.read(1024, exception_on_overflow=False)
            audio_frame = rtc.AudioFrame(data=audio_data, sample_rate=48000, num_channels=1, samples_per_channel=1024)
            await audio_source.capture_frame(audio_frame)
            # print("🎵 Audio frame captured") # Commented out to reduce log spam
            
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