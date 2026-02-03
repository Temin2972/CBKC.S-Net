-- =====================================================
-- AI TRIAGE & COUNSELED MARKING FIELDS
-- Run this in Supabase SQL Editor
-- =====================================================

-- Add AI triage fields to chat_rooms
ALTER TABLE chat_rooms 
ADD COLUMN IF NOT EXISTS ai_triage_complete BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS counselor_first_reply_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_counseled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS counseled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS counseled_by UUID REFERENCES auth.users(id);

-- Comments for documentation
COMMENT ON COLUMN chat_rooms.ai_triage_complete IS 'True when AI has finished initial assessment';
COMMENT ON COLUMN chat_rooms.counselor_first_reply_at IS 'Timestamp of first counselor reply - AI stops after this';
COMMENT ON COLUMN chat_rooms.is_counseled IS 'Manual mark by counselor that chat has been handled';
COMMENT ON COLUMN chat_rooms.counseled_at IS 'When the chat was marked as counseled';
COMMENT ON COLUMN chat_rooms.counseled_by IS 'Counselor who marked as counseled';

-- Index for sorting by counseled status
CREATE INDEX IF NOT EXISTS idx_chat_rooms_counseled ON chat_rooms(is_counseled, urgency_level DESC);

-- =====================================================
-- FUNCTION: Auto-unmark counseled when student messages
-- =====================================================

CREATE OR REPLACE FUNCTION auto_unmark_counseled()
RETURNS TRIGGER AS $$
DECLARE
    room_record chat_rooms%ROWTYPE;
    sender_role TEXT;
BEGIN
    -- Get the chat room
    SELECT * INTO room_record FROM chat_rooms WHERE id = NEW.chat_room_id;
    
    -- Get sender's role
    SELECT role INTO sender_role FROM users WHERE id = NEW.sender_id;
    
    -- If student sends a message and room was marked as counseled, unmark it
    IF sender_role = 'student' AND room_record.is_counseled = TRUE THEN
        UPDATE chat_rooms 
        SET is_counseled = FALSE, counseled_at = NULL, counseled_by = NULL
        WHERE id = NEW.chat_room_id;
    END IF;
    
    -- Check if this is first counselor reply
    IF sender_role IN ('counselor', 'admin') AND room_record.counselor_first_reply_at IS NULL THEN
        UPDATE chat_rooms 
        SET counselor_first_reply_at = NOW()
        WHERE id = NEW.chat_room_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_auto_unmark_counseled ON chat_messages;
CREATE TRIGGER trigger_auto_unmark_counseled
    AFTER INSERT ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION auto_unmark_counseled();

-- =====================================================
-- STUDENT NOTES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS student_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES auth.users(id),
    content TEXT DEFAULT '',
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id)
);

-- Enable RLS
ALTER TABLE student_notes ENABLE ROW LEVEL SECURITY;

-- Staff can view/edit notes
CREATE POLICY "notes_select_staff" ON student_notes
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('counselor', 'admin'))
    );

CREATE POLICY "notes_insert_staff" ON student_notes
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('counselor', 'admin'))
    );

CREATE POLICY "notes_update_staff" ON student_notes
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('counselor', 'admin'))
    );

-- Trigger to update timestamp
CREATE OR REPLACE FUNCTION update_notes_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_notes_updated_at
    BEFORE UPDATE ON student_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_notes_timestamp();

-- Index
CREATE INDEX IF NOT EXISTS idx_notes_student ON student_notes(student_id);
