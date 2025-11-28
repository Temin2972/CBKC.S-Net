import { useComments } from '../../hooks/useComments'
import { useAIModeration } from '../../hooks/useAIModeration'
import { useState } from 'react'
import CommentList from './CommentList'

export default function CommentSection({ postId, currentUser }) {
  const { 
    comments, 
    loading,
    createComment,
    toggleCommentLike,
    deleteComment
  } = useComments(postId, currentUser?.id)

  const { analyzeContent } = useAIModeration()
  const [aiError, setAiError] = useState('')

  const handleCreateComment = async (content, parentId) => {
    setAiError('')

    // AI MODERATION CHECK
    const moderation = await analyzeContent(content, currentUser.id, 'comment', postId)

    if (!moderation.allowed) {
      if (moderation.severity === 'blocked') {
        setAiError('⚠️ Bình luận chứa ngôn từ không phù hợp và đã bị chặn.')
        setTimeout(() => setAiError(''), 5000)
        return { error: new Error('Blocked by AI') }
      } else if (moderation.severity === 'high') {
        setAiError('⚠️ Chúng tôi phát hiện bạn có thể đang gặp khó khăn. Bình luận đã được gửi đến tư vấn viên.')
        setTimeout(() => setAiError(''), 8000)
        return { error: new Error('Flagged by AI') }
      }
    }

    if (moderation.severity === 'medium') {
      setAiError('ℹ️ Bình luận đã được đăng. Tư vấn viên sẽ theo dõi.')
      setTimeout(() => setAiError(''), 5000)
    }

    const result = await createComment(content, parentId)
    return result
  }

  return (
    <div>
      {aiError && (
        <div className={`mb-4 p-3 rounded-xl text-sm ${
          aiError.includes('⚠️') 
            ? 'bg-red-50 border border-red-200 text-red-700' 
            : 'bg-blue-50 border border-blue-200 text-blue-700'
        }`}>
          {aiError}
        </div>
      )}
      
      <CommentList
        comments={comments}
        loading={loading}
        currentUser={currentUser}
        onCreateComment={handleCreateComment}
        onLikeComment={toggleCommentLike}
        onDeleteComment={deleteComment}
      />
    </div>
  )
}
