"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Brain,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
// Removed direct Mastra imports - now using API routes
import type { Incident, Alert } from "@/lib/types/database";

interface MastraInsightsProps {
  incident: Incident;
  alerts: Alert[];
  onRecommendationAction?: (action: string, incidentId: string) => void;
}

interface Insight {
  id: string;
  type: "recommendation" | "alert" | "analysis";
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  actions: string[];
  timestamp: string;
  status: "pending" | "in_progress" | "completed" | "dismissed";
}

export function MastraInsights({
  incident,
  onRecommendationAction,
}: MastraInsightsProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateInsights = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Call the API route to analyze the incident
      const response = await fetch("/api/mastra/analyze-incident", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ incident }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze incident");
      }

      await response.json();

      // Parse the analysis and create insights
      const newInsights: Insight[] = [];

      // Risk assessment insight
      newInsights.push({
        id: `risk_${incident.id}`,
        type: "analysis",
        title: "Risk Assessment",
        description: `Current risk level: ${
          incident.risk_level
        }. ${getRiskDescription(incident.risk_level)}`,
        priority: incident.risk_level as "low" | "medium" | "high" | "critical",
        actions: getRiskActions(incident.risk_level),
        timestamp: new Date().toISOString(),
        status: "pending",
      });

      // Generate recommendations based on escalation type
      const recommendations = getRecommendations(
        incident.escalation_type,
        incident.risk_level
      );
      recommendations.forEach((rec, index) => {
        newInsights.push({
          id: `rec_${incident.id}_${index}`,
          type: "recommendation",
          title: rec.title,
          description: rec.description,
          priority: rec.priority,
          actions: rec.actions,
          timestamp: new Date().toISOString(),
          status: "pending",
        });
      });

      // Check for backup requirements
      if (
        incident.risk_level === "high" ||
        incident.escalation_type === "high_risk"
      ) {
        newInsights.push({
          id: `backup_${incident.id}`,
          type: "alert",
          title: "Backup Required",
          description:
            "High-risk incident detected. Immediate backup recommended.",
          priority: "critical",
          actions: [
            "Dispatch backup unit",
            "Alert supervisor",
            "Prepare tactical response",
          ],
          timestamp: new Date().toISOString(),
          status: "pending",
        });
      }

      setInsights(newInsights);
    } catch (err) {
      console.error("Error generating insights:", err);
      setError("Failed to generate insights. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [incident]);

  const getRiskDescription = (riskLevel: string) => {
    switch (riskLevel) {
      case "low":
        return "Minimal threat level. Standard procedures sufficient.";
      case "medium":
        return "Moderate threat level. Enhanced monitoring recommended.";
      case "high":
        return "High threat level. Immediate attention required.";
      case "critical":
        return "Critical threat level. Emergency response needed.";
      default:
        return "Unknown risk level.";
    }
  };

  const getRiskActions = (riskLevel: string) => {
    switch (riskLevel) {
      case "low":
        return ["Continue standard procedures", "Monitor situation"];
      case "medium":
        return [
          "Increase monitoring",
          "Prepare backup if needed",
          "Alert supervisor",
        ];
      case "high":
        return [
          "Dispatch backup immediately",
          "Alert supervisor",
          "Prepare tactical response",
        ];
      case "critical":
        return [
          "Emergency response",
          "Dispatch all available units",
          "Alert command center",
        ];
      default:
        return ["Assess situation", "Follow standard protocols"];
    }
  };

  const getRecommendations = (escalationType: string, riskLevel: string) => {
    const recommendations = [];

    if (escalationType === "high_risk" || riskLevel === "high") {
      recommendations.push({
        title: "Immediate Response Required",
        description:
          "This incident requires immediate attention and resource allocation.",
        priority: "critical" as const,
        actions: [
          "Dispatch backup",
          "Alert supervisor",
          "Prepare tactical team",
        ],
      });
    }

    if (escalationType === "escalating") {
      recommendations.push({
        title: "Escalation Management",
        description:
          "Situation is escalating. Implement de-escalation protocols.",
        priority: "high" as const,
        actions: [
          "Deploy de-escalation team",
          "Prepare containment measures",
          "Monitor closely",
        ],
      });
    }

    if (escalationType === "routine") {
      recommendations.push({
        title: "Routine Response",
        description: "Standard response procedures are appropriate.",
        priority: "low" as const,
        actions: [
          "Follow standard protocols",
          "Document incident",
          "Monitor progress",
        ],
      });
    }

    return recommendations;
  };

  const handleActionClick = (action: string, insightId: string) => {
    if (onRecommendationAction) {
      onRecommendationAction(action, incident.id);
    }

    // Update insight status
    setInsights((prev) =>
      prev.map((insight) =>
        insight.id === insightId
          ? { ...insight, status: "in_progress" as const }
          : insight
      )
    );
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "critical":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "high":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "medium":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "low":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100/20 border-red-200/50 text-red-200";
      case "high":
        return "bg-orange-100/20 border-orange-200/50 text-orange-200";
      case "medium":
        return "bg-yellow-100/20 border-yellow-200/50 text-yellow-200";
      case "low":
        return "bg-green-100/20 border-green-200/50 text-green-200";
      default:
        return "bg-gray-100/20 border-gray-200/50 text-gray-200";
    }
  };

  useEffect(() => {
    generateInsights();
  }, [generateInsights]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-500" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-muted-foreground">
              Analyzing incident...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-500" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-red-500 mb-2">{error}</p>
            <Button onClick={generateInsights} variant="outline" size="sm">
              Retry Analysis
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-blue-500" />
          AI Insights & Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No insights available for this incident.
          </p>
        ) : (
          insights.map((insight) => (
            <div
              key={insight.id}
              className={`p-4 rounded-lg border ${getPriorityColor(
                insight.priority
              )}`}
            >
              <div className="flex items-start gap-3">
                {getPriorityIcon(insight.priority)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium">{insight.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      {insight.priority}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {insight.type}
                    </Badge>
                  </div>
                  <p className="text-sm mb-3">{insight.description}</p>

                  {insight.actions.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        Recommended Actions:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {insight.actions.map((action, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() =>
                              handleActionClick(action, insight.id)
                            }
                          >
                            {action}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      {new Date(insight.timestamp).toLocaleTimeString()}
                    </span>
                    <span>•</span>
                    <span className="capitalize">{insight.status}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        <div className="pt-2 border-t border-border">
          <Button
            onClick={generateInsights}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <Brain className="h-4 w-4 mr-2" />
            Refresh Analysis
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
