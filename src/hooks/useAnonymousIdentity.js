/**
 * useAnonymousIdentity Hook
 * Manages consistent anonymous identities for users
 * The same user always gets the same anonymous name
 */
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

// Default avatar colors for fallback
const AVATAR_COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
]

// Adjectives and animals for client-side generation
const ADJECTIVES = [
    'Dịu dàng', 'Mạnh mẽ', 'Tươi sáng', 'Bình yên', 'Ấm áp',
    'Dũng cảm', 'Kiên cường', 'Lạc quan', 'Nhẹ nhàng', 'Tự tin',
    'Sáng tạo', 'Thân thiện', 'Đáng yêu', 'Tinh tế', 'Chân thành'
]

const ANIMALS = [
    'Cáo', 'Thỏ', 'Chim', 'Bướm', 'Cá heo',
    'Mèo', 'Chó', 'Gấu', 'Sóc', 'Hươu',
    'Chim sẻ', 'Cú mèo', 'Công', 'Vẹt', 'Hạc'
]

/**
 * Generate a deterministic hash from user ID
 * Used for consistent random selection
 */
function hashCode(str) {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash)
}

/**
 * Generate anonymous identity client-side (fallback)
 */
function generateLocalIdentity(userId) {
    const hash = hashCode(userId)
    const adjIndex = hash % ADJECTIVES.length
    const animalIndex = (hash >> 4) % ANIMALS.length
    const colorIndex = (hash >> 8) % AVATAR_COLORS.length
    const num = hash % 100

    return {
        anonymous_name: `${ADJECTIVES[adjIndex]} ${ANIMALS[animalIndex]} ${num}`,
        anonymous_avatar: AVATAR_COLORS[colorIndex]
    }
}

export function useAnonymousIdentity(userId) {
    const [identity, setIdentity] = useState(null)
    const [loading, setLoading] = useState(true)

    const fetchIdentity = useCallback(async () => {
        if (!userId) {
            setLoading(false)
            return
        }

        try {
            // Try to get from database first
            const { data, error } = await supabase
                .rpc('get_anonymous_identity', { p_user_id: userId })

            if (error) {
                console.warn('RPC not available, using local generation:', error.message)
                // Fallback to local generation
                setIdentity(generateLocalIdentity(userId))
            } else if (data && data.length > 0) {
                setIdentity({
                    anonymous_name: data[0].anonymous_name,
                    anonymous_avatar: data[0].anonymous_avatar
                })
            } else {
                // Fallback
                setIdentity(generateLocalIdentity(userId))
            }
        } catch (err) {
            console.error('Error fetching anonymous identity:', err)
            // Always fall back to local generation
            setIdentity(generateLocalIdentity(userId))
        } finally {
            setLoading(false)
        }
    }, [userId])

    useEffect(() => {
        fetchIdentity()
    }, [fetchIdentity])

    /**
     * Get anonymous identity for any user ID
     * Useful when displaying other users' anonymous identities
     */
    const getIdentityFor = useCallback(async (targetUserId) => {
        if (!targetUserId) return null

        try {
            const { data, error } = await supabase
                .rpc('get_anonymous_identity', { p_user_id: targetUserId })

            if (error || !data || data.length === 0) {
                return generateLocalIdentity(targetUserId)
            }

            return {
                anonymous_name: data[0].anonymous_name,
                anonymous_avatar: data[0].anonymous_avatar
            }
        } catch {
            return generateLocalIdentity(targetUserId)
        }
    }, [])

    /**
     * Get initials from anonymous name
     */
    const getInitials = (name) => {
        if (!name) return '?'
        const parts = name.split(' ')
        if (parts.length >= 2) {
            return parts[0].charAt(0) + parts[1].charAt(0)
        }
        return name.charAt(0)
    }

    return {
        identity,
        loading,
        anonymousName: identity?.anonymous_name || 'Ẩn danh',
        avatarColor: identity?.anonymous_avatar || '#6366f1',
        initials: getInitials(identity?.anonymous_name),
        getIdentityFor,
        refetch: fetchIdentity
    }
}

// Export the local generator for components that need it without hooks
export { generateLocalIdentity }
