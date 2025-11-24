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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400">
        <div className="text-white text-2xl font-bold">Đang tải...</div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={user ? <Navigate to="/home" /> : <Login />} 
        />
        <Route 
          path="/register" 
          element={user ? <Navigate to="/home" /> : <Register />} 
        />
        
        <Route element={<ProtectedRoute user={user} />}>
          <Route path="/home" element={<Home />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/community" element={<Community />} />
          <Route path="/admin" element={<Admin />} />
        </Route>

        <Route 
          path="*" 
          element={<Navigate to={user ? "/home" : "/login"} />} 
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
