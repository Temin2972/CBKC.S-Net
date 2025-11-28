import { MessageCircle, Users, Clock, Shield, AlertTriangle, MessageSquare } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useFlaggedUsers } from '../hooks/useFlaggedUsers'
import Navbar from '../components/Layout/Navbar'

export default function CounselorHome() {
  const { user } = useAuth()
  const { flaggedUsers, loading, resolveFlag, createChatWithStudent } = useFlaggedUsers()
  const navigate = useNavigate()

  const handleContactStudent = async (studentId, flagId) => {
    // Create or get chat room
    const { data, error } = await createChatWithStudent(studentId, user.id)

    if (error) {
      alert('Không thể tạo phòng chat. Vui lòng thử lại.')
      return
    }

    // Mark flag as resolved
    await resolveFlag(flagId, 'Đã liên hệ với học sinh')

    // Navigate to chat
    navigate('/chat')
  }

  const getSeverityColor = (severity) => {
    if (severity === 'high') return 'from-red-500 to-orange-500'
    if (severity === 'medium') return 'from-yellow-500 to-amber-500'
    return 'from-gray-400 to-gray-500'
  }

  const getSeverityBadge = (severity) => {
    if (severity === 'high') {
      return (
        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
          KHẨN CẤP
        </span>
      )
    }
    if (severity === 'medium') {
      return (
        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
          CẦN CHÚ Ý
        </span>
      )
    }
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            Xin chào, {user?.user_metadata?.full_name || user?.email}! 👋
          </h2>
          <p className="text-xl text-white opacity-90">
            Bảng điều khiển Tư vấn viên
          </p>
        </div>

        {/* Caution Section - Đáng chú ý */}
        {!loading && (flaggedUsers.high?.length > 0 || flaggedUsers.medium?.length > 0) && (
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-red-100 rounded-xl">
                  <AlertTriangle size={32} className="text-red-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    Đáng chú ý
                  </h2>
                  <p className="text-gray-600">
                    Học sinh cần hỗ trợ khẩn cấp
                  </p>
                </div>
              </div>

              {/* HIGH Priority */}
              {flaggedUsers.high?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-red-600 mb-4 flex items-center gap-2">
                    <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></span>
                    Cần can thiệp ngay ({flaggedUsers.high.length})
                  </h3>
                  <div className="space-y-3">
                    {flaggedUsers.high.map((flag) => (
                      <div
                        key={flag.id}
                        className="bg-red-50 border-2 border-red-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-orange-400 rounded-full flex items-center justify-center text-white font-bold">
                              {flag.user?.full_name?.[0] || 'H'}
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-800">
                                {flag.user?.full_name || 'Học sinh'}
                              </h4>
                              <p className="text-xs text-gray-500">
                                {new Date(flag.flagged_at).toLocaleString('vi-VN')}
                              </p>
                            </div>
                          </div>
                          {getSeverityBadge(flag.severity)}
                        </div>

                        <div className="bg-white rounded-lg p-3 mb-3">
                          <p className="text-sm text-gray-700 mb-2">
                            <span className="font-semibold">Nội dung:</span> {flag.content_text.substring(0, 150)}...
                          </p>
                          <p className="text-sm text-red-600">
                            <span className="font-semibold">Phân tích AI:</span> {flag.ai_reason}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleContactStudent(flag.user_id, flag.id)}
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg hover:from-red-600 hover:to-orange-600 transition-colors font-semibold flex items-center justify-center gap-2"
                          >
                            <MessageSquare size={18} />
                            Liên hệ ngay
                          </button>
                          <button
                            onClick={() => resolveFlag(flag.id, 'Đã xem xét')}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                          >
                            Đã xử lý
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* MEDIUM Priority */}
              {flaggedUsers.medium?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-yellow-600 mb-4 flex items-center gap-2">
                    <span className="w-3 h-3 bg-yellow-600 rounded-full"></span>
                    Theo dõi thêm ({flaggedUsers.medium.length})
                  </h3>
                  <div className="space-y-3">
                    {flaggedUsers.medium.map((flag) => (
                      <div
                        key={flag.id}
                        className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-400 rounded-full flex items-center justify-center text-white font-bold">
                              {flag.user?.full_name?.[0] || 'H'}
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-800">
                                {flag.user?.full_name || 'Học sinh'}
                              </h4>
                              <p className="text-xs text-gray-500">
                                {new Date(flag.flagged_at).toLocaleString('vi-VN')}
                              </p>
                            </div>
                          </div>
                          {getSeverityBadge(flag.severity)}
                        </div>

                        <div className="bg-white rounded-lg p-3 mb-3">
                          <p className="text-sm text-gray-700 mb-2">
                            <span className="font-semibold">Nội dung:</span> {flag.content_text.substring(0, 150)}...
                          </p>
                          <p className="text-sm text-yellow-600">
                            <span className="font-semibold">Phân tích AI:</span> {flag.ai_reason}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleContactStudent(flag.user_id, flag.id)}
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-lg hover:from-yellow-600 hover:to-amber-600 transition-colors font-semibold flex items-center justify-center gap-2"
                          >
                            <MessageSquare size={18} />
                            Liên hệ
                          </button>
                          <button
                            onClick={() => resolveFlag(flag.id, 'Đã xem xét')}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                          >
                            Đã xử lý
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Regular Actions */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Link
            to="/chat"
            className="group p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1 cursor-pointer"
          >
            <div className="inline-block p-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
              <MessageCircle size={40} className="text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              Phòng Tư vấn
            </h3>
            <p className="text-gray-600">
              Quản lý và trả lời các yêu cầu tư vấn từ học sinh
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm text-green-600">
              <Clock size={16} />
              <span>Hoạt động: 7:00 - 22:00</span>
            </div>
          </Link>

          <Link
            to="/community"
            className="group p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1 cursor-pointer"
          >
            <div className="inline-block p-4 bg-gradient-to-br from-purple-100 to-pink-200 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
              <Users size={40} className="text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              Cộng đồng
            </h3>
            <p className="text-gray-600">
              Theo dõi và hỗ trợ trong cộng đồng chia sẻ
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm text-purple-600">
              <Shield size={16} />
              <span>Môi trường an toàn</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
