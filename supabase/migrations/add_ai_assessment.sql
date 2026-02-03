-- =====================================================
-- AI ASSESSMENT FIELD FOR CHAT ROOMS
-- Run this in Supabase SQL Editor
-- =====================================================

-- Add AI assessment JSON field to store detailed analysis
ALTER TABLE chat_rooms 
ADD COLUMN IF NOT EXISTS ai_assessment JSONB;

-- Comment for documentation
COMMENT ON COLUMN chat_rooms.ai_assessment IS 'AI-generated assessment including urgency, suicide risk, issues, and recommendations';

-- Create index for sorting by urgency and suicide risk
CREATE INDEX IF NOT EXISTS idx_chat_rooms_urgency_assessment 
ON chat_rooms(urgency_level DESC, (ai_assessment->>'suicideRisk') DESC NULLS LAST);

-- =====================================================
-- FUNCTION: Get sorted chat rooms for counselors
-- Sorts by: Critical first, then suicide risk, then urgency, then counseled status, then time
-- =====================================================

CREATE OR REPLACE FUNCTION get_sorted_chat_rooms_for_counselor(counselor_uuid UUID)
RETURNS TABLE (
    id UUID,
    student_id UUID,
    counselor_id UUID,
    status TEXT,
    urgency_level INT,
    is_counseled BOOLEAN,
    ai_assessment JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    last_message_at TIMESTAMPTZ,
    sort_priority INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cr.id,
        cr.student_id,
        cr.counselor_id,
        cr.status,
        cr.urgency_level,
        cr.is_counseled,
        cr.ai_assessment,
        cr.created_at,
        cr.updated_at,
        cr.updated_at as last_message_at,
        -- Calculate sort priority (lower = higher priority)
        CASE 
            -- Critical with high suicide risk = highest priority
            WHEN cr.urgency_level = 3 AND cr.ai_assessment->>'suicideRisk' = 'high' THEN 0
            -- High suicide risk = very high priority
            WHEN cr.ai_assessment->>'suicideRisk' = 'high' THEN 1
            -- Critical urgency = high priority
            WHEN cr.urgency_level = 3 THEN 2
            -- Medium suicide risk = elevated priority
            WHEN cr.ai_assessment->>'suicideRisk' = 'medium' THEN 3
            -- Urgent = elevated priority
            WHEN cr.urgency_level = 2 THEN 4
            -- Attention needed = normal priority
            WHEN cr.urgency_level = 1 THEN 5
            -- Already counseled = lower priority
            WHEN cr.is_counseled = TRUE THEN 7
            -- Normal = base priority
            ELSE 6
        END as sort_priority
    FROM chat_rooms cr
    WHERE cr.status = 'active'
    ORDER BY 
        sort_priority ASC,
        cr.is_counseled ASC,
        cr.updated_at DESC;
END;
$$ LANGUAGE plpgsql;
