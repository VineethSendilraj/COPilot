-- Synthetic Test Data for Police Safety Alert System
-- This script generates test data for all tables with proper relationships

-- Insert test officers
INSERT INTO officers (id, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '2 hours'),
('550e8400-e29b-41d4-a716-446655440002', NOW() - INTERVAL '1 hour 30 minutes'),
('550e8400-e29b-41d4-a716-446655440003', NOW() - INTERVAL '45 minutes'),
('550e8400-e29b-41d4-a716-446655440004', NOW() - INTERVAL '20 minutes'),
('550e8400-e29b-41d4-a716-446655440005', NOW() - INTERVAL '5 minutes');

-- Insert test incidents with various escalation types and risk levels
INSERT INTO incidents (id, officer_id, escalation_type, risk_level, description, created_at) VALUES
-- Critical incidents
('inc-001', '550e8400-e29b-41d4-a716-446655440001', 'officer_aggression', 'critical', 'Officer showing signs of aggression during traffic stop - immediate intervention needed', NOW() - INTERVAL '10 minutes'),
('inc-002', '550e8400-e29b-41d4-a716-446655440002', 'suspect_weapon_detected', 'critical', 'Weapon detected on suspect during routine stop - tactical response required', NOW() - INTERVAL '15 minutes'),
('inc-003', '550e8400-e29b-41d4-a716-446655440003', 'officer_in_danger', 'critical', 'Officer in immediate danger - backup dispatched urgently', NOW() - INTERVAL '8 minutes'),

-- High risk incidents
('inc-004', '550e8400-e29b-41d4-a716-446655440001', 'suspect_aggression', 'high', 'Suspect becoming increasingly aggressive - escalation observed', NOW() - INTERVAL '25 minutes'),
('inc-005', '550e8400-e29b-41d4-a716-446655440004', 'multiple_officers_needed', 'high', 'Situation requires additional officers - crowd control needed', NOW() - INTERVAL '30 minutes'),
('inc-006', '550e8400-e29b-41d4-a716-446655440002', 'crowd_control_needed', 'high', 'Large crowd gathering - potential for escalation', NOW() - INTERVAL '35 minutes'),

-- Medium risk incidents
('inc-007', '550e8400-e29b-41d4-a716-446655440003', 'verbal_escalation', 'medium', 'Verbal confrontation escalating between officer and suspect', NOW() - INTERVAL '40 minutes'),
('inc-008', '550e8400-e29b-41d4-a716-446655440005', 'medical_emergency', 'medium', 'Medical emergency during incident - paramedics called', NOW() - INTERVAL '45 minutes'),
('inc-009', '550e8400-e29b-41d4-a716-446655440001', 'verbal_escalation', 'medium', 'Tense verbal exchange - monitoring situation closely', NOW() - INTERVAL '50 minutes'),

-- Low risk incidents
('inc-010', '550e8400-e29b-41d4-a716-446655440004', 'verbal_escalation', 'low', 'Minor verbal disagreement - situation under control', NOW() - INTERVAL '1 hour'),
('inc-011', '550e8400-e29b-41d4-a716-446655440002', 'medical_emergency', 'low', 'Minor medical issue - first aid administered', NOW() - INTERVAL '1 hour 15 minutes'),
('inc-012', '550e8400-e29b-41d4-a716-446655440005', 'verbal_escalation', 'low', 'Routine verbal interaction - no concerns', NOW() - INTERVAL '1 hour 30 minutes');

-- Insert test alerts corresponding to incidents
INSERT INTO alerts (id, officer_id, incident_id, alert_type, message, created_at) VALUES
-- Critical alerts
('alert-001', '550e8400-e29b-41d4-a716-446655440001', 'inc-001', 'officer_aggression', 'CRITICAL: Officer aggression detected - immediate supervisor intervention required', NOW() - INTERVAL '10 minutes'),
('alert-002', '550e8400-e29b-41d4-a716-446655440002', 'inc-002', 'suspect_weapon_detected', 'CRITICAL: Weapon detected - tactical team dispatched immediately', NOW() - INTERVAL '15 minutes'),
('alert-003', '550e8400-e29b-41d4-a716-446655440003', 'inc-003', 'officer_in_danger', 'CRITICAL: Officer safety compromised - emergency backup en route', NOW() - INTERVAL '8 minutes'),

-- High priority alerts
('alert-004', '550e8400-e29b-41d4-a716-446655440001', 'inc-004', 'suspect_aggression', 'HIGH: Suspect aggression escalating - additional units requested', NOW() - INTERVAL '25 minutes'),
('alert-005', '550e8400-e29b-41d4-a716-446655440004', 'inc-005', 'multiple_officers_needed', 'HIGH: Multiple officers required - crowd control situation developing', NOW() - INTERVAL '30 minutes'),
('alert-006', '550e8400-e29b-41d4-a716-446655440002', 'inc-006', 'crowd_control_needed', 'HIGH: Large crowd gathering - crowd control protocols activated', NOW() - INTERVAL '35 minutes'),

-- Medium priority alerts
('alert-007', '550e8400-e29b-41d4-a716-446655440003', 'inc-007', 'verbal_escalation', 'MEDIUM: Verbal confrontation escalating - monitor closely', NOW() - INTERVAL '40 minutes'),
('alert-008', '550e8400-e29b-41d4-a716-446655440005', 'inc-008', 'medical_emergency', 'MEDIUM: Medical emergency - paramedics dispatched', NOW() - INTERVAL '45 minutes'),
('alert-009', '550e8400-e29b-41d4-a716-446655440001', 'inc-009', 'verbal_escalation', 'MEDIUM: Tense verbal exchange - situation being monitored', NOW() - INTERVAL '50 minutes'),

-- Low priority alerts
('alert-010', '550e8400-e29b-41d4-a716-446655440004', 'inc-010', 'verbal_escalation', 'LOW: Minor verbal disagreement - situation under control', NOW() - INTERVAL '1 hour'),
('alert-011', '550e8400-e29b-41d4-a716-446655440002', 'inc-011', 'medical_emergency', 'LOW: Minor medical issue - first aid provided', NOW() - INTERVAL '1 hour 15 minutes'),
('alert-012', '550e8400-e29b-41d4-a716-446655440005', 'inc-012', 'verbal_escalation', 'LOW: Routine interaction - no action required', NOW() - INTERVAL '1 hour 30 minutes'),

-- Additional recent alerts for testing
('alert-013', '550e8400-e29b-41d4-a716-446655440001', 'inc-001', 'officer_aggression', 'UPDATE: Supervisor arrived on scene - intervention in progress', NOW() - INTERVAL '5 minutes'),
('alert-014', '550e8400-e29b-41d4-a716-446655440002', 'inc-002', 'suspect_weapon_detected', 'UPDATE: Tactical team on scene - situation contained', NOW() - INTERVAL '3 minutes'),
('alert-015', '550e8400-e29b-41d4-a716-446655440003', 'inc-003', 'officer_in_danger', 'UPDATE: Backup arrived - officer safety restored', NOW() - INTERVAL '2 minutes');
