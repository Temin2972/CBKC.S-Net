/**
 * NotificationPermissionPrompt Component
 * Prompts users to enable browser notifications
 */
import { useState } from 'react'
import { Bell, X } from 'lucide-react'
import { usePushNotifications } from '../../hooks/usePushNotifications'

export default function NotificationPermissionPrompt({ onDismiss }) {
  const { shouldAskPermission, requestPermission } = usePushNotifications()
  const [dismissed, setDismissed] = useState(false)
  const [requesting, setRequesting] = useState(false)

  if (!shouldAskPermission || dismissed) return null

  const handleEnable = async () => {
    setRequesting(true)
    await requestPermission()
    setRequesting(false)
    setDismissed(true)
    onDismiss?.()
  }

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss?.()
  }

  return (
    <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl p-4 shadow-lg">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-white/20 rounded-lg shrink-0">
          <Bell size={20} />
        </div>

        <div className="flex-1">
          <h3 className="font-semibold">Bật thông báo</h3>
          <p className="text-sm text-white/80 mt-0.5">
            Nhận thông báo khi có tin nhắn mới từ tư vấn viên hoặc cộng đồng
          </p>

          <div className="flex gap-2 mt-3">
            <button
              onClick={handleEnable}
              disabled={requesting}
              className="px-4 py-1.5 bg-white text-purple-600 font-medium rounded-lg text-sm hover:bg-white/90 transition-colors disabled:opacity-50"
            >
              {requesting ? 'Đang xử lý...' : 'Bật ngay'}
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-1.5 text-white/80 font-medium rounded-lg text-sm hover:text-white hover:bg-white/10 transition-colors"
            >
              Để sau
            </button>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
