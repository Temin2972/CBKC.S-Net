import { useState } from 'react'
import { Check, ChevronRight, User, Sparkles, X } from 'lucide-react'

export default function CounselorSelector({ 
  counselors, 
  loading, 
  onSelect, 
  onCancel 
}) {
  const [selectedCounselor, setSelectedCounselor] = useState(null)

  const handleSelect = (counselor) => {
    setSelectedCounselor(counselor)
  }

  const handleConfirm = () => {
    onSelect(selectedCounselor)
  }

  const handleSkip = () => {
    onSelect(null) // Không chọn ai, tạo phòng chung
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-600 mt-3">Đang tải danh sách tư vấn viên...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <div className="inline-block p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl mb-3">
          <Sparkles size={32} className="text-purple-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          Chọn Tư vấn viên
        </h3>
        <p className="text-gray-600 mb-1">
          Bạn có thể chọn tư vấn viên mà bạn muốn trao đổi
        </p>
        <p className="text-sm text-gray-500">
          Hoặc bỏ qua để tất cả tư vấn viên đều có thể hỗ trợ bạn
        </p>
      </div>

      {/* Counselors List */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {counselors.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <User size={48} className="mx-auto mb-3 opacity-50" />
            <p>Chưa có tư vấn viên nào trong hệ thống</p>
          </div>
        ) : (
          counselors.map((counselor) => (
            <button
              key={counselor.id}
              onClick={() => handleSelect(counselor)}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left group hover:shadow-lg ${
                selectedCounselor?.id === counselor.id
                  ? 'border-purple-500 bg-purple-50 shadow-lg'
                  : 'border-gray-200 bg-white hover:border-purple-300'
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className={`w-14 h-14 bg-gradient-to-br ${counselor.avatarColor} rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0 group-hover:scale-110 transition-transform`}>
                  {counselor.displayName[0]}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-800 truncate">
                      {counselor.displayName}
                    </h4>
                    {counselor.role === 'admin' && (
                      <span className="px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-semibold rounded-full">
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {counselor.description}
                  </p>
                </div>

                {/* Check Mark */}
                <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  selectedCounselor?.id === counselor.id
                    ? 'border-purple-500 bg-purple-500'
                    : 'border-gray-300 group-hover:border-purple-300'
                }`}>
                  {selectedCounselor?.id === counselor.id && (
                    <Check size={16} className="text-white" />
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={onCancel}
          className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium flex items-center justify-center gap-2"
        >
          <X size={20} />
          Hủy
        </button>

        <button
          onClick={handleSkip}
          className="flex-1 px-6 py-3 bg-white border-2 border-purple-300 text-purple-600 rounded-xl hover:bg-purple-50 transition-colors font-medium flex items-center justify-center gap-2"
        >
          Bỏ qua
        </button>

        <button
          onClick={handleConfirm}
          disabled={!selectedCounselor}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {selectedCounselor ? (
            <>
              <Check size={20} />
              Xác nhận
            </>
          ) : (
            <>
              <ChevronRight size={20} />
              Chọn tư vấn viên
            </>
          )}
        </button>
      </div>

      {/* Selected Preview */}
      {selectedCounselor && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 bg-gradient-to-br ${selectedCounselor.avatarColor} rounded-full flex items-center justify-center text-white font-bold`}>
              {selectedCounselor.displayName[0]}
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600">Bạn đã chọn:</p>
              <p className="font-semibold text-purple-700">
                {selectedCounselor.displayName}
              </p>
            </div>
            <Sparkles size={20} className="text-purple-500" />
          </div>
        </div>
      )}
    </div>
  )
}
