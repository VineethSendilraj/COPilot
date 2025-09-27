'use client';

import React from 'react';
import { Track } from 'livekit-client';
import { 
  useTracks, 
  VideoTrack, 
  AudioTrack,
  useParticipants,
  useConnectionState,
  ConnectionState,
  RoomAudioRenderer
} from '@livekit/components-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Wifi, WifiOff, Video, VideoOff } from 'lucide-react';

export function OfficerStreamDisplay() {
  const connectionState = useConnectionState();
  const participants = useParticipants();
  
  // Subscribe to all camera tracks from remote participants
  const cameraTracks = useTracks(
    [Track.Source.Camera], 
    { onlySubscribed: true }
  );
  
  // Subscribe to all microphone tracks from remote participants  
  const microphoneTracks = useTracks(
    [Track.Source.Microphone], 
    { onlySubscribed: true }
  );

  const isConnected = connectionState === ConnectionState.Connected;
  const hasVideoStreams = cameraTracks.length > 0;
  const hasAudioStreams = microphoneTracks.length > 0;

  return (
    <Card className="w-full">
      {/* Audio renderer for all audio tracks */}
      <RoomAudioRenderer />
      
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Live Officer Streams
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? (
                <>
                  <Wifi className="h-3 w-3 mr-1" />
                  Connected
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 mr-1" />
                  Disconnected
                </>
              )}
            </Badge>
            <Badge variant="outline">
              <Users className="h-3 w-3 mr-1" />
              {participants.length} participants
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!isConnected ? (
          <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
            <div className="text-center">
              <WifiOff className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Connecting to live streams...</p>
            </div>
          </div>
        ) : !hasVideoStreams ? (
          <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
            <div className="text-center">
              <VideoOff className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">
                {participants.length === 0 
                  ? "Waiting for officers to connect..." 
                  : "No video streams available"
                }
              </p>
              {participants.length > 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  {participants.length} officer(s) connected without video
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Video Streams */}
            {hasVideoStreams && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Video Streams</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cameraTracks.map((trackRef) => (
                    <div key={trackRef.publication.trackSid} className="relative">
                      <div className="aspect-video bg-black rounded-lg overflow-hidden">
                        <VideoTrack
                          trackRef={trackRef}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* Officer info overlay */}
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="bg-black/70 text-white px-2 py-1 rounded text-sm">
                          <div className="flex items-center justify-between">
                            <span>
                              {trackRef.participant.name || trackRef.participant.identity}
                            </span>
                            <div className="flex items-center gap-1">
                              {hasAudioStreams && microphoneTracks.some(
                                audioTrack => audioTrack.participant.sid === trackRef.participant.sid
                              ) && (
                                <Badge variant="secondary" className="text-xs px-1 py-0">
                                  🎤
                                </Badge>
                              )}
                              <Badge 
                                variant={trackRef.publication.isMuted ? "destructive" : "default"} 
                                className="text-xs px-1 py-0"
                              >
                                {trackRef.publication.isMuted ? "📹 OFF" : "📹 ON"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Audio-Only Participants */}
            {hasAudioStreams && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Voice Participants</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {microphoneTracks.map((trackRef) => (
                    <div key={trackRef.publication.trackSid} className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-4 border">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-lg">
                            🎤
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {trackRef.participant.name || trackRef.participant.identity}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant={trackRef.publication.isMuted ? "destructive" : "default"} 
                              className="text-xs"
                            >
                              {trackRef.publication.isMuted ? "🔇 Muted" : "🔊 Speaking"}
                            </Badge>
                            {trackRef.participant.identity.includes('agent') && (
                              <Badge variant="secondary" className="text-xs">
                                AI Agent
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No streams at all */}
            {!hasVideoStreams && !hasAudioStreams && (
              <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <VideoOff className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">
                    {participants.length === 0 
                      ? "Waiting for officers to connect..." 
                      : "No active streams"
                    }
                  </p>
                  {participants.length > 0 && (
                    <p className="text-sm text-gray-500 mt-2">
                      {participants.length} participant(s) connected
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Debug info - remove in production */}
        <div className="mt-4 p-2 bg-gray-50 rounded text-xs text-gray-600">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Video Tracks:</strong> {cameraTracks.length}
            </div>
            <div>
              <strong>Audio Tracks:</strong> {microphoneTracks.length}
            </div>
            <div>
              <strong>Participants:</strong> {participants.map(p => p.identity).join(', ') || 'None'}
            </div>
            <div>
              <strong>Connection:</strong> {connectionState}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
