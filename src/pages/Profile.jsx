/**
 * Profile Page Component
 * User profile customization with avatar presets
 * Counselors can upload custom photos
 */
import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase, isDemoMode, getDemoState } from '../lib/supabaseClient'
import { AVATAR_PRESETS, DEMO_USERS } from '../lib/demoData'
import { moderateDisplayName } from '../lib/contentModeration'
import Navbar from '../components/Layout/Navbar'
import { Button, Alert } from '../components/UI'
import { 
  User, 
  Save, 
  Check,
  Camera,
  Mail,
  GraduationCap,
  Shield,
  Upload,
  Loader2,
  X,
  Lock,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

export default function Profile() {
  const { user, isCounselor, isAdmin, role } = useAuth()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  
  // Profile state
  const [displayName, setDisplayName] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState('')
  const [bio, setBio] = useState('')
  const [specialty, setSpecialty] = useState('')
  
  // Password change state
  const [showPasswordSection, setShowPasswordSection] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  useEffect(() => {
    if (user) {
      loadProfile()
    }
  }, [user])

  const loadProfile = async () => {
    if (isDemoMode) {
      setDisplayName(user.user_metadata?.full_name || '')
      setSelectedAvatar(user.user_metadata?.avatar_url || AVATAR_PRESETS[0].url)
      setBio(user.user_metadata?.bio || '')
      setSpecialty(user.user_metadata?.specialty || '')
    } else {
      // First try to get from users table
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (data) {
        setDisplayName(data.full_name || user.user_metadata?.full_name || '')
        setSelectedAvatar(data.avatar_url || user.user_metadata?.avatar_url || AVATAR_PRESETS[0].url)
        setBio(data.bio || '')
        setSpecialty(data.specialty || '')
      } else {
        // Fallback to user metadata from auth
        setDisplayName(user.user_metadata?.full_name || '')
        setSelectedAvatar(user.user_metadata?.avatar_url || AVATAR_PRESETS[0].url)
        setBio(user.user_metadata?.bio || '')
        setSpecialty(user.user_metadata?.specialty || '')
      }
    }
  }

  // Handle photo upload (counselors only)
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn file ảnh')
      return
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError('Kích thước ảnh không được vượt quá 5MB')
      return
    }

    setUploading(true)
    setError('')

    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
      
      setSelectedAvatar(data.publicUrl)
    } catch (err) {
      console.error('Upload error:', err)
      setError('Không thể tải ảnh lên. Vui lòng thử lại.')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    setError('')
    setSaved(false)

    setLoading(true)

    // Check display name for inappropriate content (async - includes AI real-name check)
    const nameCheck = await moderateDisplayName(displayName)
    if (!nameCheck.allowed) {
      setError(nameCheck.reason)
      setLoading(false)
      return
    }

    try {
      const profileData = {
        full_name: displayName,
        avatar_url: selectedAvatar,
        bio,
        specialty,
        updated_at: new Date().toISOString()
      }

      if (isDemoMode) {
        // Update demo state
        const state = getDemoState()
        const userKey = Object.keys(DEMO_USERS).find(key => 
          DEMO_USERS[key].id === user.id
        )
        if (userKey && state.users[userKey]) {
          state.users[userKey].user_metadata = {
            ...state.users[userKey].user_metadata,
            ...profileData
          }
        }
      } else {
        // Update users table
        const { error: dbError } = await supabase
          .from('users')
          .update(profileData)
          .eq('id', user.id)
        
        if (dbError) {
          console.error('Error updating users table:', dbError)
        }
        
        // Also update auth user metadata
        await supabase.auth.updateUser({
          data: profileData
        })
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError('Có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async () => {
    setPasswordError('')
    setPasswordSuccess(false)

    // Validation
    if (!currentPassword) {
      setPasswordError('Vui lòng nhập mật khẩu hiện tại')
      return
    }
    if (!newPassword) {
      setPasswordError('Vui lòng nhập mật khẩu mới')
      return
    }
    if (newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải có ít nhất 6 ký tự')
      return
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('Mật khẩu xác nhận không khớp')
      return
    }
    if (currentPassword === newPassword) {
      setPasswordError('Mật khẩu mới phải khác mật khẩu hiện tại')
      return
    }

    setPasswordLoading(true)

    try {
      if (isDemoMode) {
        // Simulate password change in demo mode
        await new Promise(resolve => setTimeout(resolve, 1000))
        setPasswordSuccess(true)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmNewPassword('')
        setTimeout(() => {
          setPasswordSuccess(false)
          setShowPasswordSection(false)
        }, 2000)
      } else {
        // First verify current password by trying to sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword
        })

        if (signInError) {
          setPasswordError('Mật khẩu hiện tại không đúng')
          setPasswordLoading(false)
          return
        }

        // Update to new password
        const { error: updateError } = await supabase.auth.updateUser({
          password: newPassword
        })

        if (updateError) {
          setPasswordError('Không thể đổi mật khẩu. Vui lòng thử lại.')
          setPasswordLoading(false)
          return
        }

        setPasswordSuccess(true)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmNewPassword('')
        setTimeout(() => {
          setPasswordSuccess(false)
          setShowPasswordSection(false)
        }, 2000)
      }
    } catch (err) {
      console.error('Password change error:', err)
      setPasswordError('Có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setPasswordLoading(false)
    }
  }

  const getRoleInfo = () => {
    switch (role) {
      case 'admin':
        return { label: 'Quản trị viên', icon: Shield, color: 'text-purple-600 bg-purple-100' }
      case 'counselor':
        return { label: 'Tư vấn viên', icon: GraduationCap, color: 'text-blue-600 bg-blue-100' }
      default:
        return { label: 'Học sinh', icon: User, color: 'text-teal-600 bg-teal-100' }
    }
  }

  const roleInfo = getRoleInfo()

  return (
    <div className="min-h-screen bg-animated-gradient relative overflow-hidden">
      {/* Floating Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="floating-orb floating-orb-1"></div>
        <div className="floating-orb floating-orb-2"></div>
        <div className="floating-orb floating-orb-3"></div>
      </div>

      <Navbar />

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full text-sm text-teal-700 mb-4 border border-teal-100">
            <User size={16} />
            <span>Trang cá nhân</span>
          </div>
          <h1 className="text-3xl font-semibold text-gray-800 mb-2">
            Hồ sơ của bạn
          </h1>
          <p className="text-gray-600">
            Tuỳ chỉnh thông tin và ảnh đại diện
          </p>
        </header>

        {/* Profile Card */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-xl p-6 mb-6">
          {/* Current Avatar & Role */}
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-400 to-cyan-300 p-1">
                <img 
                  src={selectedAvatar || AVATAR_PRESETS[0].url} 
                  alt="Avatar"
                  className="w-full h-full rounded-full object-cover bg-white"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center">
                <Camera size={14} className="text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                {displayName || user?.user_metadata?.full_name || 'Người dùng'}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${roleInfo.color}`}>
                  <roleInfo.icon size={12} />
                  {roleInfo.label}
                </span>
              </div>
              {user?.email && (
                <div className="flex items-center gap-1 text-sm text-gray-500 mt-2">
                  <Mail size={14} />
                  {user.email}
                </div>
              )}
            </div>
          </div>

          {error && <Alert variant="error" className="mb-6">{error}</Alert>}
          {saved && (
            <Alert variant="success" className="mb-6">
              <Check size={16} className="inline mr-2" />
              Đã lưu thay đổi!
            </Alert>
          )}

          {/* Avatar Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Chọn ảnh đại diện
            </label>
            
            {/* Photo Upload for Counselors */}
            {(isCounselor || isAdmin) && (
              <div className="mb-4">
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-dashed border-purple-300">
                  <div className="relative">
                    {selectedAvatar && !AVATAR_PRESETS.some(a => a.url === selectedAvatar) ? (
                      <div className="relative">
                        <img 
                          src={selectedAvatar} 
                          alt="Custom avatar"
                          className="w-16 h-16 rounded-full object-cover"
                        />
                        <button
                          onClick={() => setSelectedAvatar(AVATAR_PRESETS[0].url)}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                        <Camera size={24} className="text-purple-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 mb-1">Tải ảnh của bạn</p>
                    <p className="text-sm text-gray-500 mb-2">PNG, JPG tối đa 5MB</p>
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg cursor-pointer hover:bg-purple-600 transition-colors text-sm">
                      {uploading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Đang tải...
                        </>
                      ) : (
                        <>
                          <Upload size={16} />
                          Chọn ảnh
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        disabled={uploading}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  — hoặc chọn từ bộ sưu tập bên dưới —
                </p>
              </div>
            )}

            {/* Preset Avatars */}
            <div className="grid grid-cols-5 gap-3">
              {AVATAR_PRESETS.map(avatar => (
                <button
                  key={avatar.id}
                  onClick={() => setSelectedAvatar(avatar.url)}
                  className={`relative p-1 rounded-full transition-all ${
                    selectedAvatar === avatar.url
                      ? 'ring-2 ring-teal-500 ring-offset-2 scale-110'
                      : 'hover:scale-105'
                  }`}
                  title={avatar.name}
                >
                  <img 
                    src={avatar.url} 
                    alt={avatar.name}
                    className="w-14 h-14 rounded-full object-cover bg-gray-100"
                  />
                  {selectedAvatar === avatar.url && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center">
                      <Check size={12} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Display Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên hiển thị
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Nhập tên của bạn"
              className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
            />
          </div>

          {/* Specialty (for counselors) */}
          {(isCounselor || isAdmin) && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chuyên môn
              </label>
              <input
                type="text"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="VD: Tư vấn tâm lý học đường, Hỗ trợ stress..."
                className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
              />
            </div>
          )}

          {/* Bio (for counselors) */}
          {(isCounselor || isAdmin) && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giới thiệu bản thân
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Chia sẻ về kinh nghiệm, phương pháp tư vấn của bạn..."
                className="w-full p-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none resize-none h-32"
              />
            </div>
          )}

          {/* Save Button */}
          <Button
            onClick={handleSave}
            loading={loading}
            disabled={loading}
            size="lg"
            className="w-full"
            icon={Save}
          >
            Lưu thay đổi
          </Button>
        </div>

        {/* Password Change Section */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-xl overflow-hidden mb-6">
          <button
            onClick={() => {
              setShowPasswordSection(!showPasswordSection)
              setPasswordError('')
              setPasswordSuccess(false)
            }}
            className="w-full flex items-center justify-between p-6 hover:bg-gray-50/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <Lock size={20} className="text-amber-600" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800">Đổi mật khẩu</h3>
                <p className="text-sm text-gray-500">Cập nhật mật khẩu tài khoản của bạn</p>
              </div>
            </div>
            {showPasswordSection ? (
              <ChevronUp size={20} className="text-gray-400" />
            ) : (
              <ChevronDown size={20} className="text-gray-400" />
            )}
          </button>

          {showPasswordSection && (
            <div className="px-6 pb-6 border-t border-gray-100">
              <div className="pt-4 space-y-4">
                {passwordError && (
                  <Alert variant="error">{passwordError}</Alert>
                )}
                {passwordSuccess && (
                  <Alert variant="success">
                    <Check size={16} className="inline mr-2" />
                    Đổi mật khẩu thành công!
                  </Alert>
                )}

                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mật khẩu hiện tại
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Nhập mật khẩu hiện tại"
                      className="w-full p-3 pr-12 rounded-xl bg-gray-50 border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mật khẩu mới
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                      className="w-full p-3 pr-12 rounded-xl bg-gray-50 border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Xác nhận mật khẩu mới
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu mới"
                      className="w-full p-3 pr-12 rounded-xl bg-gray-50 border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* Change Password Button */}
                <Button
                  onClick={handleChangePassword}
                  loading={passwordLoading}
                  disabled={passwordLoading || !currentPassword || !newPassword || !confirmNewPassword}
                  variant="primary"
                  className="w-full bg-amber-500 hover:bg-amber-600"
                  icon={Lock}
                >
                  Đổi mật khẩu
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Demo Mode Info */}
        {isDemoMode && (
          <div className="text-center text-sm text-gray-500">
            <p>🔧 Demo Mode: Thay đổi sẽ chỉ lưu trong phiên hiện tại</p>
          </div>
        )}
      </div>
    </div>
  )
}
