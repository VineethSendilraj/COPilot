#!/usr/bin/env python3
"""
Test direct connection to LiveKit without needing the web API.
"""

import asyncio
import os
from dotenv import load_dotenv

# Load environment
load_dotenv(".env.local")

async def test_direct_connection():
    """Test direct connection to voice-video-agent."""
    
    # Import LiveKit
    try:
        from livekit import rtc
        from livekit.api import AccessToken
        from livekit.api.access_token import VideoGrants
    except ImportError as e:
        print(f"❌ Missing LiveKit packages: {e}")
        print("💡 Run: pip install livekit")
        return
    
    # Get credentials
    livekit_url = os.getenv("LIVEKIT_URL")
    api_key = os.getenv("LIVEKIT_API_KEY") 
    api_secret = os.getenv("LIVEKIT_API_SECRET")
    
    if not all([livekit_url, api_key, api_secret]):
        print("❌ Missing environment variables")
        return
    
    print("🚀 Testing Direct Connection to Voice-Video-Agent")
    print(f"🌐 Server: {livekit_url}")
    
    try:
        # Create access token with grants
        grant = VideoGrants(
            room="test_room_console",
            room_join=True,
            can_publish=True,
            can_publish_data=True,
            can_subscribe=True,
        )
        
        token = (AccessToken(api_key, api_secret)
                .with_identity("test_console_user")
                .with_name("Test Console User")
                .with_grants(grant))
        
        # Generate JWT
        jwt_token = token.to_jwt()
        print("✅ Token generated successfully")
        
        # Create room and connect
        room = rtc.Room()
        
        print("🔗 Connecting to LiveKit...")
        await room.connect(livekit_url, jwt_token)
        
        print("✅ Connected successfully!")
        print(f"🏠 Room state: {room.connection_state}")
        print(f"👤 Local participant: {room.local_participant.identity}")
        
        # Set up data message handler
        @room.on("data_received")
        def on_data_received(data: bytes, participant: rtc.RemoteParticipant):
            try:
                message = data.decode('utf-8')
                print(f"📩 Received from {participant.identity}: {message}")
            except Exception as e:
                print(f"📁 Binary data from {participant.identity}: {len(data)} bytes")
        
        # Send a test message
        print("\n📤 Sending test message...")
        await room.local_participant.publish_data(
            "Hello from console client!".encode('utf-8'),
            reliable=True
        )
        
        # Wait a bit to see if there are any responses
        print("⏳ Waiting for responses (10 seconds)...")
        await asyncio.sleep(10)
        
        # Check for remote participants (agents)
        remote_participants = list(room.remote_participants.values())
        if remote_participants:
            print(f"🤖 Found {len(remote_participants)} agent(s):")
            for participant in remote_participants:
                print(f"  - {participant.identity} ({participant.name})")
        else:
            print("🤷 No agents found in room")
            print("💡 Make sure the voice-video-agent is running and connected")
        
        # Disconnect
        await room.disconnect()
        print("🔌 Disconnected")
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        print("💡 Make sure:")
        print("   - LiveKit server is running")
        print("   - Credentials are correct") 
        print("   - No firewall blocking connection")

if __name__ == "__main__":
    asyncio.run(test_direct_connection())
