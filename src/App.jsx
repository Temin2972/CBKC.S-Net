import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import Chat from './pages/Chat'
import Community from './pages/Community'
import Admin from './pages/Admin'
import ProtectedRoute from './components/Layout/ProtectedRoute'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      
        Đang tải...
      
    )
  }

  return (
    
      
         : } 
        />
         : } 
        />
        
        }>
          } />
          } />
          } />
          } />
        

        <Route 
          path="*" 
          element={<Navigate to={user ? "/home" : "/login"} />} 
        />
      
    
  )
}

export default App
