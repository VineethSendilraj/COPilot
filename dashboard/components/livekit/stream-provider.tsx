'use client';

import React from 'react';
import { LiveKitRoom } from '@livekit/components-react';
import { useLiveKitConnection } from '@/hooks/use-livekit-connection';

interface StreamProviderProps {
  children: React.ReactNode;
  roomName?: string;
}

export function StreamProvider({ 
  children, 
  roomName = 'officer-stream-room'
}: StreamProviderProps) {
  const { connectionDetails, isLoading, error } = useLiveKitConnection({
    roomName,
    participantType: 'dashboard',
    autoConnect: true
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-sm text-gray-600">Connecting to live stream...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-sm text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (!connectionDetails) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-sm text-gray-600">No connection details available</div>
      </div>
    );
  }

  return (
    <LiveKitRoom
      video={false} // Dashboard is observer only
      audio={false} // Dashboard is observer only
      serverUrl={connectionDetails.serverUrl}
      token={connectionDetails.participantToken}
      options={{
        autoSubscribe: true, // Automatically subscribe to all tracks
      }}
      onError={(error) => {
        console.error('LiveKit connection error:', error);
      }}
    >
      {children}
    </LiveKitRoom>
  );
}
