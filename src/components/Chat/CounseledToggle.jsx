/**
 * CounseledToggle Component
 * Toggle button for counselors to mark chat as handled
 */
import { useState } from 'react'
import { CheckCircle, Circle, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

export default function CounseledToggle({
    chatRoomId,
    isCounseled = false,
    counselorId,
    onToggle,
    size = 'md'
}) {
    const [loading, setLoading] = useState(false)
    const [localCounseled, setLocalCounseled] = useState(isCounseled)

    const handleToggle = async () => {
        setLoading(true)
        const newValue = !localCounseled

        try {
            const updateData = newValue
                ? {
                    is_counseled: true,
                    counseled_at: new Date().toISOString(),
                    counseled_by: counselorId
                }
                : {
                    is_counseled: false,
                    counseled_at: null,
                    counseled_by: null
                }

            const { error } = await supabase
                .from('chat_rooms')
                .update(updateData)
                .eq('id', chatRoomId)

            if (error) throw error

            setLocalCounseled(newValue)
            onToggle?.(newValue)
        } catch (error) {
            console.error('Error toggling counseled status:', error)
        } finally {
            setLoading(false)
        }
    }

    const sizeClasses = {
        sm: 'text-xs px-2 py-1',
        md: 'text-sm px-3 py-1.5',
        lg: 'text-base px-4 py-2'
    }

    const iconSizes = {
        sm: 14,
        md: 16,
        lg: 18
    }

    return (
        <button
            onClick={handleToggle}
            disabled={loading}
            className={`
        inline-flex items-center gap-1.5 rounded-lg font-medium transition-all
        ${sizeClasses[size]}
        ${localCounseled
                    ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                }
        ${loading ? 'opacity-50 cursor-not-allowed' : ''}
      `}
            title={localCounseled ? 'Bỏ đánh dấu đã tư vấn' : 'Đánh dấu đã tư vấn'}
        >
            {loading ? (
                <Loader2 size={iconSizes[size]} className="animate-spin" />
            ) : localCounseled ? (
                <CheckCircle size={iconSizes[size]} />
            ) : (
                <Circle size={iconSizes[size]} />
            )}
            <span>{localCounseled ? 'Đã tư vấn' : 'Đánh dấu đã tư vấn'}</span>
        </button>
    )
}
