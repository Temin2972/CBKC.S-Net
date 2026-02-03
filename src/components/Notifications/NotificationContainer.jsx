/**
 * NotificationContainer Component
 * Renders a stack of in-app toast notifications
 */
import NotificationToast from './NotificationToast'
import { usePushNotifications } from '../../hooks/usePushNotifications'

export default function NotificationContainer() {
    const { pendingNotifications, dismissNotification } = usePushNotifications()

    if (pendingNotifications.length === 0) return null

    return (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-h-screen overflow-hidden pointer-events-none">
            {pendingNotifications.slice(0, 5).map(notification => (
                <div key={notification.id} className="pointer-events-auto">
                    <NotificationToast
                        notification={notification}
                        onDismiss={dismissNotification}
                    />
                </div>
            ))}

            {pendingNotifications.length > 5 && (
                <div className="text-center text-sm text-gray-500 bg-white/80 backdrop-blur px-3 py-1 rounded-full shadow pointer-events-auto">
                    +{pendingNotifications.length - 5} thông báo khác
                </div>
            )}
        </div>
    )
}
