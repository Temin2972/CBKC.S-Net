/**
 * useCounselorAvailability Hook
 * Manages counselor online status and schedule
 */
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

// Status constants
export const AVAILABILITY_STATUS = {
    ONLINE: 'online',
    BUSY: 'busy',
    AWAY: 'away',
    OFFLINE: 'offline'
}

export const STATUS_CONFIG = {
    [AVAILABILITY_STATUS.ONLINE]: {
        label: 'Trực tuyến',
        color: 'green',
        icon: '🟢'
    },
    [AVAILABILITY_STATUS.BUSY]: {
        label: 'Đang bận',
        color: 'yellow',
        icon: '🟡'
    },
    [AVAILABILITY_STATUS.AWAY]: {
        label: 'Vắng mặt',
        color: 'orange',
        icon: '🟠'
    },
    [AVAILABILITY_STATUS.OFFLINE]: {
        label: 'Ngoại tuyến',
        color: 'gray',
        icon: '⚪'
    }
}

// Days of the week in Vietnamese
export const WEEK_DAYS = {
    monday: 'Thứ 2',
    tuesday: 'Thứ 3',
    wednesday: 'Thứ 4',
    thursday: 'Thứ 5',
    friday: 'Thứ 6',
    saturday: 'Thứ 7',
    sunday: 'Chủ nhật'
}

export function useCounselorAvailability(counselorId) {
    const [availability, setAvailability] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchAvailability = useCallback(async () => {
        if (!counselorId) {
            setLoading(false)
            return
        }

        try {
            const { data, error } = await supabase
                .from('counselor_availability')
                .select('*')
                .eq('counselor_id', counselorId)
                .single()

            if (error && error.code === 'PGRST116') {
                // No record exists, create default one
                const { data: newData, error: createError } = await supabase
                    .from('counselor_availability')
                    .insert({
                        counselor_id: counselorId,
                        status: AVAILABILITY_STATUS.OFFLINE,
                        weekly_schedule: getDefaultSchedule()
                    })
                    .select()
                    .single()

                if (createError) throw createError
                setAvailability(newData)
            } else if (error) {
                throw error
            } else {
                setAvailability(data)
            }
        } catch (err) {
            console.error('Error fetching availability:', err)
            setError(err)
        } finally {
            setLoading(false)
        }
    }, [counselorId])

    // Subscribe to realtime updates
    useEffect(() => {
        fetchAvailability()

        const channel = supabase
            .channel(`availability-${counselorId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'counselor_availability',
                filter: `counselor_id=eq.${counselorId}`
            }, () => {
                fetchAvailability()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [counselorId, fetchAvailability])

    /**
     * Update online status
     */
    const setStatus = async (status, message = '') => {
        try {
            const { error } = await supabase
                .from('counselor_availability')
                .update({
                    status,
                    status_message: message || null
                })
                .eq('counselor_id', counselorId)

            if (error) throw error

            // Update local state immediately
            setAvailability(prev => ({ ...prev, status, status_message: message }))
            return { error: null }
        } catch (err) {
            console.error('Error updating status:', err)
            return { error: err }
        }
    }

    /**
     * Update weekly schedule
     */
    const updateSchedule = async (schedule) => {
        try {
            const { error } = await supabase
                .from('counselor_availability')
                .update({ weekly_schedule: schedule })
                .eq('counselor_id', counselorId)

            if (error) throw error

            setAvailability(prev => ({ ...prev, weekly_schedule: schedule }))
            return { error: null }
        } catch (err) {
            console.error('Error updating schedule:', err)
            return { error: err }
        }
    }

    /**
     * Update max concurrent chats
     */
    const setMaxChats = async (maxChats) => {
        try {
            const { error } = await supabase
                .from('counselor_availability')
                .update({ max_concurrent_chats: maxChats })
                .eq('counselor_id', counselorId)

            if (error) throw error
            return { error: null }
        } catch (err) {
            return { error: err }
        }
    }

    /**
     * Toggle online/offline quickly
     */
    const toggleOnline = async () => {
        const newStatus = availability?.status === AVAILABILITY_STATUS.ONLINE
            ? AVAILABILITY_STATUS.OFFLINE
            : AVAILABILITY_STATUS.ONLINE
        return setStatus(newStatus)
    }

    /**
     * Get all available counselors
     */
    const getAvailableCounselors = async () => {
        try {
            const { data, error } = await supabase
                .rpc('get_available_counselors')

            if (error) {
                // Fallback to simple query if RPC not available
                const { data: fallbackData, error: fallbackError } = await supabase
                    .from('counselor_availability')
                    .select(`
            *,
            counselor:users!counselor_availability_counselor_id_fkey(id, full_name)
          `)
                    .in('status', ['online', 'busy'])

                if (fallbackError) throw fallbackError
                return { data: fallbackData, error: null }
            }

            return { data, error: null }
        } catch (err) {
            return { data: [], error: err }
        }
    }

    return {
        availability,
        loading,
        error,
        status: availability?.status || AVAILABILITY_STATUS.OFFLINE,
        statusConfig: STATUS_CONFIG[availability?.status] || STATUS_CONFIG[AVAILABILITY_STATUS.OFFLINE],
        schedule: availability?.weekly_schedule || {},
        isOnline: availability?.status === AVAILABILITY_STATUS.ONLINE,
        isBusy: availability?.status === AVAILABILITY_STATUS.BUSY,
        currentChatCount: availability?.current_chat_count || 0,
        maxChats: availability?.max_concurrent_chats || 5,
        setStatus,
        updateSchedule,
        setMaxChats,
        toggleOnline,
        getAvailableCounselors,
        refetch: fetchAvailability,
        AVAILABILITY_STATUS,
        STATUS_CONFIG,
        WEEK_DAYS
    }
}

// Default schedule helper
function getDefaultSchedule() {
    return {
        monday: [{ start: '08:00', end: '17:00' }],
        tuesday: [{ start: '08:00', end: '17:00' }],
        wednesday: [{ start: '08:00', end: '17:00' }],
        thursday: [{ start: '08:00', end: '17:00' }],
        friday: [{ start: '08:00', end: '17:00' }],
        saturday: [],
        sunday: []
    }
}
