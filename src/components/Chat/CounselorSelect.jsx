import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { Star, MessageCircle } from 'lucide-react'

export default function CounselorSelect({ onSelect }) {
  const [counselors, setCounselors] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCounselors()
  }, [])

  const fetchCounselors = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'counselor')

    if (!error) {
      setCounselors(data || [])
    }
    setLoading(false)
  }

  if (loading) {
    return <div className="text-center py-12">Đang tải...</div>
  }

  return (
    <div className="grid gap-4">
      {counselors.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <MessageCircle size={48} className="mx-auto mb-4 text-gray-300" />
          <p>Hiện chưa có tư vấn viên nào</p>
        </div>
      ) : (
        counselors.map((counselor) => (
          <div
            key={counselor.id}
            onClick={() => onSelect(counselor)}
            className="p-6 bg-white rounded-xl shadow-lg border-2 border-transparent hover:border-purple-500 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {counselor.full_name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    {counselor.full_name}
                  </h3>
                  <p className="text-gray-600">{counselor.specialty || 'Tư vấn chung'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Star className="text-yellow-500 fill-yellow-500" size={16} />
                    <span className="text-sm text-gray-600">
                      5.0 (0 đánh giá)
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Đang hoạt động</span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
