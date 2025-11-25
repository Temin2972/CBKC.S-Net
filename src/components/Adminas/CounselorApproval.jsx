import { useState, useEffect } from 'react'
import { Check, X } from 'lucide-react'

export default function CounselorApproval() {
  const [pending, setPending] = useState([])

  // This is a placeholder - in production you'd fetch from Supabase
  useEffect(() => {
    // Fetch pending counselor applications
  }, [])

  const approve = (id) => {
    // Approve counselor logic
    console.log('Approve:', id)
  }

  const reject = (id) => {
    // Reject counselor logic
    console.log('Reject:', id)
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Duyệt tư vấn viên
      </h2>

      {pending.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Không có đơn đăng ký nào đang chờ duyệt
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map((counselor) => (
            <div key={counselor.id} className="border rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold">{counselor.name}</h3>
                  <p className="text-sm text-gray-600">{counselor.email}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => approve(counselor.id)}
                    className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    <Check size={18} />
                  </button>
                  <button
                    onClick={() => reject(counselor.id)}
                    className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

