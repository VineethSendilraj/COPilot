"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Video,
  VideoOff,
  Play,
  Square,
  Camera,
  Wifi,
  WifiOff,
} from "lucide-react";
import type { Incident } from "@/lib/types/database";

interface CameraStreamTestProps {
  incident: Incident;
  className?: string;
}

export function CameraStreamTest({
  incident,
  className,
}: CameraStreamTestProps) {
  const [isReceivingStream, setIsReceivingStream] = useState(false);
  const [currentFrame, setCurrentFrame] = useState<string | null>(null);
  const [lastFrameTime, setLastFrameTime] = useState<number>(0);
  const [framesReceived, setFramesReceived] = useState<number>(0);
  const imgRef = useRef<HTMLImageElement>(null);

  // Monitor for incoming stream frames
  useEffect(() => {
    const checkForFrames = () => {
      const frameData = localStorage.getItem("streamFrame");
      const timestamp = localStorage.getItem("streamTimestamp");

      if (frameData && timestamp) {
        const frameTime = parseInt(timestamp);
        const timeDiff = Date.now() - frameTime;

        // Only update if frame is fresh (less than 3 seconds old)
        if (timeDiff < 3000) {
          setCurrentFrame(frameData);
          setLastFrameTime(frameTime);
          setIsReceivingStream(true);

          // Count frames (only if it's a new frame)
          if (frameTime !== lastFrameTime) {
            setFramesReceived((prev) => prev + 1);
            console.log(
              `[Incident ${incident.id}] Received frame ${framesReceived + 1}:`,
              {
                incidentId: incident.id,
                officerId: incident.officer_id,
                timestamp: new Date(frameTime).toISOString(),
                frameSize: frameData.length,
                timeDiff: timeDiff,
              }
            );
          }
        } else {
          // Frame is stale, stop showing stream
          setIsReceivingStream(false);
        }
      } else {
        setIsReceivingStream(false);
      }
    };

    // Check for frames every 500ms
    const interval = setInterval(checkForFrames, 500);

    return () => {
      clearInterval(interval);
    };
  }, [incident.id, incident.officer_id, lastFrameTime, framesReceived]);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Camera className="h-4 w-4" />
          Live Camera Stream
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stream Status */}
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isReceivingStream ? "bg-green-500" : "bg-gray-400"
            }`}
          />
          <span className="text-xs">
            {isReceivingStream
              ? "Receiving Live Stream"
              : "No Stream Available"}
          </span>
          {isReceivingStream && (
            <div className="flex items-center gap-1 ml-2">
              <Wifi className="h-3 w-3 text-green-500" />
              <span className="text-xs text-green-600">Live</span>
            </div>
          )}
        </div>

        {/* Stream Display */}
        <div className="relative">
          {currentFrame && isReceivingStream ? (
            <img
              ref={imgRef}
              src={currentFrame}
              alt="Live Stream"
              className="w-full h-32 object-cover rounded border border-green-500"
            />
          ) : (
            <div className="w-full h-32 bg-gray-100 rounded border border-gray-300 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <VideoOff className="h-6 w-6 mx-auto mb-1" />
                <p className="text-xs">No Stream</p>
              </div>
            </div>
          )}
        </div>

        {/* Stream Info */}
        {isReceivingStream && (
          <div className="text-xs text-gray-600 space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Receiving from /stream-test</span>
            </div>
            <div>Frames received: {framesReceived}</div>
            <div>Officer: {incident.officer?.name || "Unknown"}</div>
            <div>Incident: {incident.id}</div>
            <div>
              Last frame:{" "}
              {lastFrameTime
                ? new Date(lastFrameTime).toLocaleTimeString()
                : "Never"}
            </div>
          </div>
        )}

        {/* Instructions */}
        {!isReceivingStream && (
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
            <p>To see live stream:</p>
            <p>
              1. Open{" "}
              <a
                href="/stream-test"
                className="text-blue-600 underline"
                target="_blank"
              >
                /stream-test
              </a>
            </p>
            <p>2. Click "Start Camera"</p>
            <p>3. Return to this dashboard</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
