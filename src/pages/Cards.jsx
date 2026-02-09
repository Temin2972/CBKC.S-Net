import { useState, useEffect, useRef, useCallback } from 'react'
import { 
  ChevronLeft, 
  ChevronRight, 
  Copy, 
  Share2, 
  Check, 
  Plus,
  X,
  Loader2,
  Sparkles,
  Heart
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCards } from '../hooks/useCards'
import Navbar from '../components/Layout/Navbar'
import Footer from '../components/Layout/Footer'
import { Button, Modal } from '../components/UI'

export default function Cards() {
  const { id: userId, isCounselor } = useAuth()
  const { cards, loading, creating, createCard, getShuffledCards } = useCards()
  
  const [shuffledCards, setShuffledCards] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [viewedIds, setViewedIds] = useState(new Set()) // Track viewed cards
  const [copied, setCopied] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newCardTitle, setNewCardTitle] = useState('')
  const [newCardContent, setNewCardContent] = useState('')
  const [newCardAuthor, setNewCardAuthor] = useState('')
  const [swipeDirection, setSwipeDirection] = useState(null)
  
  // Touch/swipe handling
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)
  const cardRef = useRef(null)

  // Initialize shuffled cards
  useEffect(() => {
    if (cards.length > 0) {
      setShuffledCards(getShuffledCards())
      setViewedIds(new Set())
    }
  }, [cards, getShuffledCards])

  const currentCard = shuffledCards[currentIndex]

  // Get next random card that hasn't been viewed yet
  const getNextRandomIndex = useCallback(() => {
    if (shuffledCards.length === 0) return 0
    
    // Get all unviewed indices except current
    const unviewedIndices = shuffledCards
      .map((_, idx) => idx)
      .filter(idx => idx !== currentIndex && !viewedIds.has(shuffledCards[idx]?.id))
    
    // If all cards have been viewed, reset and reshuffle
    if (unviewedIndices.length === 0) {
      setViewedIds(new Set())
      const allIndices = shuffledCards.map((_, idx) => idx).filter(idx => idx !== currentIndex)
      if (allIndices.length === 0) return currentIndex
      return allIndices[Math.floor(Math.random() * allIndices.length)]
    }
    
    return unviewedIndices[Math.floor(Math.random() * unviewedIndices.length)]
  }, [shuffledCards, currentIndex, viewedIds])

  // Navigate to previous card (random unviewed)
  const goToPrevious = useCallback(() => {
    if (shuffledCards.length === 0) return
    setSwipeDirection('right')
    setTimeout(() => {
      const nextIdx = getNextRandomIndex()
      if (currentCard) {
        setViewedIds(prev => new Set([...prev, currentCard.id]))
      }
      setCurrentIndex(nextIdx)
      setSwipeDirection(null)
    }, 150)
  }, [shuffledCards.length, getNextRandomIndex, currentCard])

  // Navigate to next card (random unviewed)
  const goToNext = useCallback(() => {
    if (shuffledCards.length === 0) return
    setSwipeDirection('left')
    setTimeout(() => {
      const nextIdx = getNextRandomIndex()
      if (currentCard) {
        setViewedIds(prev => new Set([...prev, currentCard.id]))
      }
      setCurrentIndex(nextIdx)
      setSwipeDirection(null)
    }, 150)
  }, [shuffledCards.length, getNextRandomIndex, currentCard])

  // Handle touch start
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
  }

  // Handle touch move
  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX
  }

  // Handle touch end - detect swipe
  const handleTouchEnd = () => {
    const swipeThreshold = 50
    const diff = touchStartX.current - touchEndX.current

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        goToNext() // Swiped left
      } else {
        goToPrevious() // Swiped right
      }
    }
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') goToPrevious()
      if (e.key === 'ArrowRight') goToNext()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToPrevious, goToNext])

  // Copy card content to clipboard
  const handleCopy = async () => {
    if (!currentCard) return
    try {
      const textToCopy = `${currentCard.title}\n\n${currentCard.content}${currentCard.author ? `\n\n— ${currentCard.author}` : ''}`
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Share card content
  const handleShare = async () => {
    if (!currentCard) return
    
    const shareText = `${currentCard.title}\n\n${currentCard.content}${currentCard.author ? `\n\n— ${currentCard.author}` : ''}`
    const shareData = {
      title: currentCard.title || 'S-Net Wellbeing Card',
      text: shareText,
      url: window.location.href,
    }

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData)
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareText)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch (err) {
      console.error('Failed to share:', err)
    }
  }

  // Handle create new card
  const handleCreateCard = async () => {
    if (!newCardContent.trim()) return
    
    const result = await createCard(newCardTitle || null, newCardContent, newCardAuthor || null, userId)
    if (result.success) {
      setNewCardTitle('')
      setNewCardContent('')
      setNewCardAuthor('')
      setShowAddModal(false)
      // Refresh shuffled cards
      setShuffledCards(prev => [result.card, ...prev])
    }
  }

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url('/images/flying.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(3px) brightness(0.9)'
        }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-rose-900/20 via-pink-800/10 to-purple-900/20" />

      <div className="relative z-10">
        <Navbar />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm mb-4">
              <Sparkles size={16} />
              <span>Thông điệp an lành</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Cards <Heart className="inline-block text-pink-400 fill-current" size={32} />
            </h1>
            <p className="text-white/80">
              Vuốt trái/phải hoặc dùng nút điều hướng để xem các thẻ
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-white" size={48} />
            </div>
          )}

          {/* No Cards State */}
          {!loading && shuffledCards.length === 0 && (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="text-white" size={40} />
              </div>
              <p className="text-white/80 text-lg">Chưa có thẻ nào được tạo.</p>
              {isCounselor && (
                <Button
                  onClick={() => setShowAddModal(true)}
                  className="mt-4"
                  variant="primary"
                >
                  <Plus size={20} />
                  Tạo thẻ đầu tiên
                </Button>
              )}
            </div>
          )}

          {/* Card Display */}
          {!loading && currentCard && (
            <div className="relative">
              {/* Navigation Buttons */}
              <button
                onClick={goToPrevious}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-16 z-20 w-12 h-12 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:text-gray-900 transition-all hover:scale-110"
                aria-label="Previous card"
              >
                <ChevronLeft size={24} />
              </button>

              <button
                onClick={goToNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-16 z-20 w-12 h-12 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:text-gray-900 transition-all hover:scale-110"
                aria-label="Next card"
              >
                <ChevronRight size={24} />
              </button>

              {/* Card */}
              <div
                ref={cardRef}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className={`
                  bg-white rounded-3xl shadow-2xl p-8 md:p-12 mx-auto max-w-2xl
                  transition-all duration-150 ease-out
                  ${swipeDirection === 'left' ? '-translate-x-8 opacity-0' : ''}
                  ${swipeDirection === 'right' ? 'translate-x-8 opacity-0' : ''}
                `}
              >
                {/* Card Title */}
                {currentCard.title && (
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                    {currentCard.title}
                  </h2>
                )}

                {/* Card Content - Scrollable */}
                <div className="max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                  <p className="text-gray-700 text-lg md:text-xl leading-relaxed whitespace-pre-wrap">
                    {currentCard.content}
                  </p>
                </div>

                {/* Card Author */}
                {currentCard.author && (
                  <p className="mt-6 text-right text-gray-500 italic">
                    — {currentCard.author}
                  </p>
                )}

                {/* Card Footer */}
                <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-end">
                  {/* Action Buttons */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check size={18} className="text-green-500" />
                          <span className="text-green-600">Đã sao chép</span>
                        </>
                      ) : (
                        <>
                          <Copy size={18} />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleShare}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 rounded-full text-white transition-colors"
                    >
                      <Share2 size={18} />
                      <span>Chia sẻ</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add Card Button for Counselors */}
          {isCounselor && !loading && shuffledCards.length > 0 && (
            <div className="mt-8 text-center">
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-white transition-colors"
              >
                <Plus size={20} />
                Thêm thẻ mới
              </button>
            </div>
          )}
        </main>

        <Footer />
      </div>

      {/* Add Card Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Tạo thẻ mới">
        <div className="p-6 space-y-4">
          <p className="text-gray-600">
            Viết một thông điệp an lành để chia sẻ với các học sinh.
          </p>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tiêu đề <span className="text-gray-400">(tùy chọn)</span>
              </label>
              <input
                type="text"
                value={newCardTitle}
                onChange={(e) => setNewCardTitle(e.target.value)}
                placeholder="Tiêu đề của thẻ..."
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                maxLength={200}
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nội dung <span className="text-red-500">*</span>
              </label>
              <textarea
                value={newCardContent}
                onChange={(e) => setNewCardContent(e.target.value)}
                placeholder="Viết thông điệp của bạn tại đây..."
                className="w-full h-48 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Author */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tác giả <span className="text-gray-400">(tùy chọn)</span>
              </label>
              <input
                type="text"
                value={newCardAuthor}
                onChange={(e) => setNewCardAuthor(e.target.value)}
                placeholder="Tên tác giả hoặc nguồn..."
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                maxLength={100}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateCard}
                disabled={!newCardContent.trim() || creating}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg hover:from-pink-600 hover:to-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    Tạo thẻ
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  )
}
