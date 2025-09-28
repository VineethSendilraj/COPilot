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
  badge_number: string;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Incident {
  id: string;
  officer_id: string;
  escalation_type: EscalationType;
  risk_level: RiskLevel;
  description?: string;
  is_resolved: boolean;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
  officer?: Officer;
}

export interface Alert {
  id: string;
  officer_id: string;
  incident_id: string;
  alert_type: EscalationType;
  message: string;
  is_dismissed: boolean;
  dismissed_at?: string;
  created_at: string;
  incident?: Incident;
}

export interface IncidentClip {
  id: string;
  incident_id: string;
  clip_url: string;
  duration_seconds?: number;
  timestamp_offset?: number;
  created_at: string;
}

export interface OfficerNote {
  id: string;
  officer_id: string;
  incident_id?: string;
  note_type: string;
  content?: string;
  is_voice_note: boolean;
  audio_url?: string;
  created_at: string;
}

export interface IncidentWithDetails extends Incident {
  officer: Officer;
  clips?: IncidentClip[];
  alerts?: Alert[];
}

export interface AlertWithDetails extends Alert {
  incident: Incident;
  officer: Officer;
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
