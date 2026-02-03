-- =====================================================
-- CHAT TRANSFER & URGENCY LEVEL MIGRATION
-- Run this in Supabase SQL Editor
-- =====================================================

-- Add urgency_level column to chat_rooms
ALTER TABLE chat_rooms 
ADD COLUMN IF NOT EXISTS urgency_level INTEGER DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN chat_rooms.urgency_level IS 'Urgency level: 0=normal, 1=attention, 2=urgent, 3=critical';

-- Create index for urgency-based sorting
CREATE INDEX IF NOT EXISTS idx_chat_rooms_urgency ON chat_rooms(urgency_level DESC, last_message_at DESC);

-- =====================================================
-- CHAT TRANSFERS TABLE
-- Logs all chat transfers for audit and history
-- =====================================================

CREATE TABLE IF NOT EXISTS chat_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    from_counselor_id UUID REFERENCES auth.users(id),
    to_counselor_id UUID NOT NULL REFERENCES auth.users(id),
    student_id UUID REFERENCES auth.users(id),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE chat_transfers ENABLE ROW LEVEL SECURITY;

-- Policies for chat_transfers
CREATE POLICY "Staff can view transfers" ON chat_transfers
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('counselor', 'admin'))
    );

CREATE POLICY "Staff can create transfers" ON chat_transfers
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('counselor', 'admin'))
    );

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_chat_transfers_room ON chat_transfers(chat_room_id);
CREATE INDEX IF NOT EXISTS idx_chat_transfers_counselors ON chat_transfers(from_counselor_id, to_counselor_id);

-- =====================================================
-- ADD is_system COLUMN TO CHAT_MESSAGES
-- For system messages like transfer notifications
-- =====================================================

ALTER TABLE chat_messages
ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN chat_messages.is_system IS 'True if this is a system-generated message';

-- =====================================================
-- UPDATE RLS FOR CHAT ROOMS (add update for urgency)
-- =====================================================

-- Drop existing update policy if exists
DROP POLICY IF EXISTS "chat_rooms_update_by_staff" ON chat_rooms;

-- Create new policy allowing staff to update urgency_level and counselor_id
CREATE POLICY "chat_rooms_update_by_staff" ON chat_rooms
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('counselor', 'admin'))
    );

-- =====================================================
-- NOTES
-- =====================================================

/*
URGENCY LEVELS:
- 0: Normal (green) - Standard conversation
- 1: Attention (yellow) - Needs follow-up
- 2: Urgent (orange) - Priority attention needed
- 3: Critical (red) - Immediate intervention required

USAGE:
1. Run this migration in Supabase SQL Editor
2. The useChatRoom hook now has:
   - transferChatRoom(roomId, toCounselorId, reason)
   - setUrgencyLevel(roomId, level)
   - URGENCY_LEVELS constants
*/
