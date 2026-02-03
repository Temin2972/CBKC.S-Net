/**
 * BookingForm Component
 * Student appointment booking form (supports guests)
 */
import { useState } from 'react'
import {
    Calendar, Mail, User, Home, Clock,
    MessageSquare, Loader2, CheckCircle, AlertCircle
} from 'lucide-react'
import { useAppointments, TIME_SLOTS } from '../../hooks/useAppointments'

export default function BookingForm({ userId = null, onSuccess }) {
    const { submitAppointment } = useAppointments()

    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        class_name: '',
        dorm_room: '',
        time_slot: '',
        custom_time_slot: '',
        issues: ''
    })

    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState('')

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        setError('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        // Validate
        if (!formData.full_name.trim()) {
            setError('Vui lòng nhập họ và tên')
            return
        }
        if (!formData.email.trim() || !formData.email.includes('@')) {
            setError('Vui lòng nhập email hợp lệ')
            return
        }
        if (!formData.time_slot) {
            setError('Vui lòng chọn khung giờ')
            return
        }
        if (formData.time_slot === 'other' && !formData.custom_time_slot.trim()) {
            setError('Vui lòng nhập khung giờ mong muốn')
            return
        }
        if (!formData.issues.trim() || formData.issues.length < 10) {
            setError('Vui lòng mô tả chi tiết vấn đề cần tư vấn (ít nhất 10 ký tự)')
            return
        }

        setSubmitting(true)
        setError('')

        const { error: submitError } = await submitAppointment(formData, userId)

        if (submitError) {
            setError('Có lỗi xảy ra. Vui lòng thử lại.')
            setSubmitting(false)
        } else {
            setSubmitted(true)
            onSuccess?.()
        }
    }

    // Success state
    if (submitted) {
        return (
            <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-lg p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="text-green-500" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Đã gửi yêu cầu thành công! 🎉
                </h2>
                <p className="text-gray-600 mb-6">
                    Tư vấn viên sẽ sớm liên hệ với bạn qua email hoặc tin nhắn.
                    Cảm ơn bạn đã tin tưởng S-Net!
                </p>
                <button
                    onClick={() => {
                        setSubmitted(false)
                        setFormData({
                            full_name: '',
                            email: '',
                            class_name: '',
                            dorm_room: '',
                            time_slot: '',
                            custom_time_slot: '',
                            issues: ''
                        })
                    }}
                    className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                >
                    Đặt lịch khác
                </button>
            </div>
        )
    }

    return (
        <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-6 text-white">
                <div className="flex items-center gap-3">
                    <Calendar size={28} />
                    <div>
                        <h2 className="text-xl font-bold">Đặt lịch tư vấn</h2>
                        <p className="text-purple-100 text-sm">
                            Điền thông tin bên dưới để đặt lịch hẹn với tư vấn viên
                        </p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Error message */}
                {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                {/* Full name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={formData.full_name}
                            onChange={(e) => handleChange('full_name', e.target.value)}
                            placeholder="Nguyễn Văn A"
                            className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                        />
                    </div>
                </div>

                {/* Email */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            placeholder="email@example.com"
                            className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                        />
                    </div>
                </div>

                {/* Class and Dorm */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Lớp
                        </label>
                        <input
                            type="text"
                            value={formData.class_name}
                            onChange={(e) => handleChange('class_name', e.target.value)}
                            placeholder="VD: 12A1"
                            className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phòng KTX
                        </label>
                        <div className="relative">
                            <Home size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={formData.dorm_room}
                                onChange={(e) => handleChange('dorm_room', e.target.value)}
                                placeholder="VD: B205"
                                className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Time slot */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Khung giờ mong muốn <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                        {TIME_SLOTS.map((slot) => (
                            <label
                                key={slot.value}
                                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${formData.time_slot === slot.value
                                        ? 'border-purple-500 bg-purple-50'
                                        : 'hover:bg-gray-50'
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="time_slot"
                                    value={slot.value}
                                    checked={formData.time_slot === slot.value}
                                    onChange={(e) => handleChange('time_slot', e.target.value)}
                                    className="text-purple-500 focus:ring-purple-500"
                                />
                                <Clock size={16} className="text-gray-400" />
                                <span className="text-gray-700">{slot.label}</span>
                            </label>
                        ))}
                    </div>

                    {/* Custom time input */}
                    {formData.time_slot === 'other' && (
                        <input
                            type="text"
                            value={formData.custom_time_slot}
                            onChange={(e) => handleChange('custom_time_slot', e.target.value)}
                            placeholder="Nhập khung giờ mong muốn..."
                            className="w-full mt-2 px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                        />
                    )}
                </div>

                {/* Issues */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Những khó khăn cần tư vấn <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <MessageSquare size={18} className="absolute left-3 top-3 text-gray-400" />
                        <textarea
                            value={formData.issues}
                            onChange={(e) => handleChange('issues', e.target.value)}
                            placeholder="Hãy chia sẻ những khó khăn bạn đang gặp phải. Thông tin này sẽ được bảo mật..."
                            rows={4}
                            className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none"
                        />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                        {formData.issues.length}/500 ký tự
                    </p>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {submitting ? (
                        <>
                            <Loader2 size={20} className="animate-spin" />
                            Đang gửi...
                        </>
                    ) : (
                        <>
                            <Calendar size={20} />
                            Gửi yêu cầu đặt lịch
                        </>
                    )}
                </button>

                {/* Privacy note */}
                <p className="text-xs text-gray-400 text-center">
                    🔒 Thông tin của bạn được bảo mật tuyệt đối
                </p>
            </form>
        </div>
    )
}
