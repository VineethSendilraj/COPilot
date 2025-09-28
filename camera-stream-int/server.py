#!/usr/bin/env python3
import asyncio
import numpy as np
import cv2
import os
import os
from livekit import rtc
from livekit.api import AccessToken, VideoGrants
from moviepy import VideoFileClip
from pydub import AudioSegment
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env')

def generate_token(identity="server", name="Server", room="copilot-room"):
    """Generate a LiveKit access token"""
    api_key = os.getenv('LIVEKIT_API_KEY')
    api_secret = os.getenv('LIVEKIT_API_SECRET')
    
    if not api_key or not api_secret:
        raise ValueError("LIVEKIT_API_KEY and LIVEKIT_API_SECRET must be set in .env file")
    
    token = AccessToken(api_key, api_secret) \
        .with_identity(identity) \
        .with_name(name) \
        .with_grants(VideoGrants(
            room_join=True,
            room=room,
        ))
    return token.to_jwt()

async def send_mp3_alert(room, mp3_filename, alert_text):
    """Send MP3 audio file as data packet to LiveKit room"""
    try:
        if os.path.exists(mp3_filename):
            print(f"🎵 Sending MP3 alert: {mp3_filename}")
            with open(mp3_filename, 'rb') as f:
                mp3_data = f.read()
            
            # Send MP3 data with topic "audio_alert"
            await room.local_participant.publish_data(
                payload=mp3_data, topic="audio_alert", reliable=True
            )
            print(f"✅ MP3 alert sent: {mp3_filename} ({len(mp3_data)} bytes)")
        else:
            print(f"❌ MP3 file not found: {mp3_filename}, falling back to text")
            # Fallback to text alert
            await room.local_participant.publish_data(
                payload=alert_text.encode(), topic="alert", reliable=True
            )
    except Exception as e:
        print(f"❌ Error sending MP3 alert: {e}")
        # Fallback to text alert
        await room.local_participant.publish_data(
            payload=alert_text.encode(), topic="alert", reliable=True
        )

async def play_audio_file(audio_data, audio_source, sample_rate, channels=1):
    """Play audio file (MP3/MP4) through LiveKit audio source"""
    try:
        print("🎵 Starting audio file playback...")
        
        # Calculate frame size (1024 samples per frame)
        frame_size = 1024
        total_frames = len(audio_data) // frame_size
        
        for i in range(total_frames):
            start_idx = i * frame_size
            end_idx = start_idx + frame_size
            frame_data = audio_data[start_idx:end_idx]
            
            # Create audio frame
            audio_frame = rtc.AudioFrame(
                data=frame_data.tobytes(),
                sample_rate=sample_rate,
                num_channels=channels,
                samples_per_channel=frame_size
            )
            
            # Send frame to LiveKit
            await audio_source.capture_frame(audio_frame)
            
            # Wait for next frame (maintain real-time playback)
            await asyncio.sleep(frame_size / sample_rate)
        
        print("✅ Audio file playback completed")
        
    except Exception as e:
        print(f"❌ Error playing audio file: {e}")

async def main():
    room = rtc.Room()
    
    # Audio source for MP4 playback
    audio_source = None
    audio_track = None
    
    # Audio source for MP4 playback
    audio_source = None
    audio_track = None

    @room.on("track_subscribed")
    def on_track_subscribed(track: rtc.Track, publication: rtc.TrackPublication, participant: rtc.RemoteParticipant):
        print(f"📥 Subscribed to track: {track.kind} from {participant.identity}")
        
        if track.kind == rtc.TrackKind.KIND_VIDEO:
            print(f"🎥 Starting video analysis for {participant.identity}")
            
            async def process_video_track():
                video_stream = rtc.VideoStream(track)
                first_frame = None
                frame_count = 0
                last_alert_time = 0
                motion_history = []  # Track motion over time
                motion_threshold = 5  # Require 3 consecutive frames with motion
                
                try:
                    async for frame_event in video_stream:
                        try:
                            frame = frame_event.frame
                            frame_count += 1
                            
                            if frame_count % 3 == 0:
                                frame_data = np.frombuffer(frame.data, dtype=np.uint8)
                                if frame_count % 30 == 0:  # Print every 10th frame (every 3 seconds at 10fps)
                                    print(f"📹 Video frame {frame_count}: width={frame.width}, height={frame.height}, data_size={len(frame_data)}")
                                if frame_count % 30 == 0:  # Print every 10th frame (every 3 seconds at 10fps)
                                    print(f"📹 Video frame {frame_count}: width={frame.width}, height={frame.height}, data_size={len(frame_data)}")
                                
                                expected_pixels = frame.height * frame.width
                                actual_pixels = len(frame_data)
                                
                                if actual_pixels == expected_pixels * 3:  # RGB
                                    frame_image = frame_data.reshape((frame.height, frame.width, 3))
                                    gray = cv2.cvtColor(frame_image, cv2.COLOR_RGB2GRAY)
                                elif actual_pixels == expected_pixels * 4:  # RGBA
                                    frame_image = frame_data.reshape((frame.height, frame.width, 4))
                                    gray = cv2.cvtColor(frame_image, cv2.COLOR_RGBA2GRAY)
                                elif actual_pixels == expected_pixels:  # Grayscale
                                    gray = frame_data.reshape((frame.height, frame.width))
                                elif actual_pixels == expected_pixels * 1.5:  # YUV420 or similar
                                    # Take first expected_pixels bytes (Y channel)
                                    gray_data = frame_data[:expected_pixels]
                                    gray = gray_data.reshape((frame.height, frame.width))
                                else:
                                    # Fallback: take first expected_pixels bytes
                                    if actual_pixels >= expected_pixels:
                                        gray_data = frame_data[:expected_pixels]
                                        gray = gray_data.reshape((frame.height, frame.width))
                                    else:
                                        continue
                                
                                gray = cv2.GaussianBlur(gray, (21, 21), 0)
                                
                                if first_frame is not None:
                                    # Ensure both frames have the same shape
                                    if first_frame.shape == gray.shape:
                                        frame_delta = cv2.absdiff(first_frame, gray)
                                        thresh = cv2.threshold(frame_delta, 25, 255, cv2.THRESH_BINARY)[1]
                                        thresh = cv2.dilate(thresh, None, iterations=2)
                                        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                                        
                                        # Count significant contours
                                        significant_contours = 0
                                        total_motion_area = 0
                                        for contour in contours:
                                            area = cv2.contourArea(contour)
                                            if area > 500:  # Increased threshold for significant motion
                                                significant_contours += 1
                                                total_motion_area += area
                                        
                                        # Add motion status to history
                                        has_motion = significant_contours > 0 and total_motion_area > 2000
                                        motion_history.append(has_motion)
                                        
                                        # Debug motion detection
                                        if frame_count % 30 == 0:  # Print every 10th frame
                                            print(f"🔍 Motion check: contours={significant_contours}, area={total_motion_area:.0f}, has_motion={has_motion}, history={motion_history}")
                                        
                                        # Debug motion detection
                                        if frame_count % 30 == 0:  # Print every 10th frame
                                            print(f"🔍 Motion check: contours={significant_contours}, area={total_motion_area:.0f}, has_motion={has_motion}, history={motion_history}")
                                        
                                        # Keep only last 5 frames
                                        if len(motion_history) > 5:
                                            motion_history.pop(0)
                                        
                                        # Check if we have enough motion history
                                        if len(motion_history) >= motion_threshold:
                                            # Require motion in at least 2 out of 3 recent frames
                                            recent_motion = sum(motion_history[-motion_threshold:])
                                            if recent_motion >= 2:
                                                current_time = asyncio.get_event_loop().time()
                                                if (current_time - last_alert_time) > 8:  # Increased cooldown
                                                    last_alert_time = current_time
                                                    alert = f"Motion detected from {participant.identity} - Area: {total_motion_area:.0f}px"
                                                    
                                                    # Send MP3 audio alert instead of text
                                                    await send_mp3_alert(room, "motion_alert.mp3", alert)
                                                    
                                                    # Send MP3 audio alert instead of text
                                                    await send_mp3_alert(room, "motion_alert.mp3", alert)
                                                    print(f"📤 Motion alert: {alert}")
                                                    # Clear motion history after alert
                                                    motion_history.clear()
                                    else:
                                        # Reset first frame if shapes don't match
                                        print(f"Frame shape mismatch: {first_frame.shape} vs {gray.shape}, resetting")
                                        first_frame = gray.copy()
                                        motion_history.clear()
                                else:
                                    first_frame = gray.copy()
                        except Exception as e:
                            print(f"Video frame error: {e}")
                except Exception as e:
                    print(f"Video track error: {e}")
                finally:
                    await video_stream.aclose()
            
            asyncio.create_task(process_video_track())
            
        elif track.kind == rtc.TrackKind.KIND_AUDIO:
            print(f"🎵 Starting audio analysis for {participant.identity}")
            
            async def process_audio_track():
                audio_stream = rtc.AudioStream(track)
                frame_count = 0
                last_alert_time = 0
                
                try:
                    async for frame_event in audio_stream:
                        try:
                            frame = frame_event.frame
                            frame_count += 1
                            
                            if frame_count % 10 == 0:
                                audio_data = np.frombuffer(frame.data, dtype=np.int16)
                                volume = np.sqrt(np.mean(audio_data.astype(float) ** 2))
                                if frame_count % 100 == 0:  # Print every 10th audio frame
                                    print(f"🎵 Audio frame {frame_count}: volume={volume:.1f}")
                                if frame_count % 100 == 0:  # Print every 10th audio frame
                                    print(f"🎵 Audio frame {frame_count}: volume={volume:.1f}")
                                
                                if volume > 800:  # Lowered threshold
                                    current_time = asyncio.get_event_loop().time()
                                    if (current_time - last_alert_time) > 3:
                                        last_alert_time = current_time
                                        alert = f"Speech detected from {participant.identity} - Volume: {volume:.1f}"
                                        
                                        # Send MP3 audio alert instead of text
                                        await send_mp3_alert(room, "speech_alert.mp3", alert)
                                        
                                        # Send MP3 audio alert instead of text
                                        await send_mp3_alert(room, "speech_alert.mp3", alert)
                                        print(f"📤 Speech alert: {alert}")
                        except Exception as e:
                            print(f"Audio frame error: {e}")
                except Exception as e:
                    print(f"Audio track error: {e}")
                finally:
                    await audio_stream.aclose()
            
            asyncio.create_task(process_audio_track())
        
        print(f"✅ Track {track.kind} ready for processing")

    url = os.getenv("LIVEKIT_URL")
    if not url:
        raise ValueError("LIVEKIT_URL must be set in .env file")
    
    token = generate_token(identity="server", name="Server", room="copilot-room")
    await room.connect(url, token)
    print(f"✅ Server connected to LiveKit room: {url}")
    
    # Test MP3 alert after 5 seconds
    async def test_mp3_alert():
        await asyncio.sleep(5)
        print("🧪 Testing MP3 alert...")
        await send_mp3_alert(room, "motion_alert.mp3", "Test motion alert")
    
    asyncio.create_task(test_mp3_alert())
    
    # Set up audio track from audio file (MP3 or MP4)
    audio_file = "test_voice.mp3"  # Try MP3 first, fallback to MP4
    if not os.path.exists(audio_file):
        audio_file = "test_voice.mp4"
    
    if os.path.exists(audio_file):
        print(f"🎵 Loading audio from {audio_file}")
        
        # Load audio file based on extension
        if audio_file.endswith('.mp3'):
            # Load MP3 with pydub
            audio_segment = AudioSegment.from_mp3(audio_file)
            sample_rate = audio_segment.frame_rate
            channels = audio_segment.channels
            duration = len(audio_segment) / 1000.0  # Convert ms to seconds
            
            # Convert to numpy array (int16)
            audio_data = np.array(audio_segment.get_array_of_samples())
            if channels == 2:
                # Convert stereo to mono by averaging channels
                audio_data = audio_data.reshape(-1, 2).mean(axis=1).astype(np.int16)
                channels = 1
            
        else:
            # Load MP4 with moviepy
            video_clip = VideoFileClip(audio_file)
            audio_clip = video_clip.audio
            
            if audio_clip is not None:
                sample_rate = int(audio_clip.fps)
                channels = 1  # Force mono
                duration = audio_clip.duration
                
                # Convert to numpy array
                audio_array = audio_clip.to_soundarray()
                audio_data = (audio_array * 32767).astype(np.int16)
                
                audio_clip.close()
            else:
                print(f"❌ No audio track found in {audio_file}")
                return
        
        # Create audio source and track
        audio_source = rtc.AudioSource(sample_rate, channels)
        audio_track = rtc.LocalAudioTrack.create_audio_track("audio_file", audio_source)
        await room.local_participant.publish_track(audio_track)
        print(f"🎤 Audio track published: {channels}ch @ {sample_rate}Hz, {duration:.1f}s")
        
        # Start audio playback task
        asyncio.create_task(play_audio_file(audio_data, audio_source, sample_rate, channels))
    else:
        print(f"❌ Audio file not found: test_voice.mp3 or test_voice.mp4")
    
    await asyncio.sleep(float('inf'))

if __name__ == "__main__":
    asyncio.run(main())