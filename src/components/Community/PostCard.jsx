import { useState } from 'react'
import { Heart, MessageCircle, Trash2, Send } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

export default function PostCard({ post, currentUser, onDelete }) {
  const [liked, setLiked] = useState(false)
  const [likes, setLikes] = useState(post.likes || 0)
  const [showComments, setShowComments] = useState(false)

  const handleLike = async () => {
    if (liked) {
      setLikes(likes - 1)
      setLiked(false)
    } else {
      setLikes(likes + 1)
      setLiked(true)
    }

    // Update in database
    await supabase
      .from('posts')
      .update({ likes: liked ? likes - 1 : likes + 1 })
      .eq('id', post.id)
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold hover-wiggle">
            {post.author?.full_name?.[0] || 'A'}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">
              {post.author?.full_name || 'Ẩn danh'}
            </h3>
            <p className="text-sm text-gray-500">
              {new Date(post.created_at).toLocaleString('vi-VN')}
            </p>
          </div>
        </div>

        {(currentUser?.id === post.author_id || 
          currentUser?.user_metadata?.role === 'admin' ||
          currentUser?.user_metadata?.role === 'counselor') && (
          <button
            onClick={() => onDelete(post.id)}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>

      <p className="text-gray-700 mb-4 whitespace-pre-wrap">{post.content}</p>

      {post.image_url && (
        <img
          src={post.image_url}
          alt="Post"
          className="w-full max-h-96 object-cover rounded-xl mb-4"
        />
      )}

      <div className="flex items-center gap-6 pt-4 border-t border-gray-200">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 transition-all duration-200 hover-pop ${
            liked ? 'text-pink-600' : 'text-gray-600 hover:text-pink-600'
          }`}
        >
          <Heart size={20} className={`transition-transform ${liked ? 'fill-pink-600 animate-pop' : ''}`} />
          <span className="text-sm">{likes}</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-all duration-200 hover-pop"
        >
          <MessageCircle size={20} />
          <span className="text-sm">Bình luận</span>
        </button>
      </div>

      {showComments && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Viết bình luận..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button className="px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors">
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

