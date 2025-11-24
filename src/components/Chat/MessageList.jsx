import { useEffect, useRef } from 'react'

export default function MessageList({ messages, currentUserId }) {
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <p>Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${
            msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'
          }`}
        >
          <div
            className={`max-w-md px-4 py-3 rounded-2xl ${
              msg.sender_id === currentUserId
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {msg.sender && (
              <p className="text-xs font-semibold mb-1 opacity-75">
                {msg.sender.full_name}
              </p>
            )}
            <p className="break-words">{msg.content}</p>
            <p
              className={`text-xs mt-1 ${
                msg.sender_id === currentUserId ? 'text-purple-200' : 'text-gray-400'
              }`}
            >
              {new Date(msg.created_at).toLocaleTimeString('vi-VN')}
            </p>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  )
}
