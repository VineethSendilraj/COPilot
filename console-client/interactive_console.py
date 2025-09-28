#!/usr/bin/env python3
"""
Interactive console client that can actually communicate with the voice-video-agent.
This version establishes a real LiveKit connection and exchanges messages.
"""

import asyncio
import os
import sys

try:
    import aioconsole
    from dotenv import load_dotenv
    from livekit import rtc
    from livekit.api import AccessToken
    from livekit.api.access_token import VideoGrants
except ImportError as e:
    print(f"❌ Missing packages: {e}")
    print("💡 Run: pip install aioconsole python-dotenv livekit")
    sys.exit(1)

# Load environment
load_dotenv(".env.local")


class InteractiveConsoleClient:
    """Interactive console client for real communication with voice-video-agent."""
    
    def __init__(self):
        self.room = None
        self.running = False
        self.agent_participants = {}
        
        # Get credentials
        self.livekit_url = os.getenv("LIVEKIT_URL")
        self.api_key = os.getenv("LIVEKIT_API_KEY") 
        self.api_secret = os.getenv("LIVEKIT_API_SECRET")
        
        if not all([self.livekit_url, self.api_key, self.api_secret]):
            print("❌ Missing environment variables")
            print("💡 Check your .env.local file")
            sys.exit(1)
    
    async def connect_to_room(self):
        """Connect to LiveKit room with agent configuration."""
        try:
            # Generate room name in the same format as web-agent
            import random
            room_name = f"voice_assistant_room_{random.randint(1000, 9999)}"
            participant_identity = f"voice_assistant_user_{random.randint(1000, 9999)}"
            
            # Create access token with same pattern as web-agent
            grant = VideoGrants(
                room=room_name,
                room_join=True,
                can_publish=True,
                can_publish_data=True,
                can_subscribe=True,
            )
            
            token = (AccessToken(self.api_key, self.api_secret)
                    .with_identity(participant_identity)
                    .with_name("user")  # Same as web-agent
                    .with_grants(grant))
            
            # Note: For now, let's test without explicit agent configuration
            # The voice-video-agent should auto-join based on the room naming pattern
            # TODO: Add proper agent configuration once we understand the API
            
            jwt_token = token.to_jwt()
            self.room_name = room_name
            
            # Create room and connect
            self.room = rtc.Room()
            self._setup_event_handlers()
            
            print("🔗 Connecting to LiveKit...")
            await self.room.connect(self.livekit_url, jwt_token)
            
            print("✅ Connected successfully!")
            print(f"🏠 Room: {self.room_name}")
            print(f"👤 Your identity: {self.room.local_participant.identity}")
            print("🤖 Requesting agent assignment...")
            
            return True
            
        except Exception as e:
            print(f"❌ Connection failed: {e}")
            return False
    
    def _setup_event_handlers(self):
        """Set up event handlers for LiveKit room."""
        
        @self.room.on("participant_connected")
        def on_participant_connected(participant: rtc.RemoteParticipant):
            print(f"🤖 Agent joined: {participant.identity}")
            self.agent_participants[participant.identity] = participant
        
        @self.room.on("participant_disconnected") 
        def on_participant_disconnected(participant: rtc.RemoteParticipant):
            print(f"👋 Agent left: {participant.identity}")
            if participant.identity in self.agent_participants:
                del self.agent_participants[participant.identity]
        
        @self.room.on("data_received")
        def on_data_received(data: bytes, participant: rtc.RemoteParticipant):
            try:
                message = data.decode('utf-8')
                print(f"🤖 {participant.identity}: {message}")
            except UnicodeDecodeError:
                print(f"📁 Binary data from {participant.identity}: {len(data)} bytes")
        
        @self.room.on("track_subscribed")
        def on_track_subscribed(
            track: rtc.Track,
            publication: rtc.RemoteTrackPublication,
            participant: rtc.RemoteParticipant
        ):
            track_type = "🎥" if track.kind == rtc.TrackKind.KIND_VIDEO else "🎵"
            print(f"{track_type} Subscribed to {track.kind} track from {participant.identity}")
        
        @self.room.on("disconnected")
        def on_disconnected():
            print("🔌 Disconnected from room")
            self.running = False
    
    async def send_message(self, message: str):
        """Send a message to the room."""
        if self.room and self.room.connection_state == rtc.ConnectionState.CONN_CONNECTED:
            await self.room.local_participant.publish_data(
                message.encode('utf-8'),
                reliable=True
            )
            print(f"📤 You: {message}")
        else:
            print("⚠️ Not connected - cannot send message")
    
    async def _input_handler(self):
        """Handle user input asynchronously."""
        while self.running:
            try:
                user_input = await aioconsole.ainput("💭 > ")
                user_input = user_input.strip()
                
                if not user_input:
                    continue
                
                # Handle commands
                if user_input.startswith('/'):
                    await self._handle_command(user_input)
                else:
                    # Send as message to agents
                    await self.send_message(user_input)
                    
            except (KeyboardInterrupt, EOFError):
                print("\n🛑 Stopping...")
                self.running = False
                break
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"Error in input handler: {e}")
    
    async def run_interactive_session(self):
        """Run the interactive console session."""
        print("\n" + "=" * 60)
        print("🎤 Interactive Console Client - Voice-Video-Agent")
        print("=" * 60)
        print("This connects to the actual voice-video-agent!")
        print()
        print("💡 Commands:")
        print("  /help        - Show this help")
        print("  /status      - Show connection status")
        print("  /agents      - List connected agents")
        print("  /quit        - Quit the application")
        print("  <message>    - Send message to voice-video-agent")
        print("=" * 60)
        
        # Connect to room
        if not await self.connect_to_room():
            print("❌ Failed to connect. Exiting.")
            return
        
        self.running = True
        
        # Wait a moment for agents to connect
        print("⏳ Waiting for agents to connect...")
        await asyncio.sleep(3)
        
        # Show connected agents
        if self.agent_participants:
            print(f"🤖 Found {len(self.agent_participants)} agent(s):")
            for identity in self.agent_participants:
                print(f"  - {identity}")
            print("🎯 Ready to chat with voice-video-agent!")
        else:
            print("⚠️ No agents found. Make sure voice-video-agent is running.")
            print("💡 You can still send messages - agents may join later.")
        
        # Start input handler
        input_task = asyncio.create_task(self._input_handler())
        
        try:
            await input_task
        except asyncio.CancelledError:
            pass
        finally:
            if self.room:
                await self.room.disconnect()
            print("👋 Session ended!")
    
    async def _handle_command(self, command: str):
        """Handle console commands."""
        cmd = command.lower().strip()
        
        if cmd == "/help":
            print("\n📖 Available commands:")
            print("  /help        - Show this help")
            print("  /status      - Show connection status") 
            print("  /agents      - List connected agents")
            print("  /quit        - Quit the application")
            print("  <message>    - Send message to voice-video-agent")
            
        elif cmd == "/status":
            if self.room:
                state = self.room.connection_state
                print(f"\n📊 Connection Status: {state}")
                print(f"🏠 Room: {getattr(self, 'room_name', 'unknown')}")
                print(f"👤 Your identity: {self.room.local_participant.identity}")
                print(f"🌐 Server: {self.livekit_url}")
                print(f"🤖 Agents connected: {len(self.agent_participants)}")
            else:
                print("\n❌ Not connected to any room")
                
        elif cmd == "/agents":
            if self.agent_participants:
                print(f"\n🤖 Connected agents ({len(self.agent_participants)}):")
                for identity, participant in self.agent_participants.items():
                    print(f"  - {identity}")
                    # Show any tracks they're publishing
                    for pub in participant.track_publications.values():
                        track_icon = "🎥" if pub.kind == rtc.TrackKind.KIND_VIDEO else "🎵"
                        print(f"    {track_icon} {pub.kind}: {pub.source}")
            else:
                print("\n🤷 No agents currently connected")
                print("💡 Make sure voice-video-agent is running")
                
        elif cmd == "/quit":
            print("\n👋 Exiting...")
            self.running = False
            
        else:
            print(f"\n❓ Unknown command: {command}")
            print("💡 Type /help for available commands")


async def main():
    """Main entry point."""
    print("🚀 Starting Interactive Console Client")
    
    client = InteractiveConsoleClient()
    
    try:
        await client.run_interactive_session()
    except KeyboardInterrupt:
        print("\n🛑 Interrupted by user")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")


if __name__ == "__main__":
    asyncio.run(main())
