import { useState, useEffect, useCallback, useMemo } from 'react'
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
  const [animState, setAnimState] = useState('idle') // 'idle' | 'leaving' | 'entering'

  // Initialize shuffled cards
  useEffect(() => {
    if (cards.length > 0) {
      setShuffledCards(getShuffledCards())
      setViewedIds(new Set())
    }
  }, [cards, getShuffledCards])

  const currentCard = shuffledCards[currentIndex]

  // Popular cards for sidebar
  const popularCards = useMemo(() => {
    if (cards.length === 0) return []
    return cards.slice(0, 5)
  }, [cards])

  // Get next random unviewed card index
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

  // Navigate to next random card with stacked card animation
  const goToNextCard = useCallback(() => {
    if (shuffledCards.length === 0 || animState !== 'idle') return

    setAnimState('leaving')

    setTimeout(() => {
      const nextIdx = getNextRandomIndex()
      if (currentCard) {
        setViewedIds(prev => new Set([...prev, currentCard.id]))
      }
      setCurrentIndex(nextIdx)
      setAnimState('entering')

      setTimeout(() => {
        setAnimState('idle')
      }, 400)
    }, 400)
  }, [shuffledCards.length, getNextRandomIndex, currentCard, animState])

  // Go to specific card
  const goToCard = useCallback((index) => {
    if (index === currentIndex || animState !== 'idle') return

    setAnimState('leaving')

    setTimeout(() => {
      if (currentCard) {
        setViewedIds(prev => new Set([...prev, currentCard.id]))
      }
      setCurrentIndex(index)
      setAnimState('entering')

      setTimeout(() => {
        setAnimState('idle')
      }, 400)
    }, 400)
  }, [currentIndex, currentCard, animState])

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

  // Copy card content
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

  // Create new card
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

  return (
    <div className="min-h-screen relative">
      {/* Background - matching other pages */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url('/images/flying.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(3px) brightness(0.9)'
        }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-teal-900/20 via-emerald-800/10 to-cyan-900/20" />

      <div className="relative z-10">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm mb-8">
            <Link to={ROUTES.HOME} className="text-white/70 hover:text-white transition-colors flex items-center gap-1">
              <Home size={14} />
              Trang chủ
            </Link>
            <ChevronRight size={14} className="text-white/40" />
            <span className="text-white">Thông điệp an lành</span>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Loading State */}
              {loading && (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <Loader2 className="animate-spin text-teal-400 mx-auto mb-4" size={48} />
                    <p className="text-white/60">Đang tải thẻ...</p>
                  </div>
                </div>
              )}

              {/* No Cards State */}
              {!loading && shuffledCards.length === 0 && (
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-12 text-center border border-white/10">
                  <div className="w-20 h-20 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="text-teal-400" size={40} />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Chưa có thẻ nào</h2>
                  <p className="text-white/60 mb-6">Hãy tạo thẻ đầu tiên để bắt đầu chia sẻ thông điệp an lành.</p>
                  {isCounselor && (
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-xl transition-colors shadow-lg shadow-teal-500/20"
                    >
                      <Plus size={20} />
                      Tạo thẻ đầu tiên
                    </button>
                  )}
                </div>
              )}

              {/* Card Display */}
              {!loading && currentCard && (
                <div className="overflow-hidden">
                  <div
                    className={`
                      card-content
                      ${animState === 'leaving' ? 'card-leave' : ''}
                      ${animState === 'entering' ? 'card-enter' : ''}
                    `}
                  >
                    {/* Card Title */}
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight">
                      {currentCard.title || 'Thông điệp an lành'}
                    </h1>

                    {/* Card Meta */}
                    <div className="flex items-center gap-3 text-sm text-white/50 mb-6">
                      <span>Thẻ {currentIndex + 1}/{shuffledCards.length}</span>
                    </div>

                    {/* Card Content Box */}
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 sm:p-8 mb-6 shadow-xl border border-white/10">
                      <p className="text-white/90 text-lg sm:text-xl leading-relaxed whitespace-pre-wrap">
                        {currentCard.content}
                      </p>

                      {currentCard.author && (
                        <p className="mt-6 text-right text-teal-300/80 italic text-lg">
                          — {currentCard.author}
                        </p>
                      )}
                    </div>

                    {/* Action Buttons Row */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={handleCopy}
                          className="flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-xl text-white transition-colors border border-white/10"
                        >
                          {copied ? (
                            <>
                              <Check size={18} className="text-green-300" />
                              <span className="text-green-300">Đã sao chép</span>
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
                          className="flex items-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-600 rounded-xl text-white transition-colors shadow-lg shadow-teal-500/20"
                        >
                          <Share2 size={18} />
                          <span className="hidden sm:inline">Chia sẻ</span>
                        </button>
                      </div>

                      {isCounselor && (
                        <button
                          onClick={() => setShowAddModal(true)}
                          className="flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-xl text-white transition-colors border border-white/10"
                        >
                          <Plus size={18} />
                          <span className="hidden sm:inline">Thêm thẻ</span>
                        </button>
                      )}
                    </div>

                    {/* Read Another Card Button */}
                    <button
                      onClick={goToNextCard}
                      disabled={animState !== 'idle'}
                      className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-teal-500 hover:bg-teal-600 rounded-2xl text-white font-semibold text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-teal-500/20"
                    >
                      <RefreshCw size={22} className={animState !== 'idle' ? 'animate-spin' : ''} />
                      Đọc thẻ khác
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:w-80 flex-shrink-0">
              {/* Popular Cards Section */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp size={20} className="text-teal-400" />
                  Nổi bật
                </h3>

                <div className="space-y-3">
                  {popularCards.map((card) => (
                    <button
                      key={card.id}
                      onClick={() => {
                        const cardIndex = shuffledCards.findIndex(c => c.id === card.id)
                        if (cardIndex !== -1) goToCard(cardIndex)
                      }}
                      className={`
                        w-full flex gap-3 p-3 rounded-xl text-left transition-all
                        ${currentCard?.id === card.id
                          ? 'bg-teal-500/20 border border-teal-500/50'
                          : 'hover:bg-white/10 border border-transparent'}
                      `}
                    >
                      {/* Thumbnail/Icon */}
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-500/30 to-emerald-500/30 flex items-center justify-center flex-shrink-0">
                        <Heart size={20} className="text-teal-300" />
                      </div>

                      {/* Card Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-white line-clamp-2 mb-1">
                          {card.title || card.content.substring(0, 50) + '...'}
                        </h4>
                        {card.author && (
                          <p className="text-xs text-white/40 truncate">
                            — {card.author}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}

                  {popularCards.length === 0 && !loading && (
                    <p className="text-white/40 text-sm text-center py-4">
                      Chưa có thẻ nào
                    </p>
                  )}
                </div>
              </div>

              {/* Info Card */}
              <div className="mt-6 bg-gradient-to-br from-teal-500/10 to-emerald-500/10 backdrop-blur-md rounded-2xl p-5 border border-teal-500/20">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                    <Sparkles size={20} className="text-teal-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-teal-300 mb-1">Thông điệp an lành</h4>
                    <p className="text-sm text-white/50 leading-relaxed">
                      Nhấn nút "Đọc thẻ khác" để khám phá những thông điệp tích cực mỗi ngày.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
              className="w-full h-48 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
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
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
              className="flex items-center gap-2 px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-teal-500/20"
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

      {/* Card Swipe Animation Styles */}
      <style>{`
        .card-content {
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1),
                      opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .card-leave {
          transform: translateX(120%) rotate(15deg);
          opacity: 0;
        }

        .card-enter {
          animation: cardSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        @keyframes cardSlideIn {
          0% {
            transform: translateX(-60px) rotate(-8deg) scale(0.9);
            opacity: 0;
          }
          100% {
            transform: translateX(0) rotate(0) scale(1);
            opacity: 1;
          }
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
