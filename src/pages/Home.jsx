import { MessageCircle, Users, Clock, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Navbar from '../components/Layout/Navbar'

export default function Home() {
  const { user } = useAuth()

  return (
    
      

      
        
          
            Xin chào, {user?.user_metadata?.full_name}! 👋
          
          
            {user?.user_metadata?.role === 'counselor' 
              ? 'Sẵn sàng hỗ trợ học sinh hôm nay' 
              : 'Bạn cần hỗ trợ gì hôm nay?'}
          
        

        
          
            
              
            
            
              Chat với Tư vấn viên
            
            
              Kết nối trực tiếp với giáo viên tâm lý để được hỗ trợ ngay lập tức
            
            
              
              Hoạt động: 7:00 - 22:00
            
          

          
            
              
            
            
              Cộng đồng Ẩn danh
            
            
              Chia sẻ câu chuyện và kết nối với những người cùng hoàn cảnh
            
            
              
              100% Ẩn danh
            
          
        

        
          
            💡 Tại sao chọn chúng tôi?
            
              
                🛡️
                Bảo mật tuyệt đối
                Thông tin được mã hóa và bảo vệ
              
              
                ⚡
                Hỗ trợ tức thời
                Nhiều tư vấn viên luôn sẵn sàng
              
              
                ❤️
                Cộng đồng thân thiện
                Được chia sẻ và đồng cảm
              
            
          
        
      
    
  )
}
