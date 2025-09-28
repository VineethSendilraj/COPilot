#!/usr/bin/env python3
"""
Demo script showing how to use the console client with voice-video-agent.
"""

import asyncio
import os
import subprocess
import sys
import time
from pathlib import Path


def print_banner():
    """Print demo banner."""
    print("🎭 Console Client Demo")
    print("=" * 50)
    print("This demo shows how to run the console client")
    print("with the voice-video-agent system.")
    print("=" * 50)


def check_voice_agent():
    """Check if voice-video-agent directory exists."""
    voice_agent_path = Path("../voice-video-agent")
    if not voice_agent_path.exists():
        print("❌ voice-video-agent directory not found")
        print("💡 Make sure the voice-video-agent is in the parent directory")
        return False
    
    agent_py = voice_agent_path / "agent.py"
    if not agent_py.exists():
        print("❌ agent.py not found in voice-video-agent")
        return False
    
    print("✅ voice-video-agent found")
    return True


def show_setup_instructions():
    """Show setup instructions."""
    print("\n📋 Setup Instructions:")
    print("1. Install dependencies:")
    print("   pip install -r requirements.txt")
    print()
    print("2. Configure environment:")
    print("   cp env_example.txt .env.local")
    print("   # Edit .env.local with your LiveKit credentials")
    print()
    print("3. Test connection:")
    print("   python test_connection.py")
    print()
    print("4. Run demo:")
    print("   python demo.py")


def show_usage_demo():
    """Show usage demonstration."""
    print("\n🎮 Usage Demo:")
    print()
    print("Terminal 1 (Voice-Video-Agent):")
    print("  cd ../voice-video-agent")
    print("  python agent.py")
    print()
    print("Terminal 2 (Console Client):")
    print("  cd console-client")
    print("  python run.py")
    print()
    print("🎯 The console client will:")
    print("• Connect to the same LiveKit room as the agent")
    print("• Allow sending text messages")
    print("• Display agent responses and events")
    print("• Monitor participant connections")
    print()
    print("💡 Available commands in console:")
    print("• /help - Show commands")
    print("• /status - Connection status")
    print("• /participants - List participants")
    print("• Hello - Send message to agent")


async def run_interactive_demo():
    """Run an interactive demo."""
    print("\n🚀 Interactive Demo")
    print("Would you like to:")
    print("1. Test connection")
    print("2. Run console client")
    print("3. Show setup instructions")
    print("4. Exit")
    
    try:
        choice = input("\nEnter choice (1-4): ").strip()
        
        if choice == "1":
            print("\n🧪 Running connection test...")
            from test_connection import main as test_main
            await test_main()
            
        elif choice == "2":
            print("\n🎮 Starting console client...")
            print("💡 Press Ctrl+C to exit")
            time.sleep(2)
            
            from async_console_client import main as client_main
            await client_main()
            
        elif choice == "3":
            show_setup_instructions()
            
        elif choice == "4":
            print("👋 Goodbye!")
            
        else:
            print("❌ Invalid choice")
            
    except KeyboardInterrupt:
        print("\n👋 Demo interrupted")
    except Exception as e:
        print(f"❌ Error: {e}")


def main():
    """Main demo function."""
    print_banner()
    
    # Check environment
    env_file = Path(".env.local")
    if not env_file.exists():
        print("⚠️  .env.local not found")
        show_setup_instructions()
        return
    
    # Check voice agent
    if not check_voice_agent():
        return
    
    # Show usage demo
    show_usage_demo()
    
    # Ask if user wants interactive demo
    try:
        response = input("\nRun interactive demo? (y/n): ").lower().strip()
        if response in ['y', 'yes']:
            asyncio.run(run_interactive_demo())
        else:
            print("👋 Demo completed!")
    except KeyboardInterrupt:
        print("\n👋 Demo interrupted")


if __name__ == "__main__":
    main()
