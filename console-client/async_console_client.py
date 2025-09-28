#!/usr/bin/env python3
"""
Async console client for connecting to the voice-video-agent.
This version uses aioconsole for proper async input handling.
"""

import asyncio
import logging
import os
import random
import sys
from dataclasses import dataclass
from typing import Optional

try:
    import aioconsole
except ImportError:
    print("Please install aioconsole: pip install aioconsole")
    sys.exit(1)

from dotenv import load_dotenv
from livekit import api, rtc
from livekit.api import AccessToken, VideoGrant


# Load environment variables
load_dotenv(".env.local")

# Configure logging
log_level = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, log_level),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@dataclass
class ConnectionDetails:
    """Connection details for LiveKit room."""
    server_url: str
    room_name: str
    participant_name: str
    participant_token: str


class AsyncConsoleClient:
    """Async console client for voice-video-agent communication."""
    
    def __init__(self, livekit_url: str, api_key: str, api_secret: str):
        self.livekit_url = livekit_url
        self.api_key = api_key
        self.api_secret = api_secret
        self.room: Optional[rtc.Room] = None
        self.connection_details: Optional[ConnectionDetails] = None
        self.running = False
        self._input_task: Optional[asyncio.Task] = None
        
    def create_participant_token(
        self, 
        participant_identity: str, 
        participant_name: str,
        room_name: str,
        agent_name: Optional[str] = None
    ) -> str:
        """Create a participant token for joining the LiveKit room."""
        at = AccessToken(self.api_key, self.api_secret)
        at.identity = participant_identity
        at.name = participant_name
        at.ttl = 15 * 60  # 15 minutes
        
        grant = VideoGrant(
            room=room_name,
            room_join=True,
            can_publish=True,
            can_publish_data=True,
            can_subscribe=True,
        )
        at.add_grant(grant)
        
        # Add agent configuration if specified
        if agent_name:
            at.room_config = api.RoomConfiguration(
                agents=[api.AgentConfiguration(agent_name=agent_name)]
            )
        
        return at.to_jwt()
    
    def generate_connection_details(self, agent_name: Optional[str] = None) -> ConnectionDetails:
        """Generate connection details for a new room session."""
        # Generate random identifiers
        participant_identity = f"console_user_{random.randint(1000, 9999)}"
        participant_name = "console_user"
        room_name = f"console_room_{random.randint(1000, 9999)}"
        
        # Create participant token
        participant_token = self.create_participant_token(
            participant_identity, participant_name, room_name, agent_name
        )
        
        return ConnectionDetails(
            server_url=self.livekit_url,
            room_name=room_name,
            participant_name=participant_name,
            participant_token=participant_token
        )
    
    async def connect_to_room(self, agent_name: Optional[str] = None) -> bool:
        """Connect to a LiveKit room with optional agent."""
        try:
            # Generate connection details
            self.connection_details = self.generate_connection_details(agent_name)
            
            # Create room instance
            self.room = rtc.Room()
            
            # Set up event handlers
            self._setup_event_handlers()
            
            # Connect to the room
            print(f"🔗 Connecting to room: {self.connection_details.room_name}")
            print(f"🌐 Server URL: {self.connection_details.server_url}")
            
            await self.room.connect(
                self.connection_details.server_url,
                self.connection_details.participant_token
            )
            
            # Enable microphone
            await self.room.local_participant.set_microphone_enabled(True)
            
            print("✅ Successfully connected to LiveKit room!")
            print(f"👤 Participant: {self.connection_details.participant_name}")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to connect to room: {e}")
            return False
    
    def _setup_event_handlers(self):
        """Set up event handlers for the LiveKit room."""
        if not self.room:
            return
        
        @self.room.on("participant_connected")
        def on_participant_connected(participant: rtc.RemoteParticipant):
            print(f"👋 Participant joined: {participant.identity} ({participant.name})")
        
        @self.room.on("participant_disconnected") 
        def on_participant_disconnected(participant: rtc.RemoteParticipant):
            print(f"👋 Participant left: {participant.identity}")
        
        @self.room.on("track_subscribed")
        def on_track_subscribed(
            track: rtc.Track,
            publication: rtc.RemoteTrackPublication,
            participant: rtc.RemoteParticipant
        ):
            track_type = "🎥" if track.kind == rtc.TrackKind.KIND_VIDEO else "🎵"
            print(f"{track_type} Subscribed to {track.kind} track from {participant.identity}")
        
        @self.room.on("data_received")
        def on_data_received(data: bytes, participant: rtc.RemoteParticipant):
            try:
                message = data.decode('utf-8')
                print(f"💬 {participant.identity}: {message}")
            except UnicodeDecodeError:
                print(f"📁 Binary data from {participant.identity} ({len(data)} bytes)")
        
        @self.room.on("disconnected")
        def on_disconnected():
            print("🔌 Disconnected from room")
            self.running = False
    
    async def send_message(self, message: str):
        """Send a text message to the room."""
        if self.room and self.room.connection_state == rtc.ConnectionState.CONN_CONNECTED:
            await self.room.local_participant.publish_data(
                message.encode('utf-8'),
                reliable=True
            )
            print(f"📤 Sent: {message}")
        else:
            print("⚠️  Not connected to room - cannot send message")
    
    async def disconnect(self):
        """Disconnect from the LiveKit room."""
        if self._input_task:
            self._input_task.cancel()
            
        if self.room:
            await self.room.disconnect()
            self.room = None
            self.connection_details = None
        self.running = False
        print("🔌 Disconnected from LiveKit room")
    
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
                    # Send as message
                    await self.send_message(user_input)
                    
            except (KeyboardInterrupt, EOFError):
                print("\n🛑 Stopping...")
                self.running = False
                break
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in input handler: {e}")
    
    async def run_console_interface(self):
        """Run the interactive console interface."""
        self.running = True
        
        print("\n" + "=" * 60)
        print("🤖 Console Client for Voice-Video-Agent")
        print("=" * 60)
        print("Commands:")
        print("  /help        - Show this help")
        print("  /status      - Show connection status")
        print("  /participants - List participants")
        print("  /disconnect  - Disconnect from room")
        print("  /quit        - Quit the application")
        print("  <message>    - Send message to room")
        print("=" * 60)
        
        # Start input handler
        self._input_task = asyncio.create_task(self._input_handler())
        
        try:
            # Wait for input handler to complete
            await self._input_task
        except asyncio.CancelledError:
            pass
        finally:
            await self.disconnect()
    
    async def _handle_command(self, command: str):
        """Handle console commands."""
        cmd = command.lower().strip()
        
        if cmd == "/help":
            print("\n📖 Available commands:")
            print("  /help        - Show this help")
            print("  /status      - Show connection status") 
            print("  /participants - List participants")
            print("  /disconnect  - Disconnect from room")
            print("  /quit        - Quit the application")
            print("  <message>    - Send message to room")
            
        elif cmd == "/status":
            if self.room and self.connection_details:
                state = self.room.connection_state
                print(f"\n📊 Connection Status: {state}")
                print(f"🏠 Room: {self.connection_details.room_name}")
                print(f"👤 Participant: {self.connection_details.participant_name}")
                print(f"🌐 Server: {self.connection_details.server_url}")
            else:
                print("\n❌ Not connected to any room")
                
        elif cmd == "/participants":
            if self.room:
                print(f"\n👥 Participants:")
                print(f"🙋 Local: {self.room.local_participant.identity}")
                
                remote_participants = list(self.room.remote_participants.values())
                if remote_participants:
                    print("🌐 Remote:")
                    for participant in remote_participants:
                        print(f"  👤 {participant.identity} ({participant.name})")
                        for pub in participant.track_publications.values():
                            track_icon = "🎥" if pub.kind == rtc.TrackKind.KIND_VIDEO else "🎵"
                            print(f"    {track_icon} {pub.kind}: {pub.source}")
                else:
                    print("🤷 No remote participants")
            else:
                print("\n❌ Not connected to any room")
                
        elif cmd in ["/disconnect", "/quit"]:
            print("\n🔌 Disconnecting...")
            self.running = False
            
        else:
            print(f"\n❓ Unknown command: {command}")
            print("💡 Type /help for available commands")


async def main():
    """Main entry point."""
    print("🚀 Starting Console Client for Voice-Video-Agent")
    
    # Check required environment variables
    livekit_url = os.getenv("LIVEKIT_URL")
    api_key = os.getenv("LIVEKIT_API_KEY") 
    api_secret = os.getenv("LIVEKIT_API_SECRET")
    
    if not all([livekit_url, api_key, api_secret]):
        print("❌ Missing required environment variables:")
        print("   - LIVEKIT_URL")
        print("   - LIVEKIT_API_KEY")
        print("   - LIVEKIT_API_SECRET")
        print("💡 Please set these in .env.local file")
        print("📄 See env_example.txt for reference")
        return
    
    # Get optional agent name
    agent_name = os.getenv("AGENT_NAME")
    if agent_name:
        print(f"🤖 Will connect with agent: {agent_name}")
    
    # Create and run client
    client = AsyncConsoleClient(livekit_url, api_key, api_secret)
    
    try:
        # Connect to room
        if await client.connect_to_room(agent_name):
            # Run console interface
            await client.run_console_interface()
        else:
            print("❌ Failed to connect to LiveKit room")
    except KeyboardInterrupt:
        print("\n🛑 Interrupted by user")
    except Exception as e:
        logger.error(f"❌ Unexpected error: {e}")
    finally:
        await client.disconnect()


if __name__ == "__main__":
    asyncio.run(main())
