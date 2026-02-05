/**
 * useAITriage Hook - Enhanced
 * Manages AI conversation with students and real-time assessment
 */
import { useState, useCallback, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import {
    generateAIResponse,
    generateStudentAssessment,
    shouldAIRespond,
    getWelcomeMessage,
    getUrgencyConfig
} from '../lib/aiTriage'

export function useAITriage(chatRoomId, chatRoom) {
    const [isProcessing, setIsProcessing] = useState(false)
    const [assessment, setAssessment] = useState(null)
    const conversationHistoryRef = useRef([])
    const hasInitializedRef = useRef(false)

    /**
     * Send AI message to chat
     */
    const sendAIMessage = useCallback(async (content, assessmentData = null) => {
        try {
            // Format AI message with marker (metadata column doesn't exist in DB)
            const aiContent = `🤖 **Tâm An:** ${content}`
            
            const messageData = {
                chat_room_id: chatRoomId,
                sender_id: null, // NULL indicates system/AI message
                content: aiContent,
                is_system: true
            }

            await supabase.from('chat_messages').insert(messageData)

            // Track in conversation history
            conversationHistoryRef.current.push({
                content,
                isAI: true
            })
        } catch (error) {
            console.error('Error sending AI message:', error)
        }
    }, [chatRoomId])

    /**
     * Update chat room with assessment data
     */
    const updateChatRoomAssessment = useCallback(async (assessmentData) => {
        if (!assessmentData || !chatRoomId) return

        try {
            await supabase
                .from('chat_rooms')
                .update({
                    urgency_level: assessmentData.urgencyLevel,
                    ai_assessment: assessmentData,
                    ai_triage_complete: assessmentData.urgencyLevel >= 0
                })
                .eq('id', chatRoomId)

            setAssessment(assessmentData)
        } catch (error) {
            console.error('Error updating chat room assessment:', error)
        }
    }, [chatRoomId])

    /**
     * Initialize AI conversation when chat room is created
     */
    const initializeTriage = useCallback(async () => {
        if (!chatRoom || hasInitializedRef.current) return
        if (chatRoom.counselor_first_reply_at) return

        hasInitializedRef.current = true
        setIsProcessing(true)

        // Send welcome message
        await sendAIMessage(getWelcomeMessage())

        setIsProcessing(false)
    }, [chatRoom, sendAIMessage])

    /**
     * Process student message and generate AI response
     */
    const processStudentMessage = useCallback(async (messageContent) => {
        if (!chatRoom || !shouldAIRespond(chatRoom)) {
            return
        }

        // Add to conversation history
        conversationHistoryRef.current.push({
            content: messageContent,
            isAI: false
        })

        setIsProcessing(true)

        try {
            // Generate AI response with assessment
            const { response, assessment: newAssessment } = await generateAIResponse(
                conversationHistoryRef.current,
                messageContent
            )

            // Send AI response
            await sendAIMessage(response, newAssessment)

            // Update chat room if we have assessment data
            if (newAssessment) {
                await updateChatRoomAssessment(newAssessment)

                // If high urgency, generate full assessment
                if (newAssessment.urgencyLevel >= 2 || newAssessment.suicideRisk !== 'none') {
                    // Notify about urgency
                    if (newAssessment.suicideRisk === 'high') {
                        setTimeout(async () => {
                            await sendAIMessage(
                                '⚠️ Mình hiểu bạn đang trải qua thời điểm rất khó khăn. Tư vấn viên sẽ liên hệ với bạn ngay lập tức. Trong lúc chờ đợi, hãy nhớ rằng bạn không đơn độc và việc tìm kiếm sự giúp đỡ là điều rất dũng cảm. ❤️'
                            )
                        }, 1000)
                    }
                }
            }
        } catch (error) {
            console.error('Error processing student message:', error)
        }

        setIsProcessing(false)
    }, [chatRoom, sendAIMessage, updateChatRoomAssessment])

    /**
     * Refresh full assessment (for counselors)
     */
    const refreshAssessment = useCallback(async (messages) => {
        if (!messages || messages.length === 0) return

        const fullAssessment = await generateStudentAssessment(messages)
        if (fullAssessment) {
            await updateChatRoomAssessment(fullAssessment)
        }
        return fullAssessment
    }, [updateChatRoomAssessment])

    /**
     * Check if a message is from AI
     */
    const isAIMessage = (message) => {
        return message.is_system && (
            message.sender_id === null ||
            message.content?.includes('🤖') ||
            message.content?.includes('Tâm An')
        )
    }

    /**
     * Get AI sender name
     */
    const getAISenderName = () => 'Tâm An'

    return {
        // Actions
        initializeTriage,
        processStudentMessage,
        refreshAssessment,

        // State
        isProcessing,
        assessment,

        // Helpers
        isAIMessage,
        getAISenderName,
        shouldAIRespond: shouldAIRespond(chatRoom || {}),
        getUrgencyConfig
    }
}

export default useAITriage
