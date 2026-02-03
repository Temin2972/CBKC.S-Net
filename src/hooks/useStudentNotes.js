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
            const { data, error } = await supabase
                .from('student_notes')
                .select(`
          *,
          updater:users!student_notes_updated_by_fkey(id, full_name)
        `)
                .eq('student_id', studentId)
                .single()

            if (error && error.code === 'PGRST116') {
                // No notes exist yet, that's okay
                setNotes({ content: '', student_id: studentId })
            } else if (error) {
                throw error
            } else {
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

        // Subscribe to changes
        const channel = supabase
            .channel(`notes-${studentId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'student_notes',
                filter: `student_id=eq.${studentId}`
            }, () => {
                fetchNotes()
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
                .single()

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
                // Create new
                const { error } = await supabase
                    .from('student_notes')
                    .insert({
                        student_id: studentId,
                        content,
                        updated_by: counselorId
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
        saveNotes,
        refetch: fetchNotes
    }
}
