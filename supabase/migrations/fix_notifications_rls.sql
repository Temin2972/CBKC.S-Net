-- Fix notifications RLS policies
-- Run this in Supabase SQL Editor

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
DROP POLICY IF EXISTS "notifications_insert" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_all" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_any" ON notifications;
DROP POLICY IF EXISTS "notifications_delete_own" ON notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Create notifications" ON notifications;

-- SELECT: Users can only view their own notifications
CREATE POLICY "notifications_select_own" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

-- INSERT: Any authenticated user can create notifications
CREATE POLICY "notifications_insert" ON notifications
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Users can update their own notifications (mark as read)
CREATE POLICY "notifications_update_own" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- DELETE: Users can delete their own notifications
CREATE POLICY "notifications_delete_own" ON notifications
    FOR DELETE USING (auth.uid() = user_id);

-- Verify
SELECT policyname, cmd, permissive, qual, with_check
FROM pg_policies
WHERE tablename = 'notifications'
ORDER BY policyname;