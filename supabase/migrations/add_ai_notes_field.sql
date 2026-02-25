-- =====================================================
-- AI NOTES FIELD FOR STUDENT_NOTES
-- Allows AI assessments to be stored in content column
-- Run this in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- UPDATE RLS POLICIES
-- Fix policies for counselors and students
-- =====================================================

-- Drop ALL existing policies to recreate them properly
DROP POLICY IF EXISTS "notes_select_staff" ON student_notes;
DROP POLICY IF EXISTS "notes_insert_staff" ON student_notes;
DROP POLICY IF EXISTS "notes_update_staff" ON student_notes;
DROP POLICY IF EXISTS "notes_insert_ai" ON student_notes;
DROP POLICY IF EXISTS "notes_update_ai" ON student_notes;

-- =====================================================
-- COUNSELOR/ADMIN POLICIES (full access)
-- =====================================================

-- Staff can SELECT any notes
CREATE POLICY "notes_select_staff" ON student_notes
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('counselor', 'admin'))
    );

-- Staff can INSERT any notes
CREATE POLICY "notes_insert_staff" ON student_notes
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('counselor', 'admin'))
    );

-- Staff can UPDATE any notes
CREATE POLICY "notes_update_staff" ON student_notes
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('counselor', 'admin'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('counselor', 'admin'))
    );

-- =====================================================
-- STUDENT POLICIES (can only manage their own notes when updated_by is null)
-- This allows AI to insert/update notes on behalf of students
-- =====================================================

-- Students can SELECT their own notes
CREATE POLICY "notes_select_student" ON student_notes
    FOR SELECT USING (
        student_id = auth.uid()
    );

-- Students can INSERT their own notes (for AI assessments)
CREATE POLICY "notes_insert_student" ON student_notes
    FOR INSERT WITH CHECK (
        student_id = auth.uid()
    );

-- Students can UPDATE their own notes ONLY if no counselor has edited yet (updated_by is null)
CREATE POLICY "notes_update_student" ON student_notes
    FOR UPDATE USING (
        student_id = auth.uid() AND updated_by IS NULL
    )
    WITH CHECK (
        student_id = auth.uid()
    );
