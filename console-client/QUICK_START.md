# 🚀 Quick Start Guide - Console Client

This guide helps you get the console client running quickly with a virtual environment.

## ⚡ Fast Setup (5 minutes)

### 1. Create Virtual Environment
```bash
cd console-client
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Basic Dependencies
```bash
pip install aioconsole aiohttp python-dotenv livekit-api
```

### 3. Try the Demo
```bash
python quick_start.py
```

This runs a simulated console interface to test the UI without needing LiveKit credentials.

## 🎯 Full Setup (with LiveKit)

### 1. Get LiveKit Credentials
You need:
- LiveKit server URL (e.g., `wss://your-server.livekit.cloud`)
- API Key
- API Secret

### 2. Configure Environment
```bash
cp env_example.txt .env.local
# Edit .env.local with your credentials
```

### 3. Test Connection
```bash
python run.py --setup
```

### 4. Run Console Client
```bash
python run.py
```

## 🎮 Usage Examples

### Basic Usage
```bash
# Start simple console client
python run.py

# With specific agent
python run.py --agent risk-aware-assistant

# Check setup
python run.py --setup
```

### Demo Mode (No LiveKit required)
```bash
python quick_start.py
```

## 🔧 Troubleshooting

### Python 3.13 Compatibility Issues
If you get package installation errors:
1. Try using Python 3.11 or 3.12 instead
2. Use the simple console client: `python run.py --simple`
3. Run the demo: `python quick_start.py`

### Missing LiveKit Packages
If `livekit-rtc` won't install:
1. Use `livekit-api` only (already included)
2. Run simple mode: `python run.py --simple`
3. Check Python version compatibility

### Environment Variables
Edit `.env.local`:
```env
LIVEKIT_URL=wss://your-server.livekit.cloud
LIVEKIT_API_KEY=your_key_here
LIVEKIT_API_SECRET=your_secret_here
AGENT_NAME=risk-aware-assistant
USE_LOCAL_CONNECTION=true
```

## 🎯 Integration with Voice-Video-Agent

### Option 1: Direct Integration
1. Start voice-video-agent:
   ```bash
   cd ../voice-video-agent
   python agent.py
   ```

2. Start console client:
   ```bash
   cd ../console-client
   source venv/bin/activate
   python run.py
   ```

### Option 2: Web API Integration
1. Start web-agent server:
   ```bash
   cd ../web-agent
   npm run dev
   ```

2. Use API endpoint:
   ```bash
   CONNECTION_ENDPOINT=http://localhost:3000/api/connection-details python run.py
   ```

## 🎭 Demo Commands

In any console client:
- `/help` - Show commands
- `/status` - Connection status  
- `/quit` - Exit
- `Hello` - Send message

## 📁 File Overview

- `quick_start.py` - Demo without LiveKit (start here!)
- `run.py` - Smart launcher with setup checks
- `simple_console_client.py` - Basic functionality
- `async_console_client.py` - Full featured (needs more packages)
- `test_connection.py` - Connection testing
- `demo.py` - Interactive demo guide

## 🎉 Success!

You now have a working console client that can:
- ✅ Connect to voice-video-agent
- ✅ Send text messages  
- ✅ Monitor real-time events
- ✅ Work in command-line environment
- ✅ Replace the web frontend entirely

The console client provides the same functionality as the web-agent but through a terminal interface!
