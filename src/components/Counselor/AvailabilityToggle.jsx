/**
 * AvailabilityToggle Component
 * Quick toggle for counselor online/offline status
 */
import { useState } from 'react'
import { Power, Loader2 } from 'lucide-react'
import { useCounselorAvailability, AVAILABILITY_STATUS, STATUS_CONFIG } from '../../hooks/useCounselorAvailability'

export default function AvailabilityToggle({ counselorId }) {
    const { status, isOnline, toggleOnline, setStatus } = useCounselorAvailability(counselorId)
    const [isUpdating, setIsUpdating] = useState(false)
    const [showOptions, setShowOptions] = useState(false)

    const handleToggle = async () => {
        setIsUpdating(true)
        await toggleOnline()
        setIsUpdating(false)
    }

    const handleStatusChange = async (newStatus) => {
        setIsUpdating(true)
        await setStatus(newStatus)
        setIsUpdating(false)
        setShowOptions(false)
    }

    const currentConfig = STATUS_CONFIG[status] || STATUS_CONFIG[AVAILABILITY_STATUS.OFFLINE]

    return (
        <div className="relative">
            <div className="flex items-center gap-2">
                {/* Quick toggle button */}
                <button
                    onClick={handleToggle}
                    disabled={isUpdating}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${isOnline
                            ? 'bg-green-500 text-white hover:bg-green-600'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                >
                    {isUpdating ? (
                        <Loader2 size={18} className="animate-spin" />
                    ) : (
                        <Power size={18} />
                    )}
                    <span>{currentConfig.label}</span>
                </button>

                {/* More options */}
                <button
                    onClick={() => setShowOptions(!showOptions)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                </button>
            </div>

            {/* Status options dropdown */}
            {showOptions && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowOptions(false)}
                    />
                    <div className="absolute right-0 mt-2 z-20 w-48 bg-white rounded-lg shadow-lg border overflow-hidden">
                        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                            <button
                                key={key}
                                onClick={() => handleStatusChange(key)}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 ${status === key ? 'bg-purple-50' : ''
                                    }`}
                            >
                                <span>{config.icon}</span>
                                <span className="font-medium">{config.label}</span>
                                {status === key && (
                                    <span className="ml-auto text-purple-500">✓</span>
                                )}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
