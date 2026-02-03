/**
 * ContentAppealModal Component
 * Allows users to submit an appeal for blocked/rejected content
 */
import { useState } from 'react'
import { X, FileQuestion, Loader2, AlertCircle } from 'lucide-react'

export default function ContentAppealModal({
    isOpen,
    onClose,
    onSubmit,
    contentType = 'post',
    contentId,
    originalContent = '',
    isSubmitting = false
}) {
    const [reason, setReason] = useState('')
    const [error, setError] = useState('')

    if (!isOpen) return null

    const handleSubmit = async () => {
        if (reason.trim().length < 10) {
            setError('Vui lòng nhập lý do ít nhất 10 ký tự')
            return
        }

        setError('')
        await onSubmit(contentType, contentId, originalContent, reason)
        setReason('')
    }

    const handleClose = () => {
        setReason('')
        setError('')
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-5 text-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <FileQuestion size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">Yêu cầu xem xét lại</h2>
                            <p className="text-sm text-white/80">
                                Giải thích tại sao nội dung này không vi phạm
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4">
                    {/* Show original content preview */}
                    {originalContent && (
                        <div className="bg-gray-50 rounded-lg p-3 border">
                            <p className="text-xs font-medium text-gray-500 mb-1">Nội dung của bạn:</p>
                            <p className="text-sm text-gray-700 line-clamp-3">{originalContent}</p>
                        </div>
                    )}

                    {/* Reason input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Lý do yêu cầu xem xét lại <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Ví dụ: Nội dung này chỉ là lời bài hát, không phải suy nghĩ tiêu cực của tôi..."
                            rows={4}
                            className="w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                            maxLength={500}
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>Tối thiểu 10 ký tự</span>
                            <span>{reason.length}/500</span>
                        </div>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-2 rounded-lg">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Info note */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-xs text-blue-700">
                            <strong>Lưu ý:</strong> Yêu cầu của bạn sẽ được tư vấn viên xem xét.
                            Bạn sẽ nhận được thông báo khi có kết quả.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 bg-gray-50 border-t flex gap-3">
                    <button
                        onClick={handleClose}
                        className="flex-1 py-2.5 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || reason.trim().length < 10}
                        className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-white transition-colors flex items-center justify-center gap-2 ${isSubmitting || reason.trim().length < 10
                                ? 'bg-gray-300 cursor-not-allowed'
                                : 'bg-blue-500 hover:bg-blue-600'
                            }`}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Đang gửi...
                            </>
                        ) : (
                            <>
                                <FileQuestion size={18} />
                                Gửi yêu cầu
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
