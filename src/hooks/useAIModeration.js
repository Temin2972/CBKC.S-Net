import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'

export function useAIModeration() {
  const [checking, setChecking] = useState(false)

  const analyzeContent = async (content, userId, contentType = 'post', contentId = null) => {
    if (!content || !content.trim()) {
      return { allowed: true, severity: null, reason: null }
    }

    setChecking(true)

    try {
      // Call Gemini API
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a mental health content moderator for a Vietnamese school counseling platform. Analyze this content for concerning language.

Content: "${content}"

Categorize into ONE of these levels:
1. BLOCK - Contains aggressive, violent, hateful, or harmful language toward others
2. HIGH - Contains suicide ideation, self-harm intent, or severe depression requiring immediate attention
3. MEDIUM - Contains mild depression, sadness, or distress but no immediate danger
4. SAFE - Normal content, no concerns

Respond in this EXACT JSON format:
{
  "level": "BLOCK|HIGH|MEDIUM|SAFE",
  "reason": "Brief explanation in Vietnamese (max 100 characters)",
  "confidence": 0-100
}

Only respond with the JSON, nothing else.`
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            topK: 1,
            topP: 1,
            maxOutputTokens: 200,
          }
        })
      })

      if (!response.ok) {
        console.error('Gemini API error:', response.statusText)
        // If API fails, allow content but log error
        return { allowed: true, severity: null, reason: 'API Error' }
      }

      const data = await response.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text

      if (!text) {
        return { allowed: true, severity: null, reason: 'No response' }
      }

      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        return { allowed: true, severity: null, reason: 'Parse error' }
      }

      const analysis = JSON.parse(jsonMatch[0])
      
      console.log('AI Analysis:', analysis)

      // Handle different levels
      if (analysis.level === 'BLOCK') {
        // Aggressive/harmful content - REJECT
        return {
          allowed: false,
          severity: 'blocked',
          reason: analysis.reason || 'Nội dung chứa ngôn từ không phù hợp',
          shouldFlag: false
        }
      } else if (analysis.level === 'HIGH') {
        // Severe depression/suicide - REJECT + FLAG HIGH
        await flagUser(userId, contentType, contentId || 'draft', content, 'high', analysis.reason)
        return {
          allowed: false,
          severity: 'high',
          reason: analysis.reason || 'Nội dung cho thấy dấu hiệu cần hỗ trợ khẩn cấp',
          shouldFlag: true,
          flagLevel: 'high'
        }
      } else if (analysis.level === 'MEDIUM') {
        // Mild depression - ACCEPT + FLAG MEDIUM
        await flagUser(userId, contentType, contentId || 'pending', content, 'medium', analysis.reason)
        return {
          allowed: true,
          severity: 'medium',
          reason: analysis.reason,
          shouldFlag: true,
          flagLevel: 'medium'
        }
      } else {
        // SAFE - Allow
        return {
          allowed: true,
          severity: null,
          reason: null,
          shouldFlag: false
        }
      }

    } catch (error) {
      console.error('AI Moderation error:', error)
      // On error, allow content to avoid blocking users unfairly
      return { allowed: true, severity: null, reason: 'Error occurred' }
    } finally {
      setChecking(false)
    }
  }

  const flagUser = async (userId, contentType, contentId, contentText, severity, reason) => {
    try {
      const { error } = await supabase
        .from('flagged_users')
        .insert({
          user_id: userId,
          content_type: contentType,
          content_id: contentId,
          content_text: contentText,
          severity: severity,
          ai_reason: reason
        })

      if (error) throw error

      // Update user's flag status
      await supabase
        .from('users')
        .update({ has_active_flags: true })
        .eq('id', userId)

      console.log('User flagged successfully:', userId, severity)
    } catch (error) {
      console.error('Error flagging user:', error)
    }
  }

  return { analyzeContent, checking }
}
