/**
 * StudentAssessmentPanel Component
 * Displays AI-generated assessment of student for counselors
 */
import { useState } from 'react'
import {
    AlertTriangle, Brain, Heart, Shield, ChevronDown, ChevronUp,
    AlertCircle, CheckCircle, Clock, RefreshCw, User, FileText
} from 'lucide-react'
import { getUrgencyConfig, URGENCY_LEVELS } from '../../lib/aiTriage'

const SUICIDE_RISK_CONFIG = {
    none: { label: 'Không có', color: 'text-green-600', bg: 'bg-green-50', icon: '✓' },
    low: { label: 'Thấp', color: 'text-yellow-600', bg: 'bg-yellow-50', icon: '⚠' },
    medium: { label: 'Trung bình', color: 'text-orange-600', bg: 'bg-orange-50', icon: '⚠️' },
    high: { label: 'Cao - CẦN CAN THIỆP', color: 'text-red-600', bg: 'bg-red-50', icon: '🚨' }
}

export default function StudentAssessmentPanel({
    assessment,
    studentName = 'Học sinh',
    onRefresh,
    isRefreshing = false,
    compact = false
}) {
    const [expanded, setExpanded] = useState(!compact)

    if (!assessment) {
        return (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center gap-2 text-gray-500">
                    <Brain size={18} />
                    <span className="text-sm">Chưa có đánh giá từ AI</span>
                </div>
            </div>
        )
    }

    const urgencyConfig = getUrgencyConfig(assessment.urgencyLevel)
    const suicideRiskConfig = SUICIDE_RISK_CONFIG[assessment.suicideRisk] || SUICIDE_RISK_CONFIG.none
    const isHighRisk = assessment.urgencyLevel >= URGENCY_LEVELS.URGENT ||
        assessment.suicideRisk === 'medium' ||
        assessment.suicideRisk === 'high'

    return (
        <div className={`rounded-xl border overflow-hidden ${isHighRisk ? 'border-red-300 bg-red-50/50' : 'border-gray-200 bg-white'
            }`}>
            {/* Header - Always visible */}
            <div
                className={`p-4 cursor-pointer ${isHighRisk ? 'bg-red-50' : 'bg-gray-50'}`}
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${urgencyConfig.bgColor}`}>
                            <Brain size={20} className={urgencyConfig.textColor} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-gray-900">Đánh giá AI</h3>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${urgencyConfig.bgColor} ${urgencyConfig.textColor}`}>
                                    {urgencyConfig.icon} {urgencyConfig.label}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500">{studentName}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {onRefresh && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onRefresh(); }}
                                disabled={isRefreshing}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors"
                                title="Cập nhật đánh giá"
                            >
                                <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                            </button>
                        )}
                        {expanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                    </div>
                </div>

                {/* Quick summary always visible */}
                {assessment.summary && (
                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                        {assessment.summary}
                    </p>
                )}
            </div>

            {/* Expanded content */}
            {expanded && (
                <div className="p-4 space-y-4 border-t border-gray-100">
                    {/* Suicide Risk Alert */}
                    {assessment.suicideRisk && assessment.suicideRisk !== 'none' && (
                        <div className={`p-3 rounded-xl ${suicideRiskConfig.bg} border ${assessment.suicideRisk === 'high' ? 'border-red-300' : 'border-orange-200'
                            }`}>
                            <div className="flex items-center gap-2">
                                <AlertTriangle size={18} className={suicideRiskConfig.color} />
                                <span className={`font-semibold ${suicideRiskConfig.color}`}>
                                    Nguy cơ tự hại: {suicideRiskConfig.label}
                                </span>
                            </div>
                            {assessment.suicideRisk === 'high' && (
                                <p className="text-sm text-red-600 mt-1">
                                    ⚠️ Cần can thiệp ngay lập tức. Liên hệ với học sinh và cân nhắc thông báo phụ huynh/ban giám hiệu.
                                </p>
                            )}
                        </div>
                    )}

                    {/* Emotional State */}
                    {assessment.emotionalState && (
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center shrink-0">
                                <Heart size={16} className="text-purple-500" />
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-gray-700">Trạng thái cảm xúc</h4>
                                <p className="text-sm text-gray-600">{assessment.emotionalState}</p>
                            </div>
                        </div>
                    )}

                    {/* Main Issues */}
                    {assessment.mainIssues?.length > 0 && (
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                                <FileText size={16} className="text-blue-500" />
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-gray-700">Vấn đề chính</h4>
                                <ul className="mt-1 space-y-1">
                                    {assessment.mainIssues.map((issue, i) => (
                                        <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                                            {issue}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Risk Factors */}
                    {assessment.riskFactors?.length > 0 && (
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
                                <AlertCircle size={16} className="text-red-500" />
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-gray-700">Yếu tố nguy cơ</h4>
                                <ul className="mt-1 space-y-1">
                                    {assessment.riskFactors.map((factor, i) => (
                                        <li key={i} className="text-sm text-red-600 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                                            {factor}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Protective Factors */}
                    {assessment.protectiveFactors?.length > 0 && (
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
                                <Shield size={16} className="text-green-500" />
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-gray-700">Yếu tố bảo vệ</h4>
                                <ul className="mt-1 space-y-1">
                                    {assessment.protectiveFactors.map((factor, i) => (
                                        <li key={i} className="text-sm text-green-600 flex items-center gap-2">
                                            <CheckCircle size={12} />
                                            {factor}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Recommended Approach */}
                    {assessment.recommendedApproach && (
                        <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                            <h4 className="text-sm font-medium text-indigo-700 mb-1 flex items-center gap-2">
                                <Brain size={14} />
                                Gợi ý tiếp cận
                            </h4>
                            <p className="text-sm text-indigo-600">{assessment.recommendedApproach}</p>
                        </div>
                    )}

                    {/* Priority Note */}
                    {assessment.priorityNote && (
                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                            <p className="text-sm text-amber-700 flex items-center gap-2">
                                <Clock size={14} />
                                <strong>Lưu ý:</strong> {assessment.priorityNote}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
