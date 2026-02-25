/**
 * Donate Page Component
 * Support the project
 */
import Navbar from '../components/Layout/Navbar'
import Footer from '../components/Layout/Footer'
import { 
  Heart, 
  Coffee, 
  Gift,
  Sparkles,
  CheckCircle2,
  Copy,
  ExternalLink
} from 'lucide-react'
import { useState } from 'react'

const BENEFITS = [
  'Hỗ trợ duy trì và phát triển S-Net',
  'Giúp đỡ nhiều học sinh hơn',
  'Cải thiện tính năng và trải nghiệm',
  'Duy trì server và bảo mật dữ liệu',
  'Phát triển tính năng mới'
]

const BANK_INFO = {
  bank: 'MBBank',
  accountNumber: '02127928888',
  accountName: 'NGO MINH CHIEN',
  branch: 'Chi nhánh Hà Nội'
}

export default function Donate() {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-100 rounded-full text-rose-700 text-sm font-medium mb-4">
              <Heart size={16} className="fill-current" />
              Ủng hộ dự án
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              Cùng chung tay phát triển S-Net
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Mọi đóng góp đều giúp chúng tôi duy trì và phát triển nền tảng, 
              mang đến sự hỗ trợ tâm lý cho nhiều học sinh hơn.
            </p>
          </div>

          {/* Benefits */}
          <div className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl p-8 text-white mb-12">
            <h2 className="text-2xl font-semibold mb-6">Đóng góp của bạn giúp</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {BENEFITS.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle2 size={20} className="text-teal-200 flex-shrink-0" />
                  <span className="text-teal-50">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bank Transfer */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Chuyển khoản ngân hàng</h2>
            
            <div className="bg-gray-50 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Ngân hàng</p>
                  <p className="font-semibold text-gray-800">{BANK_INFO.bank}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Số tài khoản</p>
                  <p className="font-semibold text-gray-800 font-mono text-lg">{BANK_INFO.accountNumber}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(BANK_INFO.accountNumber)}
                  className={`p-2 rounded-lg transition-colors ${
                    copied ? 'bg-teal-100 text-teal-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {copied ? <CheckCircle2 size={20} /> : <Copy size={20} />}
                </button>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Chủ tài khoản</p>
                <p className="font-semibold text-gray-800">{BANK_INFO.accountName}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Chi nhánh</p>
                <p className="font-semibold text-gray-800">{BANK_INFO.branch}</p>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-1">Nội dung chuyển khoản</p>
                <p className="font-mono bg-white p-3 rounded-lg text-teal-600 font-medium">
                  SNET [Tên của bạn]
                </p>
              </div>
            </div>

            <p className="text-center text-gray-500 text-sm mt-6">
              Cảm ơn bạn đã ủng hộ S-Net! ❤️
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
