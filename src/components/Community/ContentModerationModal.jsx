import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { X, AlertTriangle, Heart, MessageCircle, Shield, Clock, Phone, Loader2, FileQuestion } from 'lucide-react'
import { MODERATION_ACTIONS } from '../../lib/contentModeration'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useAuth'
import { createNotification } from '../../hooks/useNotifications'

// Hotline tâm lý quốc gia
const EMERGENCY_HOTLINE = '1800 599 920'

export default function ContentModerationModal({
  isOpen,
  onClose,
  action,
  title,
  message,
  showChatSuggestion,
  onRequestAppeal = null, // Callback when user wants to appeal
  originalContent = '' // Original content for appeal context
}) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [creatingEmergencyChat, setCreatingEmergencyChat] = useState(false)

  if (!isOpen) return null

  const isEmergency = action === MODERATION_ACTIONS.REJECT

  // Tạo chat khẩn cấp và thông báo cho tất cả counselors
  const handleEmergencyChat = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    setCreatingEmergencyChat(true)

    try {
      // Kiểm tra xem user đã có chat room chưa
      const { data: existingRoom } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('student_id', user.id)
        .single()

      let roomId = existingRoom?.id

      // Nếu chưa có, tạo mới
      if (!roomId) {
        const { data: newRoom, error: createError } = await supabase
          .from('chat_rooms')
          .insert({
            student_id: user.id,
            counselor_id: null // Public chat để tất cả counselors thấy
          })
          .select()
          .single()

        if (createError) throw createError
        roomId = newRoom.id

        // Gửi tin nhắn đầu tiên để counselors thấy ngay
        await supabase
          .from('chat_messages')
          .insert({
            chat_room_id: roomId,
            sender_id: user.id,
            content: '🆘 Tôi cần được hỗ trợ khẩn cấp. Tôi đang trải qua giai đoạn rất khó khăn.'
          })
      }

      // Thông báo khẩn cấp cho TẤT CẢ counselors và admins
      const { data: counselors } = await supabase
        .from('users')
        .select('id')
        .in('role', ['counselor', 'admin'])

      if (counselors && counselors.length > 0) {
        const studentName = user.user_metadata?.full_name || 'Học sinh'

        // Gửi notification khẩn cấp cho từng counselor
        const notificationPromises = counselors.map(counselor =>
          createNotification(
            counselor.id,
            'emergency_chat',
            '🚨 YÊU CẦU HỖ TRỢ KHẨN CẤP',
            `${studentName} cần được hỗ trợ tâm lý ngay lập tức!`,
            '/chat',
            {
              student_id: user.id,
              chat_room_id: roomId,
              urgency: 'critical'
            }
          )
        )

        await Promise.all(notificationPromises)
      }

      // Chuyển đến trang chat
      onClose()
      navigate('/chat')

    } catch (error) {
      console.error('Error creating emergency chat:', error)
      alert('Có lỗi xảy ra. Vui lòng thử lại hoặc gọi đường dây nóng.')
    } finally {
      setCreatingEmergencyChat(false)
    }
  }

  const getIcon = () => {
    switch (action) {
      case MODERATION_ACTIONS.BLOCK:
        return <Shield className="text-red-500" size={48} />
      case MODERATION_ACTIONS.REJECT:
        return <Heart className="text-pink-500" size={48} />
      case MODERATION_ACTIONS.PENDING:
        return <Clock className="text-blue-500" size={48} />
      default:
        return <AlertTriangle className="text-yellow-500" size={48} />
    }
  }

  const getHeaderColor = () => {
    switch (action) {
      case MODERATION_ACTIONS.BLOCK:
        return 'from-red-500 to-orange-500'
      case MODERATION_ACTIONS.REJECT:
        return 'from-purple-500 to-pink-500'
      case MODERATION_ACTIONS.PENDING:
        return 'from-blue-500 to-cyan-500'
      default:
        return 'from-yellow-500 to-orange-500'
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className={`bg-gradient-to-r ${getHeaderColor()} p-6 text-center`}>
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            {getIcon()}
          </div>
          <h2 className="text-2xl font-bold text-white">
            {title}
          </h2>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 text-center mb-6 leading-relaxed">
            {message}
          </p>

          {/* Emergency Action Section - Only for REJECT (severe distress) */}
          {isEmergency && (
            <div className="space-y-4 mb-6">
              {/* Primary Emergency CTA - Chat */}
              <button
                onClick={handleEmergencyChat}
                disabled={creatingEmergencyChat}
                className="w-full py-4 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl font-bold text-lg hover:from-red-600 hover:to-rose-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-3 animate-pulse hover:animate-none"
              >
                {creatingEmergencyChat ? (
                  <>
                    <Loader2 size={24} className="animate-spin" />
                    Đang kết nối...
                  </>
                ) : (
                  <>
                    <MessageCircle size={24} />
                    🆘 Chat Khẩn cấp với Tư vấn viên
                  </>
                )}
              </button>

              {/* Hotline */}
              <a
                href={`tel:${EMERGENCY_HOTLINE.replace(/\s/g, '')}`}
                className="w-full py-3 bg-white border-2 border-red-500 text-red-600 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-red-50 transition-colors"
              >
                <Phone size={20} />
                Gọi đường dây nóng: {EMERGENCY_HOTLINE}
              </a>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">hoặc</span>
                </div>
              </div>
            </div>
          )}

          {/* Regular Chat Suggestion - For non-emergency cases */}
          {showChatSuggestion && !isEmergency && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <MessageCircle className="text-purple-600" size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-purple-800 mb-1">
                    Trò chuyện với tư vấn viên
                  </h4>
                  <p className="text-sm text-purple-600">
                    Các tư vấn viên của chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn. Đừng ngại chia sẻ nhé!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            {showChatSuggestion && !isEmergency && (
              <Link
                to="/chat"
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold text-center hover:from-purple-600 hover:to-pink-600 transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle size={20} />
                Chat với tư vấn viên ngay
              </Link>
            )}

            {/* Appeal button - only show for BLOCK action and when callback is provided */}
            {action === MODERATION_ACTIONS.BLOCK && onRequestAppeal && (
              <button
                onClick={onRequestAppeal}
                className="w-full py-3 bg-blue-50 border border-blue-200 text-blue-600 rounded-xl font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
              >
                <FileQuestion size={18} />
                Yêu cầu xem xét lại
              </button>
            )}

            <button
              onClick={onClose}
              className={`w-full py-3 rounded-xl font-semibold transition-all ${isEmergency
                ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                : showChatSuggestion
                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                }`}
            >
              {isEmergency ? 'Để sau (không khuyến khích)' : showChatSuggestion ? 'Để sau' : 'Đã hiểu'}
            </button>
          </div>

          {/* Reassurance message for emergency */}
          {isEmergency && (
            <div className="mt-6 pt-4 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600 mb-2">
                ❤️ Bạn không đơn độc. Chúng tôi ở đây để hỗ trợ bạn.
              </p>
              <p className="text-xs text-gray-400">
                Tất cả cuộc trò chuyện đều được bảo mật và tôn trọng.
              </p>
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors"
        >
          <X size={24} />
        </button>
      </div>
    </div>
  )
}
