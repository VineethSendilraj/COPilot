"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, VideoOff, Play, Square, Wifi, WifiOff } from "lucide-react";
import { SimpleStreamingService } from "@/lib/streaming-service";

export default function StreamTestPage() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [framesSent, setFramesSent] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamingService = useRef(SimpleStreamingService.getInstance());

  const startCamera = async () => {
    try {
      setError(null);
      const mediaStream = await streamingService.current.startStreaming();

      setStream(mediaStream);
      setIsStreaming(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Monitor frames being sent
      const frameMonitor = setInterval(() => {
        const timestamp = localStorage.getItem("streamTimestamp");
        if (timestamp) {
          const timeDiff = Date.now() - parseInt(timestamp);
          if (timeDiff < 2000) {
            // Frame is fresh (less than 2 seconds old)
            setFramesSent((prev) => prev + 1);
          }
        }
      }, 1000);

      // Store interval for cleanup
      (streamingService.current as any).frameMonitor = frameMonitor;
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Failed to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    streamingService.current.stopStreaming();
    setStream(null);
    setIsStreaming(false);
    setFramesSent(0);

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Clear frame monitor
    if ((streamingService.current as any).frameMonitor) {
      clearInterval((streamingService.current as any).frameMonitor);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isStreaming) {
        stopCamera();
      }
    };
  }, []);

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Camera Stream Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Camera Controls */}
          <div className="flex gap-4">
            {!isStreaming ? (
              <Button onClick={startCamera} className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Start Camera
              </Button>
            ) : (
              <Button
                onClick={stopCamera}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Square className="h-4 w-4" />
                Stop Camera
              </Button>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-100 border border-red-300 rounded-md">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Camera Preview */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Camera Preview</h3>
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full max-w-2xl rounded-lg border-2 ${
                  isStreaming ? "border-green-500" : "border-gray-300"
                }`}
                style={{ display: isStreaming ? "block" : "none" }}
              />
              {!isStreaming && (
                <div className="w-full max-w-2xl h-64 bg-gray-100 rounded-lg border-2 border-gray-300 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <VideoOff className="h-12 w-12 mx-auto mb-2" />
                    <p>Camera not active</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stream Status */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Stream Status</h3>
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  isStreaming ? "bg-green-500" : "bg-gray-400"
                }`}
              />
              <span>
                {isStreaming ? "Streaming Active" : "Streaming Inactive"}
              </span>
              {isStreaming && (
                <div className="flex items-center gap-1 ml-2">
                  <Wifi className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600">Live</span>
                </div>
              )}
            </div>
            {isStreaming && (
              <div className="text-sm text-gray-600 space-y-1">
                <p>• Camera is capturing frames every second</p>
                <p>• Frames sent to dashboard: {framesSent}</p>
                <p>
                  • Stream is being transmitted to the first incident on
                  dashboard
                </p>
                <p>
                  • Open the dashboard in another tab to see the live stream
                </p>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Instructions:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
              <li>Click "Start Camera" to begin streaming</li>
              <li>Allow camera permissions when prompted</li>
              <li>Your camera feed will appear in the preview</li>
              <li>
                Frames are automatically sent to the dashboard every second
              </li>
              <li>
                Open{" "}
                <a
                  href="/dashboard"
                  className="text-blue-600 underline"
                  target="_blank"
                >
                  http://localhost:3000/dashboard
                </a>{" "}
                in another tab to see your live stream
              </li>
              <li>
                The stream will appear in the first incident's video section
              </li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
