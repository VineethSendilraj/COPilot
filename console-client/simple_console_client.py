#!/usr/bin/env python3
"""
Simple console client for connecting to the voice-video-agent.
Uses HTTP API approach similar to the web-agent frontend.
"""

import asyncio
import json
import logging
import os
import random
import sys
from dataclasses import dataclass
from typing import Optional

try:
    import aioconsole
    import aiohttp
except ImportError:
    print("Please install dependencies: pip install aioconsole aiohttp")
    sys.exit(1)

from dotenv import load_dotenv


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


class SimpleConsoleClient:
    """Simple console client that interacts with voice-video-agent via HTTP API."""
    
    def __init__(self, connection_endpoint: str = None):
        self.connection_endpoint = connection_endpoint or "http://localhost:3000/api/connection-details"
        self.connection_details: Optional[ConnectionDetails] = None
        self.running = False
        self.session: Optional[aiohttp.ClientSession] = None
        
    async def get_connection_details(self, agent_name: Optional[str] = None) -> ConnectionDetails:
        """Get connection details from the API endpoint."""
        if not self.session:
            self.session = aiohttp.ClientSession()
        
        # Prepare request payload
        payload = {}
        if agent_name:
            payload = {
                "room_config": {
                    "agents": [{"agent_name": agent_name}]
                }
            }
        
        try:
            print(f"🔗 Requesting connection details from {self.connection_endpoint}")
            
            async with self.session.post(
                self.connection_endpoint,
                json=payload,
                headers={"Content-Type": "application/json"}
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"API returned {response.status}: {error_text}")
                
                data = await response.json()
                
                return ConnectionDetails(
                    server_url=data["serverUrl"],
                    room_name=data["roomName"],
                    participant_name=data["participantName"], 
                    participant_token=data["participantToken"]
                )
                
        except Exception as e:
            logger.error(f"Failed to get connection details: {e}")
            raise
    
    async def create_local_connection_details(self, agent_name: Optional[str] = None) -> ConnectionDetails:
        """Create connection details locally using environment variables."""
        livekit_url = os.getenv("LIVEKIT_URL")
        api_key = os.getenv("LIVEKIT_API_KEY")
        api_secret = os.getenv("LIVEKIT_API_SECRET")
        
        if not all([livekit_url, api_key, api_secret]):
            raise Exception("Missing LiveKit environment variables")
        
        from livekit.api import AccessToken, VideoGrant
        
        # Generate random identifiers
        participant_identity = f"console_user_{random.randint(1000, 9999)}"
        participant_name = "console_user"
        room_name = f"console_room_{random.randint(1000, 9999)}"
        
        # Create participant token
        at = AccessToken(api_key, api_secret)
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
            from livekit import api
            at.room_config = api.RoomConfiguration(
                agents=[api.AgentConfiguration(agent_name=agent_name)]
            )
        
        participant_token = at.to_jwt()
        
        return ConnectionDetails(
            server_url=livekit_url,
            room_name=room_name,
            participant_name=participant_name,
            participant_token=participant_token
        )
    
    async def connect_to_room(self, agent_name: Optional[str] = None, use_local: bool = False) -> bool:
        """Connect to a LiveKit room."""
        try:
            # Get connection details
            if use_local:
                print("🔧 Creating connection details locally...")
                self.connection_details = await self.create_local_connection_details(agent_name)
            else:
                print("🌐 Getting connection details from API...")
                self.connection_details = await self.get_connection_details(agent_name)
            
            print("✅ Connection details obtained!")
            print(f"🏠 Room: {self.connection_details.room_name}")
            print(f"👤 Participant: {self.connection_details.participant_name}")
            print(f"🌐 Server: {self.connection_details.server_url}")
            
            # For now, we'll simulate the connection since we don't have the RTC library
            # In a full implementation, you would use the LiveKit client library here
            print("🎯 Ready to communicate with voice-video-agent!")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to connect to room: {e}")
            return False
    
    async def send_message(self, message: str):
        """Simulate sending a message to the room."""
        if self.connection_details:
            print(f"📤 Sent: {message}")
            # In a real implementation, this would send via LiveKit
            print("💡 Message sent to voice-video-agent (simulated)")
        else:
            print("⚠️  Not connected to room - cannot send message")
    
    async def disconnect(self):
        """Disconnect from the room."""
        if self.session:
            await self.session.close()
            self.session = None
        
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
        print("🤖 Simple Console Client for Voice-Video-Agent")
        print("=" * 60)
        print("Commands:")
        print("  /help        - Show this help")
        print("  /status      - Show connection status")
        print("  /disconnect  - Disconnect from room")
        print("  /quit        - Quit the application")
        print("  <message>    - Send message to agent")
        print("=" * 60)
        
        # Start input handler
        input_task = asyncio.create_task(self._input_handler())
        
        try:
            # Wait for input handler to complete
            await input_task
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
            print("  /disconnect  - Disconnect from room")
            print("  /quit        - Quit the application")
            print("  <message>    - Send message to agent")
            
        elif cmd == "/status":
            if self.connection_details:
                print(f"\n📊 Connection Status: Connected")
                print(f"🏠 Room: {self.connection_details.room_name}")
                print(f"👤 Participant: {self.connection_details.participant_name}")
                print(f"🌐 Server: {self.connection_details.server_url}")
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
    print("🚀 Starting Simple Console Client for Voice-Video-Agent")
    
    # Get optional agent name
    agent_name = os.getenv("AGENT_NAME")
    if agent_name:
        print(f"🤖 Will connect with agent: {agent_name}")
    
    # Check if we should use local mode or API mode
    connection_endpoint = os.getenv("CONNECTION_ENDPOINT")
    use_local = os.getenv("USE_LOCAL_CONNECTION", "false").lower() == "true"
    
    if use_local:
        print("🔧 Using local connection mode")
        # Check required environment variables for local mode
        livekit_url = os.getenv("LIVEKIT_URL")
        api_key = os.getenv("LIVEKIT_API_KEY") 
        api_secret = os.getenv("LIVEKIT_API_SECRET")
        
        if not all([livekit_url, api_key, api_secret]):
            print("❌ Missing required environment variables for local mode:")
            print("   - LIVEKIT_URL")
            print("   - LIVEKIT_API_KEY")
            print("   - LIVEKIT_API_SECRET")
            print("💡 Please set these in .env.local file")
            return
    else:
        print(f"🌐 Using API endpoint: {connection_endpoint or 'default'}")
    
    # Create and run client
    client = SimpleConsoleClient(connection_endpoint)
    
    try:
        # Connect to room
        if await client.connect_to_room(agent_name, use_local):
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
