import { NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';

// You'll need to set these environment variables
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || 'devkey';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || 'secret';
const LIVEKIT_URL = process.env.LIVEKIT_URL || 'ws://localhost:7880';

export interface ConnectionDetails {
  serverUrl: string;
  roomName: string;
  participantToken: string;
  participantName: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { roomName = 'officer-stream-room', participantType = 'dashboard' } = body;

    // Generate participant token for dashboard observer
    const participantName = participantType === 'dashboard' ? 'dashboard-observer' : 'officer';
    const participantIdentity = `${participantType}_${Math.floor(Math.random() * 10_000)}`;

    const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: participantIdentity,
      name: participantName,
    });

    // Set permissions based on participant type
    if (participantType === 'dashboard') {
      // Dashboard is read-only observer
      token.addGrant({
        roomJoin: true,
        room: roomName,
        canPublish: false,
        canSubscribe: true,
        canPublishData: false,
      });
    } else {
      // Officer can publish streams
      token.addGrant({
        roomJoin: true,
        room: roomName,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
      });
    }

    const jwt = await token.toJwt();

    const connectionDetails: ConnectionDetails = {
      serverUrl: LIVEKIT_URL,
      roomName,
      participantToken: jwt,
      participantName,
    };

    return NextResponse.json(connectionDetails);
  } catch (error) {
    console.error('Error generating LiveKit connection details:', error);
    return NextResponse.json(
      { error: 'Failed to generate connection details' },
      { status: 500 }
    );
  }
}
