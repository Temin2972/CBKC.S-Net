/**
 * useAnalytics Hook
 * Fetches and aggregates platform statistics
 */
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useAnalytics(dateRange = 'week') {
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Calculate date range
    const getDateRange = useCallback(() => {
        const now = new Date()
        const startDate = new Date()

        switch (dateRange) {
            case 'today':
                startDate.setHours(0, 0, 0, 0)
                break
            case 'week':
                startDate.setDate(now.getDate() - 7)
                break
            case 'month':
                startDate.setMonth(now.getMonth() - 1)
                break
            case 'year':
                startDate.setFullYear(now.getFullYear() - 1)
                break
            default:
                startDate.setDate(now.getDate() - 7)
        }

        return { start: startDate.toISOString(), end: now.toISOString() }
    }, [dateRange])

    const fetchStats = useCallback(async () => {
        setLoading(true)
        const { start, end } = getDateRange()

        try {
            // Parallel queries for better performance
            const [
                usersResult,
                chatsResult,
                messagesResult,
                postsResult,
                activeChatsResult
            ] = await Promise.all([
                // Total users by role
                supabase
                    .from('users')
                    .select('role', { count: 'exact' }),

                // Chat rooms created in range
                supabase
                    .from('chat_rooms')
                    .select('*', { count: 'exact' })
                    .gte('created_at', start)
                    .lte('created_at', end),

                // Messages sent in range
                supabase
                    .from('chat_messages')
                    .select('*', { count: 'exact' })
                    .gte('created_at', start)
                    .lte('created_at', end),

                // Posts created in range
                supabase
                    .from('posts')
                    .select('*', { count: 'exact' })
                    .gte('created_at', start)
                    .lte('created_at', end),

                // Currently active chats
                supabase
                    .from('chat_rooms')
                    .select('*', { count: 'exact' })
                    .eq('status', 'active')
            ])

            // Count users by role
            const usersByRole = {
                students: 0,
                counselors: 0,
                admins: 0
            }

            if (usersResult.data) {
                usersResult.data.forEach(user => {
                    if (user.role === 'student') usersByRole.students++
                    else if (user.role === 'counselor') usersByRole.counselors++
                    else if (user.role === 'admin') usersByRole.admins++
                })
            }

            // Calculate averages
            const totalChats = chatsResult.count || 0
            const totalMessages = messagesResult.count || 0
            const avgMessagesPerChat = totalChats > 0
                ? Math.round(totalMessages / totalChats)
                : 0

            setStats({
                users: {
                    total: usersResult.count || 0,
                    ...usersByRole
                },
                chats: {
                    total: totalChats,
                    active: activeChatsResult.count || 0,
                    avgMessages: avgMessagesPerChat
                },
                messages: {
                    total: totalMessages
                },
                posts: {
                    total: postsResult.count || 0
                },
                dateRange: { start, end }
            })
        } catch (err) {
            console.error('Error fetching analytics:', err)
            setError(err)
        } finally {
            setLoading(false)
        }
    }, [getDateRange])

    useEffect(() => {
        fetchStats()
    }, [fetchStats])

    return {
        stats,
        loading,
        error,
        refetch: fetchStats
    }
}

// Export date range options
export const DATE_RANGE_OPTIONS = [
    { value: 'today', label: 'Hôm nay' },
    { value: 'week', label: '7 ngày qua' },
    { value: 'month', label: '30 ngày qua' },
    { value: 'year', label: 'Năm qua' }
]
