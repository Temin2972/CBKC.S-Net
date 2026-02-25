import { useState } from 'react'
import Navbar from '../components/Layout/Navbar'
import Footer from '../components/Layout/Footer'
import { CalendarClock, Clock, MapPin, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import BookingForm from '../components/Appointments/BookingForm'
import AppointmentList from '../components/Appointments/AppointmentList'

// =====================================================
// BOOKING MODE CONFIGURATION
// =====================================================
// Set to 'native' for built-in booking system
// Set to 'google' for Google Form embedded booking
// Change this single value to switch between modes
const BOOKING_MODE = 'native'

// Google Form URL (only used when BOOKING_MODE = 'google')
const GOOGLE_FORM_EMBED_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfkEdnDGQ23qAX8PKsj9O5DMn4ilu9Yc36qyL0xntdzemtujQ/viewform?embedded=true'
// =====================================================

export default function Booking() {
  const { id: userId, isCounselor } = useAuth()

  // Counselors see the appointment management view
  if (isCounselor) {
    return (
      <div className="min-h-screen relative">
        {/* Background */}
        <div
          className="fixed inset-0 z-0"
          style={{
            backgroundImage: `url('/images/flying.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(3px) brightness(0.9)'
          }}
        />
        <div className="fixed inset-0 z-0 bg-gradient-to-br from-purple-900/20 via-indigo-800/10 to-blue-900/20" />

        <div className="relative z-10">
          <Navbar />
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6">
              <AppointmentList />
            </div>
          </div>
          <Footer />
        </div>
      </div>
    )
  }

  // Students see the booking form
  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url('/images/flying.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(3px) brightness(0.9)'
        }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-green-900/20 via-teal-800/10 to-cyan-900/20" />

      <div className="relative z-10">
        <Navbar />

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-white/20 backdrop-blur-sm rounded-2xl mb-4">
              <CalendarClock size={48} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-3">
              Đặt lịch tư vấn trực tiếp
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Đặt lịch hẹn để gặp trực tiếp tư vấn viên tại phòng tham vấn tâm lý học đường
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            {/* Left Column - Info Cards */}
            <div className="lg:col-span-1 space-y-6">
              {/* Working Hours Card */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Clock size={24} className="text-blue-600" />
                  </div>
                  <h3 className="font-bold text-gray-800 text-lg">Giờ làm việc</h3>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <p className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800">Thứ 2 - Thứ 6:</span>
                    <span>7:30 - 16:45</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800">Thứ 7 - CN:</span>
                    <span>Nghỉ</span>
                  </p>
                </div>
              </div>

              {/* Location Card */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <MapPin size={24} className="text-green-600" />
                  </div>
                  <h3 className="font-bold text-gray-800 text-lg">Địa điểm</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Phòng Tham vấn Tâm lý<br />
                  Tầng 1, Tòa nhà Gamma<br />
                  THPT FPT Hà Nội, Khu Công nghệ cao Hòa Lạc
                </p>
              </div>

              {/* Instructions Card */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <AlertCircle size={24} className="text-purple-600" />
                  </div>
                  <h3 className="font-bold text-gray-800 text-lg">Lưu ý</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Điền đầy đủ thông tin trong form</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Chọn khung giờ phù hợp với lịch học</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Đến đúng giờ đã đặt</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Liên hệ trước nếu cần hủy lịch</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Right Column - Booking Form */}
            <div className="lg:col-span-2">
              {BOOKING_MODE === 'native' ? (
                // Native Booking Form
                <BookingForm userId={userId} />
              ) : (
                // Google Form Embed
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    Form đặt lịch
                  </h2>
                  
                  {/* Google Form Container */}
                  <div className="relative w-full" style={{ height: 'calc(100vh - 250px)', minHeight: '600px' }}>
                    <iframe
                      src={GOOGLE_FORM_EMBED_URL}
                      className="w-full h-full border-0 rounded-lg"
                      frameBorder="0"
                      marginHeight="0"
                      marginWidth="0"
                      title="Form đặt lịch tư vấn"
                    >
                      Đang tải...
                    </iframe>
                  </div>

                  {/* Help Text */}
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-800">
                        <p className="font-semibold mb-1">Cần hỗ trợ?</p>
                        <p>Nếu bạn gặp khó khăn khi đặt lịch hoặc form không hiển thị, vui lòng liên hệ trực tiếp tại phòng tham vấn hoặc chat với tư vấn viên.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Info Banner */}
          <div className="mt-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6">
            <h3 className="font-bold text-gray-800 mb-3 text-center">
              📌 Quy trình tư vấn trực tiếp
            </h3>
            <div className="grid md:grid-cols-4 gap-4 text-center">
              <div className="p-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 font-bold text-lg">
                  1
                </div>
                <p className="text-sm font-semibold text-gray-800 mb-1">Đặt lịch</p>
                <p className="text-xs text-gray-600">Điền form đặt lịch hẹn</p>
              </div>
              <div className="p-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 font-bold text-lg">
                  2
                </div>
                <p className="text-sm font-semibold text-gray-800 mb-1">Xác nhận</p>
                <p className="text-xs text-gray-600">Tư vấn viên xác nhận lịch hẹn</p>
              </div>
              <div className="p-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 font-bold text-lg">
                  3
                </div>
                <p className="text-sm font-semibold text-gray-800 mb-1">Đến gặp</p>
                <p className="text-xs text-gray-600">Đến phòng tư vấn đúng giờ</p>
              </div>
              <div className="p-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 font-bold text-lg">
                  4
                </div>
                <p className="text-sm font-semibold text-gray-800 mb-1">Tư vấn</p>
                <p className="text-xs text-gray-600">Gặp tư vấn viên và chia sẻ</p>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  )
}
