/**
 * Contact Page Component
 * Contact information and map
 */
import Navbar from '../components/Layout/Navbar'
import Footer from '../components/Layout/Footer'
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageCircle,
  Facebook,
  ExternalLink
} from 'lucide-react'
import { EXTERNAL_LINKS } from '../constants'

/**
 * Google Maps Embed URL
 * Change this URL to update the embedded map location.
 * To get a new embed URL: Google Maps → Search location → Share → Embed a map → Copy the src URL
 */
const GOOGLE_MAP_EMBED_URL = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3860.148954386832!2d105.52532970953004!3d21.011379345390424!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31345bbfd675f23f%3A0x687158968ee822d6!2zVHLGsMahzIBuZyBUSFBUIEZQVCBIw6AgTuG7mWk!5e0!3m2!1svi!2s!4v1772094995690!5m2!1svi!2s'

/**
 * Map address details
 * Change these values to update the displayed address information.
 */
const MAP_ADDRESS = {
  department: 'Phòng Tâm lý Học đường',
  school: 'Trường THPT FPT Hà Nội',
  street: 'Khu Công nghệ cao Hòa Lạc',
  city: 'Thạch Thất, Hà Nội'
}

const CONTACT_METHODS = [
  {
    icon: Phone,
    title: 'Hotline Tâm lý',
    value: '1800 599 920',
    note: 'Miễn phí 24/7',
    href: 'tel:1800599920',
    color: 'from-green-400 to-emerald-500'
  },
  {
    icon: Mail,
    title: 'Email',
    value: 'support@snet.fpt.edu.vn',
    note: 'Phản hồi trong 24h',
    href: 'mailto:support@snet.fpt.edu.vn',
    color: 'from-blue-400 to-indigo-500'
  },
  {
    icon: Facebook,
    title: 'Facebook',
    value: 'Bức Thư Chiều Thứ 6',
    note: 'Fanpage chính thức',
    href: EXTERNAL_LINKS.FACEBOOK_FANPAGE,
    external: true,
    color: 'from-blue-500 to-blue-600'
  },
  {
    icon: Clock,
    title: 'Giờ làm việc',
    value: '7:30 - 16:45',
    note: 'Thứ 2 - Thứ 6',
    color: 'from-amber-400 to-orange-500'
  }
]

export default function Contact() {
  return (
    <div className="min-h-screen bg-animated-gradient relative overflow-hidden flex flex-col">
      {/* Floating Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="floating-orb floating-orb-1"></div>
        <div className="floating-orb floating-orb-2"></div>
        <div className="floating-orb floating-orb-3"></div>
      </div>

      <Navbar />

      <main className="flex-1 py-12 px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-100 rounded-full text-teal-700 text-sm font-medium mb-4">
              <MessageCircle size={16} />
              Liên hệ
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              Liên hệ với chúng tôi
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Bạn cần hỗ trợ hoặc có câu hỏi? Hãy liên hệ với chúng tôi qua các kênh dưới đây.
            </p>
          </div>

          {/* Contact Methods */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {CONTACT_METHODS.map((method, index) => (
              <a
                key={index}
                href={method.href}
                target={method.external ? '_blank' : undefined}
                rel={method.external ? 'noopener noreferrer' : undefined}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${method.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <method.icon className="text-white" size={24} />
                </div>
                <h3 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
                  {method.title}
                  {method.external && <ExternalLink size={14} className="text-gray-400" />}
                </h3>
                <p className="text-teal-600 font-medium">{method.value}</p>
                <p className="text-gray-500 text-sm">{method.note}</p>
              </a>
            ))}
          </div>

          {/* Map & Address — Full Width */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <MapPin className="text-teal-500" size={24} />
              Địa chỉ
            </h2>

            <div className="flex flex-wrap gap-x-8 gap-y-2 mb-6">
              <div>
                <h3 className="font-semibold text-gray-800">{MAP_ADDRESS.department}</h3>
                <p className="text-gray-600">{MAP_ADDRESS.school}</p>
              </div>
              <div className="text-gray-600">
                <p>{MAP_ADDRESS.street}</p>
                <p>{MAP_ADDRESS.city}</p>
              </div>
            </div>

            {/* Embedded Google Map */}
            <div className="rounded-xl overflow-hidden">
              <iframe
                src={GOOGLE_MAP_EMBED_URL}
                width="100%"
                height="450"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Bản đồ địa chỉ"
                className="w-full"
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
