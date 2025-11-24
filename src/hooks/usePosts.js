import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export function usePosts() {
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
  }, [])

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:users!posts_author_id_fkey(id, full_name, role)
      `)
      .order('created_at', { ascending: false })
    
    if (!error) setPosts(data || [])
    setLoading(false)
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

  return { posts, loading, createPost, deletePost, refetch: fetchPosts }
}
