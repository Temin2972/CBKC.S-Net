import { useState, useEffect } from 'react'
import { Bell, X, AlertCircle } from 'lucide-react'
import { useNotifications } from '../../hooks/useNotifications'

export default function NotificationPermissionPrompt({ userId }) {
  const { requestNotificationPermission } = useNotifications(userId)
  const [showPrompt, setShowPrompt] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if we should show the prompt
    const checkNotificationPermission = () => {
      // Don't show if not supported
      if (!('Notification' in window)) {
        return
      }

      // Don't show if already granted or denied
      if (Notification.permission === 'granted' || Notification.permission === 'denied') {
        return
      }

      // Don't show if user previously dismissed (stored in localStorage)
      const dismissed = localStorage.getItem('notification-prompt-dismissed')
      if (dismissed) {
        return
      }

      // Show prompt after a short delay (3 seconds) to not be intrusive
      const timer = setTimeout(() => {
        setShowPrompt(true)
      }, 3000)

      return () => clearTimeout(timer)
    }

    checkNotificationPermission()
  }, [])

  const handleEnable = async () => {
    const granted = await requestNotificationPermission()
    
    if (granted) {
      setShowPrompt(false)
      // Show a test notification
      new Notification('S-Net Thông báo', {
        body: 'Bạn sẽ nhận được thông báo khi có tin nhắn mới!',
        icon: '/icon.svg',
        badge: '/icon.svg'
      })
    } else {
      // Permission denied
      setShowPrompt(false)
      setDismissed(true)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    setDismissed(true)
    // Remember user dismissed this for 7 days
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + 7)
    localStorage.setItem('notification-prompt-dismissed', expiryDate.toISOString())
  }

  const handleRemindLater = () => {
    setShowPrompt(false)
    // Will show again next session
  }

  if (!showPrompt || dismissed) {
    return null
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 animate-fade-in" />

      {/* Notification Prompt Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in-up">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-8 text-center relative">
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={20} />
            </button>

            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Bell size={40} className="text-purple-500" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">
              Bật thông báo
            </h2>
            <p className="text-white/90 text-sm">
              Nhận thông báo khi có tin nhắn mới
            </p>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-2">Tại sao bật thông báo?</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Không bỏ lỡ tin nhắn từ tư vấn viên</li>
                    <li>Được thông báo ngay khi có phản hồi</li>
                    <li>Tắt bất cứ lúc nào trong cài đặt</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleEnable}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all flex items-center justify-center gap-2"
              >
                <Bell size={20} />
                Bật thông báo
              </button>

              <button
                onClick={handleRemindLater}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                Để sau
              </button>

              <button
                onClick={handleDismiss}
                className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Không hiển thị lại
              </button>
            </div>
          </div>

          {/* Footer note */}
          <div className="px-6 pb-6">
            <p className="text-xs text-gray-400 text-center">
              Bạn có thể bật/tắt thông báo bất cứ lúc nào trong cài đặt trình duyệt
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
