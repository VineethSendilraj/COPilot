"use client";

import React from "react";
import { Track } from "livekit-client";
import {
  useTracks,
  VideoTrack,
  useParticipants,
  useConnectionState,
  ConnectionState,
} from "@livekit/components-react";
import { Badge } from "@/components/ui/badge";
import {
  Video,
  VideoOff,
  Wifi,
  WifiOff,
  AlertTriangle,
  Shield,
} from "lucide-react";
import { Incident } from "@/lib/types/database";

interface IncidentVideoStreamProps {
  incident: Incident;
  className?: string;
}

export function IncidentVideoStream({
  incident,
  className = "",
}: IncidentVideoStreamProps) {
  const connectionState = useConnectionState();
  const participants = useParticipants();

  // Find video tracks from the specific officer
  const officerTracks = useTracks([Track.Source.Camera], {
    onlySubscribed: true,
  }).filter(
    (trackRef) =>
      trackRef.participant.identity === incident.officer?.badge_number ||
      trackRef.participant.name === incident.officer?.name
  );

  const isConnected = connectionState === ConnectionState.Connected;
  const hasVideoStream = officerTracks.length > 0;
  const officerTrack = officerTracks[0]; // Get the first (and likely only) track for this officer

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "high":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "medium":
        return <Shield className="h-4 w-4 text-yellow-500" />;
      default:
        return <Shield className="h-4 w-4 text-green-500" />;
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-green-100 text-green-800 border-green-200";
    }
  };

  return (
    <div
      className={`relative bg-black rounded-lg aspect-video overflow-hidden ${className}`}
    >
      {!isConnected ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-white">
            <WifiOff className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Connecting...</p>
          </div>
        </div>
      ) : !hasVideoStream ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-white">
            <VideoOff className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No live stream</p>
            <p className="text-xs opacity-75 mt-1">
              Officer #{incident.officer?.badge_number}
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Live Video Stream */}
          <VideoTrack
            trackRef={officerTrack}
            className="w-full h-full object-cover"
          />

          {/* Live indicator */}
          <div className="absolute top-2 left-2">
            <Badge variant="destructive" className="text-xs animate-pulse">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
              LIVE
            </Badge>
          </div>

          {/* Risk level indicator */}
          <div className="absolute top-2 right-2">
            <Badge className={`${getRiskColor(incident.risk_level)} text-xs`}>
              {getRiskIcon(incident.risk_level)}
              <span className="ml-1">{incident.risk_level.toUpperCase()}</span>
            </Badge>
          </div>

          {/* Officer info overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
            <div className="text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">
                    {incident.officer?.name || "Unknown Officer"}
                  </p>
                  <p className="text-xs opacity-75">
                    Badge #{incident.officer?.badge_number || "N/A"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs opacity-75">
                    {incident.escalation_type.replace("_", " ").toUpperCase()}
                  </p>
                  {incident.is_resolved && (
                    <Badge variant="secondary" className="text-xs mt-1">
                      RESOLVED
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
