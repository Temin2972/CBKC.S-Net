import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

// Constants for reliability
const POLLING_INTERVAL_MS = 30000 // Fallback polling every 30 seconds

export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState('disconnected') // 'connected', 'disconnected', 'reconnecting'
  
  // Refs for cleanup and retry management
  const channelRef = useRef(null)
  const pollingIntervalRef = useRef(null)
  const isUnmounting = useRef(false)

  const fetchNotifications = useCallback(async () => {
    if (!userId) return

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      setNotifications(data || [])
      setUnreadCount((data || []).filter(n => !n.is_read).length)
    } catch (error) {
      console.error('Error fetching notifications:', error)
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Start fallback polling when realtime is disconnected
  const startFallbackPolling = useCallback(() => {
    if (pollingIntervalRef.current || isUnmounting.current) return // Already polling or unmounting
    
    pollingIntervalRef.current = setInterval(() => {
      if (!isUnmounting.current) {
        fetchNotifications()
      }
    }, POLLING_INTERVAL_MS)
  }, [fetchNotifications])

  // Stop polling when realtime reconnects
  const stopFallbackPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }, [])

  // Main effect - subscribe to realtime and start polling
  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    isUnmounting.current = false

    // Initial fetch
    fetchNotifications()

    // Start polling as reliable fallback
    startFallbackPolling()

    // Try realtime subscription (with unique channel name to avoid conflicts)
    const channel = supabase
      .channel(`notifications-${userId}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          // Filter client-side for this user's notifications
          const record = payload.new || payload.old
          if (record?.user_id !== userId) return
          
          fetchNotifications()
          
          // Browser notification for new inserts
          if (payload.eventType === 'INSERT' && payload.new) {
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(payload.new.title || 'Thông báo mới', {
                body: payload.new.message,
                icon: '/icon.svg'
              })
            }
          }
        }
      )
      .subscribe((status) => {
        // Ignore events if unmounting
        if (isUnmounting.current) return
        
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected')
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setConnectionStatus('disconnected')
        }
        // Don't handle CLOSED - it happens during cleanup and causes loops
      })

    channelRef.current = channel

    // Cleanup
    return () => {
      isUnmounting.current = true
      stopFallbackPolling()
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  const markAsRead = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', userId)

      if (error) throw error

      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false)

      if (error) throw error

      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      )
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const deleteNotification = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId)

      if (error) throw error

      const notification = notifications.find(n => n.id === notificationId)
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const deleteAllRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)
        .eq('is_read', true)

      if (error) throw error

      setNotifications(prev => prev.filter(n => !n.is_read))
    } catch (error) {
      console.error('Error deleting read notifications:', error)
    }
  }

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      console.log('Browser does not support notifications')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }

    return false
  }

  return {
    notifications,
    unreadCount,
    loading,
    connectionStatus,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead,
    requestNotificationPermission,
    refetch: fetchNotifications
  }
}

// Helper function to create notification
export async function createNotification(userId, type, title, message, link = null, data = null) {
  try {
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        link,
        data
      })
      .select()
      .single()

    if (error) throw error
    return { data: notification, error: null }
  } catch (error) {
    console.error('Error creating notification:', error)
    return { data: null, error }
  }
}
