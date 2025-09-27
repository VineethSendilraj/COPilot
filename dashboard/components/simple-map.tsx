"use client";

import { MapPin, Users, AlertTriangle, Shield } from "lucide-react";
import { MapMarker } from "@/lib/types/database";

interface SimpleMapProps {
  markers: MapMarker[];
  center?: { lat: number; lng: number };
  className?: string;
}

export function SimpleMap({
  markers,
  center,
  className = "h-64",
}: SimpleMapProps) {
  // This is a placeholder map component
  // In a real implementation, you would integrate with Google Maps, Mapbox, or similar

  const getMarkerColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "low":
        return "text-green-500";
      case "medium":
        return "text-yellow-500";
      case "high":
        return "text-orange-500";
      case "critical":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getMarkerIcon = (type: string) => {
    switch (type) {
      case "officer_aggression":
      case "suspect_aggression":
        return <AlertTriangle className="h-4 w-4" />;
      case "suspect_weapon_detected":
      case "officer_in_danger":
        return <Shield className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  return (
    <div
      className={`relative bg-gray-100 rounded-lg overflow-hidden ${className}`}
    >
      {/* Placeholder map background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50">
        <div className="absolute inset-0 opacity-20">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <pattern
                id="grid"
                width="10"
                height="10"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 10 0 L 0 0 0 10"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>
      </div>

      {/* Center marker */}
      {center && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="bg-blue-600 text-white rounded-full p-2 shadow-lg">
            <MapPin className="h-4 w-4" />
          </div>
        </div>
      )}

      {/* Incident markers */}
      {markers.map((marker, index) => (
        <div
          key={marker.id}
          className="absolute transform -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${20 + ((index * 15) % 60)}%`,
            top: `${30 + ((index * 20) % 40)}%`,
          }}
        >
          <div
            className={`${getMarkerColor(
              marker.risk_level
            )} bg-white rounded-full p-2 shadow-lg border-2 border-current`}
          >
            {getMarkerIcon(marker.type)}
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            #{marker.badge_number}
          </div>
        </div>
      ))}

      {/* Map legend */}
      <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 text-xs">
        <div className="flex items-center space-x-2 mb-1">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>Low Risk</span>
        </div>
        <div className="flex items-center space-x-2 mb-1">
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <span>Medium Risk</span>
        </div>
        <div className="flex items-center space-x-2 mb-1">
          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
          <span>High Risk</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span>Critical</span>
        </div>
      </div>

      {/* Map info */}
      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 text-xs">
        <div className="flex items-center space-x-1">
          <Users className="h-3 w-3" />
          <span>{markers.length} incidents</span>
        </div>
      </div>
    </div>
  );
}
