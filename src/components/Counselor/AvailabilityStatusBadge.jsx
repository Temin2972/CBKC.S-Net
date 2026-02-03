/**
 * AvailabilityStatusBadge Component
 * Shows counselor online status
 */
import { Circle } from 'lucide-react'
import { STATUS_CONFIG, AVAILABILITY_STATUS } from '../../hooks/useCounselorAvailability'

export default function AvailabilityStatusBadge({
    status = AVAILABILITY_STATUS.OFFLINE,
    showLabel = true,
    size = 'md'
}) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG[AVAILABILITY_STATUS.OFFLINE]

    const sizeClasses = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base'
    }

    const dotSizes = {
        sm: 8,
        md: 10,
        lg: 12
    }

    const colorClasses = {
        green: 'text-green-500',
        yellow: 'text-yellow-500',
        orange: 'text-orange-500',
        gray: 'text-gray-400'
    }

    return (
        <span className={`inline-flex items-center gap-1.5 ${sizeClasses[size]}`}>
            <Circle
                size={dotSizes[size]}
                className={`fill-current ${colorClasses[config.color]}`}
            />
            {showLabel && (
                <span className="text-gray-600 font-medium">{config.label}</span>
            )}
        </span>
    )
}
