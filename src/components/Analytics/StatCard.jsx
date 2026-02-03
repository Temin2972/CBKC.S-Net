/**
 * StatCard Component
 * Displays a single statistic with icon and trend
 */
import { ArrowUp, ArrowDown, Minus } from 'lucide-react'

export default function StatCard({
    title,
    value,
    icon: Icon,
    trend = null, // percentage change
    trendLabel = '',
    color = 'purple',
    loading = false
}) {
    const colorClasses = {
        purple: 'from-purple-500 to-indigo-500',
        blue: 'from-blue-500 to-cyan-500',
        green: 'from-green-500 to-emerald-500',
        orange: 'from-orange-500 to-amber-500',
        pink: 'from-pink-500 to-rose-500',
        red: 'from-red-500 to-rose-500'
    }

    const getTrendIcon = () => {
        if (trend === null) return null
        if (trend > 0) return <ArrowUp size={14} className="text-green-500" />
        if (trend < 0) return <ArrowDown size={14} className="text-red-500" />
        return <Minus size={14} className="text-gray-400" />
    }

    const getTrendColor = () => {
        if (trend === null) return ''
        if (trend > 0) return 'text-green-600'
        if (trend < 0) return 'text-red-600'
        return 'text-gray-500'
    }

    return (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className={`h-1 bg-gradient-to-r ${colorClasses[color] || colorClasses.purple}`} />

            <div className="p-5">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm text-gray-500 font-medium">{title}</p>

                        {loading ? (
                            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse mt-1" />
                        ) : (
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">
                                {typeof value === 'number' ? value.toLocaleString('vi-VN') : value}
                            </h3>
                        )}

                        {trend !== null && !loading && (
                            <div className={`flex items-center gap-1 mt-2 text-sm ${getTrendColor()}`}>
                                {getTrendIcon()}
                                <span className="font-medium">
                                    {trend > 0 ? '+' : ''}{trend}%
                                </span>
                                {trendLabel && (
                                    <span className="text-gray-400 ml-1">{trendLabel}</span>
                                )}
                            </div>
                        )}
                    </div>

                    {Icon && (
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color] || colorClasses.purple} text-white`}>
                            <Icon size={22} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
