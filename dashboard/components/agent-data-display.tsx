"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Shield,
  Users,
  Clock,
  Activity,
  TrendingUp,
  MessageSquare,
} from "lucide-react";
import { Incident, Alert } from "@/lib/types/database";

interface AgentDataDisplayProps {
  incident: Incident;
  alerts: Alert[];
  className?: string;
}

export function AgentDataDisplay({
  incident,
  alerts,
  className = "",
}: AgentDataDisplayProps) {
  // Find alerts related to this incident
  const incidentAlerts = alerts.filter(
    (alert) => alert.incident_id === incident.id
  );

  // Get the most recent alert for this incident
  const latestAlert = incidentAlerts.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0];

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case "critical":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case "high":
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case "medium":
        return <Shield className="h-5 w-5 text-yellow-500" />;
      default:
        return <Shield className="h-5 w-5 text-green-500" />;
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

  const getEscalationIcon = (type: string) => {
    switch (type) {
      case "officer_aggression":
      case "suspect_aggression":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "suspect_weapon_detected":
      case "officer_in_danger":
        return <Shield className="h-4 w-4 text-orange-500" />;
      case "verbal_escalation":
        return <MessageSquare className="h-4 w-4 text-yellow-500" />;
      case "crowd_control_needed":
        return <Users className="h-4 w-4 text-blue-500" />;
      case "medical_emergency":
        return <Activity className="h-4 w-4 text-purple-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Risk Assessment Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            {getRiskIcon(incident.risk_level)}
            AI Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Risk Level</span>
            <Badge className={getRiskColor(incident.risk_level)}>
              {incident.risk_level.toUpperCase()}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Escalation Type</span>
            <div className="flex items-center gap-2">
              {getEscalationIcon(incident.escalation_type)}
              <span className="text-sm capitalize">
                {incident.escalation_type.replace("_", " ")}
              </span>
            </div>
          </div>

          {incident.description && (
            <div>
              <span className="text-sm font-medium block mb-1">
                AI Analysis
              </span>
              <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                {incident.description}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live Alerts */}
      {incidentAlerts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              Live Alerts ({incidentAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {incidentAlerts.slice(0, 3).map((alert) => (
              <div
                key={alert.id}
                className="p-3 bg-orange-50 border border-orange-200 rounded-lg"
              >
                <div className="flex items-start gap-2">
                  {getEscalationIcon(alert.alert_type)}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-orange-800">
                      {alert.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-3 w-3 text-orange-600" />
                      <span className="text-xs text-orange-600">
                        {formatTime(alert.created_at)}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {alert.alert_type.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {incidentAlerts.length > 3 && (
              <p className="text-xs text-gray-500 text-center">
                +{incidentAlerts.length - 3} more alerts
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Incident Timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-blue-500" />
            Incident Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-3 p-2 bg-blue-50 rounded">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium">Incident Created</p>
              <p className="text-xs text-gray-600">
                {formatTime(incident.created_at)}
              </p>
            </div>
          </div>

          {incident.is_resolved && incident.resolved_at && (
            <div className="flex items-center gap-3 p-2 bg-green-50 rounded">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Incident Resolved</p>
                <p className="text-xs text-gray-600">
                  {formatTime(incident.resolved_at)}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
