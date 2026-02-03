/**
 * AnonymousAvatar Component
 * Displays a colored avatar with initials for anonymous users
 */
import { User } from 'lucide-react'

export default function AnonymousAvatar({
    name = 'Ẩn danh',
    color = '#6366f1',
    size = 'md',
    className = ''
}) {
    const sizeClasses = {
        xs: 'w-6 h-6 text-xs',
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base',
        xl: 'w-16 h-16 text-lg'
    }

    // Get initials from name
    const getInitials = () => {
        if (!name) return '?'
        const parts = name.split(' ')
        if (parts.length >= 2) {
            return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
        }
        return name.charAt(0).toUpperCase()
    }

    return (
        <div
            className={`
        rounded-full flex items-center justify-center font-bold text-white
        ${sizeClasses[size] || sizeClasses.md}
        ${className}
      `}
            style={{ backgroundColor: color }}
            title={name}
        >
            {name ? getInitials() : <User size={size === 'xs' ? 12 : size === 'sm' ? 14 : 16} />}
        </div>
    )
}
