/**
 * AI Triage System - Enhanced
 * Provides conversational support, detailed student assessment, 
 * suicide risk evaluation, and condition summaries
 */

const GEMINI_API_KEY = () => import.meta.env.VITE_GEMINI_API_KEY

// Urgency level configuration
export const URGENCY_LEVELS = {
    NORMAL: 0,
    ATTENTION: 1,
    URGENT: 2,
    CRITICAL: 3
}

export const URGENCY_CONFIG = {
    [URGENCY_LEVELS.NORMAL]: {
        label: 'Bình thường',
        description: 'Tham vấn thông thường, không có dấu hiệu lo ngại',
        color: 'green',
        bgColor: 'bg-green-100',
        textColor: 'text-green-700',
        borderColor: 'border-green-200',
        icon: '🟢'
    },
    [URGENCY_LEVELS.ATTENTION]: {
        label: 'Cần chú ý',
        description: 'Có một số khó khăn cần theo dõi',
        color: 'yellow',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-700',
        borderColor: 'border-yellow-200',
        icon: '🟡'
    },
    [URGENCY_LEVELS.URGENT]: {
        label: 'Khẩn cấp',
        description: 'Cần hỗ trợ sớm, có dấu hiệu căng thẳng đáng kể',
        color: 'orange',
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-700',
        borderColor: 'border-orange-200',
        icon: '🟠'
    },
    [URGENCY_LEVELS.CRITICAL]: {
        label: 'Rất khẩn cấp',
        description: 'Cần can thiệp ngay - có dấu hiệu tự gây hại',
        color: 'red',
        bgColor: 'bg-red-100',
        textColor: 'text-red-700',
        borderColor: 'border-red-200',
        icon: '🔴'
    }
}

// AI Personality and context
const AI_SYSTEM_CONTEXT = `Bạn là một chuyên gia tâm lý học đường thân thiện, đang hỗ trợ học sinh Trường THPT FPT Hà Nội trong khi chờ thầy cô tư vấn.

Thông tin về Trường THPT FPT Hà Nội:
- Tên đầy đủ: Trường Trung học Phổ thông FPT Hà Nội, thuộc Tổ chức Giáo dục FPT (FPT Education), trực thuộc Tập đoàn FPT.
- Địa chỉ: Khu Công nghệ cao Hòa Lạc, Km29 Đại lộ Thăng Long, huyện Thạch Thất, Hà Nội.
- Mô hình: Trường nội trú từ thứ 2 đến thứ 6, học sinh chỉ về nhà vào cuối tuần – học sinh sống tại 2 tòa ký túc xá ( Dom ) và học tập tại tòa nhà giảng đường ( Gamma ) trong khuôn viên trường.
- Chương trình học: Chương trình THPT quốc gia kết hợp đào tạo chuyên sâu về Công nghệ thông tin, tiếng Anh tăng cường, kỹ năng mềm và giáo dục STEM.
- Đặc trưng giáo dục: Học theo dự án (Project-Based Learning), khuyến khích sáng tạo, tư duy phản biện và tinh thần khởi nghiệp.
- Hoạt động ngoại khóa: Đa dạng câu lạc bộ (thể thao, nghệ thuật, lập trình, tình nguyện, v.v.), các sự kiện văn hóa, cuộc thi học thuật và hoạt động cộng đồng.
- Đời sống nội trú: Học sinh sống xa gia đình, ở ký túc xá có quản lý. Điều này có thể gây ra cảm giác nhớ nhà, áp lực tự lập hoặc khó khăn trong các mối quan hệ bạn bè cùng phòng/cùng lớp.
- Hỗ trợ tâm lý: Trường có bộ phận tư vấn tâm lý học đường để hỗ trợ sức khỏe tinh thần cho học sinh. Thêm vào đó là hệ thống S-Net được phát triển bởi 1 nhóm học sinh ( Nhóm CBKC ).

Nguyên tắc:
- Luôn thể hiện sự đồng cảm và lắng nghe
- Không đưa ra chẩn đoán y khoa
- Khuyến khích học sinh chia sẻ thêm
- Giữ cuộc trò chuyện trong vùng an toàn
- Nếu phát hiện dấu hiệu nguy hiểm (tự tử, tự gây hại), hãy khuyên nhủ học sinh tìm sự giúp đỡ ngay lập tức và cung cấp thông tin liên hệ khẩn cấp nếu cần
- Trả lời bằng tiếng Việt, thân thiện, không quá dài (2-4 câu)
- Tránh trả lời bằng các câu hỏi đóng, hãy khuyến khích chia sẻ hơn nữa
- Hãy trả lời một cách tự nhiên
- Xưng hô "Mình"-"Bạn", có thể linh hoạt xưng hô phù hợp với học sinh
- Hiểu rõ bối cảnh nội trú: học sinh có thể gặp vấn đề về nhớ nhà, áp lực học tập, mối quan hệ bạn bè, thích nghi cuộc sống tự lập, hoặc căng thẳng thi cử.
- Khi phù hợp, có thể gợi ý học sinh tham gia các hoạt động ngoại khóa, câu lạc bộ hoặc đặt lịch, tìm đến thầy cô tư vấn trực tiếp tại trường.

Bạn KHÔNG phải AI thông thường - bạn là "Tâm An", trợ lý tâm lý của S-Net.`

/**
 * Generate AI response to student message
 * Also provides real-time assessment
 */
export async function generateAIResponse(conversationHistory, studentMessage, priorAssessment = null) {
    const apiKey = GEMINI_API_KEY()

    if (!apiKey) {
        console.error('❌ VITE_GEMINI_API_KEY is not set!')
        return {
            response: 'Xin lỗi, tôi đang gặp sự cố kỹ thuật. Tư vấn viên sẽ sớm liên hệ với bạn! ❤️',
            assessment: null
        }
    }

    console.log('🔑 Gemini API Key found (length:', apiKey.length, ')')
    console.log('💬 Conversation history length:', conversationHistory.length)

    const conversationText = conversationHistory
        .map(msg => `${msg.isAI ? 'Tâm An' : 'Học sinh'}: ${msg.content}`)
        .join('\n')

    // Build prior assessment context if available (restored after page refresh)
    let priorContext = ''
    if (priorAssessment) {
        priorContext = `\n\nĐánh giá trước đó của bạn về học sinh này:
- Mức độ khẩn cấp: ${priorAssessment.urgencyLevel ?? 'chưa xác định'}
- Nguy cơ tự hại: ${priorAssessment.suicideRisk || 'không có'}
- Vấn đề chính: ${(priorAssessment.mainIssues || []).join(', ') || 'chưa xác định'}
- Trạng thái cảm xúc: ${priorAssessment.emotionalState || 'chưa xác định'}
- Tóm tắt: ${priorAssessment.summary || 'chưa có'}
Hãy tiếp tục cuộc trò chuyện dựa trên ngữ cảnh này.`
    }

    const prompt = `${AI_SYSTEM_CONTEXT}${priorContext}

Lịch sử cuộc trò chuyện:
${conversationText}

Học sinh vừa nói: "${studentMessage}"

Hãy:
1. Trả lời học sinh một cách đồng cảm và hỗ trợ
2. Đánh giá tình trạng học sinh

Trả lời theo JSON format:
{
  "response": "<câu trả lời cho học sinh, 2-4 câu, thân thiện>",
  "assessment": {
    "urgencyLevel": <0-3>,
    "suicideRisk": "<none/low/medium/high>",
    "mainIssues": ["<vấn đề 1>", "<vấn đề 2>"],
    "emotionalState": "<mô tả ngắn trạng thái cảm xúc>",
    "summary": "<mô tả tình trạng học sinh trong 1-2 câu cho tư vấn viên>"
  }
}

Mức độ khẩn cấp:
0 = Bình thường (tham vấn thông thường)
1 = Cần chú ý (có khó khăn nhẹ)
2 = Khẩn cấp (căng thẳng đáng kể, cần hỗ trợ sớm)
3 = Rất khẩn cấp (có dấu hiệu tự gây hại, cần can thiệp ngay)

Chỉ trả về JSON, không thêm text khác.`

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 500
                    },
                    safetySettings: [
                        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
                    ]
                })
            }
        )

        if (!response.ok) {
            const errorText = await response.text()
            console.error('❌ Gemini API error:', response.status, errorText)
            throw new Error(`API error: ${response.status} - ${errorText}`)
        }

        const data = await response.json()
        console.log('✅ Gemini API response received')
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

        if (!text) {
            console.warn('⚠️ Empty response from Gemini API')
        }

        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0])
            return {
                response: result.response || 'Cảm ơn bạn đã chia sẻ. Tư vấn viên sẽ sớm liên hệ với bạn.',
                assessment: {
                    urgencyLevel: Math.min(3, Math.max(0, parseInt(result.assessment?.urgencyLevel) || 0)),
                    suicideRisk: result.assessment?.suicideRisk || 'none',
                    mainIssues: result.assessment?.mainIssues || [],
                    emotionalState: result.assessment?.emotionalState || '',
                    summary: result.assessment?.summary || ''
                }
            }
        }

        return {
            response: 'Mình hiểu bạn đang trải qua nhiều điều. Bạn có thể chia sẻ thêm không?',
            assessment: null
        }
    } catch (error) {
        console.error('❌ AI response error:', error)
        return {
            response: 'Mình đang lắng nghe bạn. Tư vấn viên sẽ sớm liên hệ để hỗ trợ bạn tốt hơn nhé! ❤️',
            assessment: null
        }
    }
}

/**
 * Generate comprehensive student assessment for counselors
 */
export async function generateStudentAssessment(allMessages) {
    const apiKey = GEMINI_API_KEY()

    if (!apiKey || allMessages.length === 0) {
        return null
    }

    const conversationText = allMessages
        .filter(msg => !msg.is_system)
        .map(msg => `${msg.sender_id ? 'Học sinh' : 'AI'}: ${msg.content}`)
        .join('\n')

    const prompt = `Bạn là chuyên gia tâm lý học đường. Phân tích cuộc hội thoại sau và đưa ra đánh giá chi tiết cho tư vấn viên.

Cuộc hội thoại:
${conversationText}

Trả lời theo JSON format:
{
  "urgencyLevel": <0-3>,
  "suicideRisk": "<none/low/medium/high>",
  "riskFactors": ["<yếu tố nguy cơ 1>", "<yếu tố 2>"],
  "protectiveFactors": ["<yếu tố bảo vệ 1>", "<yếu tố 2>"],
  "mainIssues": ["<vấn đề chính 1>", "<vấn đề 2>"],
  "emotionalState": "<mô tả trạng thái cảm xúc>",
  "behavioralIndicators": ["<dấu hiệu hành vi 1>", "<dấu hiệu 2>"],
  "recommendedApproach": "<gợi ý cách tiếp cận cho tư vấn viên>",
  "summary": "<tóm tắt tình trạng học sinh trong 2-3 câu>",
  "priorityNote": "<ghi chú ưu tiên nếu khẩn cấp>"
}

Mức độ khẩn cấp:
0 = Bình thường - tham vấn thông thường
1 = Cần chú ý - có dấu hiệu khó khăn nhẹ
2 = Khẩn cấp - căng thẳng đáng kể, cần hỗ trợ trong 24h
3 = Rất khẩn cấp - có dấu hiệu tự gây hại/tự tử, cần can thiệp ngay

Đánh giá nguy cơ tự tử:
- none: Không có dấu hiệu
- low: Có suy nghĩ tiêu cực nhưng không có ý định cụ thể
- medium: Có suy nghĩ về việc tự gây hại, cần theo dõi sát
- high: Có kế hoạch hoặc ý định rõ ràng, CẦN CAN THIỆP NGAY

Chỉ trả về JSON.`

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.3,
                        maxOutputTokens: 800
                    },
                    safetySettings: [
                        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
                    ]
                })
            }
        )

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`)
        }

        const data = await response.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0])
        }

        return null
    } catch (error) {
        console.error('Assessment generation error:', error)
        return null
    }
}

/**
 * Check if AI should respond (counselor hasn't replied yet)
 */
export function shouldAIRespond(chatRoom) {
    if (!chatRoom) return false

    // AI stops responding once a counselor has replied
    if (chatRoom.counselor_first_reply_at) {
        return false
    }

    return true
}

/**
 * Get welcome message for new chat
 */
export function getWelcomeMessage() {
    return `Xin chào! 👋 Mình là Tâm An, trợ lý tâm lý của S-Net. 

Trong khi chờ tư vấn viên, mình sẵn sàng lắng nghe và hỗ trợ bạn. Bạn có chuyện gì muốn chia sẻ không? 💭`
}

/**
 * Get urgency config
 */
export function getUrgencyConfig(level) {
    return URGENCY_CONFIG[level] || URGENCY_CONFIG[0]
}

// Legacy exports for backward compatibility
export const URGENCY_DESCRIPTIONS = {
    0: 'Bình thường - Tham vấn thông thường',
    1: 'Cần chú ý - Có dấu hiệu khó khăn',
    2: 'Khẩn cấp - Cần hỗ trợ sớm',
    3: 'Rất khẩn cấp - Cần can thiệp ngay'
}

export async function analyzeUrgency(studentMessages) {
    const result = await generateStudentAssessment(
        studentMessages.map(content => ({ content, sender_id: 'student' }))
    )
    return {
        urgencyLevel: result?.urgencyLevel || 0,
        reasoning: result?.summary || ''
    }
}

export async function analyzeAppointmentUrgency(issuesText) {
    return analyzeUrgency([issuesText])
}