#!/usr/bin/env python3
"""
Test script to verify Pi cloud connection capabilities.
Tests the connection without requiring camera/audio hardware.
"""

import asyncio
import os
import random
import sys

try:
    from dotenv import load_dotenv
    from livekit import rtc
    from livekit.api import AccessToken
    from livekit.api.access_token import VideoGrants
except ImportError as e:
    print(f"❌ Missing packages: {e}")
    print("💡 Install with: pip install python-dotenv livekit")
    sys.exit(1)

load_dotenv(".env.local")


async def test_pi_cloud_connection():
    """Test connection to cloud LiveKit for Pi deployment."""
    
    # Get credentials
    livekit_url = os.getenv("LIVEKIT_URL")
    api_key = os.getenv("LIVEKIT_API_KEY") 
    api_secret = os.getenv("LIVEKIT_API_SECRET")
    
    if not all([livekit_url, api_key, api_secret]):
        print("❌ Missing environment variables")
        return False
    
    print("🧪 Testing Pi Cloud Connection")
    print("=" * 40)
    print(f"🌐 Server: {livekit_url}")
    
    try:
        # Generate room credentials like the Pi will
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
        print("✅ Token generated successfully")
        
        # Test connection
        room = rtc.Room()
        
        agent_joined = False
        
        @room.on("participant_connected")
        def on_participant_connected(participant):
            nonlocal agent_joined
            agent_joined = True
            print(f"🤖 Agent connected: {participant.identity}")
        
        @room.on("track_subscribed")
        def on_track_subscribed(track, publication, participant):
            track_type = "🎥" if track.kind == rtc.TrackKind.KIND_VIDEO else "🎵"
            print(f"{track_type} Agent track available: {track.kind}")
        
        print("🔗 Connecting to cloud...")
        await room.connect(livekit_url, jwt_token)
        print("✅ Connected successfully!")
        
        # Wait for agent
        print("⏳ Waiting for voice-video-agent to join...")
        for i in range(10):
            if agent_joined:
                break
            await asyncio.sleep(1)
            if i % 2 == 0:
                print(f"   Waiting... ({10-i}s remaining)")
        
        if agent_joined:
            print("🎉 SUCCESS: Voice-video-agent joined the room!")
            print("✅ Pi cloud connection is working perfectly")
        else:
            print("⚠️  No agent joined, but connection works")
            print("💡 Make sure voice-video-agent is running")
        
        # Test sending data
        print("📤 Testing data transmission...")
        await room.local_participant.publish_data(
            "Hello from Pi test!".encode('utf-8'),
            reliable=True
        )
        print("✅ Data sent successfully")
        
        await room.disconnect()
        print("🔌 Disconnected")
        
        return True
        
    except Exception as e:
        print(f"❌ Connection test failed: {e}")
        return False


async def main():
    """Main test runner."""
    print("🚀 Pi Cloud Connection Test")
    print("This verifies your Pi can connect to the cloud voice-video-agent")
    
    success = await test_pi_cloud_connection()
    
    if success:
        print("\n🎯 READY FOR PI DEPLOYMENT!")
        print("✅ Your Pi will be able to connect to the cloud")
        print("💡 Next step: Deploy pi_cloud_publisher.py to your Raspberry Pi")
    else:
        print("\n❌ Fix connection issues before Pi deployment")
        print("💡 Check your .env.local file and network connection")


if __name__ == "__main__":
    asyncio.run(main())
