-- =====================================================
-- AI NOTES FIELD FOR STUDENT_NOTES
-- Allows AI assessments to be stored separately from counselor notes
-- Run this in Supabase SQL Editor
-- =====================================================

-- Add AI notes field (separate from counselor's manual notes)
ALTER TABLE student_notes 
ADD COLUMN IF NOT EXISTS ai_notes TEXT DEFAULT '';

-- Add timestamp for AI notes
ALTER TABLE student_notes 
ADD COLUMN IF NOT EXISTS ai_notes_updated_at TIMESTAMPTZ;

-- Comment for documentation
COMMENT ON COLUMN student_notes.ai_notes IS 'AI-generated assessment notes, updated automatically during chat';
COMMENT ON COLUMN student_notes.content IS 'Manual notes written by counselors';

-- =====================================================
-- UPDATE RLS POLICIES
-- Allow students to insert/update their own AI notes only
-- =====================================================

-- Drop existing policies (if they exist) to recreate them
DROP POLICY IF EXISTS "notes_insert_staff" ON student_notes;
DROP POLICY IF EXISTS "notes_update_staff" ON student_notes;
DROP POLICY IF EXISTS "notes_insert_ai" ON student_notes;
DROP POLICY IF EXISTS "notes_update_ai" ON student_notes;

-- Staff can insert any notes
CREATE POLICY "notes_insert_staff" ON student_notes
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('counselor', 'admin'))
    );

-- Staff can update any notes
CREATE POLICY "notes_update_staff" ON student_notes
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('counselor', 'admin'))
    );

-- Students can insert their own AI notes (for new records)
CREATE POLICY "notes_insert_ai" ON student_notes
    FOR INSERT WITH CHECK (
        student_id = auth.uid()
    );

-- Students can update ONLY their own ai_notes field
-- This uses a security definer function to restrict what they can change
CREATE OR REPLACE FUNCTION student_can_update_ai_notes(note_student_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Student can only update their own notes
    RETURN note_student_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE POLICY "notes_update_ai" ON student_notes
    FOR UPDATE USING (
        student_id = auth.uid()
    )
    WITH CHECK (
        student_id = auth.uid()
    );
