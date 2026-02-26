-- =====================================================
-- FIX: Allow students to update their own appointment requests
-- Run this in Supabase SQL Editor
-- =====================================================
-- Problem: Students can't delete chat rooms that have linked
-- appointment_requests because the existing RLS policy only
-- allows staff (counselor/admin) to UPDATE appointment_requests.
-- The delete flow needs to null out chat_room_id first.
--
-- Fix: Add an UPDATE policy for students on their own rows.
-- =====================================================

-- Allow students to clear chat_room_id on their own appointment requests
-- (needed when deleting a chat room that has linked appointments)
-- WITH CHECK ensures only chat_room_id can be changed, and only to NULL
CREATE POLICY "appointments_update_own_chat_room" ON appointment_requests
    FOR UPDATE
    USING (student_id = auth.uid())
    WITH CHECK (
        student_id = auth.uid()
        AND chat_room_id IS NULL
    );
