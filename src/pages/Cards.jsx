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
  const [copied, setCopied] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newCardContent, setNewCardContent] = useState('')
  const [swipeDirection, setSwipeDirection] = useState(null)
  
  // Touch/swipe handling
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)
  const cardRef = useRef(null)

  // Initialize shuffled cards
  useEffect(() => {
    if (cards.length > 0) {
      setShuffledCards(getShuffledCards())
    }
  }, [cards, getShuffledCards])

  const currentCard = shuffledCards[currentIndex]

  // Navigate to previous card
  const goToPrevious = useCallback(() => {
    if (shuffledCards.length === 0) return
    setSwipeDirection('right')
    setTimeout(() => {
      setCurrentIndex(prev => 
        prev === 0 ? shuffledCards.length - 1 : prev - 1
      )
      setSwipeDirection(null)
    }, 150)
  }, [shuffledCards.length])

  // Navigate to next card
  const goToNext = useCallback(() => {
    if (shuffledCards.length === 0) return
    setSwipeDirection('left')
    setTimeout(() => {
      setCurrentIndex(prev => 
        prev === shuffledCards.length - 1 ? 0 : prev + 1
      )
      setSwipeDirection(null)
    }, 150)
  }, [shuffledCards.length])

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
      await navigator.clipboard.writeText(currentCard.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Share card content
  const handleShare = async () => {
    if (!currentCard) return
    
    const shareData = {
      title: 'S-Net Wellbeing Card',
      text: currentCard.content,
      url: window.location.href,
    }

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData)
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(currentCard.content)
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
    
    const result = await createCard(newCardContent, userId)
    if (result.success) {
      setNewCardContent('')
      setShowAddModal(false)
      // Refresh shuffled cards
      setShuffledCards(prev => [result.card, ...prev])
    }
  }

  // Character count for new card
  const charCount = newCardContent.length

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
                {/* Card Content - Scrollable */}
                <div className="max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                  <p className="text-gray-700 text-lg md:text-xl leading-relaxed whitespace-pre-wrap">
                    {currentCard.content}
                  </p>
                </div>

                {/* Card Footer */}
                <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                  {/* Card Counter */}
                  <div className="text-sm text-gray-400">
                    {currentIndex + 1} / {shuffledCards.length}
                  </div>

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

              {/* Dot Indicators */}
              <div className="flex items-center justify-center gap-2 mt-6">
                {shuffledCards.slice(0, 10).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentIndex
                        ? 'bg-white w-6'
                        : 'bg-white/40 hover:bg-white/60'
                    }`}
                    aria-label={`Go to card ${index + 1}`}
                  />
                ))}
                {shuffledCards.length > 10 && (
                  <span className="text-white/60 text-sm ml-2">
                    +{shuffledCards.length - 10}
                  </span>
                )}
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
      {showAddModal && (
        <Modal onClose={() => setShowAddModal(false)} title="Tạo thẻ mới">
          <div className="p-6">
            <p className="text-gray-600 mb-4">
              Viết một thông điệp an lành để chia sẻ với các học sinh.
            </p>

            <textarea
              value={newCardContent}
              onChange={(e) => setNewCardContent(e.target.value)}
              placeholder="Viết thông điệp của bạn tại đây..."
              className="w-full h-64 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
            />

            {/* Character Count */}
            <div className="flex items-center justify-end mt-2">
              <span className="text-sm text-gray-400">
                {charCount} ký tự
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 mt-6">
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
      )}

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
