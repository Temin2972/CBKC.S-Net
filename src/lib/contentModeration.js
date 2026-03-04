// Content Moderation using Ollama Cloud API

import { ollamaChat } from './ollamaClient'

// Confidence threshold - below this, content goes to pending review
const CONFIDENCE_THRESHOLD = 0.7

// Flag levels
export const FLAG_LEVELS = {
  NORMAL: 0,        // No issues detected
  MILD: 1,          // Mild negative language - post allowed but flagged
  IMMEDIATE: 2,     // Suicide/self-harm/depression - needs immediate attention
  BLOCKED: 3,       // Aggressive/violent/spam - auto-blocked
  PENDING: 4        // API unavailable or low confidence - pending counselor review
}

// Moderation result types
export const MODERATION_ACTIONS = {
  ALLOW: 'allow',           // Content is fine, post normally
  FLAG_MILD: 'flag_mild',   // Post but flag for review
  REJECT: 'reject',         // Don't post, notify counselors, suggest chat
  BLOCK: 'block',           // Don't post, content is aggressive/harmful/spam
  PENDING: 'pending'        // API down or low confidence - hold for counselor review
}

const MODERATION_PROMPT = `You are a content moderation AI for a mental health support platform for Vietnamese students. Analyze the following content and categorize it.

=== CRITICAL: VIETNAMESE TEENAGER SLANG ===
Pay SPECIAL ATTENTION to Vietnamese teenager slang and profanity, including but not limited to:
- "dm", "đm", "d.m", "đ.m", "đ m" = "địt mẹ" (extremely vulgar, mother insult)
- "dcm", "đcm", "d.c.m" = "địt con mẹ" (extremely vulgar)
- "dkm", "đkm", "d.k.m" = variant of above
- "dkmm", "đkmm" = "địt kẻ mày mẹ" (extremely vulgar)
- "dcmm", "đcmm" = variant of above
- "vl", "vãi lồn", "vailol", "v.l" = vulgar exclamation
- "cl", "c.l", "cái lồn" = vulgar female anatomy
- "cc", "c.c", "cặc" = vulgar male anatomy
- "đéo", "deo", "đéo", "đếu" = vulgar "no"
- "vcl", "v.c.l" = "vãi cái lồn"
- "clm" = vulgar phrase
- "đĩ", "di", "đ.ĩ" = prostitute insult
- "ngu", "ngu vl", "ngu vcl" = stupid (offensive when used aggressively)
- "óc chó", "oc cho" = dog brain (insult)
- "thằng", "con" + insults = personal attacks
- "mày", "tao" in aggressive context
- Any creative spellings/spacing to bypass filters (d.m, đ-m, đ_m, etc.)

Also detect SPAM patterns:
- Repeated characters/words (aaaaaaa, hahahahaha excessively)
- Promotional/advertising content
- Links to external sites (unless clearly helpful)
- Nonsensical random text
- Copy-paste spam
- Excessive emoji spam
- All caps shouting

IMPORTANT: Respond ONLY with a valid JSON object, no other text.

Categories:
1. "safe" - Normal content, no concerns
2. "mild_negative" - Mild negative emotions, sadness, stress, frustration (but not dangerous)
3. "severe_distress" - Severe emotional distress, hopelessness, but no explicit self-harm
4. "depression" - Clear signs of depression, persistent sadness, loss of interest
5. "self_harm" - Mentions of self-harm, cutting, hurting oneself
6. "suicide" - Suicidal ideation, thoughts of ending life, wanting to die
7. "aggressive" - Violent intentions, threats, bullying, hate speech, harmful to others
8. "profanity" - Contains Vietnamese slang/profanity (dm, dcm, vl, etc.) or offensive language
9. "spam" - Spam, advertising, repetitive content
{MEANINGLESS_CATEGORY}


Response format (KEEP IT SHORT - reasoning must be under 15 words):
{"category":"one of the categories above","confidence":0.0 to 1.0,"reasoning":"very short Vietnamese explanation, max 15 words","keywords_detected":["list"]}

IMPORTANT NOTES:
- Be STRICT with Vietnamese slang - even subtle variations should be caught
- If you're not confident (< 70%), still provide your best guess but with low confidence
- Spam and profanity should be blocked
- Creative spellings of profanity (d.m, d m, đ-m) should still be detected
{MEANINGLESS_NOTE}

Content to analyze:
"""
{CONTENT}
"""

Remember: Only output the JSON object, nothing else.`

/**
 * Analyze content using Ollama API
 * @param {string} content - The text content to analyze
 * @param {'post'|'comment'} [contentType='post'] - Type of content being analyzed
 * @returns {Promise<{action: string, flagLevel: number, category: string, reasoning: string, keywords: string[]}>}
 */
export async function analyzeContent(content, contentType = 'post') {
  // Result when API fails - content goes to pending review
  const pendingResult = {
    action: MODERATION_ACTIONS.PENDING,
    flagLevel: FLAG_LEVELS.PENDING,
    category: 'pending',
    reasoning: 'API unavailable - pending counselor review',
    keywords: [],
    confidence: 0
  }

  if (!content || content.trim().length === 0) {
    return {
      action: MODERATION_ACTIONS.ALLOW,
      flagLevel: FLAG_LEVELS.NORMAL,
      category: 'safe',
      reasoning: 'Empty content',
      keywords: [],
      confidence: 1
    }
  }

  // Pre-check for obvious Vietnamese slang (quick filter before API call)
  const quickSlangCheck = detectVietnameseSlang(content)
  if (quickSlangCheck.detected) {
    console.log('⚠️ Quick slang detection:', quickSlangCheck.keywords)
    return {
      action: MODERATION_ACTIONS.BLOCK,
      flagLevel: FLAG_LEVELS.BLOCKED,
      category: 'profanity',
      reasoning: 'Phát hiện ngôn ngữ tục tĩu: ' + quickSlangCheck.keywords.join(', '),
      keywords: quickSlangCheck.keywords,
      confidence: 0.95
    }
  }

  // Pre-check for obvious spam patterns
  const quickSpamCheck = detectSpamPatterns(content)
  if (quickSpamCheck.detected) {
    console.log('⚠️ Quick spam detection:', quickSpamCheck.reason)
    return {
      action: MODERATION_ACTIONS.BLOCK,
      flagLevel: FLAG_LEVELS.BLOCKED,
      category: 'spam',
      reasoning: quickSpamCheck.reason,
      keywords: [],
      confidence: 0.9
    }
  }

  try {
    console.log('🔍 Analyzing content with Ollama API...')
    
    // Build prompt - include meaningless detection only for posts
    const meaninglessCategory = contentType === 'post'
      ? '10. "meaningless" - The words are real/proper words but together they form no coherent meaning, story, message, or intent. Random words thrown together, disconnected phrases that make no sense as a post, or content that a reader cannot understand or derive any meaning from.'
      : ''
    const meaninglessNote = contentType === 'post'
      ? '- For posts: if the content uses real words but they do NOT form any coherent message, story, or meaning together, categorize as "meaningless". A post should communicate something understandable to readers.'
      : ''
    
    const prompt = MODERATION_PROMPT
      .replace('{MEANINGLESS_CATEGORY}', meaninglessCategory)
      .replace('{MEANINGLESS_NOTE}', meaninglessNote)
      .replace('{CONTENT}', content)

    const textResponse = await ollamaChat({
      messages: [
        { role: 'system', content: 'You are a content moderation AI. Respond only with valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      maxTokens: 1024,
      format: {
        type: 'object',
        properties: {
          category: { type: 'string' },
          confidence: { type: 'number' },
          reasoning: { type: 'string' },
          keywords_detected: { type: 'array', items: { type: 'string' } }
        },
        required: ['category', 'confidence', 'reasoning', 'keywords_detected']
      }
    })

    console.log('✅ API Response received')

    const analysis = JSON.parse(textResponse)
    console.log('✅ Content analysis result:', analysis)
    
    // Check confidence - if too low, send to pending review
    if (analysis.confidence < CONFIDENCE_THRESHOLD && analysis.category !== 'safe') {
      console.log(`⚠️ Low confidence (${analysis.confidence}) - sending to pending review`)
      return {
        action: MODERATION_ACTIONS.PENDING,
        flagLevel: FLAG_LEVELS.PENDING,
        category: analysis.category,
        reasoning: `Độ tin cậy thấp (${Math.round(analysis.confidence * 100)}%) - cần tư vấn viên xem xét. AI phân tích: ${analysis.reasoning}`,
        keywords: analysis.keywords_detected || [],
        confidence: analysis.confidence
      }
    }
    
    // Map category to action and flag level
    return mapCategoryToAction(analysis)

  } catch (error) {
    console.error('❌ Content moderation error:', error)
    return pendingResult
  }
}



/**
 * Quick detection of Vietnamese slang/profanity (before API call)
 */
function detectVietnameseSlang(content) {
  const normalized = content.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics for matching
    .replace(/đ/g, 'd')
    .replace(/[._\-\s]+/g, '') // Remove separators used to bypass filters
  
  const originalLower = content.toLowerCase()
  
  // Patterns to detect (both with and without diacritics)
  const slangPatterns = [
    // Core profanity
    { pattern: /d[iị]t\s*m[eẹ]/gi, word: 'địt mẹ' },
    { pattern: /\bdm\b/gi, word: 'dm' },
    { pattern: /\bd\.m\b/gi, word: 'd.m' },
    { pattern: /\bd\sm\b/gi, word: 'd m' },
    { pattern: /\bđm\b/gi, word: 'đm' },
    { pattern: /\bđ\.m\b/gi, word: 'đ.m' },
    { pattern: /\bdcm\b/gi, word: 'dcm' },
    { pattern: /\bđcm\b/gi, word: 'đcm' },
    { pattern: /\bd\.c\.m\b/gi, word: 'd.c.m' },
    { pattern: /\bdkm\b/gi, word: 'dkm' },
    { pattern: /\bđkm\b/gi, word: 'đkm' },
    { pattern: /\bdkmm\b/gi, word: 'dkmm' },
    { pattern: /\bđkmm\b/gi, word: 'đkmm' },
    { pattern: /\bdcmm\b/gi, word: 'dcmm' },
    { pattern: /\bđcmm\b/gi, word: 'đcmm' },
    
    // Other vulgar terms
    { pattern: /\bvl\b/gi, word: 'vl' },
    { pattern: /\bv\.l\b/gi, word: 'v.l' },
    { pattern: /v[aã]i\s*l[oồ][nln]/gi, word: 'vãi lồn' },
    { pattern: /\bvcl\b/gi, word: 'vcl' },
    { pattern: /\bv\.c\.l\b/gi, word: 'v.c.l' },
    { pattern: /\bcl\b/gi, word: 'cl' },
    { pattern: /\bc\.l\b/gi, word: 'c.l' },
    { pattern: /c[aá]i\s*l[oồ][nln]/gi, word: 'cái lồn' },
    { pattern: /\bcc\b/gi, word: 'cc' },
    { pattern: /\bc\.c\b/gi, word: 'c.c' },
    { pattern: /\bc[aặ][ck]\b/gi, word: 'cặc' },
    { pattern: /\bclm\b/gi, word: 'clm' },
    
    // Insults
    { pattern: /\bđ[iĩ]\b/gi, word: 'đĩ' },
    { pattern: /con\s*đ[iĩ]/gi, word: 'con đĩ' },
    { pattern: /[oó]c\s*ch[oó]/gi, word: 'óc chó' },
    
    // "đéo" variants
    { pattern: /\bđ[eé]o\b/gi, word: 'đéo' },
    { pattern: /\bdeo\b/gi, word: 'đéo' },
    { pattern: /\bđ[eế]u\b/gi, word: 'đếu' },
  ]
  
  const detectedKeywords = []
  
  for (const { pattern, word } of slangPatterns) {
    if (pattern.test(originalLower) || pattern.test(normalized)) {
      if (!detectedKeywords.includes(word)) {
        detectedKeywords.push(word)
      }
    }
  }
  
  // Additional check on normalized text for creative spellings
  const normalizedPatterns = [
    'ditme', 'dcm', 'dkm', 'dkmm', 'dcmm',
    'vailon', 'vcl', 'cailon', 'cac', 'lon'
  ]
  
  for (const p of normalizedPatterns) {
    if (normalized.includes(p) && !detectedKeywords.some(k => k.includes(p.substring(0, 2)))) {
      detectedKeywords.push(p)
    }
  }
  
  return {
    detected: detectedKeywords.length > 0,
    keywords: detectedKeywords
  }
}

/**
 * Quick detection of spam patterns
 */
function detectSpamPatterns(content) {
  // Check for excessive character repetition (aaaaaaa, hahahahaha)
  const repetitionMatch = content.match(/(.)\1{6,}/g)
  if (repetitionMatch) {
    return {
      detected: true,
      reason: 'Phát hiện spam: ký tự lặp lại quá nhiều'
    }
  }
  
  // Check for word repetition
  const words = content.toLowerCase().split(/\s+/)
  if (words.length >= 5) {
    const wordCount = {}
    for (const word of words) {
      if (word.length > 2) {
        wordCount[word] = (wordCount[word] || 0) + 1
      }
    }
    const maxRepeat = Math.max(...Object.values(wordCount))
    if (maxRepeat >= 5 && maxRepeat / words.length > 0.5) {
      return {
        detected: true,
        reason: 'Phát hiện spam: từ lặp lại quá nhiều'
      }
    }
  }
  
  // Check for excessive caps (shouting)
  const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length
  if (content.length > 20 && capsRatio > 0.7) {
    return {
      detected: true,
      reason: 'Phát hiện spam: viết hoa quá nhiều'
    }
  }
  
  // Check for excessive emoji
  const emojiMatch = content.match(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu)
  if (emojiMatch && emojiMatch.length > 10) {
    return {
      detected: true,
      reason: 'Phát hiện spam: emoji quá nhiều'
    }
  }
  
  // Check for suspicious URLs
  const urlPattern = /(https?:\/\/[^\s]+)/gi
  const urls = content.match(urlPattern)
  if (urls && urls.length > 2) {
    return {
      detected: true,
      reason: 'Phát hiện spam: quá nhiều liên kết'
    }
  }
  
  // Check for gibberish/random characters
  const gibberishPattern = /[bcdfghjklmnpqrstvwxz]{5,}/gi
  if (gibberishPattern.test(content)) {
    return {
      detected: true,
      reason: 'Phát hiện spam: nội dung vô nghĩa'
    }
  }
  
  return { detected: false, reason: '' }
}

/**
 * Map the AI analysis category to moderation action and flag level
 */
function mapCategoryToAction(analysis) {
  const { category, confidence, reasoning, keywords_detected } = analysis
  
  const result = {
    category,
    reasoning: reasoning || '',
    keywords: keywords_detected || [],
    confidence: confidence || 0
  }

  switch (category) {
    case 'safe':
      return {
        ...result,
        action: MODERATION_ACTIONS.ALLOW,
        flagLevel: FLAG_LEVELS.NORMAL
      }

    case 'mild_negative':
    case 'severe_distress':
      // Mild concerns - post but flag for counselor review
      return {
        ...result,
        action: MODERATION_ACTIONS.FLAG_MILD,
        flagLevel: FLAG_LEVELS.MILD
      }

    case 'depression':
    case 'self_harm':
    case 'suicide':
      // Immediate attention needed - reject post, notify counselors
      return {
        ...result,
        action: MODERATION_ACTIONS.REJECT,
        flagLevel: FLAG_LEVELS.IMMEDIATE
      }

    case 'aggressive':
    case 'profanity':
    case 'spam':
    case 'meaningless':
      // Block aggressive, profane, spam, or meaningless content
      return {
        ...result,
        action: MODERATION_ACTIONS.BLOCK,
        flagLevel: FLAG_LEVELS.BLOCKED
      }

    default:
      // Unknown category, default to allow
      return {
        ...result,
        action: MODERATION_ACTIONS.PENDING,
        flagLevel: FLAG_LEVELS.NORMAL
      }
  }
}

/**
 * Moderate a display name - simple accept/reject without counselor review.
 * Uses the same profanity and spam detection as community content moderation,
 * plus AI-based real name detection via Ollama.
 * @param {string} displayName - The display name to check
 * @returns {Promise<{ allowed: boolean, reason: string }>}
 */
export async function moderateDisplayName(displayName) {
  if (!displayName || displayName.trim().length === 0) {
    return { allowed: false, reason: 'Tên hiển thị không được để trống' }
  }

  const name = displayName.trim()

  // Check for Vietnamese slang/profanity
  const slangCheck = detectVietnameseSlang(name)
  if (slangCheck.detected) {
    return {
      allowed: false,
      reason: 'Tên hiển thị chứa ngôn ngữ không phù hợp. Vui lòng chọn tên khác.'
    }
  }

  // Check for spam patterns (gibberish, excessive chars, etc.)
  const spamCheck = detectSpamPatterns(name)
  if (spamCheck.detected) {
    return {
      allowed: false,
      reason: 'Tên hiển thị không hợp lệ. Vui lòng chọn tên có ý nghĩa.'
    }
  }

  // AI check: detect real names
  try {
    const aiResult = await checkRealName(name)
    if (aiResult.isRealName) {
      return {
        allowed: false,
        reason: 'Tên hiển thị có vẻ là tên thật tiếng Việt. Vui lòng sử dụng biệt danh hoặc tên ẩn danh để bảo vệ quyền riêng tư của bạn.'
      }
    }
  } catch (err) {
    // If AI check fails, allow the name through (don't block users due to API issues)
    console.warn('⚠️ AI real-name check failed, allowing name:', err.message)
  }

  return { allowed: true, reason: '' }
}

/**
 * Use AI to detect if a display name looks like a real Vietnamese name.
 * Foreign names (English, Japanese, Korean, etc.) are allowed.
 * @param {string} name - The display name to check
 * @returns {Promise<{ isRealName: boolean, reasoning: string }>}
 */
async function checkRealName(name) {
  // Use gpt-oss model with structured outputs (format parameter) for reliable JSON responses.
  const response = await ollamaChat({
    messages: [
      {
        role: 'user',
        content: `Is "${name}" a real Vietnamese name? Only block Vietnamese names (surnames: Nguyễn, Trần, Lê, Phạm, Hoàng, Vũ, Đặng, Bùi... given names: Linh, Hương, Tùng, Nam, Phúc, Minh, Anh, Đức, Quân, Trang...). Allow foreign names (John, Maria, Alex) and nicknames (Mèo Con, Star123, Bé Bông). Respond with JSON.`
      }
    ],
    temperature: 0,
    maxTokens: 50,
    format: {
      type: 'object',
      properties: {
        is_vietnamese_name: { type: 'boolean' }
      },
      required: ['is_vietnamese_name']
    }
  })

  console.log('🔍 AI real-name check response:', response)

  if (!response || response.trim().length === 0) {
    throw new Error('Empty response from AI')
  }

  const result = JSON.parse(response)
  return {
    isRealName: result.is_vietnamese_name === true,
    reasoning: response
  }
}

/**
 * Get Vietnamese message for moderation result
 */
export function getModerationMessage(action, category) {
  switch (action) {
    case MODERATION_ACTIONS.BLOCK:
      if (category === 'spam') {
        return {
          title: 'Nội dung bị từ chối',
          message: 'Bài viết của bạn bị phát hiện là spam và không thể được đăng. Vui lòng viết nội dung có ý nghĩa.',
          showChatSuggestion: false
        }
      }
      if (category === 'profanity') {
        return {
          title: 'Ngôn ngữ không phù hợp',
          message: 'Bài viết của bạn chứa ngôn ngữ tục tĩu và không thể được đăng. Vui lòng sử dụng ngôn ngữ văn minh.',
          showChatSuggestion: false
        }
      }
      if (category === 'meaningless') {
        return {
          title: 'Nội dung không rõ ràng',
          message: 'Bài viết của bạn không có nội dung rõ ràng. Vui lòng viết chi tiết hơn để mọi người có thể hiểu và hỗ trợ bạn.',
          showChatSuggestion: false
        }
      }
      return {
        title: 'Nội dung không được phép',
        message: 'Bài viết của bạn chứa nội dung không phù hợp và không thể được đăng.',
        showChatSuggestion: false
      }

    case MODERATION_ACTIONS.REJECT:
      return {
        title: 'Chúng tôi quan tâm đến bạn',
        message: 'Chúng tôi nhận thấy bạn có thể đang trải qua giai đoạn khó khăn. Bài viết này không thể được đăng công khai, nhưng chúng tôi khuyến khích bạn trò chuyện trực tiếp với tư vấn viên để được hỗ trợ tốt hơn.',
        showChatSuggestion: true
      }

    case MODERATION_ACTIONS.PENDING:
      return {
        title: '📝 Đang chờ duyệt',
        message: 'Nội dung của bạn đã được gửi thành công và đang chờ tư vấn viên xem xét trước khi hiển thị công khai. Thường mất 1-2 giờ trong giờ làm việc.',
        showChatSuggestion: false
      }

    case MODERATION_ACTIONS.FLAG_MILD:
      return {
        title: 'Đã đăng bài',
        message: 'Bài viết của bạn đã được đăng. Nếu bạn cần hỗ trợ, đừng ngần ngại liên hệ với tư vấn viên.',
        showChatSuggestion: false
      }

    default:
      return {
        title: 'Đã đăng bài',
        message: 'Bài viết của bạn đã được đăng thành công.',
        showChatSuggestion: false
      }
  }
}

/**
 * Get flag level label in Vietnamese
 */
export function getFlagLevelLabel(level) {
  switch (level) {
    case FLAG_LEVELS.IMMEDIATE:
      return 'Cần chú ý ngay'
    case FLAG_LEVELS.MILD:
      return 'Theo dõi'
    case FLAG_LEVELS.BLOCKED:
      return 'Đã chặn'
    case FLAG_LEVELS.PENDING:
      return 'Chờ duyệt'
    default:
      return 'Bình thường'
  }
}

/**
 * Get category label in Vietnamese
 */
export function getCategoryLabel(category) {
  const labels = {
    'safe': 'An toàn',
    'mild_negative': 'Tiêu cực nhẹ',
    'severe_distress': 'Căng thẳng nghiêm trọng',
    'depression': 'Trầm cảm',
    'self_harm': 'Tự gây thương tích',
    'suicide': 'Ý định tự tử',
    'aggressive': 'Hung hăng/Bạo lực',
    'profanity': 'Ngôn ngữ tục tĩu',
    'spam': 'Spam',
    'meaningless': 'Nội dung vô nghĩa'
  }
  return labels[category] || category
}
