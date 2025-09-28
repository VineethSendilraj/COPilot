#!/usr/bin/env python3
"""
Launcher script for the console client.
Provides a simple way to start the console client with different configurations.
"""

import argparse
import asyncio
import os
import subprocess
import sys
from pathlib import Path


def check_dependencies():
    """Check if required dependencies are installed."""
    required_packages = [
        "livekit-api",
        "livekit-rtc", 
        "python-dotenv",
        "aioconsole"
    ]
    
    missing = []
    for package in required_packages:
        try:
            __import__(package.replace("-", "_"))
        except ImportError:
            missing.append(package)
    
    if missing:
        print("❌ Missing required packages:")
        for pkg in missing:
            print(f"   - {pkg}")
        print("\n💡 Install with: pip install -r requirements.txt")
        return False
    
    return True


def check_env_file():
    """Check if .env.local file exists and has required variables."""
    env_file = Path(".env.local")
    
    if not env_file.exists():
        print("❌ .env.local file not found")
        print("💡 Copy env_example.txt to .env.local and configure your settings")
        return False
    
    # Load and check environment variables
    from dotenv import load_dotenv
    import os
    
    # Load the env file
    load_dotenv(env_file)
    
    required_vars = ["LIVEKIT_URL", "LIVEKIT_API_KEY", "LIVEKIT_API_SECRET"]
    missing_vars = []
    
    for var in required_vars:
        value = os.getenv(var)
        if not value or value.startswith("your_") or value in ["", "your_api_key_here", "your_api_secret_here", "wss://your-livekit-server.com"]:
            missing_vars.append(var)
    
    if missing_vars:
        print("❌ Missing or unconfigured environment variables in .env.local:")
        for var in missing_vars:
            print(f"   - {var}")
        print("\n💡 Update .env.local with your LiveKit credentials")
        return False
    
    print("✅ Environment variables configured")
    return True


def setup_environment():
    """Set up the environment for running the console client."""
    print("🔧 Setting up environment...")
    
    # Check Python version
    if sys.version_info < (3, 8):
        print("❌ Python 3.8 or higher is required")
        return False
    
    # Check basic dependencies
    try:
        import aioconsole
        import aiohttp
        from dotenv import load_dotenv
    except ImportError as e:
        print(f"❌ Missing required package: {e}")
        print("💡 Install with: pip install aioconsole aiohttp python-dotenv")
        return False
    
    # Check environment file
    if not check_env_file():
        return False
    
    print("✅ Environment setup complete")
    return True


async def run_console_client(client_type: str = "simple", agent_name: str = None):
    """Run the console client."""
    # Set agent name if provided
    if agent_name:
        os.environ["AGENT_NAME"] = agent_name
    
    if client_type == "simple":
        from simple_console_client import main as simple_main
        await simple_main()
    elif client_type == "async":
        try:
            from async_console_client import main as async_main
            await async_main()
        except ImportError as e:
            print(f"❌ Cannot run async client: {e}")
            print("💡 Try: pip install livekit-api livekit-rtc")
            print("💡 Or use --simple for basic functionality")
    else:
        try:
            from console_client import main as basic_main
            await basic_main()
        except ImportError as e:
            print(f"❌ Cannot run basic client: {e}")
            print("💡 Use --simple for basic functionality")


def main():
    """Main entry point for the launcher."""
    parser = argparse.ArgumentParser(
        description="Console Client for Voice-Video-Agent",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python run.py                           # Run async console client
  python run.py --basic                   # Run basic console client
  python run.py --agent risk-aware-assistant  # Connect with specific agent
  python run.py --setup                   # Check environment setup
        """
    )
    
    parser.add_argument(
        "--simple", 
        action="store_true",
        help="Use simple console client (default, works without full LiveKit setup)"
    )
    
    parser.add_argument(
        "--advanced", 
        action="store_true",
        help="Use advanced async console client (requires full LiveKit packages)"
    )
    
    parser.add_argument(
        "--agent",
        type=str,
        help="Agent name to connect with (e.g., risk-aware-assistant)"
    )
    
    parser.add_argument(
        "--setup",
        action="store_true", 
        help="Check environment setup and exit"
    )
    
    parser.add_argument(
        "--install",
        action="store_true",
        help="Install required dependencies"
    )
    
    args = parser.parse_args()
    
    # Handle installation
    if args.install:
        print("📦 Installing dependencies...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
            print("✅ Dependencies installed successfully")
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to install dependencies: {e}")
            sys.exit(1)
        return
    
    # Handle setup check
    if args.setup:
        if setup_environment():
            print("🎉 Ready to run console client!")
        else:
            print("🔧 Please fix the issues above before running")
        return
    
    # Setup environment before running
    if not setup_environment():
        print("\n💡 Use --setup to check configuration")
        print("💡 Use --install to install dependencies")
        sys.exit(1)
    
    # Determine client type
    if args.advanced:
        client_type = "async"
    elif args.simple:
        client_type = "simple"
    else:
        client_type = "simple"  # Default to simple
    
    print(f"🚀 Starting {client_type} console client...")
    if args.agent:
        print(f"🤖 Connecting with agent: {args.agent}")
    
    try:
        asyncio.run(run_console_client(client_type, args.agent))
    except KeyboardInterrupt:
        print("\n👋 Goodbye!")
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
