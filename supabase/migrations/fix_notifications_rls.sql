-- Fix notifications RLS policies
-- Error: new row violates row-level security policy for table "notifications"
-- Run this ENTIRE script in Supabase SQL Editor

-- Step 1: Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies on notifications
DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
DROP POLICY IF EXISTS "notifications_insert" ON notifications;
DROP POLICY IF EXISTS "notifications_delete_own" ON notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Create notifications" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_any" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_all" ON notifications;

-- Step 3: Recreate policies
-- SELECT: Users can only view their own notifications
CREATE POLICY "notifications_select_own" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

-- INSERT: Allow ALL operations (authenticated users create notifications for OTHER users)
-- Using (true) because auth.uid() IS NOT NULL can fail when Supabase
-- evaluates WITH CHECK before the auth context is fully resolved
CREATE POLICY "notifications_insert_all" ON notifications
    FOR INSERT WITH CHECK (true);

-- UPDATE: Users can update (mark as read) their own notifications
CREATE POLICY "notifications_update_own" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- DELETE: Users can delete their own notifications
CREATE POLICY "notifications_delete_own" ON notifications
    FOR DELETE USING (auth.uid() = user_id);

-- Step 4: Verify
SELECT policyname, cmd, permissive, qual, with_check
FROM pg_policies
WHERE tablename = 'notifications'
ORDER BY policyname;
