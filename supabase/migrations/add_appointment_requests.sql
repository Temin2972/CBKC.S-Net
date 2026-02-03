-- =====================================================
-- APPOINTMENT BOOKING SYSTEM
-- Run this in Supabase SQL Editor
-- =====================================================

-- Create appointment_requests table
CREATE TABLE IF NOT EXISTS appointment_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Student info (can be guest or logged in)
    student_id UUID REFERENCES auth.users(id), -- NULL if guest
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    class_name TEXT,
    dorm_room TEXT,
    
    -- Booking details
    time_slot TEXT NOT NULL, -- 'monday_11', 'tuesday_11', etc. or 'other:custom text'
    time_slot_display TEXT, -- Human readable: 'Thứ 2, 11h-12h'
    issues TEXT NOT NULL, -- Student's description of issues
    
    -- AI Classification
    urgency_level INT DEFAULT 0, -- 0-3, classified by AI
    ai_analysis TEXT, -- AI's reasoning
    
    -- Status
    status TEXT DEFAULT 'pending', -- pending, accepted, completed, cancelled
    handled_by UUID REFERENCES auth.users(id),
    chat_room_id UUID REFERENCES chat_rooms(id), -- If counselor creates chat
    
    -- Notes
    counselor_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE appointment_requests ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Anyone can create (guest booking allowed)
CREATE POLICY "appointments_insert_anyone" ON appointment_requests
    FOR INSERT WITH CHECK (true);

-- Logged-in users can view their own requests
CREATE POLICY "appointments_select_own" ON appointment_requests
    FOR SELECT USING (
        student_id = auth.uid() OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('counselor', 'admin'))
    );

-- Staff can view all
CREATE POLICY "appointments_select_staff" ON appointment_requests
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('counselor', 'admin'))
    );

-- Staff can update
CREATE POLICY "appointments_update_staff" ON appointment_requests
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('counselor', 'admin'))
    );

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointment_requests(status);
CREATE INDEX IF NOT EXISTS idx_appointments_urgency ON appointment_requests(urgency_level DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_student ON appointment_requests(student_id);

-- =====================================================
-- UPDATE TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION update_appointment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_appointment_updated_at
    BEFORE UPDATE ON appointment_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_appointment_timestamp();

-- =====================================================
-- TIME SLOTS REFERENCE
-- =====================================================

/*
Time slot values:
- 'monday_11' → 'Thứ 2, 11h00 - 12h00'
- 'tuesday_11' → 'Thứ 3, 11h00 - 12h00'
- 'wednesday_11' → 'Thứ 4, 11h00 - 12h00'
- 'thursday_11' → 'Thứ 5, 11h00 - 12h00'
- 'friday_11' → 'Thứ 6, 11h00 - 12h00'
- 'other:...' → Custom text entered by student
*/
