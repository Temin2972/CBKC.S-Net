import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Shield, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useQuotes } from '../hooks/useQuotes'

export default function Register() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { signUpStudent } = useAuth()
  const { quote, loading: quoteLoading } = useQuotes()
  const navigate = useNavigate()
  const location = useLocation()
  
  // Get the feature user wanted to access
  const fromFeature = location.state?.from

  const getFeatureMessage = () => {
    if (fromFeature === 'chat') {
      return {
        title: '💬 Bạn muốn sử dụng tính năng Chat với Tư vấn viên',
        description: 'Đăng ký để kết nối với các tư vấn viên tâm lý chuyên nghiệp'
      }
    }
    if (fromFeature === 'community') {
      return {
        title: '👥 Bạn muốn tham gia Cộng đồng Ẩn danh',
        description: 'Đăng ký để chia sẻ và kết nối với những người cùng hoàn cảnh'
      }
    }
    return null
  }

  const featureMessage = getFeatureMessage()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!username || !password || !fullName || !confirmPassword) {
      setError('Vui lòng điền đầy đủ thông tin')
      setLoading(false)
      return
    }

    // Username validation
    if (username.length < 3) {
      setError('Tên đăng nhập phải có ít nhất 3 ký tự')
      setLoading(false)
      return
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu không khớp')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự')
      setLoading(false)
      return
    }

    const { error } = await signUpStudent(username, password, fullName)
    
    if (error) {
      if (error.message?.includes('already registered')) {
        setError('Tên đăng nhập đã tồn tại')
      } else {
        setError(error.message || 'Đã có lỗi xảy ra')
      }
      setLoading(false)
    } else {
      alert('Đăng ký thành công!')
      navigate('/login')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Feature Message */}
        {featureMessage && (
          <div className="bg-white/90 rounded-3xl shadow-2xl p-6 mb-4 animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                <ArrowRight size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-800 mb-1">
                  {featureMessage.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {featureMessage.description}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white/90 rounded-3xl shadow-2xl p-8 mb-6">
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-4">
              <Shield size={40} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Đăng ký Học sinh
            </h1>
            <p className="text-gray-600">
              Tạo tài khoản học sinh mới
            </p>
          </div>

          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-start gap-2">
              <AlertCircle size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Dành cho học sinh</p>
                <p className="text-blue-700">Không cần email. Chỉ cần tên đăng nhập và mật khẩu.</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tên hiển thị (Có thể không để tên thật)
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Florentino"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tên đăng nhập
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="florentino"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Chỉ chữ cái, số và dấu gạch dưới. Tối thiểu 3 ký tự.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Ít nhất 6 ký tự"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Xác nhận mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Nhập lại mật khẩu"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all font-medium disabled:opacity-50"
            >
              {loading ? 'Đang đăng ký...' : 'Đăng ký'}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-600">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-purple-600 font-semibold hover:underline">
              Đăng nhập
            </Link>
          </p>
        </div>

        {/* Simple Quote Section */}
        {!quoteLoading && quote && (
          <div className="bg-white/90 rounded-3xl shadow-2xl p-6 text-center">
            <p className="text-base text-gray-700 mb-2">
              "{quote.content}"
            </p>
            {quote.author && (
              <p className="text-sm text-gray-600">
                — {quote.author} —
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
