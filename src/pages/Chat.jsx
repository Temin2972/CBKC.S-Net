import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useChat } from '../hooks/useChat'
import { supabase } from '../lib/supabaseClient'
import Navbar from '../components/Layout/Navbar'
import { Send, MessageCircle } from 'lucide-react'

export default function Chat() {
  const { user } = useAuth()
  const [rooms, setRooms] = useState([])
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [newMessage, setNewMessage] = useState('')
  const { messages, loading, sendMessage } = useChat(selectedRoom?.id)

  useEffect(() => {
    fetchRooms()
  }, [user])

  const fetchRooms = async () => {
    const query = supabase
      .from('chat_rooms')
      .select(`
        *,
        student:users!chat_rooms_student_id_fkey(id, full_name),
        counselor:users!chat_rooms_counselor_id_fkey(id, full_name)
      `)

    if (user?.user_metadata?.role === 'student') {
      query.eq('student_id', user.id)
    } else {
      query.eq('counselor_id', user.id)
    }

    const { data, error } = await query
    if (!error) setRooms(data || [])
  }

  const createNewRoom = async () => {
    // Find a counselor (simplified - you can improve this)
    const { data: counselors } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'counselor')
      .limit(1)

    if (counselors && counselors.length > 0) {
      const { data, error } = await supabase
        .from('chat_rooms')
        .insert({
          student_id: user.id,
          counselor_id: counselors[0].id
        })
        .select()

      if (!error && data) {
        setRooms([...rooms, data[0]])
        setSelectedRoom(data[0])
      }
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    const { error } = await sendMessage(newMessage, user.id)
    if (!error) {
      setNewMessage('')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-400 via-pink-400 to-purple-400">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6 h-[80vh]">
          {/* Rooms List */}
          <div className="bg-white rounded-2xl shadow-lg p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Cuộc trò chuyện</h2>
              {user?.user_metadata?.role === 'student' && (
                <button
                  onClick={createNewRoom}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm"
                >
                  Bắt đầu chat
                </button>
              )}
            </div>

            {rooms.length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                <MessageCircle size={48} className="mx-auto mb-4 text-gray-300" />
                <p>Chưa có cuộc trò chuyện nào</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    onClick={() => setSelectedRoom(room)}
                    className={`p-4 rounded-xl cursor-pointer transition-all ${
                      selectedRoom?.id === room.id
                        ? 'bg-purple-100 border-2 border-purple-500'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <h3 className="font-semibold text-gray-800">
                      {user?.user_metadata?.role === 'student'
                        ? room.counselor?.full_name || 'Tư vấn viên'
                        : room.student?.full_name || 'Học sinh'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(room.created_at).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chat Area */}
          <div className="md:col-span-2 bg-white rounded-2xl shadow-lg flex flex-col">
            {selectedRoom ? (
              <>
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-800">
                    Chat với{' '}
                    {user?.user_metadata?.role === 'student'
                      ? selectedRoom.counselor?.full_name || 'Tư vấn viên'
                      : selectedRoom.student?.full_name || 'Học sinh'}
                  </h2>
                </div>

                {/* Messages */}
                <div className="flex-1 p-6 overflow-y-auto">
                  {loading ? (
                    <div className="text-center text-gray-500">Đang tải...</div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-12">
                      <MessageCircle size={48} className="mx-auto mb-4 text-gray-300" />
                      <p>Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${
                            msg.sender_id === user.id ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-md px-4 py-3 rounded-2xl ${
                              msg.sender_id === user.id
                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            <p className="break-words">{msg.content}</p>
                            <p
                              className={`text-xs mt-1 ${
                                msg.sender_id === user.id ? 'text-purple-200' : 'text-gray-400'
                              }`}
                            >
                              {new Date(msg.created_at).toLocaleTimeString('vi-VN')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Input */}
                <form onSubmit={handleSendMessage} className="p-6 border-t border-gray-200">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Nhập tin nhắn..."
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      type="submit"
                      className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-colors flex items-center gap-2"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <MessageCircle size={64} className="mx-auto mb-4" />
                  <p className="text-xl">Chọn một cuộc trò chuyện để bắt đầu</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
