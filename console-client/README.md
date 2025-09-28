# Console Client for Voice-Video-Agent

This is a Python console application that connects to the same LiveKit room as the voice-video-agent, replacing the web-agent frontend with a command-line interface.

## Features

- **Real-time Communication**: Connect to LiveKit rooms and communicate with the voice-video-agent
- **Interactive Console**: Send messages and receive responses through a command-line interface
- **Agent Integration**: Automatically configure agent connections
- **Event Monitoring**: Monitor participant connections, track subscriptions, and data messages
- **Async I/O**: Non-blocking input/output for smooth real-time communication

## Quick Start (Recommended)

⚡ **Try the demo first** (no setup required):
```bash
cd console-client
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install aioconsole
python quick_start.py
```

## Full Installation

1. **Create a virtual environment** (recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**:
   ```bash
   pip install aioconsole aiohttp python-dotenv livekit-api
   # Note: livekit-rtc may not work with Python 3.13, use simple mode
   ```

3. **Set up environment variables**:
   ```bash
   cp env_example.txt .env.local
   ```
   
   Edit `.env.local` with your LiveKit credentials:
   ```env
   LIVEKIT_URL=wss://your-livekit-server.com
   LIVEKIT_API_KEY=your_api_key_here
   LIVEKIT_API_SECRET=your_api_secret_here
   ```

4. **Test setup**:
   ```bash
   python run.py --setup
   ```

## Usage

### Demo Mode (No LiveKit Setup)

Try the interface without any configuration:
```bash
python quick_start.py
```

### Simple Console Client (Recommended)

Run the simple console client (works with basic setup):
```bash
python run.py
# or explicitly:
python run.py --simple
```

### Advanced Console Client

For full LiveKit functionality (requires all packages):
```bash
python run.py --advanced
```

### With Specific Agent

To connect with a specific agent name:
```bash
python run.py --agent risk-aware-assistant
```

## Console Commands

Once connected, you can use these commands:

- `/help` - Show available commands
- `/status` - Show connection status and room information
- `/participants` - List all participants in the room
- `/disconnect` - Disconnect from the current room
- `/quit` - Exit the application
- `<message>` - Send a text message to the room

## Integration with Voice-Video-Agent

This console client is designed to work with the existing `voice-video-agent` system:

1. **Start the voice-video-agent**:
   ```bash
   cd ../voice-video-agent
   python agent.py
   ```

2. **Run the console client** (in a separate terminal):
   ```bash
   cd ../console-client
   python async_console_client.py
   ```

3. **Interact**: The console client will connect to the same LiveKit room and can communicate with the agent.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Console Client │◄──►│   LiveKit Room  │◄──►│ Voice-Video     │
│                 │    │                 │    │ Agent           │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

The console client:
1. Generates LiveKit connection details (room name, participant token)
2. Connects to the LiveKit room
3. Enables microphone and text communication
4. Listens for events from other participants (including agents)
5. Allows sending messages through the console interface

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `LIVEKIT_URL` | Yes | WebSocket URL of your LiveKit server |
| `LIVEKIT_API_KEY` | Yes | API key for LiveKit server |
| `LIVEKIT_API_SECRET` | Yes | API secret for LiveKit server |
| `AGENT_NAME` | No | Specific agent name to connect with |
| `LOG_LEVEL` | No | Logging level (DEBUG, INFO, WARNING, ERROR) |

## Troubleshooting

### Connection Issues

1. **Check environment variables**: Ensure all required variables are set in `.env.local`
2. **Verify LiveKit server**: Make sure your LiveKit server is running and accessible
3. **Check API credentials**: Verify your API key and secret are correct

### Audio Issues

The console client enables microphone by default. If you encounter audio permission issues:
- Grant microphone permissions to your terminal/Python
- Check your system's audio settings

### Network Issues

- Ensure your firewall allows WebSocket connections
- If behind a corporate firewall, you may need to configure proxy settings

## Development

### File Structure

```
console-client/
├── console_client.py          # Basic console client
├── async_console_client.py    # Async console client (recommended)
├── requirements.txt           # Python dependencies
├── env_example.txt           # Environment variables template
└── README.md                 # This file
```

### Adding Features

To extend the console client:

1. **Add new commands**: Modify the `_handle_command()` method
2. **Add event handlers**: Extend the `_setup_event_handlers()` method
3. **Customize connection**: Modify the `generate_connection_details()` method

### Testing

Test the integration:

1. Start the voice-video-agent
2. Start the console client
3. Send messages and verify communication
4. Check agent responses and behavior

## License

This project follows the same license as the parent voice-video-agent project.
