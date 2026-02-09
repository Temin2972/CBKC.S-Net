-- Allow NULL author_id for anonymous posts and comments
-- This enables users to post/comment anonymously

-- Make author_id nullable in posts table
ALTER TABLE public.posts 
ALTER COLUMN author_id DROP NOT NULL;

-- Make author_id nullable in comments table
ALTER TABLE public.comments 
ALTER COLUMN author_id DROP NOT NULL;
