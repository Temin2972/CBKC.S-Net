/**
 * useStudentNotes Hook
 * Manages counselor notes for students
 */
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useStudentNotes(studentId) {
    const [notes, setNotes] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)

    const fetchNotes = useCallback(async () => {
        if (!studentId) {
            setLoading(false)
            return
        }

        try {
            // First fetch the notes (use maybeSingle to avoid 406 error when no record exists)
            const { data, error } = await supabase
                .from('student_notes')
                .select('*')
                .eq('student_id', studentId)
                .maybeSingle()

            if (error) {
                throw error
            } else if (!data) {
                // No notes exist yet, that's okay
                setNotes({ content: '', student_id: studentId })
            } else {
                // If there's an updated_by, fetch the user name separately
                if (data.updated_by) {
                    const { data: userData } = await supabase
                        .from('users')
                        .select('id, full_name')
                        .eq('id', data.updated_by)
                        .maybeSingle()
                    
                    data.updater = userData
                }
                setNotes(data)
            }
        } catch (err) {
            console.error('Error fetching notes:', err)
            setError(err)
        } finally {
            setLoading(false)
        }
    }, [studentId])

    useEffect(() => {
        fetchNotes()

        // Subscribe to changes (filter client-side to avoid binding mismatch)
        const channel = supabase
            .channel(`notes-${studentId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'student_notes'
            }, (payload) => {
                // Filter client-side
                const record = payload.new || payload.old
                if (record?.student_id === studentId) {
                    fetchNotes()
                }
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [studentId, fetchNotes])

    /**
     * Save notes
     */
    const saveNotes = async (content, counselorId) => {
        setSaving(true)
        setError(null)

        try {
            const { data: existing } = await supabase
                .from('student_notes')
                .select('id')
                .eq('student_id', studentId)
                .maybeSingle()

            if (existing) {
                // Update existing
                const { error } = await supabase
                    .from('student_notes')
                    .update({
                        content,
                        updated_by: counselorId
                    })
                    .eq('student_id', studentId)

                if (error) throw error
            } else {
                // Create new using upsert to handle race conditions
                const { error } = await supabase
                    .from('student_notes')
                    .upsert({
                        student_id: studentId,
                        content,
                        updated_by: counselorId
                    }, {
                        onConflict: 'student_id'
                    })

                if (error) throw error
            }

            // Update local state
            setNotes(prev => ({
                ...prev,
                content,
                updated_by: counselorId,
                updated_at: new Date().toISOString()
            }))

            return { error: null }
        } catch (err) {
            console.error('Error saving notes:', err)
            setError(err)
            return { error: err }
        } finally {
            setSaving(false)
        }
    }

    return {
        notes,
        content: notes?.content || '',
        loading,
        saving,
        error,
        lastUpdatedBy: notes?.updater?.full_name,
        lastUpdatedAt: notes?.updated_at,
        isAIGenerated: !notes?.updated_by && !!notes?.content, // AI-generated if has content but no updated_by
        saveNotes,
        refetch: fetchNotes
    }
}
