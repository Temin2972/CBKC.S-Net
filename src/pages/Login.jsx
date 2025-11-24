import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Shield, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!email || !password) {
      setError('Vui lòng điền đầy đủ thông tin')
      setLoading(false)
      return
    }

    const { error } = await signIn(email, password)
    
    if (error) {
      setError('Email hoặc mật khẩu không đúng')
      setLoading(false)
    } else {
      navigate('/home')
    }
  }

  return (
    
      
        
          
            
          
          
            Đăng nhập
          
          
            Nơi an toàn để chia sẻ và được hỗ trợ
          
        

        {error && (
          
            {error}
          
        )}

        
          
            
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
                placeholder="Nhập mật khẩu"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ?  : }
              
            
          

          
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          
        

        
          Chưa có tài khoản?{' '}
          
            Đăng ký ngay
          
        
      
    
  )
}
