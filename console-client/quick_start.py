#!/usr/bin/env python3
"""
Quick start demo for console client - works without full LiveKit setup.
This demonstrates the console interface functionality.
"""

import asyncio
import sys

try:
    import aioconsole
except ImportError:
    print("Please install aioconsole: pip install aioconsole")
    sys.exit(1)


class QuickStartDemo:
    """Demo console client for testing interface without LiveKit."""
    
    def __init__(self):
        self.running = False
        self.messages = []
        
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
                    # Simulate sending message
                    await self.send_message(user_input)
                    
            except (KeyboardInterrupt, EOFError):
                print("\n🛑 Stopping...")
                self.running = False
                break
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"Error: {e}")
    
    async def send_message(self, message: str):
        """Simulate sending a message."""
        self.messages.append(message)
        print(f"📤 Sent: {message}")
        
        # Simulate agent response
        await asyncio.sleep(0.5)
        responses = [
            "🤖 Message received and processed",
            "🤖 Agent is analyzing your input...",
            "🤖 Thank you for your message",
            "🤖 Processing voice-video data...",
            "🤖 Risk assessment complete"
        ]
        import random
        response = random.choice(responses)
        print(f"🎯 Agent: {response}")
    
    async def run_demo(self):
        """Run the demo interface."""
        self.running = True
        
        print("\n" + "=" * 60)
        print("🎭 Quick Start Demo - Console Client Interface")
        print("=" * 60)
        print("This demonstrates the console interface without LiveKit")
        print("💡 Commands:")
        print("  /help        - Show this help")
        print("  /status      - Show demo status")
        print("  /history     - Show message history")
        print("  /quit        - Quit the demo")
        print("  <message>    - Send message (simulated)")
        print("=" * 60)
        
        # Start input handler
        input_task = asyncio.create_task(self._input_handler())
        
        try:
            await input_task
        except asyncio.CancelledError:
            pass
        
        print("👋 Demo completed!")
    
    async def _handle_command(self, command: str):
        """Handle demo commands."""
        cmd = command.lower().strip()
        
        if cmd == "/help":
            print("\n📖 Demo Commands:")
            print("  /help        - Show this help")
            print("  /status      - Show demo status") 
            print("  /history     - Show message history")
            print("  /quit        - Quit the demo")
            print("  <message>    - Send message (simulated)")
            
        elif cmd == "/status":
            print("\n📊 Demo Status:")
            print("🎭 Mode: Quick Start Demo")
            print(f"📝 Messages sent: {len(self.messages)}")
            print("🔗 Connection: Simulated")
            
        elif cmd == "/history":
            print(f"\n📜 Message History ({len(self.messages)} messages):")
            if self.messages:
                for i, msg in enumerate(self.messages, 1):
                    print(f"  {i}. {msg}")
            else:
                print("  No messages sent yet")
                
        elif cmd == "/quit":
            print("\n👋 Exiting demo...")
            self.running = False
            
        else:
            print(f"\n❓ Unknown command: {command}")
            print("💡 Type /help for available commands")


async def main():
    """Run the quick start demo."""
    print("🚀 Console Client Quick Start Demo")
    print("This demonstrates the interface without requiring full LiveKit setup")
    print("For full functionality, configure LiveKit credentials and use run.py")
    
    demo = QuickStartDemo()
    await demo.run_demo()


if __name__ == "__main__":
    asyncio.run(main())
