#!/usr/bin/env python3
import asyncio
import numpy as np
import cv2
from livekit import rtc

async def main():
    room = rtc.Room()

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
                                # print(f"Video frame {frame_count}: width={frame.width}, height={frame.height}, data_size={len(frame_data)}")
                                
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
                                                    await room.local_participant.publish_data(
                                                        payload=alert.encode(), topic="alert", reliable=True
                                                    )
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
                                # print(f"Audio frame {frame_count}: volume={volume:.1f}")
                                
                                if volume > 800:  # Lowered threshold
                                    current_time = asyncio.get_event_loop().time()
                                    if (current_time - last_alert_time) > 3:
                                        last_alert_time = current_time
                                        alert = f"Speech detected from {participant.identity} - Volume: {volume:.1f}"
                                        await room.local_participant.publish_data(
                                            payload=alert.encode(), topic="alert", reliable=True
                                        )
                                        print(f"📤 Speech alert: {alert}")
                        except Exception as e:
                            print(f"Audio frame error: {e}")
                except Exception as e:
                    print(f"Audio track error: {e}")
                finally:
                    await audio_stream.aclose()
            
            asyncio.create_task(process_audio_track())
        
        print(f"✅ Track {track.kind} ready for processing")

    url = "ws://localhost:7880"
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NTkwODk0OTEsImlkZW50aXR5Ijoic2VydmVyIiwiaXNzIjoiZGV2a2V5IiwibmFtZSI6IlNlcnZlciIsIm5iZiI6MTc1OTAwMzA5MSwic3ViIjoic2VydmVyIiwidmlkZW8iOnsicm9vbSI6InBkYS1yb29tIiwicm9vbUpvaW4iOnRydWV9fQ.u0wmop3j4MYAGKhgpp6VeH1FMr4fpAOAQo0cJ12yrPk"
    await room.connect(url, token)
    print("✅ Server connected to LiveKit room")
    await asyncio.sleep(float('inf'))

if __name__ == "__main__":
    asyncio.run(main())