#!/usr/bin/env python3
"""
Test script to verify LiveKit connection and environment setup.
"""

import asyncio
import os
import sys
from typing import Optional

from dotenv import load_dotenv

try:
    from livekit import api, rtc
    from livekit.api import AccessToken, VideoGrant
except ImportError:
    print("❌ LiveKit packages not installed")
    print("💡 Run: pip install -r requirements.txt")
    sys.exit(1)


load_dotenv(".env.local")


class ConnectionTester:
    """Test LiveKit connection and environment."""
    
    def __init__(self):
        self.livekit_url = os.getenv("LIVEKIT_URL")
        self.api_key = os.getenv("LIVEKIT_API_KEY")
        self.api_secret = os.getenv("LIVEKIT_API_SECRET")
        
    def check_environment(self) -> bool:
        """Check if environment variables are properly set."""
        print("🔍 Checking environment variables...")
        
        missing = []
        if not self.livekit_url:
            missing.append("LIVEKIT_URL")
        if not self.api_key:
            missing.append("LIVEKIT_API_KEY")
        if not self.api_secret:
            missing.append("LIVEKIT_API_SECRET")
            
        if missing:
            print("❌ Missing environment variables:")
            for var in missing:
                print(f"   - {var}")
            return False
            
        print("✅ Environment variables configured")
        print(f"🌐 Server URL: {self.livekit_url}")
        print(f"🔑 API Key: {self.api_key[:8]}...")
        return True
    
    def test_token_generation(self) -> bool:
        """Test JWT token generation."""
        print("\n🎫 Testing token generation...")
        
        try:
            at = AccessToken(self.api_key, self.api_secret)
            at.identity = "test_user"
            at.name = "Test User"
            at.ttl = 60  # 1 minute
            
            grant = VideoGrant(
                room="test_room",
                room_join=True,
                can_publish=True,
                can_publish_data=True,
                can_subscribe=True,
            )
            at.add_grant(grant)
            
            token = at.to_jwt()
            print("✅ Token generation successful")
            print(f"🎫 Token length: {len(token)} characters")
            return True
            
        except Exception as e:
            print(f"❌ Token generation failed: {e}")
            return False
    
    async def test_room_connection(self) -> bool:
        """Test actual room connection."""
        print("\n🏠 Testing room connection...")
        
        try:
            # Generate test token
            at = AccessToken(self.api_key, self.api_secret)
            at.identity = "test_connection"
            at.name = "Connection Test"
            at.ttl = 60
            
            grant = VideoGrant(
                room="test_connection_room",
                room_join=True,
                can_publish=True,
                can_subscribe=True,
            )
            at.add_grant(grant)
            token = at.to_jwt()
            
            # Create room and connect
            room = rtc.Room()
            
            # Set up connection timeout
            connection_timeout = 10  # seconds
            
            print(f"🔗 Attempting connection to {self.livekit_url}...")
            
            # Connect with timeout
            await asyncio.wait_for(
                room.connect(self.livekit_url, token),
                timeout=connection_timeout
            )
            
            print("✅ Connection successful!")
            print(f"🎯 Room state: {room.connection_state}")
            print(f"🆔 Local participant: {room.local_participant.identity}")
            
            # Clean up
            await room.disconnect()
            print("🔌 Disconnected successfully")
            return True
            
        except asyncio.TimeoutError:
            print(f"❌ Connection timeout after {connection_timeout}s")
            print("💡 Check if LiveKit server is running and accessible")
            return False
        except Exception as e:
            print(f"❌ Connection failed: {e}")
            if "403" in str(e):
                print("💡 Check your API credentials")
            elif "network" in str(e).lower() or "dns" in str(e).lower():
                print("💡 Check your network connection and server URL")
            return False
    
    async def run_all_tests(self) -> bool:
        """Run all tests."""
        print("🧪 Running LiveKit Connection Tests")
        print("=" * 50)
        
        # Test environment
        if not self.check_environment():
            return False
        
        # Test token generation
        if not self.test_token_generation():
            return False
        
        # Test connection
        if not await self.test_room_connection():
            return False
        
        print("\n🎉 All tests passed!")
        print("✅ Ready to run console client")
        return True


async def main():
    """Main test runner."""
    tester = ConnectionTester()
    
    try:
        success = await tester.run_all_tests()
        if not success:
            print("\n💡 Fix the issues above before running the console client")
            sys.exit(1)
    except KeyboardInterrupt:
        print("\n🛑 Tests interrupted")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
