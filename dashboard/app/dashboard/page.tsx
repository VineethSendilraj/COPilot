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
import {
  Clock,
  AlertTriangle,
  Shield,
  Users,
  Play,
  CheckCircle,
  XCircle,
  RefreshCw,
  Video,
  User,
  Badge as BadgeIcon,
} from "lucide-react";
import { Incident, Officer, Alert, DashboardStats } from "@/lib/types/database";
import { StreamProvider } from "@/components/livekit/stream-provider";
import { IncidentVideoStream } from "@/components/livekit/incident-video-stream";
import { AgentDataDisplay } from "@/components/agent-data-display";

export default function Dashboard() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total_incidents: 0,
    active_incidents: 0,
    resolved_today: 0,
    critical_alerts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(
    null
  );

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
      fetchData();
    };

    checkAuth();

    // Set up automatic refresh every 2 seconds (background updates)
    const refreshInterval = setInterval(() => {
      fetchData(true); // Pass true to indicate this is a background refresh
    }, 2000);

    // Set up real-time subscriptions
    const incidentsSubscription = supabase
      .channel("incidents")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "incidents" },
        () => fetchData()
      )
      .subscribe();

    const alertsSubscription = supabase
      .channel("alerts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "alerts" },
        () => fetchData()
      )
      .subscribe();

    return () => {
      clearInterval(refreshInterval);
      incidentsSubscription.unsubscribe();
      alertsSubscription.unsubscribe();
    };
  }, []);

  const fetchData = async (isBackgroundRefresh = false) => {
    try {
      // Only show loading spinner on initial load, not background refreshes
      if (!isBackgroundRefresh) {
        setLoading(true);
      }

      // Fetch incidents with officer details
      const { data: incidentsData, error: incidentsError } = await supabase
        .from("incidents")
        .select(
          `
          *,
          officer:officers(*)
        `
        )
        .order("created_at", { ascending: false });

      if (incidentsError) throw incidentsError;

      // Fetch officers
      const { data: officersData, error: officersError } = await supabase
        .from("officers")
        .select("*")
        .eq("is_active", true);

      if (officersError) throw officersError;

      // Fetch recent alerts
      const { data: alertsData, error: alertsError } = await supabase
        .from("alerts")
        .select(
          `
          *,
          incident:incidents(*),
          officer:officers(*)
        `
        )
        .eq("is_dismissed", false)
        .order("created_at", { ascending: false })
        .limit(10);

      if (alertsError) throw alertsError;

      setIncidents(incidentsData || []);
      setOfficers(officersData || []);
      setAlerts(alertsData || []);

      // Calculate stats
      const activeIncidents =
        incidentsData?.filter((i) => !i.is_resolved).length || 0;
      const criticalAlerts =
        alertsData?.filter(
          (a) =>
            a.alert_type === "officer_aggression" ||
            a.alert_type === "officer_in_danger"
        ).length || 0;
      const today = new Date().toISOString().split("T")[0];
      const resolvedToday =
        incidentsData?.filter(
          (i) => i.is_resolved && i.resolved_at?.startsWith(today)
        ).length || 0;

      setStats({
        total_incidents: incidentsData?.length || 0,
        active_incidents: activeIncidents,
        resolved_today: resolvedToday,
        critical_alerts: criticalAlerts,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const resolveIncident = async (incidentId: string) => {
    try {
      const { error } = await supabase
        .from("incidents")
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", incidentId);

      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error("Error resolving incident:", error);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getEscalationIcon = (type: string) => {
    switch (type) {
      case "officer_aggression":
        return <AlertTriangle className="h-4 w-4" />;
      case "suspect_weapon_detected":
        return <Shield className="h-4 w-4" />;
      case "verbal_escalation":
        return <Users className="h-4 w-4" />;
      case "multiple_officers_needed":
        return <Users className="h-4 w-4" />;
      case "suspect_aggression":
        return <AlertTriangle className="h-4 w-4" />;
      case "officer_in_danger":
        return <Shield className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

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
              <div className="text-2xl font-bold">{stats.total_incidents}</div>
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
                {stats.active_incidents}
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
                {stats.resolved_today}
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
                {stats.critical_alerts}
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
                    incidents.map((incident) => (
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
                          <div className="lg:col-span-1">
                            <IncidentVideoStream
                              incident={incident}
                              className="w-full"
                            />
                          </div>

                          {/* AI Agent Data Display */}
                          <div className="lg:col-span-2">
                            <AgentDataDisplay
                              incident={incident}
                              alerts={alerts}
                              className="h-full"
                            />
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-2 mt-4 pt-4 border-t">
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
