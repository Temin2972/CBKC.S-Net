/**
 * AnalyticsDashboard Component
 * Main dashboard displaying platform statistics
 */
import { useState } from 'react'
import {
    Users, MessageCircle, FileText, Activity,
    UserCheck, Shield, TrendingUp, Calendar
} from 'lucide-react'
import { useAnalytics, DATE_RANGE_OPTIONS } from '../../hooks/useAnalytics'
import StatCard from './StatCard'

export default function AnalyticsDashboard() {
    const [dateRange, setDateRange] = useState('week')
    const { stats, loading } = useAnalytics(dateRange)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Thống kê</h1>
                    <p className="text-gray-500">Tổng quan hoạt động nền tảng</p>
                </div>

                {/* Date range selector */}
                <div className="flex items-center gap-2 bg-white rounded-lg border p-1">
                    {DATE_RANGE_OPTIONS.map(option => (
                        <button
                            key={option.value}
                            onClick={() => setDateRange(option.value)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${dateRange === option.value
                                    ? 'bg-purple-500 text-white'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Tổng người dùng"
                    value={stats?.users?.total || 0}
                    icon={Users}
                    color="purple"
                    loading={loading}
                />
                <StatCard
                    title="Học sinh"
                    value={stats?.users?.students || 0}
                    icon={UserCheck}
                    color="blue"
                    loading={loading}
                />
                <StatCard
                    title="Tư vấn viên"
                    value={stats?.users?.counselors || 0}
                    icon={Shield}
                    color="green"
                    loading={loading}
                />
                <StatCard
                    title="Chat đang hoạt động"
                    value={stats?.chats?.active || 0}
                    icon={Activity}
                    color="orange"
                    loading={loading}
                />
            </div>

            {/* Second row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                    title="Tin nhắn"
                    value={stats?.messages?.total || 0}
                    icon={MessageCircle}
                    color="pink"
                    loading={loading}
                    trendLabel="trong kỳ"
                />
                <StatCard
                    title="Cuộc trò chuyện mới"
                    value={stats?.chats?.total || 0}
                    icon={TrendingUp}
                    color="blue"
                    loading={loading}
                    trendLabel="trong kỳ"
                />
                <StatCard
                    title="Bài đăng cộng đồng"
                    value={stats?.posts?.total || 0}
                    icon={FileText}
                    color="green"
                    loading={loading}
                    trendLabel="trong kỳ"
                />
            </div>

            {/* Summary card */}
            <div className="bg-white rounded-xl border shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Calendar size={20} className="text-purple-500" />
                    <h3 className="font-semibold text-gray-900">Tóm tắt hoạt động</h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                        <p className="text-sm text-gray-500">TB tin nhắn/chat</p>
                        <p className="text-xl font-bold text-gray-900">
                            {loading ? '...' : stats?.chats?.avgMessages || 0}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Tỷ lệ counselor/student</p>
                        <p className="text-xl font-bold text-gray-900">
                            {loading ? '...' : (
                                stats?.users?.students > 0
                                    ? `1:${Math.round(stats.users.students / (stats.users.counselors || 1))}`
                                    : '0'
                            )}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Kỳ thống kê</p>
                        <p className="text-sm font-medium text-gray-700">
                            {DATE_RANGE_OPTIONS.find(o => o.value === dateRange)?.label}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Trạng thái</p>
                        <p className="text-sm font-medium text-green-600 flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            Hoạt động bình thường
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
