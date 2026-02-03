/**
 * NotificationToast Component
 * In-app toast notification for when browser notifications are unavailable
 */
import { useState, useEffect } from 'react'
import { X, Bell, AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react'
import { NOTIFICATION_TYPES } from '../../hooks/usePushNotifications'

export default function NotificationToast({
    notification,
    onDismiss,
    autoHide = true,
    autoHideDelay = 5000
}) {
    const [isVisible, setIsVisible] = useState(true)
    const [isExiting, setIsExiting] = useState(false)

    useEffect(() => {
        if (autoHide) {
            const timer = setTimeout(() => {
                handleDismiss()
            }, autoHideDelay)
            return () => clearTimeout(timer)
        }
    }, [autoHide, autoHideDelay])

    const handleDismiss = () => {
        setIsExiting(true)
        setTimeout(() => {
            setIsVisible(false)
            onDismiss?.(notification.id)
        }, 300)
    }

    if (!isVisible) return null

    const config = {
        [NOTIFICATION_TYPES.INFO]: {
            icon: Info,
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            iconColor: 'text-blue-500'
        },
        [NOTIFICATION_TYPES.SUCCESS]: {
            icon: CheckCircle,
            bg: 'bg-green-50',
            border: 'border-green-200',
            iconColor: 'text-green-500'
        },
        [NOTIFICATION_TYPES.WARNING]: {
            icon: AlertTriangle,
            bg: 'bg-yellow-50',
            border: 'border-yellow-200',
            iconColor: 'text-yellow-500'
        },
        [NOTIFICATION_TYPES.ERROR]: {
            icon: AlertCircle,
            bg: 'bg-red-50',
            border: 'border-red-200',
            iconColor: 'text-red-500'
        },
        [NOTIFICATION_TYPES.URGENT]: {
            icon: Bell,
            bg: 'bg-red-100',
            border: 'border-red-300',
            iconColor: 'text-red-600'
        }
    }

    const typeConfig = config[notification.type] || config[NOTIFICATION_TYPES.INFO]
    const Icon = typeConfig.icon

    return (
        <div
            className={`
        ${typeConfig.bg} ${typeConfig.border}
        border rounded-lg shadow-lg p-4 max-w-sm
        transform transition-all duration-300 ease-out
        ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
      `}
            onClick={() => notification.onClick?.()}
        >
            <div className="flex items-start gap-3">
                <div className={`shrink-0 ${typeConfig.iconColor}`}>
                    <Icon size={20} />
                </div>

                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-sm">
                        {notification.title}
                    </h4>
                    {notification.body && (
                        <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">
                            {notification.body}
                        </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                        {new Date(notification.timestamp).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </p>
                </div>

                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        handleDismiss()
                    }}
                    className="shrink-0 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 rounded"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    )
}
