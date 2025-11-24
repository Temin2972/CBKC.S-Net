import { Navigate, Outlet } from 'react-router-dom'

export default function ProtectedRoute({ user }) {
  if (!user) {
    return 
  }

  return 
}
