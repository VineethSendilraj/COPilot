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
  Play,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";
import {
  Incident,
  Officer,
  Alert,
  DashboardStats,
  MapMarker,
} from "@/lib/types/database";

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
      fetchData();
    };

    checkAuth();

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
      incidentsSubscription.unsubscribe();
      alertsSubscription.unsubscribe();
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

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

      // Create map markers from incidents
      const markers: MapMarker[] = (incidentsData || []).map((incident) => ({
        id: incident.id,
        latitude: incident.latitude || 40.7128,
        longitude: incident.longitude || -74.006,
        type: incident.escalation_type,
        risk_level: incident.risk_level,
        officer_name: incident.officer?.name || "Unknown",
        badge_number: incident.officer?.badge_number || "N/A",
        is_resolved: incident.is_resolved,
      }));
      setMapMarkers(markers);

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
        return "bg-gray-100 text-gray-800 border-gray-200";
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
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Dashboard Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Police Safety Dashboard
              </h1>
              <p className="text-sm text-gray-600">
                Real-time monitoring and incident management
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={fetchData} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <div className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {/* Map View */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Incident Map</CardTitle>
            <CardDescription>
              Real-time view of incidents and officer locations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleMap
              markers={mapMarkers}
              center={{ lat: 40.7128, lng: -74.006 }}
              className="h-96"
            />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Live Incident Feed */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Live Incident Feed</CardTitle>
                <CardDescription>
                  Real-time updates on ongoing incidents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {incidents.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No incidents at this time
                    </div>
                  ) : (
                    incidents.map((incident) => (
                      <div
                        key={incident.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedIncident?.id === incident.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setSelectedIncident(incident)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              {getEscalationIcon(incident.escalation_type)}
                              <span className="font-medium">
                                Officer #{incident.officer?.badge_number} -{" "}
                                {incident.officer?.name}
                              </span>
                              <Badge
                                className={getRiskColor(incident.risk_level)}
                              >
                                {incident.risk_level.toUpperCase()}
                              </Badge>
                              {incident.is_resolved && (
                                <Badge
                                  variant="secondary"
                                  className="bg-green-100 text-green-800"
                                >
                                  RESOLVED
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {incident.description ||
                                "No description available"}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-3 w-3" />
                                <span>
                                  {incident.address || "Location not specified"}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{formatTime(incident.created_at)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedIncident(incident);
                              }}
                            >
                              <Play className="h-3 w-3 mr-1" />
                              View
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
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Resolve
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Incident Details & Map */}
          <div className="space-y-6">
            {/* Incident Details */}
            {selectedIncident ? (
              <Card>
                <CardHeader>
                  <CardTitle>Incident Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Officer
                      </label>
                      <p className="text-sm">
                        #{selectedIncident.officer?.badge_number} -{" "}
                        {selectedIncident.officer?.name}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Type
                      </label>
                      <p className="text-sm capitalize">
                        {selectedIncident.escalation_type.replace("_", " ")}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Risk Level
                      </label>
                      <Badge
                        className={getRiskColor(selectedIncident.risk_level)}
                      >
                        {selectedIncident.risk_level.toUpperCase()}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Location
                      </label>
                      <p className="text-sm">{selectedIncident.address}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Time
                      </label>
                      <p className="text-sm">
                        {formatTime(selectedIncident.created_at)}
                      </p>
                    </div>
                    {selectedIncident.description && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Description
                        </label>
                        <p className="text-sm">
                          {selectedIncident.description}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <p className="text-gray-500">
                    Select an incident to view details
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Recent Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alerts.length === 0 ? (
                    <p className="text-sm text-gray-500">No recent alerts</p>
                  ) : (
                    alerts.map((alert) => (
                      <div key={alert.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start space-x-2">
                          {getEscalationIcon(alert.alert_type)}
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {alert.message}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatTime(alert.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
