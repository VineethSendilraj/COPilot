'use client';

import { useState, useEffect, useCallback } from 'react';
import { ConnectionDetails } from '@/app/api/livekit-connection/route';

interface UseLiveKitConnectionOptions {
  roomName?: string;
  participantType?: 'dashboard' | 'officer';
  autoConnect?: boolean;
}

export function useLiveKitConnection({
  roomName = 'officer-stream-room',
  participantType = 'dashboard',
  autoConnect = true
}: UseLiveKitConnectionOptions = {}) {
  const [connectionDetails, setConnectionDetails] = useState<ConnectionDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConnectionDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/livekit-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomName,
          participantType,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get connection details: ${response.statusText}`);
      }

      const details: ConnectionDetails = await response.json();
      setConnectionDetails(details);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching LiveKit connection details:', err);
    } finally {
      setIsLoading(false);
    }
  }, [roomName, participantType]);

  useEffect(() => {
    if (autoConnect) {
      fetchConnectionDetails();
    }
  }, [autoConnect, fetchConnectionDetails]);

  return {
    connectionDetails,
    isLoading,
    error,
    refetch: fetchConnectionDetails,
  };
}
