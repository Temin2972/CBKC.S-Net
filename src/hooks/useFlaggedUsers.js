import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useFlaggedUsers() {
  const [flaggedUsers, setFlaggedUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFlaggedUsers()
    subscribeToFlags()

    return () => {
      supabase.removeAllChannels()
    }
  }, [])

  const fetchFlaggedUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('flagged_users')
        .select(`
          *,
          user:users!flagged_users_user_id_fkey(id, full_name, email)
        `)
        .eq('resolved', false)
        .order('severity', { ascending: true }) // 'high' comes before 'medium'
        .order('flagged_at', { ascending: false })

      if (error) throw error

      // Group by severity
      const high = data?.filter(f => f.severity === 'high') || []
      const medium = data?.filter(f => f.severity === 'medium') || []

      setFlaggedUsers({ high, medium, all: data || [] })
    } catch (error) {
      console.error('Error fetching flagged users:', error)
      setFlaggedUsers({ high: [], medium: [], all: [] })
    } finally {
      setLoading(false)
    }
  }

  const subscribeToFlags = () => {
    const channel = supabase
      .channel('flagged-users')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'flagged_users'
        },
        () => {
          fetchFlaggedUsers()
        }
      )
      .subscribe()

    return channel
  }

  const resolveFlag = async (flagId, notes = '') => {
    try {
      const { error } = await supabase
        .from('flagged_users')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
          notes: notes
        })
        .eq('id', flagId)

      if (error) throw error

      await fetchFlaggedUsers()
      return { error: null }
    } catch (error) {
      console.error('Error resolving flag:', error)
      return { error }
    }
  }

  const createChatWithStudent = async (studentId, counselorId) => {
    try {
      // Check if chat room already exists
      const { data: existing } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('student_id', studentId)
        .single()

      if (existing) {
        return { data: existing, error: null }
      }

      // Create new chat room
      const { data, error } = await supabase
        .from('chat_rooms')
        .insert({
          student_id: studentId,
          status: 'active'
        })
        .select()
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error('Error creating chat:', error)
      return { data: null, error }
    }
  }

  return {
    flaggedUsers,
    loading,
    resolveFlag,
    createChatWithStudent,
    refetch: fetchFlaggedUsers
  }
}
