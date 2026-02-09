-- Fix RLS policies to allow anonymous posts and comments
-- Anonymous posts/comments have author_id = null but still require authentication

-- =====================================================
-- POSTS TABLE - Allow anonymous posts
-- =====================================================

DROP POLICY IF EXISTS "posts_insert_own" ON posts;

-- Users can create posts (either with their ID or anonymous with null)
CREATE POLICY "posts_insert_own" ON posts
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL 
        AND (author_id IS NULL OR author_id = auth.uid())
    );

-- =====================================================
-- COMMENTS TABLE - Allow anonymous comments  
-- =====================================================

DROP POLICY IF EXISTS "comments_insert_own" ON comments;

-- Users can create comments (either with their ID or anonymous with null)
CREATE POLICY "comments_insert_own" ON comments
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL 
        AND (author_id IS NULL OR author_id = auth.uid())
    );
