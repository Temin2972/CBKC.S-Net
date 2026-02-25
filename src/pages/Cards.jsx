import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { 
  Copy, 
  Share2, 
  Check, 
  Plus,
  Loader2,
  Sparkles,
  Heart,
  RefreshCw,
  ChevronRight,
  MessageCircle,
  TrendingUp,
  Home
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCards } from '../hooks/useCards'
import Navbar from '../components/Layout/Navbar'
import Footer from '../components/Layout/Footer'
import { Modal } from '../components/UI'
import { ROUTES } from '../constants'

export default function Cards() {
  const { id: userId, isCounselor } = useAuth()
  const { cards, loading, creating, createCard, getShuffledCards } = useCards()
  
  const [shuffledCards, setShuffledCards] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [viewedIds, setViewedIds] = useState(new Set())
  const [copied, setCopied] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newCardTitle, setNewCardTitle] = useState('')
  const [newCardContent, setNewCardContent] = useState('')
  const [newCardAuthor, setNewCardAuthor] = useState('')
  const [isFlipping, setIsFlipping] = useState(false)
  const [flipDirection, setFlipDirection] = useState('next') // 'next' or 'prev'
  
  // Touch/swipe handling
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  // Initialize shuffled cards
  useEffect(() => {
    if (cards.length > 0) {
      setShuffledCards(getShuffledCards())
      setViewedIds(new Set())
    }
  }, [cards, getShuffledCards])

  const currentCard = shuffledCards[currentIndex]

  // Get popular cards for sidebar (first 5 cards or random selection)
  const popularCards = useMemo(() => {
    if (cards.length === 0) return []
    return cards.slice(0, 5)
  }, [cards])

  // Get next random card that hasn't been viewed yet
  const getNextRandomIndex = useCallback(() => {
    if (shuffledCards.length === 0) return 0
    
    const unviewedIndices = shuffledCards
      .map((_, idx) => idx)
      .filter(idx => idx !== currentIndex && !viewedIds.has(shuffledCards[idx]?.id))
    
    if (unviewedIndices.length === 0) {
      setViewedIds(new Set())
      const allIndices = shuffledCards.map((_, idx) => idx).filter(idx => idx !== currentIndex)
      if (allIndices.length === 0) return currentIndex
      return allIndices[Math.floor(Math.random() * allIndices.length)]
    }
    
    return unviewedIndices[Math.floor(Math.random() * unviewedIndices.length)]
  }, [shuffledCards, currentIndex, viewedIds])

  // Navigate to next random card with flip animation
  const goToNextCard = useCallback(() => {
    if (shuffledCards.length === 0 || isFlipping) return
    
    setFlipDirection('next')
    setIsFlipping(true)
    
    setTimeout(() => {
      const nextIdx = getNextRandomIndex()
      if (currentCard) {
        setViewedIds(prev => new Set([...prev, currentCard.id]))
      }
      setCurrentIndex(nextIdx)
      
      setTimeout(() => {
        setIsFlipping(false)
      }, 300)
    }, 300)
  }, [shuffledCards.length, getNextRandomIndex, currentCard, isFlipping])

  // Go to specific card
  const goToCard = useCallback((index) => {
    if (index === currentIndex || isFlipping) return
    
    setFlipDirection(index > currentIndex ? 'next' : 'prev')
    setIsFlipping(true)
    
    setTimeout(() => {
      if (currentCard) {
        setViewedIds(prev => new Set([...prev, currentCard.id]))
      }
      setCurrentIndex(index)
      
      setTimeout(() => {
        setIsFlipping(false)
      }, 300)
    }, 300)
  }, [currentIndex, currentCard, isFlipping])

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
      goToNextCard()
    }
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        goToNextCard()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToNextCard])

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
      setShuffledCards(prev => [result.card, ...prev])
    }
  }

  // Format date
  const formatDate = () => {
    const now = new Date()
    const options = { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }
    const formatted = now.toLocaleDateString('vi-VN', options)
    const time = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    return `${formatted}, ${time} (GMT+7)`
  }

  return (
    <div className="min-h-screen bg-[#2a2a2a]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-6">
          <Link to={ROUTES.HOME} className="text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1">
            <Home size={14} />
            Trang chủ
          </Link>
          <ChevronRight size={14} className="text-gray-500" />
          <span className="text-amber-400">Thông điệp an lành</span>
          <span className="ml-auto text-gray-400 text-xs hidden sm:block">{formatDate()}</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <Loader2 className="animate-spin text-amber-400 mx-auto mb-4" size={48} />
                  <p className="text-gray-400">Đang tải thẻ...</p>
                </div>
              </div>
            )}

            {/* No Cards State */}
            {!loading && shuffledCards.length === 0 && (
              <div className="bg-[#3a3a3a] rounded-2xl p-12 text-center">
                <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="text-amber-400" size={40} />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Chưa có thẻ nào</h2>
                <p className="text-gray-400 mb-6">Hãy tạo thẻ đầu tiên để bắt đầu chia sẻ thông điệp an lành.</p>
                {isCounselor && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-colors"
                  >
                    <Plus size={20} />
                    Tạo thẻ đầu tiên
                  </button>
                )}
              </div>
            )}

            {/* Card Display */}
            {!loading && currentCard && (
              <div className="perspective-1000">
                {/* Card Container with 3D Flip */}
                <div
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  className={`
                    transform-style-3d transition-transform duration-500 ease-in-out
                    ${isFlipping ? (flipDirection === 'next' ? 'rotate-y-90' : '-rotate-y-90') : 'rotate-y-0'}
                  `}
                >
                  {/* Main Title */}
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-amber-100 mb-6 leading-tight">
                    {currentCard.title || 'Thông điệp an lành'}
                  </h1>

                  {/* Card Meta */}
                  <div className="flex items-center gap-3 text-sm text-gray-400 mb-6">
                    <span className="text-amber-400 font-medium">S-NET</span>
                    <span>—</span>
                    <span>Thẻ {currentIndex + 1}/{shuffledCards.length}</span>
                    {viewedIds.size > 0 && (
                      <>
                        <span>•</span>
                        <span>Đã xem: {viewedIds.size}</span>
                      </>
                    )}
                  </div>

                  {/* Card Content Box */}
                  <div className="bg-[#3a3a3a] rounded-2xl p-6 sm:p-8 mb-6 shadow-xl border border-gray-700/50">
                    {/* Content */}
                    <div className="prose prose-lg prose-invert max-w-none">
                      <p className="text-gray-200 text-lg sm:text-xl leading-relaxed whitespace-pre-wrap">
                        {currentCard.content}
                      </p>
                    </div>

                    {/* Author */}
                    {currentCard.author && (
                      <p className="mt-6 text-right text-amber-400/80 italic text-lg">
                        — {currentCard.author}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons Row */}
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleCopy}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#3a3a3a] hover:bg-[#4a4a4a] rounded-xl text-gray-300 transition-colors border border-gray-700/50"
                      >
                        {copied ? (
                          <>
                            <Check size={18} className="text-green-400" />
                            <span className="text-green-400">Đã sao chép</span>
                          </>
                        ) : (
                          <>
                            <Copy size={18} />
                            <span className="hidden sm:inline">Sao chép</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={handleShare}
                        className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 rounded-xl text-white transition-colors"
                      >
                        <Share2 size={18} />
                        <span className="hidden sm:inline">Chia sẻ</span>
                      </button>
                    </div>

                    {isCounselor && (
                      <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#3a3a3a] hover:bg-[#4a4a4a] rounded-xl text-gray-300 transition-colors border border-gray-700/50"
                      >
                        <Plus size={18} />
                        <span className="hidden sm:inline">Thêm thẻ</span>
                      </button>
                    )}
                  </div>

                  {/* Read Another Card Button */}
                  <button
                    onClick={goToNextCard}
                    disabled={isFlipping}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-2xl text-white font-semibold text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20"
                  >
                    <RefreshCw size={22} className={isFlipping ? 'animate-spin' : ''} />
                    Đọc thẻ khác
                    <Sparkles size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 flex-shrink-0">
            {/* Popular Cards Section */}
            <div className="bg-[#3a3a3a] rounded-2xl p-5 border border-gray-700/50">
              <h3 className="text-lg font-bold text-amber-400 mb-4 flex items-center gap-2">
                <TrendingUp size={20} />
                Xem nhiều
              </h3>

              <div className="space-y-4">
                {popularCards.map((card, index) => (
                  <button
                    key={card.id}
                    onClick={() => {
                      const cardIndex = shuffledCards.findIndex(c => c.id === card.id)
                      if (cardIndex !== -1) goToCard(cardIndex)
                    }}
                    className={`
                      w-full flex gap-3 p-3 rounded-xl text-left transition-all
                      ${currentCard?.id === card.id 
                        ? 'bg-amber-500/20 border border-amber-500/50' 
                        : 'hover:bg-[#4a4a4a] border border-transparent'}
                    `}
                  >
                    {/* Thumbnail/Icon */}
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-amber-500/30 to-orange-500/30 flex items-center justify-center flex-shrink-0">
                      <Heart size={24} className="text-amber-400" />
                    </div>
                    
                    {/* Card Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-200 line-clamp-2 mb-1">
                        {card.title || card.content.substring(0, 50) + '...'}
                      </h4>
                      {card.author && (
                        <p className="text-xs text-gray-500 truncate">
                          — {card.author}
                        </p>
                      )}
                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                        <MessageCircle size={12} />
                        <span>{index * 47 + 31}</span>
                      </div>
                    </div>
                  </button>
                ))}

                {popularCards.length === 0 && !loading && (
                  <p className="text-gray-500 text-sm text-center py-4">
                    Chưa có thẻ nào
                  </p>
                )}
              </div>
            </div>

            {/* Info Card */}
            <div className="mt-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl p-5 border border-amber-500/20">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles size={20} className="text-amber-400" />
                </div>
                <div>
                  <h4 className="font-medium text-amber-300 mb-1">Thông điệp an lành</h4>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Vuốt trái/phải hoặc nhấn nút "Đọc thẻ khác" để khám phá những thông điệp tích cực mỗi ngày.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

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
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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
              className="w-full h-48 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
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
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* 3D Flip Animation Styles */}
      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
          backface-visibility: hidden;
        }
        .rotate-y-0 {
          transform: rotateY(0deg);
        }
        .rotate-y-90 {
          transform: rotateY(90deg);
        }
        .-rotate-y-90 {
          transform: rotateY(-90deg);
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}
