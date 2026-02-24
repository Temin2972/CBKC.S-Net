import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useChatRoom, URGENCY_LEVELS, URGENCY_LABELS } from '../hooks/useChatRoom'
import { useBroadcastOnline } from '../hooks/useOnlineStatus'
import Navbar from '../components/Layout/Navbar'
import ChatInterface from '../components/Chat/ChatInterface'
import UrgencyBadge from '../components/Chat/UrgencyBadge'
import UrgencySelector from '../components/Chat/UrgencySelector'
import CounseledToggle from '../components/Chat/CounseledToggle'
import StudentNotesPanel from '../components/Chat/StudentNotesPanel'
import { supabase } from '../lib/supabaseClient'
import { MessageCircle, Clock, EyeOff, Eye, Shield, AlertTriangle, CheckCircle2, StickyNote } from 'lucide-react'

// Background image - Library THPT FPT
const CHAT_BG = '/images/library.jpg'

export default function CounselorChat() {
  const { user, role } = useAuth()
  const { roomId } = useParams() // Get roomId from URL if present
  const { allChatRooms, loading, refetch } = useChatRoom(user?.id, role)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [showNotes, setShowNotes] = useState(true)
  
  // Broadcast online status để students thấy
  useBroadcastOnline(user?.id)

  // Auto-select room when roomId is in URL or when rooms load
  useEffect(() => {
    if (!loading && allChatRooms.length > 0 && roomId) {
      const room = allChatRooms.find(r => r.id === roomId)
      if (room) {
        setSelectedRoom(room)
      }
    }
  }, [loading, allChatRooms, roomId])

  const formatLastMessageTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now - date) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Vừa xong'
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours} giờ trước`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays} ngày trước`
    
    return date.toLocaleDateString('vi-VN')
  }

  const getStudentName = (room) => {
    if (room.student?.full_name) {
      return room.student.full_name
    }
    return 'Học sinh'
  }

  const getStudentInitial = (room) => {
    const name = getStudentName(room)
    return name[0].toUpperCase()
  }

  // Check if room is private and assigned to current counselor
  const isPrivateRoom = (room) => {
    return room.counselor_id !== null
  }

  const isMyPrivateRoom = (room) => {
    return room.counselor_id === user?.id
  }

  if (loading) {
    return (
      <div className="min-h-screen relative">
        <div 
          className="fixed inset-0 z-0"
          style={{
            backgroundImage: `url(${CHAT_BG})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(3px) brightness(0.9)'
          }}
        />
        <div className="fixed inset-0 z-0 bg-gradient-to-br from-teal-900/40 via-emerald-800/30 to-cyan-900/40" />
        <div className="relative z-10">
          <Navbar />
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="text-center text-white text-xl">Đang tải...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      {/* Background Image */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url(${CHAT_BG})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(3px) brightness(0.9)'
        }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-teal-900/40 via-emerald-800/30 to-cyan-900/40" />
      
      <div className="relative z-10">
        <Navbar />

        <div className="max-w-[1400px] mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            Phòng Tư vấn
          </h1>
          <p className="text-white/90">
            Quản lý và trả lời các yêu cầu tư vấn từ học sinh
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Chat Room List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {/* List Header */}
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white">
                    Danh sách học sinh
                  </h2>
                  <div className="bg-white/20 px-3 py-1 rounded-full">
                    <span className="text-white text-sm font-semibold">
                      {allChatRooms.length}
                    </span>
                  </div>
                </div>
                {role === 'counselor' && (
                  <p className="text-white/80 text-xs mt-1">
                    Hiển thị chat chung và chat riêng của bạn
                  </p>
                )}
              </div>

              {/* Chat Room List */}
              <div className="overflow-y-auto max-h-[calc(100vh-280px)]">
                {allChatRooms.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Users size={32} className="text-gray-400" />
                    </div>
                    <p className="text-gray-500 mb-1">Chưa có phòng tư vấn nào</p>
                    <p className="text-sm text-gray-400">
                      Các phòng tư vấn sẽ hiển thị ở đây
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {allChatRooms.map((room) => {
                      const isPrivate = isPrivateRoom(room)
                      const isMyPrivate = isMyPrivateRoom(room)
                      const urgencyLevel = room.urgency_level || 0
                      const isUrgent = urgencyLevel >= URGENCY_LEVELS.URGENT
                      
                      return (
                        <button
                          key={room.id}
                          onClick={() => setSelectedRoom(room)}
                          className={`w-full px-4 py-4 hover:bg-purple-50 transition-colors text-left relative ${
                            selectedRoom?.id === room.id ? 'bg-purple-50 border-l-4 border-purple-500' : ''
                          } ${isUrgent ? 'bg-red-50/50' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Avatar */}
                            <div className="relative">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 ${
                                urgencyLevel === URGENCY_LEVELS.COMPLETED
                                  ? 'bg-gradient-to-br from-gray-400 to-gray-500'
                                  : urgencyLevel >= URGENCY_LEVELS.CRITICAL 
                                    ? 'bg-gradient-to-br from-red-500 to-red-600 ring-2 ring-red-300 animate-pulse'
                                    : urgencyLevel >= URGENCY_LEVELS.URGENT
                                      ? 'bg-gradient-to-br from-orange-400 to-red-500'
                                      : urgencyLevel >= URGENCY_LEVELS.ATTENTION
                                        ? 'bg-gradient-to-br from-yellow-400 to-orange-400'
                                        : 'bg-gradient-to-br from-purple-400 to-pink-400'
                              }`}>
                                {getStudentInitial(room)}
                              </div>
                              
                              {/* Private indicator badge */}
                              {isPrivate && (
                                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center ${
                                  isMyPrivate ? 'bg-purple-500' : 'bg-gray-400'
                                }`} title={isMyPrivate ? 'Chat riêng của bạn' : 'Chat riêng của tư vấn viên khác'}>
                                  <EyeOff size={10} className="text-white" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              {/* Student Name with privacy indicator */}
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-gray-800 truncate">
                                  {getStudentName(room)}
                                </h3>
                                {isPrivate && (
                                  <EyeOff size={14} className={isMyPrivate ? 'text-purple-600' : 'text-gray-400'} />
                                )}
                              </div>

                              {/* Urgency Badge */}
                              {urgencyLevel === URGENCY_LEVELS.COMPLETED ? (
                                <div className="mb-1">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                                    <CheckCircle2 size={12} />
                                    Đã hoàn thành
                                  </span>
                                </div>
                              ) : urgencyLevel > 0 && (
                                <div className="mb-1">
                                  <UrgencyBadge level={urgencyLevel} size="sm" showLabel={true} />
                                </div>
                              )}

                              {/* Privacy status text */}
                              {isPrivate && (
                                <p className={`text-xs mb-1 ${isMyPrivate ? 'text-purple-600 font-medium' : 'text-gray-400'}`}>
                                  {isMyPrivate ? '🔒 Chat riêng của bạn' : '🔒 Chat riêng'}
                                </p>
                              )}

                              {/* Last Message Time */}
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Clock size={12} />
                                <span>{formatLastMessageTime(room.last_message_at)}</span>
                              </div>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2">
            {!selectedRoom ? (
              <div className="bg-white rounded-2xl shadow-xl p-12 text-center h-full flex items-center justify-center">
                <div>
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle size={40} className="text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    Chọn một phòng tư vấn
                  </h2>
                  <p className="text-gray-600">
                    Chọn học sinh từ danh sách bên trái để bắt đầu tư vấn
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                {/* Chat Header */}
                <div className={`px-6 py-4 ${
                  selectedRoom.urgency_level === URGENCY_LEVELS.COMPLETED
                    ? 'bg-gradient-to-r from-gray-500 to-gray-600'
                    : selectedRoom.urgency_level >= URGENCY_LEVELS.CRITICAL
                      ? 'bg-gradient-to-r from-red-500 to-red-600'
                      : selectedRoom.urgency_level >= URGENCY_LEVELS.URGENT
                        ? 'bg-gradient-to-r from-orange-500 to-red-500'
                        : 'bg-gradient-to-r from-purple-500 to-pink-500'
                }`}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-lg relative">
                      {getStudentInitial(selectedRoom)}
                      {isPrivateRoom(selectedRoom) && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                          <EyeOff size={12} className="text-purple-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-xl font-bold text-white">
                          {getStudentName(selectedRoom)}
                        </h2>
                        {isPrivateRoom(selectedRoom) && (
                          <EyeOff size={18} className="text-white/80" />
                        )}
                        {selectedRoom.urgency_level > 0 && (
                          <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs text-white font-medium">
                            {selectedRoom.urgency_level >= URGENCY_LEVELS.CRITICAL ? '🔴 Rất khẩn cấp' :
                             selectedRoom.urgency_level >= URGENCY_LEVELS.URGENT ? '🟠 Khẩn cấp' :
                             selectedRoom.urgency_level >= URGENCY_LEVELS.ATTENTION ? '🟡 Cần chú ý' : ''}
                          </span>
                        )}
                      </div>
                      <p className="text-white/90 text-sm">
                        {isMyPrivateRoom(selectedRoom) 
                          ? '🔒 Chat riêng với bạn (chỉ bạn và admin thấy)'
                          : isPrivateRoom(selectedRoom)
                            ? '🔒 Chat riêng (admin có thể xem)'
                            : 'Phòng tư vấn chung'
                        }
                      </p>
                    </div>
                    
                    {/* Notes Toggle Button */}
                    <button
                      onClick={() => setShowNotes(!showNotes)}
                      className={`p-2 rounded-lg transition-colors ${
                        showNotes 
                          ? 'bg-white text-purple-600' 
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                      title={showNotes ? 'Ẩn ghi chú' : 'Xem ghi chú học sinh'}
                    >
                      <StickyNote size={20} />
                    </button>
                  </div>
                </div>

                {/* Counselor Actions Bar */}
                <div className="bg-gray-50 border-b px-6 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Urgency Selector */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 font-medium">Mức độ:</span>
                        <UrgencySelector
                          currentLevel={selectedRoom.urgency_level ?? URGENCY_LEVELS.NORMAL}
                          onSelect={async (level) => {
                            try {
                              // If setting to completed, also mark as counseled
                              const updateData = level === URGENCY_LEVELS.COMPLETED
                                ? {
                                    urgency_level: level,
                                    is_counseled: true,
                                    counseled_at: new Date().toISOString(),
                                    counseled_by: user?.id
                                  }
                                : {
                                    urgency_level: level,
                                    // If changing from completed to something else, remove counseled status
                                    ...(selectedRoom.urgency_level === URGENCY_LEVELS.COMPLETED && {
                                      is_counseled: false,
                                      counseled_at: null,
                                      counseled_by: null
                                    })
                                  }
                              
                              await supabase
                                .from('chat_rooms')
                                .update(updateData)
                                .eq('id', selectedRoom.id)
                              
                              // Update local state
                              setSelectedRoom(prev => ({
                                ...prev,
                                urgency_level: level,
                                ...(updateData.is_counseled !== undefined && { is_counseled: updateData.is_counseled })
                              }))
                              
                              // Refresh the student list to show updated urgency
                              refetch()
                            } catch (error) {
                              console.error('Error updating urgency:', error)
                            }
                          }}
                          showCompleted={true}
                        />
                      </div>

                      {/* Counseled Toggle */}
                      <CounseledToggle
                        chatRoomId={selectedRoom.id}
                        isCounseled={selectedRoom.is_counseled || selectedRoom.urgency_level === URGENCY_LEVELS.COMPLETED}
                        previousUrgencyLevel={selectedRoom.urgency_level > 0 ? selectedRoom.urgency_level : URGENCY_LEVELS.NORMAL}
                        counselorId={user?.id}
                        onToggle={(isCounseled, newUrgencyLevel) => {
                          setSelectedRoom(prev => ({
                            ...prev,
                            is_counseled: isCounseled,
                            urgency_level: newUrgencyLevel
                          }))
                          // Refresh the student list
                          refetch()
                        }}
                        size="sm"
                      />
                    </div>

                    {/* Status Info */}
                    {selectedRoom.is_counseled && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle2 size={16} />
                        <span>Đã hoàn thành tư vấn</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Privacy Notice for shared private rooms (admin only) */}
                {isPrivateRoom(selectedRoom) && !isMyPrivateRoom(selectedRoom) && role === 'admin' && (
                  <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3">
                    <div className="flex items-center gap-2 text-sm text-yellow-800">
                      <Shield size={16} />
                      <span>
                        Đây là chat riêng của tư vấn viên khác. Bạn xem được vì bạn là admin (để đảm bảo an toàn).
                      </span>
                    </div>
                  </div>
                )}

                {/* Chat Interface - Full width without embedded notes */}
                <div className="flex-1 flex flex-col">
                  <ChatInterface chatRoom={selectedRoom} currentUser={user} />
                </div>
              </div>
            )}
          </div>

          {/* Notes Panel - Separate column on the right (toggleable) */}
          {showNotes && selectedRoom?.student_id && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden h-[calc(100vh-280px)]">
                <StudentNotesPanel
                  studentId={selectedRoom.student_id}
                  studentName={getStudentName(selectedRoom)}
                  counselorId={user?.id}
                  defaultCollapsed={false}
                  onClose={() => setShowNotes(false)}
                  inline={true}
                />
              </div>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="mt-4 bg-white/90 rounded-2xl p-5 shadow-lg">
          <h3 className="font-semibold text-gray-800 mb-3">
            📋 Hướng dẫn cho tư vấn viên
          </h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div>
              <p className="font-semibold text-purple-600 mb-2 flex items-center gap-1">
                <Eye size={16} />
                Chat chung
              </p>
              <ul className="space-y-1">
                <li>• Tất cả tư vấn viên đều thấy</li>
                <li>• Phù hợp cho hỗ trợ nhanh</li>
                <li>• Có thể cùng nhau tư vấn</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-purple-600 mb-2 flex items-center gap-1">
                <EyeOff size={16} />
                Chat riêng
              </p>
              <ul className="space-y-1">
                <li>• Chỉ bạn và admin thấy</li>
                <li>• Học sinh chọn tư vấn viên cụ thể</li>
                <li>• Đảm bảo riêng tư cao hơn</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-purple-600 mb-2 flex items-center gap-1">
                <Shield size={16} />
                Trách nhiệm
              </p>
              <ul className="space-y-1">
                <li>• Trả lời nhanh và chuyên nghiệp</li>
                <li>• Tôn trọng quyền riêng tư</li>
                <li>• Lắng nghe và thấu hiểu</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
