-- =====================================================
-- CONTENT APPEALS TABLE MIGRATION
-- Run this in Supabase SQL Editor
-- =====================================================

-- Create content_appeals table
CREATE TABLE IF NOT EXISTS content_appeals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Reference to the content being appealed
    content_type TEXT NOT NULL, -- 'post', 'comment', 'pending', 'flagged'
    content_id UUID NOT NULL,
    original_content TEXT, -- Store copy of the original content
    
    -- User info
    user_id UUID NOT NULL REFERENCES auth.users(id),
    
    -- Appeal details
    reason TEXT NOT NULL, -- User's explanation
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    
    -- Review info
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE content_appeals ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Users can view their own appeals
CREATE POLICY "appeals_select_own" ON content_appeals
    FOR SELECT USING (auth.uid() = user_id);

-- Staff can view all appeals
CREATE POLICY "appeals_select_staff" ON content_appeals
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('counselor', 'admin'))
    );

-- Users can create appeals
CREATE POLICY "appeals_insert_own" ON content_appeals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Staff can update appeals (for review)
CREATE POLICY "appeals_update_staff" ON content_appeals
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('counselor', 'admin'))
    );

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_appeals_user ON content_appeals(user_id);
CREATE INDEX IF NOT EXISTS idx_appeals_status ON content_appeals(status);
CREATE INDEX IF NOT EXISTS idx_appeals_content ON content_appeals(content_type, content_id);

-- =====================================================
-- UPDATE TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION update_appeals_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_appeal_updated_at
    BEFORE UPDATE ON content_appeals
    FOR EACH ROW
    EXECUTE FUNCTION update_appeals_timestamp();

-- =====================================================
-- NOTES
-- =====================================================

/*
CONTENT APPEAL FLOW:
1. User's content gets blocked/rejected by AI moderation
2. User can submit an appeal with explanation
3. Counselor/Admin reviews the appeal
4. If approved: content is published or user is notified
5. If rejected: user is notified with reason

USAGE:
- content_type: 'post', 'comment', 'pending', 'flagged'
- status: 'pending' → 'approved' or 'rejected'
*/
