/**
 * AppealReviewCard Component
 * Displays an appeal for staff to review
 */
import { useState } from 'react'
import {
    Check, X, Clock, User, MessageSquare,
    FileText, Loader2, ChevronDown, ChevronUp
} from 'lucide-react'
import { APPEAL_STATUS } from '../../hooks/useContentAppeals'

export default function AppealReviewCard({
    appeal,
    onApprove,
    onReject,
    isProcessing = false
}) {
    const [expanded, setExpanded] = useState(false)
    const [rejectNotes, setRejectNotes] = useState('')
    const [showRejectForm, setShowRejectForm] = useState(false)

    const statusConfig = {
        [APPEAL_STATUS.PENDING]: {
            label: 'Chờ xem xét',
            color: 'yellow',
            icon: Clock
        },
        [APPEAL_STATUS.APPROVED]: {
            label: 'Đã chấp nhận',
            color: 'green',
            icon: Check
        },
        [APPEAL_STATUS.REJECTED]: {
            label: 'Đã từ chối',
            color: 'red',
            icon: X
        }
    }

    const status = statusConfig[appeal.status] || statusConfig[APPEAL_STATUS.PENDING]
    const StatusIcon = status.icon
    const isPending = appeal.status === APPEAL_STATUS.PENDING

    const handleReject = async () => {
        await onReject(appeal.id, rejectNotes)
        setShowRejectForm(false)
        setRejectNotes('')
    }

    const colorClasses = {
        yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        green: 'bg-green-100 text-green-700 border-green-200',
        red: 'bg-red-100 text-red-700 border-red-200'
    }

    return (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            {/* Header */}
            <div
                className="p-4 flex items-start gap-3 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                {/* User info */}
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-medium shrink-0">
                    {appeal.user?.full_name?.charAt(0) || <User size={18} />}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900">
                            {appeal.user?.full_name || 'Người dùng'}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${colorClasses[status.color]}`}>
                            <StatusIcon size={12} />
                            {status.label}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {new Date(appeal.created_at).toLocaleString('vi-VN')}
                    </p>
                </div>

                <button className="p-1 text-gray-400 hover:text-gray-600">
                    {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
            </div>

            {/* Expanded content */}
            {expanded && (
                <div className="px-4 pb-4 space-y-4">
                    {/* Original content */}
                    {appeal.original_content && (
                        <div className="bg-gray-50 rounded-lg p-3 border">
                            <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-2">
                                <FileText size={14} />
                                <span>Nội dung gốc ({appeal.content_type})</span>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                {appeal.original_content}
                            </p>
                        </div>
                    )}

                    {/* User's reason */}
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <div className="flex items-center gap-2 text-xs font-medium text-blue-600 mb-2">
                            <MessageSquare size={14} />
                            <span>Lý do yêu cầu xem xét lại</span>
                        </div>
                        <p className="text-sm text-blue-800 whitespace-pre-wrap">
                            {appeal.reason}
                        </p>
                    </div>

                    {/* Review notes if reviewed */}
                    {appeal.reviewed_at && appeal.review_notes && (
                        <div className={`rounded-lg p-3 border ${appeal.status === APPEAL_STATUS.APPROVED
                                ? 'bg-green-50 border-green-200'
                                : 'bg-red-50 border-red-200'
                            }`}>
                            <p className="text-xs font-medium text-gray-500 mb-1">
                                Ghi chú từ {appeal.reviewer?.full_name || 'người xem xét'}:
                            </p>
                            <p className="text-sm">{appeal.review_notes}</p>
                        </div>
                    )}

                    {/* Action buttons for pending appeals */}
                    {isPending && (
                        <div className="pt-2 border-t space-y-3">
                            {showRejectForm ? (
                                <div className="space-y-2">
                                    <textarea
                                        value={rejectNotes}
                                        onChange={(e) => setRejectNotes(e.target.value)}
                                        placeholder="Lý do từ chối (tùy chọn)..."
                                        rows={2}
                                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setShowRejectForm(false)}
                                            className="flex-1 py-2 px-3 text-sm border rounded-lg hover:bg-gray-50"
                                        >
                                            Hủy
                                        </button>
                                        <button
                                            onClick={handleReject}
                                            disabled={isProcessing}
                                            className="flex-1 py-2 px-3 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center justify-center gap-1"
                                        >
                                            {isProcessing ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : (
                                                <>
                                                    <X size={14} />
                                                    Xác nhận từ chối
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowRejectForm(true)}
                                        className="flex-1 py-2.5 px-4 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <X size={16} />
                                        Từ chối
                                    </button>
                                    <button
                                        onClick={() => onApprove(appeal.id)}
                                        disabled={isProcessing}
                                        className="flex-1 py-2.5 px-4 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                                    >
                                        {isProcessing ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <>
                                                <Check size={16} />
                                                Chấp nhận
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
