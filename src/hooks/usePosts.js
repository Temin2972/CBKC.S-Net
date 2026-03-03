import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export function usePosts(currentUserId) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPosts()

    // Subscribe to real-time updates
    const channel = supabase
      .channel('posts-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts'
        },
        () => {
          fetchPosts()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId])

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:users!posts_author_id_fkey(id, full_name, role, avatar_url)
      `)
      .order('created_at', { ascending: false })
    
    if (!error) {
      // Add like info to each post
      const transformedPosts = data?.map(post => ({
        ...post,
        like_count: post.liked_by?.length || 0,
        is_liked: currentUserId ? (post.liked_by || []).includes(currentUserId) : false
      })) || []
      
      setPosts(transformedPosts)
    }
    setLoading(false)
  }

  const toggleLike = async (postId, isCurrentlyLiked) => {
    try {
      // Use RPC function to toggle like (bypasses RLS securely)
      const { data, error } = await supabase
        .rpc('toggle_post_like', { target_post_id: postId })

      if (error) throw error

      const newLikedBy = data?.liked_by || []

      // Update local state with response from RPC
      setPosts(prevPosts => 
        prevPosts.map(p => 
          p.id === postId 
            ? { 
                ...p, 
                liked_by: newLikedBy,
                like_count: newLikedBy.length,
                is_liked: newLikedBy.includes(currentUserId)
              }
            : p
        )
      )

      return { error: null }
    } catch (error) {
      console.error('Toggle like error:', error)
      return { error }
    }
  }

  const createPost = async (postData) => {
    try {
      const { error } = await supabase
        .from('posts')
        .insert(postData)

      if (error) throw error
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const deletePost = async (postId) => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)

      if (error) throw error
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  return { posts, loading, createPost, deletePost, toggleLike, refetch: fetchPosts }
}
