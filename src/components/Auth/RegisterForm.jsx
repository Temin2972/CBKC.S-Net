import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Eye, EyeOff } from 'lucide-react'

export default function RegisterForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'student'
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu không khớp')
      return
    }

    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }

    setLoading(true)
    const { error } = await signUp(formData.email, formData.password, {
      full_name: formData.fullName,
      role: formData.role
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      alert('Đăng ký thành công! Vui lòng kiểm tra email để xác nhận.')
      onSuccess?.()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Loại tài khoản
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, role: 'student' }))}
            className={`py-3 rounded-xl font-medium transition-all ${
              formData.role === 'student'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            👨‍🎓 Học sinh
          </button>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, role: 'counselor' }))}
            className={`py-3 rounded-xl font-medium transition-all ${
              formData.role === 'counselor'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            👩‍🏫 Tư vấn viên
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Họ và tên
        </label>
        <input
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Mật khẩu
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Xác nhận mật khẩu
        </label>
        <input
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
          required
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all font-medium disabled:opacity-50"
      >
        {loading ? 'Đang đăng ký...' : 'Đăng ký'}
      </button>
    </form>
  )
}
