import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Shield, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('student')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!email || !password || !fullName || !confirmPassword) {
      setError('Vui lòng điền đầy đủ thông tin')
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

    const { error } = await signUp(email, password, {
      full_name: fullName,
      role: role
    })
    
    if (error) {
      setError(error.message || 'Đã có lỗi xảy ra')
      setLoading(false)
    } else {
      alert('Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.')
      navigate('/login')
    }
  }

  return (
    
      
        
          
            
          
          
            Đăng ký
          
          
            Tạo tài khoản mới
          
        

        {error && (
          
            {error}
          
        )}

        
          
            
              Loại tài khoản
            
            
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`py-3 rounded-xl font-medium transition-all ${
                  role === 'student'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                👨‍🎓 Học sinh
              
              <button
                type="button"
                onClick={() => setRole('counselor')}
                className={`py-3 rounded-xl font-medium transition-all ${
                  role === 'counselor'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                👩‍🏫 Tư vấn viên
              
            
          

          
            
              Họ và tên
            
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Nguyễn Văn A"
              disabled={loading}
            />
          

          
            
              Email
            
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="your@email.com"
              disabled={loading}
            />
          

          
            
              Mật khẩu
            
            
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
                {showPassword ?  : }
              
            
          

          
            
              Xác nhận mật khẩu
            
            
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
                {showConfirmPassword ?  : }
              
            
          

          
            {loading ? 'Đang đăng ký...' : 'Đăng ký'}
          
        

        
          Đã có tài khoản?{' '}
          
            Đăng nhập
          
        
      
    
  )
}
