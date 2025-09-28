"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// Removed unused Badge import
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/navigation";
import {
  Clock,
  AlertTriangle,
  Shield,
  Play,
  CheckCircle,
  RefreshCw,
  Video,
  User,
  Badge as BadgeIcon,
} from "lucide-react";
import { Incident, Alert, DashboardStats } from "@/lib/types/database";
import { StreamProvider } from "@/components/livekit/stream-provider";
import { IncidentVideoStream } from "@/components/livekit/incident-video-stream";
import { CameraStreamTest } from "@/components/livekit/camera-stream-test";
import { AgentDataDisplay } from "@/components/agent-data-display";
import { MastraInsights } from "@/components/mastra-insights";

export default function Dashboard() {
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(
    null
  );
  const [stats, setStats] = useState<DashboardStats>({
    total_incidents: 0,
    active_incidents: 0,
    resolved_today: 0,
    critical_alerts: 0,
  });

  // Static hard-coded data for demonstration
  const incidents: Incident[] = [
    {
      id: "inc-001",
      officer_id: "officer-001",
      escalation_type: "officer_aggression" as const,
      risk_level: "critical" as const,
      description:
        "Officer showing signs of aggression during traffic stop - immediate intervention needed",
      created_at: "2025-09-28T08:45:32.000Z",
      is_resolved: false,
      resolved_at: undefined,
      officer: {
        id: "officer-001",
        name: "Officer Sarah Johnson",
        badge_number: "BADGE-001",
        created_at: "2025-09-28T08:00:00.000Z",
      },
    },
    {
      id: "inc-002",
      officer_id: "officer-002",
      escalation_type: "suspect_weapon_detected" as const,
      risk_level: "critical" as const,
      description:
        "Weapon detected on suspect during routine stop - tactical response required",
      created_at: "2025-09-28T08:42:15.000Z",
      is_resolved: false,
      resolved_at: undefined,
      officer: {
        id: "officer-002",
        name: "Officer Michael Chen",
        badge_number: "BADGE-002",
        created_at: "2025-09-28T08:00:00.000Z",
      },
    },
    {
      id: "inc-003",
      officer_id: "officer-003",
      escalation_type: "officer_in_danger" as const,
      risk_level: "critical" as const,
      description: "Officer in immediate danger - backup dispatched urgently",
      created_at: "2025-09-28T08:38:22.000Z",
      is_resolved: false,
      resolved_at: undefined,
      officer: {
        id: "officer-003",
        name: "Officer David Rodriguez",
        badge_number: "BADGE-003",
        created_at: "2025-09-28T08:00:00.000Z",
      },
    },
    {
      id: "inc-004",
      officer_id: "officer-004",
      escalation_type: "suspect_aggression" as const,
      risk_level: "high" as const,
      description:
        "Suspect becoming increasingly aggressive - escalation observed",
      created_at: "2025-09-28T08:35:10.000Z",
      is_resolved: false,
      resolved_at: undefined,
      officer: {
        id: "officer-004",
        name: "Officer Lisa Thompson",
        badge_number: "BADGE-004",
        created_at: "2025-09-28T08:00:00.000Z",
      },
    },
    {
      id: "inc-005",
      officer_id: "officer-005",
      escalation_type: "multiple_officers_needed" as const,
      risk_level: "high" as const,
      description:
        "Situation requires additional officers - crowd control needed",
      created_at: "2025-09-28T08:30:45.000Z",
      is_resolved: false,
      resolved_at: undefined,
      officer: {
        id: "officer-005",
        name: "Officer James Wilson",
        badge_number: "BADGE-005",
        created_at: "2025-09-28T08:00:00.000Z",
      },
    },
    {
      id: "inc-006",
      officer_id: "officer-006",
      escalation_type: "crowd_control_needed" as const,
      risk_level: "medium" as const,
      description: "Large crowd gathering - potential for escalation",
      created_at: "2025-09-28T08:25:30.000Z",
      is_resolved: false,
      resolved_at: undefined,
      officer: {
        id: "officer-006",
        name: "Officer Maria Garcia",
        badge_number: "BADGE-006",
        created_at: "2025-09-28T08:00:00.000Z",
      },
    },
    {
      id: "inc-007",
      officer_id: "officer-007",
      escalation_type: "verbal_escalation" as const,
      risk_level: "medium" as const,
      description:
        "Verbal confrontation escalating between officer and suspect",
      created_at: "2025-09-28T08:20:15.000Z",
      is_resolved: false,
      resolved_at: undefined,
      officer: {
        id: "officer-007",
        name: "Officer Robert Brown",
        badge_number: "BADGE-007",
        created_at: "2025-09-28T08:00:00.000Z",
      },
    },
  ];

  const alerts: Alert[] = [
    {
      id: "alert-001",
      officer_id: "officer-001",
      incident_id: "inc-001",
      alert_type: "officer_aggression" as const,
      message:
        "Officer behavior escalating - immediate supervisor intervention required",
      created_at: "2025-09-28T08:46:00.000Z",
    },
    {
      id: "alert-002",
      officer_id: "officer-002",
      incident_id: "inc-002",
      alert_type: "suspect_weapon_detected" as const,
      message: "Weapon detected - tactical team dispatched",
      created_at: "2025-09-28T08:43:00.000Z",
    },
    {
      id: "alert-003",
      officer_id: "officer-003",
      incident_id: "inc-003",
      alert_type: "officer_in_danger" as const,
      message: "Officer safety compromised - emergency backup en route",
      created_at: "2025-09-28T08:39:00.000Z",
    },
    {
      id: "alert-004",
      officer_id: "officer-004",
      incident_id: "inc-004",
      alert_type: "suspect_aggression" as const,
      message: "Suspect becoming increasingly hostile - de-escalation needed",
      created_at: "2025-09-28T08:36:00.000Z",
    },
    {
      id: "alert-005",
      officer_id: "officer-005",
      incident_id: "inc-005",
      alert_type: "multiple_officers_needed" as const,
      message: "Additional units requested for crowd control situation",
      created_at: "2025-09-28T08:31:00.000Z",
    },
    {
      id: "alert-006",
      officer_id: "officer-006",
      incident_id: "inc-006",
      alert_type: "crowd_control_needed" as const,
      message: "Large crowd forming - monitoring for potential escalation",
      created_at: "2025-09-28T08:26:00.000Z",
    },
    {
      id: "alert-007",
      officer_id: "officer-007",
      incident_id: "inc-007",
      alert_type: "verbal_escalation" as const,
      message: "Verbal confrontation intensifying - de-escalation in progress",
      created_at: "2025-09-28T08:21:00.000Z",
    },
  ];

  const loading = false;

  // Calculate stats directly from static data
  const activeIncidents = incidents.filter((i) => !i.is_resolved).length;
  const criticalAlerts = alerts.filter(
    (a) =>
      a.alert_type === "officer_aggression" ||
      a.alert_type === "officer_in_danger" ||
      a.alert_type === "suspect_weapon_detected"
  ).length;
  const today = new Date().toISOString().split("T")[0];
  const resolvedToday = incidents.filter(
    (i) => i.is_resolved && i.resolved_at && i.resolved_at.startsWith(today)
  ).length;

  const calculatedStats = {
    total_incidents: incidents.length,
    active_incidents: activeIncidents,
    resolved_today: resolvedToday,
    critical_alerts: criticalAlerts,
  };

  // Update stats state
  useEffect(() => {
    setStats(calculatedStats);
  }, [calculatedStats]);

  const resolveIncident = async (incidentId: string) => {
    // For static data, we'll just log the action
    console.log(`Resolving incident: ${incidentId}`);
    alert(
      `Incident ${incidentId} has been resolved! (This is a demo with static data)`
    );
  };

  const handleRecommendationAction = async (
    action: string,
    incidentId: string
  ) => {
    console.log(`Executing action: ${action} for incident: ${incidentId}`);
    // Here you would implement the actual action execution
    // For now, we'll just log it
  };

  // Removed unused utility functions - now handled by components

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">
            Police Safety Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Real-time monitoring and incident management
          </p>
        </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Incidents
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {calculatedStats.total_incidents}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Incidents
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {calculatedStats.active_incidents}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Resolved Today
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {calculatedStats.resolved_today}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Critical Alerts
              </CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {calculatedStats.critical_alerts}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Incident Feed with Body Camera Streams */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Live Incident Feed</CardTitle>
              <CardDescription>
                Real-time body camera streams and AI-powered incident monitoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StreamProvider roomName="officer-stream-room">
                <div className="space-y-6">
                  {incidents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No incidents at this time
                    </div>
                  ) : (
                    incidents.map((incident, index) => (
                      <div
                        key={incident.id}
                        className={`p-6 border rounded-lg cursor-pointer transition-colors ${
                          selectedIncident?.id === incident.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setSelectedIncident(incident)}
                      >
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          {/* Live Body Camera Stream */}
                          <div
                            className="lg:col-span-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {index === 0 ? (
                              <CameraStreamTest
                                incident={incident}
                                className="w-full"
                              />
                            ) : (
                              <IncidentVideoStream
                                incident={incident}
                                className="w-full"
                              />
                            )}
                          </div>

                          {/* AI Agent Data Display */}
                          <div
                            className="lg:col-span-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <AgentDataDisplay
                              incident={incident}
                              alerts={alerts}
                              className="h-full"
                            />
                          </div>
                        </div>

                        {/* Mastra AI Insights */}
                        <div
                          className="mt-4"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MastraInsights
                            incident={incident}
                            alerts={alerts.filter(
                              (alert) => alert.incident_id === incident.id
                            )}
                            onRecommendationAction={handleRecommendationAction}
                          />
                        </div>

                        {/* Action Buttons */}
                        <div
                          className="flex space-x-2 mt-4 pt-4 border-t"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedIncident(incident);
                            }}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          {!incident.is_resolved && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                resolveIncident(incident.id);
                              }}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Resolve
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </StreamProvider>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
