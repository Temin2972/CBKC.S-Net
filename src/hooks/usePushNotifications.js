/**
 * usePushNotifications Hook
 * Manages browser push notifications with fallback to in-app notifications
 */
import { useState, useEffect, useCallback, useRef } from 'react'

// Check if browser supports push notifications
const isPushSupported = () => {
    return 'Notification' in window && 'serviceWorker' in navigator
}

export function usePushNotifications() {
    const [permission, setPermission] = useState('default')
    const [isSupported, setIsSupported] = useState(false)
    const [pendingNotifications, setPendingNotifications] = useState([])
    const notificationQueue = useRef([])

    useEffect(() => {
        setIsSupported(isPushSupported())
        if (isPushSupported()) {
            setPermission(Notification.permission)
        }
    }, [])

    /**
     * Request notification permission
     */
    const requestPermission = useCallback(async () => {
        if (!isPushSupported()) {
            console.warn('Push notifications not supported')
            return 'denied'
        }

        try {
            const result = await Notification.requestPermission()
            setPermission(result)
            return result
        } catch (err) {
            console.error('Error requesting permission:', err)
            return 'denied'
        }
    }, [])

    /**
     * Show a native browser notification
     */
    const showBrowserNotification = useCallback((title, options = {}) => {
        if (!isPushSupported() || Notification.permission !== 'granted') {
            return null
        }

        try {
            const notification = new Notification(title, {
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                vibrate: [200, 100, 200],
                requireInteraction: false,
                ...options
            })

            notification.onclick = () => {
                window.focus()
                if (options.onClick) options.onClick()
                notification.close()
            }

            // Auto close after 5 seconds
            setTimeout(() => notification.close(), 5000)

            return notification
        } catch (err) {
            console.error('Error showing notification:', err)
            return null
        }
    }, [])

    /**
     * Show notification with fallback to in-app toast
     */
    const notify = useCallback(async (title, body, options = {}) => {
        const notificationData = {
            id: Date.now(),
            title,
            body,
            type: options.type || 'info',
            timestamp: new Date(),
            onClick: options.onClick,
            read: false
        }

        // Try browser notification first
        if (permission === 'granted') {
            const browserNotif = showBrowserNotification(title, {
                body,
                tag: options.tag || notificationData.id.toString(),
                ...options
            })

            if (browserNotif) {
                return { type: 'browser', notification: browserNotif }
            }
        }

        // Fallback to in-app notification queue
        notificationQueue.current.push(notificationData)
        setPendingNotifications([...notificationQueue.current])

        return { type: 'in-app', notification: notificationData }
    }, [permission, showBrowserNotification])

    /**
     * Dismiss an in-app notification
     */
    const dismissNotification = useCallback((id) => {
        notificationQueue.current = notificationQueue.current.filter(n => n.id !== id)
        setPendingNotifications([...notificationQueue.current])
    }, [])

    /**
     * Clear all in-app notifications
     */
    const clearAll = useCallback(() => {
        notificationQueue.current = []
        setPendingNotifications([])
    }, [])

    /**
     * Play notification sound
     */
    const playSound = useCallback((soundType = 'default') => {
        try {
            // Try to play a simple notification sound using Web Audio API
            const audioContext = new (window.AudioContext || window.webkitAudioContext)()
            const oscillator = audioContext.createOscillator()
            const gainNode = audioContext.createGain()

            oscillator.connect(gainNode)
            gainNode.connect(audioContext.destination)

            // Different sound patterns
            switch (soundType) {
                case 'urgent':
                    oscillator.frequency.value = 880
                    gainNode.gain.value = 0.3
                    break
                case 'message':
                    oscillator.frequency.value = 523
                    gainNode.gain.value = 0.2
                    break
                default:
                    oscillator.frequency.value = 440
                    gainNode.gain.value = 0.15
            }

            oscillator.start()
            oscillator.stop(audioContext.currentTime + 0.15)
        } catch {
            // Audio not supported or blocked
        }
    }, [])

    return {
        // State
        isSupported,
        permission,
        pendingNotifications,

        // Actions
        requestPermission,
        notify,
        dismissNotification,
        clearAll,
        playSound,

        // Helpers
        canNotify: permission === 'granted',
        shouldAskPermission: permission === 'default' && isSupported
    }
}

// Export notification types for consistency
export const NOTIFICATION_TYPES = {
    INFO: 'info',
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error',
    URGENT: 'urgent'
}
