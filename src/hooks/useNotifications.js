import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

// Constants for reliability
const RECONNECT_DELAY_MS = 5000
const MAX_RECONNECT_ATTEMPTS = 5
const POLLING_INTERVAL_MS = 30000 // Fallback polling every 30 seconds

export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState('disconnected') // 'connected', 'disconnected', 'reconnecting'
  
  // Refs for cleanup and retry management
  const channelRef = useRef(null)
  const reconnectAttempts = useRef(0)
  const reconnectTimeoutRef = useRef(null)
  const pollingIntervalRef = useRef(null)

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
    if (pollingIntervalRef.current) return // Already polling
    
    console.log('🔄 Starting fallback polling for notifications')
    pollingIntervalRef.current = setInterval(() => {
      if (connectionStatus !== 'connected') {
        console.log('📥 Polling notifications (realtime unavailable)')
        fetchNotifications()
      }
    }, POLLING_INTERVAL_MS)
  }, [connectionStatus, fetchNotifications])

  // Stop polling when realtime reconnects
  const stopFallbackPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      console.log('⏹️ Stopping fallback polling')
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }, [])

  // Subscribe with reconnection logic
  const subscribeToNotifications = useCallback(() => {
    if (!userId) return

    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    console.log('📡 Subscribing to notifications channel...')

    const channel = supabase
      .channel(`notifications-${userId}`, {
        config: {
          broadcast: { self: true },
          presence: { key: userId }
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('🔔 New notification received:', payload)
          fetchNotifications()
          
          // Browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(payload.new.title, {
              body: payload.new.message,
              icon: '/icon.svg',
              badge: '/icon.svg'
            })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        () => fetchNotifications()
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        () => fetchNotifications()
      )
      .subscribe((status, err) => {
        console.log('📶 Notification channel status:', status, err || '')
        
        switch (status) {
          case 'SUBSCRIBED':
            setConnectionStatus('connected')
            reconnectAttempts.current = 0
            stopFallbackPolling()
            console.log('✅ Notification channel connected')
            break
            
          case 'CHANNEL_ERROR':
            console.error('❌ Notification channel error:', err)
            setConnectionStatus('disconnected')
            handleReconnect()
            break
            
          case 'TIMED_OUT':
            console.warn('⏰ Notification channel timed out')
            setConnectionStatus('reconnecting')
            handleReconnect()
            break
            
          case 'CLOSED':
            console.log('🔒 Notification channel closed')
            setConnectionStatus('disconnected')
            startFallbackPolling()
            break
        }
      })

    channelRef.current = channel
    return channel
  }, [userId, fetchNotifications, stopFallbackPolling, startFallbackPolling])

  // Handle reconnection with exponential backoff
  const handleReconnect = useCallback(() => {
    if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
      console.error('🚫 Max reconnection attempts reached. Switching to polling mode.')
      setConnectionStatus('disconnected')
      startFallbackPolling()
      return
    }

    reconnectAttempts.current += 1
    const delay = RECONNECT_DELAY_MS * Math.pow(2, reconnectAttempts.current - 1)
    
    console.log(`🔄 Attempting to reconnect (${reconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS}) in ${delay}ms...`)
    setConnectionStatus('reconnecting')

    // Clear any existing timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      subscribeToNotifications()
    }, delay)
  }, [subscribeToNotifications, startFallbackPolling])

  // Main effect
  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    fetchNotifications()
    subscribeToNotifications()

    // Cleanup function
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
  }, [userId, fetchNotifications, subscribeToNotifications])

  // Visibility change handler - reconnect when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && connectionStatus !== 'connected') {
        console.log('👁️ Tab became visible, checking connection...')
        fetchNotifications()
        if (connectionStatus === 'disconnected') {
          reconnectAttempts.current = 0 // Reset attempts
          subscribeToNotifications()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [connectionStatus, fetchNotifications, subscribeToNotifications])

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

  // Force reconnect function (can be called manually)
  const forceReconnect = useCallback(() => {
    console.log('🔃 Force reconnecting...')
    reconnectAttempts.current = 0
    subscribeToNotifications()
  }, [subscribeToNotifications])

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
    refetch: fetchNotifications,
    forceReconnect
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
