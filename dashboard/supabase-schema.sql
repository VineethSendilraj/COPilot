-- Police Safety Alert System Database Schema

-- Officers table
CREATE TABLE officers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  badge_number VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  current_latitude DECIMAL(10, 8),
  current_longitude DECIMAL(11, 8),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Escalation types enum
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

-- Risk levels enum
CREATE TYPE risk_level AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

-- Incidents table
CREATE TABLE incidents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  officer_id UUID REFERENCES officers(id) ON DELETE CASCADE,
  escalation_type escalation_type NOT NULL,
  risk_level risk_level NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  address TEXT,
  description TEXT,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alerts table (for mobile app notifications)
CREATE TABLE alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  officer_id UUID REFERENCES officers(id) ON DELETE CASCADE,
  incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
  alert_type escalation_type NOT NULL,
  message TEXT NOT NULL,
  is_dismissed BOOLEAN DEFAULT false,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Incident clips table (for storing video/audio clips)
CREATE TABLE incident_clips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
  clip_url TEXT NOT NULL,
  duration_seconds INTEGER,
  timestamp_offset INTEGER, -- seconds from incident start
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Officer notes table (for quick voice/text notes)
CREATE TABLE officer_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  officer_id UUID REFERENCES officers(id) ON DELETE CASCADE,
  incident_id UUID REFERENCES incidents(id),
  note_type VARCHAR(50) NOT NULL, -- 'backup_requested', 'situation_deescalated', 'custom'
  content TEXT,
  is_voice_note BOOLEAN DEFAULT false,
  audio_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_officers_badge_number ON officers(badge_number);
CREATE INDEX idx_officers_active ON officers(is_active);
CREATE INDEX idx_incidents_officer_id ON incidents(officer_id);
CREATE INDEX idx_incidents_created_at ON incidents(created_at);
CREATE INDEX idx_incidents_resolved ON incidents(is_resolved);
CREATE INDEX idx_alerts_officer_id ON alerts(officer_id);
CREATE INDEX idx_alerts_dismissed ON alerts(is_dismissed);
CREATE INDEX idx_officer_notes_officer_id ON officer_notes(officer_id);

-- Enable Row Level Security (RLS)
ALTER TABLE officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_clips ENABLE ROW LEVEL SECURITY;
ALTER TABLE officer_notes ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your authentication needs)
-- For now, allowing all operations - you may want to restrict based on user roles
CREATE POLICY "Allow all operations on officers" ON officers FOR ALL USING (true);
CREATE POLICY "Allow all operations on incidents" ON incidents FOR ALL USING (true);
CREATE POLICY "Allow all operations on alerts" ON alerts FOR ALL USING (true);
CREATE POLICY "Allow all operations on incident_clips" ON incident_clips FOR ALL USING (true);
CREATE POLICY "Allow all operations on officer_notes" ON officer_notes FOR ALL USING (true);

-- Insert sample data for development
INSERT INTO officers (badge_number, name, email, current_latitude, current_longitude) VALUES
('218', 'John Smith', 'john.smith@police.gov', 40.7128, -74.0060),
('456', 'Sarah Johnson', 'sarah.johnson@police.gov', 40.7589, -73.9851),
('789', 'Mike Davis', 'mike.davis@police.gov', 40.7505, -73.9934);

-- Insert sample incidents
INSERT INTO incidents (officer_id, escalation_type, risk_level, latitude, longitude, address, description) VALUES
((SELECT id FROM officers WHERE badge_number = '218'), 'suspect_aggression', 'high', 40.7128, -74.0060, '3rd & Main St', 'Suspect showing aggressive behavior during traffic stop'),
((SELECT id FROM officers WHERE badge_number = '456'), 'verbal_escalation', 'medium', 40.7589, -73.9851, 'Broadway & 42nd', 'Verbal confrontation escalating between suspect and officer'),
((SELECT id FROM officers WHERE badge_number = '789'), 'officer_aggression', 'critical', 40.7505, -73.9934, '5th Ave & 34th', 'Officer tone becoming aggressive - intervention needed');

-- Insert sample alerts
INSERT INTO alerts (officer_id, incident_id, alert_type, message) VALUES
((SELECT id FROM officers WHERE badge_number = '218'), (SELECT id FROM incidents WHERE officer_id = (SELECT id FROM officers WHERE badge_number = '218') LIMIT 1), 'suspect_aggression', 'Suspect aggression detected - audio escalation'),
((SELECT id FROM officers WHERE badge_number = '456'), (SELECT id FROM incidents WHERE officer_id = (SELECT id FROM officers WHERE badge_number = '456') LIMIT 1), 'verbal_escalation', 'Verbal escalation detected - maintain calm tone'),
((SELECT id FROM officers WHERE badge_number = '789'), (SELECT id FROM incidents WHERE officer_id = (SELECT id FROM officers WHERE badge_number = '789') LIMIT 1), 'officer_aggression', 'Officer aggression detected - immediate intervention required');
