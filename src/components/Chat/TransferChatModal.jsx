/**
 * TransferChatModal Component
 * Allows counselors to transfer a chat to another counselor
 */
import { useState, useEffect } from 'react'
import { X, ArrowRightLeft, Loader2, User, Search } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

export default function TransferChatModal({
    isOpen,
    onClose,
    onTransfer,
    currentCounselorId,
    studentName = 'Học sinh'
}) {
    const [counselors, setCounselors] = useState([])
    const [loading, setLoading] = useState(true)
    const [transferring, setTransferring] = useState(false)
    const [selectedCounselor, setSelectedCounselor] = useState(null)
    const [reason, setReason] = useState('')
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        if (isOpen) {
            fetchCounselors()
        }
    }, [isOpen])

    const fetchCounselors = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('users')
                .select('id, full_name, role')
                .in('role', ['counselor', 'admin'])
                .neq('id', currentCounselorId)
                .order('full_name')

            if (error) throw error
            setCounselors(data || [])
        } catch (error) {
            console.error('Error fetching counselors:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleTransfer = async () => {
        if (!selectedCounselor) return

        setTransferring(true)
        try {
            await onTransfer(selectedCounselor.id, reason)
            onClose()
        } catch (error) {
            console.error('Transfer failed:', error)
        } finally {
            setTransferring(false)
        }
    }

    const filteredCounselors = counselors.filter(c =>
        c.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-5 text-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <ArrowRightLeft size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">Chuyển giao Chat</h2>
                            <p className="text-sm text-white/80">
                                Chuyển chat với {studentName} cho tư vấn viên khác
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm tư vấn viên..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                        />
                    </div>

                    {/* Counselor List */}
                    <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 size={24} className="animate-spin text-purple-500" />
                            </div>
                        ) : filteredCounselors.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                Không tìm thấy tư vấn viên
                            </div>
                        ) : (
                            filteredCounselors.map((counselor) => (
                                <button
                                    key={counselor.id}
                                    onClick={() => setSelectedCounselor(counselor)}
                                    className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${selectedCounselor?.id === counselor.id
                                            ? 'bg-purple-50 border-l-4 border-l-purple-500'
                                            : 'hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-medium">
                                        {counselor.full_name?.charAt(0) || <User size={18} />}
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-900">{counselor.full_name}</div>
                                        <div className="text-xs text-gray-500 capitalize">{counselor.role}</div>
                                    </div>
                                    {selectedCounselor?.id === counselor.id && (
                                        <span className="ml-auto text-purple-500">✓</span>
                                    )}
                                </button>
                            ))
                        )}
                    </div>

                    {/* Reason */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Lý do chuyển giao (tùy chọn)
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Ví dụ: Hết ca làm việc, cần chuyên môn khác..."
                            rows={2}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 bg-gray-50 border-t flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleTransfer}
                        disabled={!selectedCounselor || transferring}
                        className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-white transition-colors flex items-center justify-center gap-2 ${!selectedCounselor || transferring
                                ? 'bg-gray-300 cursor-not-allowed'
                                : 'bg-purple-500 hover:bg-purple-600'
                            }`}
                    >
                        {transferring ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Đang chuyển...
                            </>
                        ) : (
                            <>
                                <ArrowRightLeft size={18} />
                                Chuyển giao
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
