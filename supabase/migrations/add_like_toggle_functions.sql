-- Add secure RPC functions for toggling likes on posts and comments
-- These use SECURITY DEFINER to bypass RLS, but only modify the liked_by column
-- This fixes the 42501 RLS error when regular users try to like anonymous posts/comments

-- =====================================================
-- Toggle like on a post
-- =====================================================
CREATE OR REPLACE FUNCTION toggle_post_like(target_post_id UUID)
RETURNS JSON AS $$
DECLARE
    current_liked_by UUID[];
    new_liked_by UUID[];
    user_id UUID := auth.uid();
    was_liked BOOLEAN;
BEGIN
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Get current liked_by array
    SELECT COALESCE(liked_by, '{}') INTO current_liked_by
    FROM posts WHERE id = target_post_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Post not found';
    END IF;

    IF user_id = ANY(current_liked_by) THEN
        -- Unlike: remove user
        new_liked_by := array_remove(current_liked_by, user_id);
        was_liked := false;
    ELSE
        -- Like: add user
        new_liked_by := array_append(current_liked_by, user_id);
        was_liked := true;
    END IF;

    UPDATE posts 
    SET liked_by = new_liked_by
    WHERE id = target_post_id;

    RETURN json_build_object(
        'liked_by', new_liked_by,
        'is_liked', was_liked,
        'like_count', array_length(new_liked_by, 1)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Toggle like on a comment
-- =====================================================
CREATE OR REPLACE FUNCTION toggle_comment_like(target_comment_id UUID)
RETURNS JSON AS $$
DECLARE
    current_liked_by UUID[];
    new_liked_by UUID[];
    user_id UUID := auth.uid();
    was_liked BOOLEAN;
BEGIN
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Get current liked_by array
    SELECT COALESCE(liked_by, '{}') INTO current_liked_by
    FROM comments WHERE id = target_comment_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Comment not found';
    END IF;

    IF user_id = ANY(current_liked_by) THEN
        -- Unlike: remove user
        new_liked_by := array_remove(current_liked_by, user_id);
        was_liked := false;
    ELSE
        -- Like: add user
        new_liked_by := array_append(current_liked_by, user_id);
        was_liked := true;
    END IF;

    UPDATE comments 
    SET liked_by = new_liked_by
    WHERE id = target_comment_id;

    RETURN json_build_object(
        'liked_by', new_liked_by,
        'is_liked', was_liked,
        'like_count', array_length(new_liked_by, 1)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
