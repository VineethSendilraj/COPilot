#!/usr/bin/env python3
"""
Test script to verify text communication with the voice-video-agent.
"""

import asyncio
import os
import sys
import random

try:
    from dotenv import load_dotenv
    from livekit import rtc
    from livekit.api import AccessToken
    from livekit.api.access_token import VideoGrants
except ImportError as e:
    print(f"❌ Missing packages: {e}")
    sys.exit(1)

load_dotenv(".env.local")


async def test_agent_communication():
    """Test communication with voice-video-agent."""
    
    # Get credentials
    livekit_url = os.getenv("LIVEKIT_URL")
    api_key = os.getenv("LIVEKIT_API_KEY") 
    api_secret = os.getenv("LIVEKIT_API_SECRET")
    
    if not all([livekit_url, api_key, api_secret]):
        print("❌ Missing environment variables")
        return
    
    print("🧪 Testing Voice-Video-Agent Communication")
    print("=" * 50)
    
    try:
        # Generate room name in web-agent format
        room_name = f"voice_assistant_room_{random.randint(1000, 9999)}"
        participant_identity = f"voice_assistant_user_{random.randint(1000, 9999)}"
        
        print(f"🏠 Room: {room_name}")
        print(f"👤 Identity: {participant_identity}")
        
        # Create access token
        grant = VideoGrants(
            room=room_name,
            room_join=True,
            can_publish=True,
            can_publish_data=True,
            can_subscribe=True,
        )
        
        token = (AccessToken(api_key, api_secret)
                .with_identity(participant_identity)
                .with_name("user")
                .with_grants(grant))
        
        jwt_token = token.to_jwt()
        
        # Create room and connect
        room = rtc.Room()
        
        # Track responses
        responses_received = []
        agent_identity = None
        
        @room.on("participant_connected")
        def on_participant_connected(participant: rtc.RemoteParticipant):
            nonlocal agent_identity
            agent_identity = participant.identity
            print(f"🤖 Agent connected: {participant.identity}")
        
        @room.on("data_received")
        def on_data_received(data: bytes, participant: rtc.RemoteParticipant):
            try:
                message = data.decode('utf-8')
                responses_received.append(message)
                print(f"📩 Agent response: {message}")
            except UnicodeDecodeError:
                print(f"📁 Binary data received: {len(data)} bytes")
        
        @room.on("track_subscribed")
        def on_track_subscribed(track, publication, participant):
            track_type = "🎥" if track.kind == rtc.TrackKind.KIND_VIDEO else "🎵"
            print(f"{track_type} Subscribed to {track.kind} track from {participant.identity}")
        
        # Connect
        print("🔗 Connecting to LiveKit...")
        await room.connect(livekit_url, jwt_token)
        print("✅ Connected successfully!")
        
        # Wait for agent to join
        print("⏳ Waiting for agent to join...")
        wait_time = 0
        while not agent_identity and wait_time < 10:
            await asyncio.sleep(0.5)
            wait_time += 0.5
        
        if not agent_identity:
            print("❌ No agent joined within 10 seconds")
            await room.disconnect()
            return
        
        print(f"🎯 Agent ready: {agent_identity}")
        
        # Send test messages
        test_messages = [
            "Hello agent",
            "What is your current status?", 
            "Set risk threshold to 0.8",
            "What is the current risk level?",
        ]
        
        for i, message in enumerate(test_messages, 1):
            print(f"\n📤 Sending message {i}/4: {message}")
            
            # Send message
            await room.local_participant.publish_data(
                message.encode('utf-8'),
                reliable=True
            )
            
            # Wait for potential response
            initial_count = len(responses_received)
            wait_time = 0
            while len(responses_received) == initial_count and wait_time < 5:
                await asyncio.sleep(0.2)
                wait_time += 0.2
            
            if len(responses_received) > initial_count:
                print("✅ Response received!")
            else:
                print("⏳ No response within 5 seconds")
        
        # Summary
        print(f"\n📊 Test Summary:")
        print(f"   Messages sent: {len(test_messages)}")
        print(f"   Responses received: {len(responses_received)}")
        
        if responses_received:
            print("\n📩 All responses:")
            for i, response in enumerate(responses_received, 1):
                print(f"   {i}. {response}")
        else:
            print("\n⚠️  No text responses received from agent")
            print("💡 The agent might be responding via audio only")
            print("💡 or might need specific triggers to send text responses")
        
        # Disconnect
        await room.disconnect()
        print("\n🔌 Disconnected")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")


if __name__ == "__main__":
    asyncio.run(test_agent_communication())
