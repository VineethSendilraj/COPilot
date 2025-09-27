"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/navigation";
import { SimpleMap } from "@/components/simple-map";
import {
  MapPin,
  Clock,
  AlertTriangle,
  Shield,
  Users,
  Mic,
  MicOff,
  Phone,
  CheckCircle,
  XCircle,
  RefreshCw,
  Navigation as NavIcon,
  Volume2,
} from "lucide-react";
import {
  Alert,
  Incident,
  Officer,
  QuickAction,
  MapMarker,
} from "@/lib/types/database";

export default function MobileApp() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [currentOfficer, setCurrentOfficer] = useState<Officer | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapMarkers, setMapMarkers] = useState<MapMarker[]>([]);

  const supabase = createClient();

  useEffect(() => {
    // Check authentication first
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = "/auth/login";
        return;
      }

      // If authenticated, proceed with data fetching
      fetchCurrentOfficer();
      fetchAlerts();
      getCurrentLocation();
    };

    checkAuth();

    // Set up real-time subscriptions
    const alertsSubscription = supabase
      .channel("mobile_alerts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "alerts" },
        () => fetchAlerts()
      )
      .subscribe();

    return () => {
      alertsSubscription.unsubscribe();
    };
  }, []);

  const fetchCurrentOfficer = async () => {
    try {
      // In a real app, get officer ID from auth context
      const { data, error } = await supabase
        .from("officers")
        .select("*")
        .eq("badge_number", "218") // Hardcoded for demo
        .single();

      if (error) throw error;
      setCurrentOfficer(data);
    } catch (error) {
      console.error("Error fetching officer:", error);
    }
  };

  const fetchAlerts = async () => {
    try {
      if (!currentOfficer) return;

      const { data, error } = await supabase
        .from("alerts")
        .select(
          `
          *,
          incident:incidents(*)
        `
        )
        .eq("officer_id", currentOfficer.id)
        .eq("is_dismissed", false)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setAlerts(data || []);

      // Create map markers from alerts
      const markers: MapMarker[] = (data || []).map((alert) => ({
        id: alert.id,
        latitude: alert.incident?.latitude || 40.7128,
        longitude: alert.incident?.longitude || -74.006,
        type: alert.alert_type,
        risk_level: alert.incident?.risk_level || "medium",
        officer_name: alert.incident?.officer?.name || "Unknown",
        badge_number: alert.incident?.officer?.badge_number || "N/A",
        is_resolved: alert.incident?.is_resolved || false,
      }));
      setMapMarkers(markers);
    } catch (error) {
      console.error("Error fetching alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };

  const dismissAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from("alerts")
        .update({
          is_dismissed: true,
          dismissed_at: new Date().toISOString(),
        })
        .eq("id", alertId);

      if (error) throw error;
      await fetchAlerts();
    } catch (error) {
      console.error("Error dismissing alert:", error);
    }
  };

  const addQuickNote = async (noteType: string, content?: string) => {
    if (!currentOfficer) return;

    try {
      const { error } = await supabase.from("officer_notes").insert({
        officer_id: currentOfficer.id,
        note_type: noteType,
        content: content || "",
        is_voice_note: isRecording,
      });

      if (error) throw error;
    } catch (error) {
      console.error("Error adding note:", error);
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      addQuickNote("voice_note", "Voice note recorded");
    }
  };

  const getAlertColor = (alertType: string) => {
    switch (alertType) {
      case "officer_aggression":
      case "officer_in_danger":
        return "bg-red-100 text-red-800 border-red-200";
      case "suspect_weapon_detected":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "verbal_escalation":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case "officer_aggression":
      case "suspect_aggression":
        return <AlertTriangle className="h-5 w-5" />;
      case "suspect_weapon_detected":
      case "officer_in_danger":
        return <Shield className="h-5 w-5" />;
      case "verbal_escalation":
        return <Users className="h-5 w-5" />;
      default:
        return <AlertTriangle className="h-5 w-5" />;
    }
  };

  const formatTime = (timestamp: string) => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffInSeconds = Math.floor(
      (now.getTime() - alertTime.getTime()) / 1000
    );

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    return alertTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const quickActions: QuickAction[] = [
    {
      id: "backup",
      label: "Call Backup",
      icon: "Phone",
      action: () => addQuickNote("backup_requested", "Backup requested"),
      variant: "destructive",
    },
    {
      id: "deescalated",
      label: "Situation De-escalated",
      icon: "CheckCircle",
      action: () =>
        addQuickNote("situation_deescalated", "Situation de-escalated"),
      variant: "default",
    },
    {
      id: "medical",
      label: "Medical Emergency",
      icon: "Shield",
      action: () =>
        addQuickNote("medical_emergency", "Medical emergency reported"),
      variant: "destructive",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Mobile Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  Safety Alert
                </h1>
                <p className="text-xs text-gray-500">
                  Officer #{currentOfficer?.badge_number} -{" "}
                  {currentOfficer?.name}
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={getCurrentLocation}>
              <NavIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Current Status */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Status: Active</h3>
                <p className="text-sm text-gray-600">
                  {currentLocation
                    ? `Location: ${currentLocation.lat.toFixed(
                        4
                      )}, ${currentLocation.lng.toFixed(4)}`
                    : "Location: Getting position..."}
                </p>
              </div>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant={isRecording ? "destructive" : "outline"}
                  onClick={toggleRecording}
                >
                  {isRecording ? (
                    <MicOff className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
                <Button size="sm" variant="outline" onClick={fetchAlerts}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Alerts */}
        {alerts.length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-red-800 flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5" />
                <span>Active Alerts</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border ${getAlertColor(
                    alert.alert_type
                  )}`}
                >
                  <div className="flex items-start space-x-3">
                    {getAlertIcon(alert.alert_type)}
                    <div className="flex-1">
                      <p className="font-medium">{alert.message}</p>
                      <p className="text-xs opacity-75">
                        {formatTime(alert.created_at)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => dismissAlert(alert.id)}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Tap to log incident updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              {quickActions.map((action) => (
                <Button
                  key={action.id}
                  variant={action.variant}
                  className="h-12 justify-start"
                  onClick={action.action}
                >
                  {action.icon === "Phone" && (
                    <Phone className="h-4 w-4 mr-3" />
                  )}
                  {action.icon === "CheckCircle" && (
                    <CheckCircle className="h-4 w-4 mr-3" />
                  )}
                  {action.icon === "Shield" && (
                    <Shield className="h-4 w-4 mr-3" />
                  )}
                  {action.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Map View */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              Location & Nearby Officers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleMap
              markers={mapMarkers}
              center={currentLocation || { lat: 40.7128, lng: -74.006 }}
              className="h-48"
            />
          </CardContent>
        </Card>

        {/* Alert History */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Recent Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Shield className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No recent alerts</p>
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.slice(0, 3).map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center space-x-3 p-2 bg-gray-50 rounded"
                  >
                    {getAlertIcon(alert.alert_type)}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{alert.message}</p>
                      <p className="text-xs text-gray-500">
                        {formatTime(alert.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="flex justify-center space-x-4">
          <Button
            size="lg"
            variant="outline"
            className="flex-1 max-w-xs"
            onClick={() => addQuickNote("custom", "Custom note added")}
          >
            <Volume2 className="h-4 w-4 mr-2" />
            Add Note
          </Button>
        </div>
      </div>
    </div>
  );
}
