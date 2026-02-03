/**
 * useContentAppeals Hook
 * Manages content appeal submissions and reviews
 */
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { createNotification } from './useNotifications'

// Appeal status constants
export const APPEAL_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected'
}

export function useContentAppeals(userId, userRole) {
    const [appeals, setAppeals] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const isStaff = userRole === 'counselor' || userRole === 'admin'

    // Fetch appeals based on role
    const fetchAppeals = useCallback(async () => {
        if (!userId) return

        setLoading(true)
        try {
            let query = supabase
                .from('content_appeals')
                .select(`
          *,
          user:users!content_appeals_user_id_fkey(id, full_name),
          reviewer:users!content_appeals_reviewed_by_fkey(id, full_name)
        `)
                .order('created_at', { ascending: false })

            // Staff sees all, users see their own
            if (!isStaff) {
                query = query.eq('user_id', userId)
            }

            const { data, error } = await query

            if (error) throw error
            setAppeals(data || [])
        } catch (err) {
            console.error('Error fetching appeals:', err)
            setError(err)
        } finally {
            setLoading(false)
        }
    }, [userId, isStaff])

    useEffect(() => {
        fetchAppeals()

        // Subscribe to changes
        const channel = supabase
            .channel(`appeals-${userId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'content_appeals'
            }, () => {
                fetchAppeals()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [userId, fetchAppeals])

    /**
     * Submit a new appeal
     */
    const submitAppeal = async (contentType, contentId, originalContent, reason) => {
        try {
            // Check if appeal already exists
            const { data: existing } = await supabase
                .from('content_appeals')
                .select('id')
                .eq('content_type', contentType)
                .eq('content_id', contentId)
                .eq('user_id', userId)
                .single()

            if (existing) {
                return { error: new Error('Bạn đã gửi yêu cầu xem xét lại cho nội dung này') }
            }

            const { data, error } = await supabase
                .from('content_appeals')
                .insert({
                    content_type: contentType,
                    content_id: contentId,
                    original_content: originalContent,
                    user_id: userId,
                    reason: reason,
                    status: APPEAL_STATUS.PENDING
                })
                .select()
                .single()

            if (error) throw error

            // Notify staff about new appeal
            const { data: staff } = await supabase
                .from('users')
                .select('id')
                .in('role', ['counselor', 'admin'])

            if (staff) {
                for (const member of staff) {
                    await createNotification(
                        member.id,
                        'content_appeal',
                        '📝 Yêu cầu xem xét lại nội dung',
                        'Có người dùng yêu cầu xem xét lại nội dung bị từ chối.',
                        '/admin/appeals',
                        { appeal_id: data.id }
                    )
                }
            }

            fetchAppeals()
            return { data, error: null }
        } catch (err) {
            console.error('Error submitting appeal:', err)
            return { error: err }
        }
    }

    /**
     * Review an appeal (staff only)
     */
    const reviewAppeal = async (appealId, approved, notes = '') => {
        if (!isStaff) {
            return { error: new Error('Không có quyền thực hiện') }
        }

        try {
            const { data: appeal, error: fetchError } = await supabase
                .from('content_appeals')
                .select('*')
                .eq('id', appealId)
                .single()

            if (fetchError) throw fetchError

            // Update appeal status
            const { error: updateError } = await supabase
                .from('content_appeals')
                .update({
                    status: approved ? APPEAL_STATUS.APPROVED : APPEAL_STATUS.REJECTED,
                    reviewed_by: userId,
                    reviewed_at: new Date().toISOString(),
                    review_notes: notes
                })
                .eq('id', appealId)

            if (updateError) throw updateError

            // If approved, handle content restoration
            if (approved && appeal.content_type === 'pending') {
                // Move from pending to approved posts
                const { data: pendingContent } = await supabase
                    .from('pending_content')
                    .select('*')
                    .eq('id', appeal.content_id)
                    .single()

                if (pendingContent) {
                    // Create approved post
                    await supabase
                        .from('posts')
                        .insert({
                            author_id: pendingContent.author_id,
                            content: pendingContent.content,
                            image_url: pendingContent.image_url,
                            is_anonymous: pendingContent.is_anonymous,
                            status: 'approved'
                        })

                    // Delete from pending
                    await supabase
                        .from('pending_content')
                        .delete()
                        .eq('id', appeal.content_id)
                }
            }

            // Notify the user about the decision
            await createNotification(
                appeal.user_id,
                'appeal_decision',
                approved ? '✅ Yêu cầu xem xét đã được chấp nhận' : '❌ Yêu cầu xem xét bị từ chối',
                approved
                    ? 'Nội dung của bạn đã được xem xét lại và chấp nhận đăng.'
                    : `Yêu cầu xem xét của bạn đã bị từ chối.${notes ? ` Lý do: ${notes}` : ''}`,
                '/community',
                { appeal_id: appealId, approved }
            )

            fetchAppeals()
            return { error: null }
        } catch (err) {
            console.error('Error reviewing appeal:', err)
            return { error: err }
        }
    }

    /**
     * Get pending appeals count (for staff badge)
     */
    const getPendingCount = () => {
        return appeals.filter(a => a.status === APPEAL_STATUS.PENDING).length
    }

    return {
        appeals,
        loading,
        error,
        submitAppeal,
        reviewAppeal,
        getPendingCount,
        refetch: fetchAppeals,
        APPEAL_STATUS
    }
}
