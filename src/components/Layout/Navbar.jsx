import { Link } from 'react-router-dom'
import { Home, MessageCircle, Users, Shield, LogOut } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

export default function Navbar() {
  const { user, signOut } = useAuth()

  const handleLogout = async () => {
    await signOut()
  }

  return (
    
      
        
          
            
            
              Tâm Lý Học Đường
            
          

          
            
              
              Trang chủ
            
            
            
              
              Tin nhắn
            

            
              
              Cộng đồng
            

            {user?.user_metadata?.role === 'admin' && (
              
                
                Admin
              
            )}

            
              
              Đăng xuất
            
          
        
      
    
  )
}
