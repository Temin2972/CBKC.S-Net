import { useState, useEffect, useRef } from 'react'
import { useChat } from '../../hooks/useChat'
import { Send } from 'lucide-react'

export default function ChatRoom({ roomId, currentUser }) {
  const [newMessage, setNewMessage] = useState('')
  const { messages, loading, sendMessage } = useChat(roomId)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    const { error } = await sendMessage(newMessage, currentUser.id)
    if (!error) {
      setNewMessage('')
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {loading ? (
          <div className="text-center text-gray-500">Đang tải...</div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.sender_id === currentUser.id ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-md px-4 py-3 rounded-2xl ${
                  msg.sender_id === currentUser.id
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <p className="break-words">{msg.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    msg.sender_id === currentUser.id ? 'text-purple-200' : 'text-gray-400'
                  }`}
                >
                  {new Date(msg.created_at).toLocaleTimeString('vi-VN')}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-6 border-t border-gray-200">
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
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  )
}
