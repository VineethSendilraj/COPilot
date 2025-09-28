-- Police Safety Alert System Database Schema
-- This schema is designed to work with voice-video-agent/agent.py outputs

-- Officers table
CREATE TABLE officers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  badge_number VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Escalation types enum (matching voice-video-agent/agent.py risk_label values)
CREATE TYPE escalation_type AS ENUM (
  'officer_aggression',
  'suspect_weapon_detected',
  'verbal_escalation',
  'multiple_officers_needed',
  'suspect_aggression',
  'officer_in_danger',
  'crowd_control_needed',
  'medical_emergency'
);

-- Risk levels enum (matching voice-video-agent/agent.py risk_score mapping)
CREATE TYPE risk_level AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

-- Incidents table (matches voice-video-agent/agent.py _insert_dashboard_records)
CREATE TABLE incidents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  officer_id UUID REFERENCES officers(id) ON DELETE CASCADE,
  escalation_type escalation_type NOT NULL,
  risk_level risk_level NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alerts table (matches voice-video-agent/agent.py _insert_dashboard_records)
CREATE TABLE alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  officer_id UUID REFERENCES officers(id) ON DELETE CASCADE,
  incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
  alert_type escalation_type NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_officers_badge_number ON officers(badge_number);
CREATE INDEX idx_officers_active ON officers(is_active);
CREATE INDEX idx_incidents_officer_id ON incidents(officer_id);
CREATE INDEX idx_incidents_created_at ON incidents(created_at);
CREATE INDEX idx_alerts_officer_id ON alerts(officer_id);
CREATE INDEX idx_alerts_incident_id ON alerts(incident_id);

-- Enable Row Level Security (RLS)
ALTER TABLE officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your authentication needs)
-- For now, allowing all operations - you may want to restrict based on user roles
CREATE POLICY "Allow all operations on officers" ON officers FOR ALL USING (true);
CREATE POLICY "Allow all operations on incidents" ON incidents FOR ALL USING (true);
CREATE POLICY "Allow all operations on alerts" ON alerts FOR ALL USING (true);
