import { useState, useEffect, useCallback } from 'react'
import { supabase, isDemoMode } from '../lib/supabaseClient'

// Demo cards for demo mode
const demoCards = [
  {
    id: '1',
    content: 'Bạn có biết không? Mỗi ngày là một cơ hội mới để bắt đầu lại. Dù hôm qua có thế nào, hôm nay bạn vẫn có quyền chọn cách mình muốn sống. Hãy nhớ rằng, việc chăm sóc sức khỏe tinh thần không phải là điều xa xỉ - đó là điều cần thiết. Khi bạn cảm thấy quá tải, hãy dừng lại một chút. Hít thở sâu. Nhắm mắt lại và hỏi bản thân: "Điều gì thực sự quan trọng với mình ngay bây giờ?" Đôi khi, câu trả lời đơn giản chỉ là: nghỉ ngơi.',
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    content: 'Áp lực học tập có thể khiến bạn cảm thấy như đang gánh cả thế giới trên vai. Nhưng hãy nhớ rằng, điểm số không định nghĩa giá trị của bạn. Bạn là một con người với rất nhiều phẩm chất tuyệt vời - sự tử tế, lòng trắc ẩn, khả năng yêu thương và được yêu thương. Những điều này không ai có thể đo đếm bằng điểm số. Hãy cố gắng hết mình, nhưng cũng hãy nhẹ nhàng với chính mình. Bạn đang làm tốt lắm rồi!',
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    content: 'Cảm giác cô đơn là điều mà ai cũng từng trải qua. Nếu bạn đang cảm thấy như vậy, hãy biết rằng bạn không hề một mình. Có rất nhiều người quan tâm đến bạn - có thể là gia đình, bạn bè, thầy cô, hoặc ngay cả những người bạn chưa từng gặp. Đừng ngại ngần chia sẻ cảm xúc của mình. Đôi khi, chỉ cần nói ra những gì bạn đang cảm thấy cũng đủ làm cho mọi thứ nhẹ nhàng hơn rất nhiều.',
    created_at: new Date().toISOString(),
  },
  {
    id: '4',
    content: 'Thất bại không phải là dấu chấm hết - đó là dấu phẩy trong câu chuyện cuộc đời bạn. Mỗi lần vấp ngã đều dạy cho chúng ta điều gì đó quý giá. Thomas Edison đã thử nghiệm hàng nghìn lần trước khi phát minh ra bóng đèn. J.K. Rowling bị từ chối bởi 12 nhà xuất bản trước khi Harry Potter ra đời. Nếu bạn đang trải qua khó khăn, hãy nhớ: đây chỉ là một chương, không phải cả cuốn sách. Câu chuyện của bạn vẫn còn dài.',
    created_at: new Date().toISOString(),
  },
  {
    id: '5',
    content: 'Hãy dành vài phút mỗi ngày để biết ơn những điều nhỏ bé: một ly nước mát vào ngày nóng, nụ cười của ai đó dành cho bạn, hay đơn giản là việc bạn đang tồn tại và có cơ hội trải nghiệm cuộc sống này. Nghiên cứu khoa học đã chứng minh rằng thực hành biết ơn có thể cải thiện đáng kể sức khỏe tinh thần, giảm lo âu và trầm cảm. Hôm nay, bạn biết ơn điều gì?',
    created_at: new Date().toISOString(),
  },
]

/**
 * Hook for managing wellbeing cards
 * @returns {Object} cards data and actions
 */
export function useCards() {
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [creating, setCreating] = useState(false)

  // Fetch all active cards
  const fetchCards = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      if (isDemoMode) {
        setCards(demoCards)
        return
      }

      const { data, error: fetchError } = await supabase
        .from('wellbeing_cards')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setCards(data || [])
    } catch (err) {
      console.error('Error fetching cards:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Create a new card (counselors only)
  const createCard = useCallback(async (content, userId) => {
    try {
      setCreating(true)
      setError(null)

      if (isDemoMode) {
        const newCard = {
          id: Date.now().toString(),
          content,
          created_by: userId,
          created_at: new Date().toISOString(),
          is_active: true,
        }
        setCards(prev => [newCard, ...prev])
        return { success: true, card: newCard }
      }

      const { data, error: createError } = await supabase
        .from('wellbeing_cards')
        .insert({
          content,
          created_by: userId,
        })
        .select()
        .single()

      if (createError) throw createError

      setCards(prev => [data, ...prev])
      return { success: true, card: data }
    } catch (err) {
      console.error('Error creating card:', err)
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setCreating(false)
    }
  }, [])

  // Delete a card (soft delete by setting is_active to false)
  const deleteCard = useCallback(async (cardId) => {
    try {
      setError(null)

      if (isDemoMode) {
        setCards(prev => prev.filter(card => card.id !== cardId))
        return { success: true }
      }

      const { error: deleteError } = await supabase
        .from('wellbeing_cards')
        .update({ is_active: false })
        .eq('id', cardId)

      if (deleteError) throw deleteError

      setCards(prev => prev.filter(card => card.id !== cardId))
      return { success: true }
    } catch (err) {
      console.error('Error deleting card:', err)
      setError(err.message)
      return { success: false, error: err.message }
    }
  }, [])

  // Get a random card
  const getRandomCard = useCallback(() => {
    if (cards.length === 0) return null
    const randomIndex = Math.floor(Math.random() * cards.length)
    return cards[randomIndex]
  }, [cards])

  // Shuffle cards and get a random starting index
  const getShuffledCards = useCallback(() => {
    if (cards.length === 0) return []
    const shuffled = [...cards].sort(() => Math.random() - 0.5)
    return shuffled
  }, [cards])

  // Initial fetch
  useEffect(() => {
    fetchCards()
  }, [fetchCards])

  return {
    cards,
    loading,
    error,
    creating,
    fetchCards,
    createCard,
    deleteCard,
    getRandomCard,
    getShuffledCards,
  }
}

export default useCards
