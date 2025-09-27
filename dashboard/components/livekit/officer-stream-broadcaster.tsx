'use client';

import React, { useState } from 'react';
import { LiveKitRoom, VideoTrack, useLocalParticipant } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { useLiveKitConnection } from '@/hooks/use-livekit-connection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, VideoOff, Mic, MicOff, Wifi } from 'lucide-react';

function OfficerControls() {
  const { localParticipant } = useLocalParticipant();
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(false);

  const toggleCamera = async () => {
    try {
      await localParticipant.setCameraEnabled(!isCameraEnabled);
      setIsCameraEnabled(!isCameraEnabled);
    } catch (error) {
      console.error('Error toggling camera:', error);
    }
  };

  const toggleMicrophone = async () => {
    try {
      await localParticipant.setMicrophoneEnabled(!isMicEnabled);
      setIsMicEnabled(!isMicEnabled);
    } catch (error) {
      console.error('Error toggling microphone:', error);
    }
  };

  // Get local camera track for preview
  const cameraPublication = localParticipant.getTrackPublication(Track.Source.Camera);
  const cameraTrack = cameraPublication?.track;

  return (
    <div className="space-y-4">
      {/* Video preview */}
      <div className="aspect-video bg-black rounded-lg overflow-hidden">
        {cameraTrack && isCameraEnabled ? (
          <VideoTrack
            trackRef={{
              participant: localParticipant,
              publication: cameraPublication!,
              source: Track.Source.Camera,
            }}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-white">
            <VideoOff className="h-12 w-12" />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4">
        <Button
          onClick={toggleCamera}
          variant={isCameraEnabled ? "default" : "outline"}
          size="lg"
        >
          {isCameraEnabled ? (
            <Video className="h-5 w-5 mr-2" />
          ) : (
            <VideoOff className="h-5 w-5 mr-2" />
          )}
          {isCameraEnabled ? "Stop Video" : "Start Video"}
        </Button>

        <Button
          onClick={toggleMicrophone}
          variant={isMicEnabled ? "default" : "outline"}
          size="lg"
        >
          {isMicEnabled ? (
            <Mic className="h-5 w-5 mr-2" />
          ) : (
            <MicOff className="h-5 w-5 mr-2" />
          )}
          {isMicEnabled ? "Mute" : "Unmute"}
        </Button>
      </div>

      {/* Status */}
      <div className="flex justify-center gap-2">
        <Badge variant={isCameraEnabled ? "default" : "secondary"}>
          Camera: {isCameraEnabled ? "ON" : "OFF"}
        </Badge>
        <Badge variant={isMicEnabled ? "default" : "secondary"}>
          Audio: {isMicEnabled ? "ON" : "OFF"}
        </Badge>
      </div>
    </div>
  );
}

interface OfficerStreamBroadcasterProps {
  officerName?: string;
  roomName?: string;
}

export function OfficerStreamBroadcaster({
  officerName = 'Officer MVP',
  roomName = 'officer-stream-room'
}: OfficerStreamBroadcasterProps) {
  const { connectionDetails, isLoading, error } = useLiveKitConnection({
    roomName,
    participantType: 'officer',
    autoConnect: true
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <Wifi className="h-8 w-8 mx-auto mb-2 animate-pulse" />
            <p>Connecting to command center...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-red-600">
            <p className="font-semibold">Connection Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!connectionDetails) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <p>No connection details available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          Officer Stream - {officerName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <LiveKitRoom
          video={true}
          audio={true}
          serverUrl={connectionDetails.serverUrl}
          token={connectionDetails.participantToken}
          options={{
            autoSubscribe: false, // Officer doesn't need to see other streams
          }}
          onError={(error) => {
            console.error('LiveKit connection error:', error);
          }}
        >
          <OfficerControls />
        </LiveKitRoom>
      </CardContent>
    </Card>
  );
}
