export type EscalationType =
  | "officer_aggression"
  | "suspect_weapon_detected"
  | "verbal_escalation"
  | "multiple_officers_needed"
  | "suspect_aggression"
  | "officer_in_danger"
  | "crowd_control_needed"
  | "medical_emergency";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface Officer {
  id: string;
  created_at: string;
}

export interface Incident {
  id: string;
  officer_id: string;
  escalation_type: EscalationType;
  risk_level: RiskLevel;
  description?: string;
  created_at: string;
  officer?: Officer;
}

export interface Alert {
  id: string;
  officer_id: string;
  incident_id: string;
  alert_type: EscalationType;
  message: string;
  created_at: string;
  incident?: Incident;
}

// UI-specific types

export interface DashboardStats {
  total_incidents: number;
  active_incidents: number;
  resolved_today: number;
  critical_alerts: number;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  action: () => void;
  variant: "default" | "destructive" | "secondary";
}
