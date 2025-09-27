'use client';

import { OfficerStreamBroadcaster } from '@/components/livekit/officer-stream-broadcaster';
import { Navigation } from '@/components/navigation';

export default function OfficerTestPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Officer Live Stream Test
          </h1>
          <p className="text-gray-600">
            Use this page to test broadcasting your video stream to the dashboard
          </p>
        </div>

        <OfficerStreamBroadcaster 
          officerName="Test Officer"
          roomName="officer-stream-room"
        />

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h2 className="font-semibold text-blue-900 mb-2">Instructions:</h2>
          <ol className="list-decimal list-inside space-y-1 text-blue-800 text-sm">
            <li>Click "Start Video" to begin broadcasting your camera</li>
            <li>Click "Unmute" to enable audio broadcasting</li>
            <li>Open the dashboard in another tab to see your stream</li>
            <li>Your stream will appear in the "Live Officer Streams" section</li>
          </ol>
        </div>

        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h2 className="font-semibold text-gray-900 mb-2">Links:</h2>
          <div className="space-y-2">
            <a 
              href="/dashboard" 
              className="block text-blue-600 hover:text-blue-800 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              → Open Dashboard (to see your stream)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
