# LiveKit Integration Setup

This guide explains how to set up the LiveKit live streaming functionality in your dashboard.

## Prerequisites

1. **LiveKit Server**: You need a running LiveKit server. Choose one option:
   - **Option A (Recommended for testing)**: Use LiveKit Cloud at https://cloud.livekit.io
   - **Option B (Local development)**: Run LiveKit server locally

## Setup Steps

### 1. Environment Variables

Create a `.env.local` file in the dashboard directory with these variables:

```bash
# LiveKit Configuration
LIVEKIT_URL=ws://localhost:7880
LIVEKIT_API_KEY=devkey  
LIVEKIT_API_SECRET=secret

# For LiveKit Cloud, use your actual values:
# LIVEKIT_URL=wss://your-project.livekit.cloud
# LIVEKIT_API_KEY=your-api-key
# LIVEKIT_API_SECRET=your-api-secret
```

### 2. Option A: LiveKit Cloud (Easiest)

1. Go to https://cloud.livekit.io and create an account
2. Create a new project
3. Copy your project's URL, API Key, and API Secret
4. Update your `.env.local` file with these values

### 3. Option B: Local LiveKit Server

Install and run LiveKit server locally:

```bash
# Download LiveKit server
curl -sSL https://get.livekit.io | bash

# Run with default config (uses devkey/secret)
livekit-server --dev
```

This will start LiveKit on `ws://localhost:7880` with:
- API Key: `devkey`
- API Secret: `secret`

### 4. Start the Application

```bash
cd dashboard
yarn dev
```

## Testing the MVP

1. **Start the dashboard**:
   - Open http://localhost:3000/dashboard
   - You should see a "Live Officer Streams" section

2. **Start officer stream**:
   - Open http://localhost:3000/officer-test in another tab/browser
   - Click "Start Video" and "Unmute" 
   - Your camera stream should appear

3. **View on dashboard**:
   - Go back to the dashboard tab
   - You should see your video stream in the "Live Officer Streams" section

## MVP Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Officer App   │────│  LiveKit Server │────│   Dashboard     │
│ (Broadcaster)   │    │   (Room: ...)   │    │   (Observer)    │
│                 │    │                 │    │                 │
│ - Camera ON     │────│ Video/Audio     │────│ - Displays      │
│ - Audio ON      │    │ Tracks          │    │   all streams   │
│ - Publishes     │    │                 │    │ - Read-only     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Components Overview

- **StreamProvider**: Connects to LiveKit room and provides context
- **OfficerStreamDisplay**: Shows live streams on dashboard (observer)
- **OfficerStreamBroadcaster**: Allows officers to broadcast video/audio
- **Connection API**: Generates JWT tokens for participants

## Troubleshooting

1. **"Connection failed"**: Check that LiveKit server is running and URL is correct
2. **"No video streams"**: Make sure officer clicked "Start Video" 
3. **Camera permissions**: Browser needs camera/microphone permissions
4. **HTTPS required**: LiveKit requires HTTPS in production (localhost works for dev)

## Next Steps

For production deployment:
1. Use LiveKit Cloud or properly configured LiveKit server
2. Implement proper authentication
3. Add officer identification 
4. Add recording capabilities
5. Integrate with existing Supabase data
