import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useChat(roomId) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!roomId) return

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users!messages_sender_id_fkey(id, full_name, role)
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
      
      if (!error) setMessages(data || [])
      setLoading(false)
    }

    fetchMessages()

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`
        },
        async (payload) => {
          // Fetch sender details
          const { data: sender } = await supabase
            .from('users')
            .select('id, full_name, role')
            .eq('id', payload.new.sender_id)
            .single()

          setMessages(current => [...current, { ...payload.new, sender }])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId])

  const sendMessage = async (content, senderId) => {
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          room_id: roomId,
          sender_id: senderId,
          content
        })

      if (error) throw error
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  return { messages, loading, sendMessage }
}
