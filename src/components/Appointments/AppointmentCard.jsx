/**
 * AppointmentCard Component
 * Individual appointment request card for counselors
 */
import { useState } from 'react'
import {
    Clock, Mail, User, Home, BookOpen,
    MessageSquare, AlertTriangle, Check, X,
    Loader2, ExternalLink, ChevronDown, ChevronUp
} from 'lucide-react'
import { APPOINTMENT_STATUS, STATUS_CONFIG } from '../../hooks/useAppointments'
import { UrgencyBadge } from '../Chat'

export default function AppointmentCard({
    appointment,
    onAccept,
    onCreateChat,
    onCancel,
    isProcessing = false
}) {
    const [expanded, setExpanded] = useState(false)
    const [notes, setNotes] = useState(appointment.counselor_notes || '')

    const statusConfig = STATUS_CONFIG[appointment.status] || STATUS_CONFIG[APPOINTMENT_STATUS.PENDING]
    const isPending = appointment.status === APPOINTMENT_STATUS.PENDING
    const isUrgent = appointment.urgency_level >= 2

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className={`bg-white rounded-xl border shadow-sm overflow-hidden ${isUrgent ? 'ring-2 ring-red-200' : ''
            }`}>
            {/* Header - always visible */}
            <div
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                        {/* Urgency indicator */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isUrgent ? 'bg-red-100' : 'bg-purple-100'
                            }`}>
                            {isUrgent ? (
                                <AlertTriangle size={20} className="text-red-500" />
                            ) : (
                                <User size={20} className="text-purple-500" />
                            )}
                        </div>

                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-gray-900">
                                    {appointment.full_name}
                                </h3>
                                <UrgencyBadge level={appointment.urgency_level} size="sm" />
                            </div>
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                                <Clock size={14} />
                                {appointment.time_slot_display || appointment.time_slot}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${appointment.status === APPOINTMENT_STATUS.PENDING
                                ? 'bg-yellow-100 text-yellow-700'
                                : appointment.status === APPOINTMENT_STATUS.ACCEPTED
                                    ? 'bg-blue-100 text-blue-700'
                                    : appointment.status === APPOINTMENT_STATUS.COMPLETED
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-gray-100 text-gray-700'
                            }`}>
                            {statusConfig.icon} {statusConfig.label}
                        </span>
                        {expanded ? (
                            <ChevronUp size={18} className="text-gray-400" />
                        ) : (
                            <ChevronDown size={18} className="text-gray-400" />
                        )}
                    </div>
                </div>

                {/* Brief preview */}
                {!expanded && (
                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                        {appointment.issues}
                    </p>
                )}
            </div>

            {/* Expanded content */}
            {expanded && (
                <div className="px-4 pb-4 space-y-4 border-t pt-4">
                    {/* Contact info */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail size={14} className="text-gray-400" />
                            <a href={`mailto:${appointment.email}`} className="hover:text-purple-500">
                                {appointment.email}
                            </a>
                        </div>
                        {appointment.class_name && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <BookOpen size={14} className="text-gray-400" />
                                Lớp {appointment.class_name}
                            </div>
                        )}
                        {appointment.dorm_room && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Home size={14} className="text-gray-400" />
                                Phòng {appointment.dorm_room}
                            </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Clock size={14} />
                            Gửi lúc: {formatDate(appointment.created_at)}
                        </div>
                    </div>

                    {/* Issues full text */}
                    <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            <MessageSquare size={14} />
                            Vấn đề cần tư vấn:
                        </div>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">
                            {appointment.issues}
                        </p>
                    </div>

                    {/* AI Analysis */}
                    {appointment.ai_analysis && (
                        <div className="bg-purple-50 rounded-lg p-3">
                            <div className="text-xs font-medium text-purple-700 mb-1">
                                🤖 Đánh giá AI:
                            </div>
                            <p className="text-sm text-purple-600">
                                {appointment.ai_analysis}
                            </p>
                        </div>
                    )}

                    {/* Actions for pending */}
                    {isPending && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => onCreateChat?.(appointment)}
                                disabled={isProcessing}
                                className="flex-1 py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isProcessing ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <MessageSquare size={16} />
                                )}
                                Tạo phòng chat
                            </button>
                            <button
                                onClick={() => onAccept?.(appointment)}
                                disabled={isProcessing}
                                className="flex-1 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Check size={16} />
                                Đã ghi nhận
                            </button>
                            <button
                                onClick={() => onCancel?.(appointment)}
                                disabled={isProcessing}
                                className="py-2 px-3 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                                title="Hủy yêu cầu"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    {/* Chat link if exists */}
                    {appointment.chat_room_id && (
                        <a
                            href={`/chat/${appointment.chat_room_id}`}
                            className="flex items-center gap-2 text-purple-500 hover:text-purple-600 text-sm"
                        >
                            <ExternalLink size={14} />
                            Đi đến phòng chat
                        </a>
                    )}
                </div>
            )}
        </div>
    )
}
