-- =====================================================
-- SUPABASE SECURITY CONFIGURATION v2.0
-- Enhanced with helper functions and simplified policies
-- Run these SQL commands in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 0. HELPER FUNCTIONS FOR SIMPLIFIED POLICIES
-- These functions cache role checks and simplify policy logic
-- =====================================================

-- Check if current user is a counselor
CREATE OR REPLACE FUNCTION is_counselor()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('counselor', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get current user's role (cached lookup)
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role FROM users WHERE id = auth.uid();
    RETURN COALESCE(user_role, 'student');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user can access a specific chat room
CREATE OR REPLACE FUNCTION can_access_chat_room(room_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
    room_student_id UUID;
    room_counselor_id UUID;
BEGIN
    -- Get current user's role
    SELECT role INTO user_role FROM users WHERE id = auth.uid();
    
    -- Admin has full access to all rooms
    IF user_role = 'admin' THEN 
        RETURN TRUE; 
    END IF;
    
    -- Get room info
    SELECT student_id, counselor_id 
    INTO room_student_id, room_counselor_id 
    FROM chat_rooms WHERE id = room_id;
    
    -- Room doesn't exist
    IF room_student_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Student can access their own room
    IF room_student_id = auth.uid() THEN 
        RETURN TRUE; 
    END IF;
    
    -- Counselor access rules
    IF user_role = 'counselor' THEN
        -- Can access public rooms (counselor_id IS NULL)
        IF room_counselor_id IS NULL THEN
            RETURN TRUE;
        END IF;
        -- Can access private rooms assigned to them
        IF room_counselor_id = auth.uid() THEN
            RETURN TRUE;
        END IF;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is the owner of a resource
CREATE OR REPLACE FUNCTION is_owner(resource_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN resource_user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- 1. ROW LEVEL SECURITY (RLS) POLICIES
-- Simplified using helper functions
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE flagged_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USERS TABLE POLICIES
-- =====================================================

-- Drop existing policies if they exist (for clean migration)
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Counselors can view all users" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Users can read their own profile
CREATE POLICY "users_select_own" ON users
    FOR SELECT USING (is_owner(id));

-- Counselors and admins can view all users
CREATE POLICY "users_select_by_staff" ON users
    FOR SELECT USING (is_counselor());

-- Users can update their own profile (but not role)
CREATE POLICY "users_update_own" ON users
    FOR UPDATE USING (is_owner(id))
    WITH CHECK (
        is_owner(id) 
        AND role = (SELECT role FROM users WHERE id = auth.uid())
    );

-- =====================================================
-- POSTS TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Authenticated users can view approved posts" ON posts;
DROP POLICY IF EXISTS "Users can create posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;
DROP POLICY IF EXISTS "Counselors can moderate posts" ON posts;

-- Anyone authenticated can view approved posts
CREATE POLICY "posts_select_approved" ON posts
    FOR SELECT USING (auth.uid() IS NOT NULL AND status = 'approved');

-- Users can create posts
CREATE POLICY "posts_insert_own" ON posts
    FOR INSERT WITH CHECK (is_owner(author_id));

-- Users can delete their own posts
CREATE POLICY "posts_delete_own" ON posts
    FOR DELETE USING (is_owner(author_id));

-- Staff can moderate any post
CREATE POLICY "posts_update_by_staff" ON posts
    FOR UPDATE USING (is_counselor());

-- =====================================================
-- COMMENTS TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view comments" ON comments;
DROP POLICY IF EXISTS "Users can create comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
DROP POLICY IF EXISTS "Counselors can delete comments" ON comments;

-- Authenticated users can view comments
CREATE POLICY "comments_select" ON comments
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Users can create comments
CREATE POLICY "comments_insert_own" ON comments
    FOR INSERT WITH CHECK (is_owner(author_id));

-- Users can delete their own comments
CREATE POLICY "comments_delete_own" ON comments
    FOR DELETE USING (is_owner(author_id));

-- Staff can delete any comment
CREATE POLICY "comments_delete_by_staff" ON comments
    FOR DELETE USING (is_counselor());

-- =====================================================
-- CHAT ROOMS TABLE POLICIES (Simplified!)
-- =====================================================

DROP POLICY IF EXISTS "Students can view own chat rooms" ON chat_rooms;
DROP POLICY IF EXISTS "Students can create chat rooms" ON chat_rooms;
DROP POLICY IF EXISTS "Students can delete own chat rooms" ON chat_rooms;

-- Select using helper function
CREATE POLICY "chat_rooms_select" ON chat_rooms
    FOR SELECT USING (can_access_chat_room(id));

-- Students can create chat rooms
CREATE POLICY "chat_rooms_insert" ON chat_rooms
    FOR INSERT WITH CHECK (
        is_owner(student_id) 
        AND get_my_role() = 'student'
    );

-- Students can delete their own chat rooms
CREATE POLICY "chat_rooms_delete" ON chat_rooms
    FOR DELETE USING (is_owner(student_id));

-- Staff can update chat rooms (for transfer, urgency level, etc.)
CREATE POLICY "chat_rooms_update_by_staff" ON chat_rooms
    FOR UPDATE USING (is_counselor());

-- =====================================================
-- CHAT MESSAGES TABLE POLICIES (Simplified!)
-- =====================================================

DROP POLICY IF EXISTS "Users can view messages in accessible rooms" ON chat_messages;
DROP POLICY IF EXISTS "Users can send messages" ON chat_messages;

-- View messages in accessible rooms
CREATE POLICY "chat_messages_select" ON chat_messages
    FOR SELECT USING (can_access_chat_room(chat_room_id));

-- Send messages to accessible rooms
CREATE POLICY "chat_messages_insert" ON chat_messages
    FOR INSERT WITH CHECK (
        is_owner(sender_id) 
        AND can_access_chat_room(chat_room_id)
    );

-- Users can delete their own messages
CREATE POLICY "chat_messages_delete_own" ON chat_messages
    FOR DELETE USING (is_owner(sender_id));

-- Staff can delete any message (moderation)
CREATE POLICY "chat_messages_delete_by_staff" ON chat_messages
    FOR DELETE USING (is_counselor());

-- =====================================================
-- NOTIFICATIONS TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Create notifications" ON notifications;

-- Users can only view their own notifications
CREATE POLICY "notifications_select_own" ON notifications
    FOR SELECT USING (is_owner(user_id));

-- Users can update their own notifications (mark as read)
CREATE POLICY "notifications_update_own" ON notifications
    FOR UPDATE USING (is_owner(user_id));

-- Any authenticated user can create notifications
CREATE POLICY "notifications_insert" ON notifications
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can delete their own notifications
CREATE POLICY "notifications_delete_own" ON notifications
    FOR DELETE USING (is_owner(user_id));

-- =====================================================
-- FLAGGED CONTENT TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Counselors can view flagged content" ON flagged_content;
DROP POLICY IF EXISTS "System can flag content" ON flagged_content;
DROP POLICY IF EXISTS "Counselors can resolve flagged content" ON flagged_content;

-- Only staff can view flagged content
CREATE POLICY "flagged_content_select" ON flagged_content
    FOR SELECT USING (is_counselor());

-- Any authenticated user can create flagged content (system/auto)
CREATE POLICY "flagged_content_insert" ON flagged_content
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Staff can update/resolve flagged content
CREATE POLICY "flagged_content_update" ON flagged_content
    FOR UPDATE USING (is_counselor());

-- =====================================================
-- PENDING CONTENT TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Counselors can view pending content" ON pending_content;
DROP POLICY IF EXISTS "Users can create pending content" ON pending_content;
DROP POLICY IF EXISTS "Counselors can moderate pending content" ON pending_content;

-- Staff can view all pending content
CREATE POLICY "pending_content_select_by_staff" ON pending_content
    FOR SELECT USING (is_counselor());

-- Users can also view their OWN pending content
CREATE POLICY "pending_content_select_own" ON pending_content
    FOR SELECT USING (is_owner(author_id));

-- Users can create pending content
CREATE POLICY "pending_content_insert" ON pending_content
    FOR INSERT WITH CHECK (is_owner(author_id));

-- Users can DELETE their own pending content (before approved)
CREATE POLICY "pending_content_delete_own" ON pending_content
    FOR DELETE USING (is_owner(author_id) AND status = 'pending');

-- Staff can moderate (update status)
CREATE POLICY "pending_content_update_by_staff" ON pending_content
    FOR UPDATE USING (is_counselor());

-- =====================================================
-- SURVEYS TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view own surveys" ON surveys;
DROP POLICY IF EXISTS "Counselors can view surveys" ON surveys;
DROP POLICY IF EXISTS "Users can create surveys" ON surveys;

-- Users can view their own survey responses
CREATE POLICY "surveys_select_own" ON surveys
    FOR SELECT USING (is_owner(user_id));

-- Staff can view all surveys
CREATE POLICY "surveys_select_by_staff" ON surveys
    FOR SELECT USING (is_counselor());

-- Users can create survey responses
CREATE POLICY "surveys_insert" ON surveys
    FOR INSERT WITH CHECK (is_owner(user_id));

-- =====================================================
-- FEEDBACKS TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view own feedback" ON feedbacks;
DROP POLICY IF EXISTS "Admins can view all feedback" ON feedbacks;
DROP POLICY IF EXISTS "Users can create feedback" ON feedbacks;

-- Users can view their own feedback
CREATE POLICY "feedbacks_select_own" ON feedbacks
    FOR SELECT USING (is_owner(user_id));

-- Staff can view all feedback
CREATE POLICY "feedbacks_select_by_staff" ON feedbacks
    FOR SELECT USING (is_counselor());

-- Users can create feedback
CREATE POLICY "feedbacks_insert" ON feedbacks
    FOR INSERT WITH CHECK (is_owner(user_id));

-- =====================================================
-- 2. ADDITIONAL HELPER FUNCTIONS
-- =====================================================

-- Get user role by ID (for other queries)
CREATE OR REPLACE FUNCTION get_user_role(target_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role FROM users WHERE id = target_user_id;
    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- 3. TRIGGERS FOR DATA INTEGRITY
-- =====================================================

-- Trigger to set created_at and updated_at
CREATE OR REPLACE FUNCTION set_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        NEW.created_at = NOW();
    END IF;
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all relevant tables (only if trigger doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamps_users') THEN
        CREATE TRIGGER set_timestamps_users
            BEFORE INSERT OR UPDATE ON users
            FOR EACH ROW EXECUTE FUNCTION set_timestamps();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamps_posts') THEN
        CREATE TRIGGER set_timestamps_posts
            BEFORE INSERT OR UPDATE ON posts
            FOR EACH ROW EXECUTE FUNCTION set_timestamps();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamps_chat_messages') THEN
        CREATE TRIGGER set_timestamps_chat_messages
            BEFORE INSERT OR UPDATE ON chat_messages
            FOR EACH ROW EXECUTE FUNCTION set_timestamps();
    END IF;
END $$;

-- =====================================================
-- 4. RATE LIMITING
-- =====================================================

-- Rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    action TEXT NOT NULL,
    count INTEGER DEFAULT 1,
    window_start TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, action)
);

-- Enable RLS on rate_limits
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Users can manage their own rate limits
CREATE POLICY "rate_limits_own" ON rate_limits
    FOR ALL USING (is_owner(user_id));

-- Function to check rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_user_id UUID,
    p_action TEXT,
    p_max_count INTEGER DEFAULT 10,
    p_window_seconds INTEGER DEFAULT 60
)
RETURNS BOOLEAN AS $$
DECLARE
    v_count INTEGER;
    v_window_start TIMESTAMPTZ;
BEGIN
    SELECT count, window_start INTO v_count, v_window_start
    FROM rate_limits
    WHERE user_id = p_user_id AND action = p_action;
    
    -- If no record or window expired, reset
    IF v_window_start IS NULL OR v_window_start < NOW() - (p_window_seconds || ' seconds')::INTERVAL THEN
        INSERT INTO rate_limits (user_id, action, count, window_start)
        VALUES (p_user_id, p_action, 1, NOW())
        ON CONFLICT (user_id, action)
        DO UPDATE SET count = 1, window_start = NOW();
        RETURN TRUE;
    END IF;
    
    -- Check if exceeded
    IF v_count >= p_max_count THEN
        RETURN FALSE;
    END IF;
    
    -- Increment count
    UPDATE rate_limits
    SET count = count + 1
    WHERE user_id = p_user_id AND action = p_action;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. AUDIT LOG TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    table_name TEXT,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on audit logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "audit_logs_admin_only" ON audit_logs
    FOR SELECT USING (is_admin());

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit(
    p_action TEXT,
    p_table_name TEXT DEFAULT NULL,
    p_record_id UUID DEFAULT NULL,
    p_old_data JSONB DEFAULT NULL,
    p_new_data JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data, new_data)
    VALUES (auth.uid(), p_action, p_table_name, p_record_id, p_old_data, p_new_data);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. SECURITY INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_student ON chat_rooms(student_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_counselor ON chat_rooms(counselor_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(chat_room_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_flagged_content_status ON flagged_content(is_resolved);
CREATE INDEX IF NOT EXISTS idx_pending_content_status ON pending_content(status);
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_action ON rate_limits(user_id, action);

-- =====================================================
-- 7. CLEANUP FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS VOID AS $$
BEGIN
    -- Delete old rate limit records (older than 1 hour)
    DELETE FROM rate_limits WHERE window_start < NOW() - INTERVAL '1 hour';
    
    -- Delete old audit logs (older than 90 days)
    DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- Delete old read notifications (older than 30 days)
    DELETE FROM notifications WHERE is_read = TRUE AND created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. INPUT VALIDATION
-- =====================================================

CREATE OR REPLACE FUNCTION validate_content_length(
    p_content TEXT,
    p_max_length INTEGER DEFAULT 10000
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN p_content IS NOT NULL AND LENGTH(p_content) <= p_max_length;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate post content
CREATE OR REPLACE FUNCTION validate_post()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT validate_content_length(NEW.content, 10000) THEN
        RAISE EXCEPTION 'Content exceeds maximum length';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'validate_post_content') THEN
        CREATE TRIGGER validate_post_content
            BEFORE INSERT OR UPDATE ON posts
            FOR EACH ROW EXECUTE FUNCTION validate_post();
    END IF;
END $$;

-- =====================================================
-- NOTES FOR PRODUCTION DEPLOYMENT
-- =====================================================

/*
CHANGELOG v2.0:
- Added helper functions (is_owner, is_counselor, is_admin, can_access_chat_room)
- Simplified all policies using helper functions
- Added missing DELETE policy for pending_content (users can delete own pending)
- Added policy for users to view their own pending content
- Fixed potential infinite recursion issues
- Added STABLE marker to functions for better caching
- Used consistent naming convention: table_operation_scope

DEPLOYMENT CHECKLIST:
1. [ ] Backup current database
2. [ ] Run this script in Supabase SQL Editor
3. [ ] Test each role (student, counselor, admin)
4. [ ] Monitor for policy errors in logs

PERFORMANCE NOTES:
- Helper functions marked as STABLE for query planner optimization
- Added partial index for unread notifications
- Functions use SECURITY DEFINER for consistent permissions
*/
