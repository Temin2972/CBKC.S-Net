/**
 * ScheduleEditor Component
 * Weekly schedule editor for counselors
 */
import { useState } from 'react'
import { Plus, X, Clock, Save, Loader2 } from 'lucide-react'
import { WEEK_DAYS } from '../../hooks/useCounselorAvailability'

export default function ScheduleEditor({
    schedule = {},
    onSave,
    saving = false
}) {
    const [localSchedule, setLocalSchedule] = useState(schedule)
    const [hasChanges, setHasChanges] = useState(false)

    const handleAddSlot = (day) => {
        const newSchedule = { ...localSchedule }
        const slots = newSchedule[day] || []
        slots.push({ start: '09:00', end: '17:00' })
        newSchedule[day] = slots
        setLocalSchedule(newSchedule)
        setHasChanges(true)
    }

    const handleRemoveSlot = (day, index) => {
        const newSchedule = { ...localSchedule }
        newSchedule[day] = newSchedule[day].filter((_, i) => i !== index)
        setLocalSchedule(newSchedule)
        setHasChanges(true)
    }

    const handleTimeChange = (day, index, field, value) => {
        const newSchedule = { ...localSchedule }
        newSchedule[day] = [...(newSchedule[day] || [])]
        newSchedule[day][index] = {
            ...newSchedule[day][index],
            [field]: value
        }
        setLocalSchedule(newSchedule)
        setHasChanges(true)
    }

    const handleSave = async () => {
        await onSave(localSchedule)
        setHasChanges(false)
    }

    return (
        <div className="bg-white rounded-xl border shadow-sm">
            <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Clock size={20} className="text-purple-500" />
                    <h3 className="font-semibold text-gray-900">Lịch làm việc hàng tuần</h3>
                </div>
                {hasChanges && (
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
                    >
                        {saving ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <Save size={16} />
                        )}
                        Lưu thay đổi
                    </button>
                )}
            </div>

            <div className="p-4 space-y-4">
                {Object.entries(WEEK_DAYS).map(([dayKey, dayLabel]) => {
                    const slots = localSchedule[dayKey] || []

                    return (
                        <div key={dayKey} className="flex gap-4 items-start">
                            <div className="w-24 pt-2 text-sm font-medium text-gray-700">
                                {dayLabel}
                            </div>

                            <div className="flex-1 space-y-2">
                                {slots.length === 0 ? (
                                    <span className="text-sm text-gray-400 italic">Nghỉ</span>
                                ) : (
                                    slots.map((slot, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <input
                                                type="time"
                                                value={slot.start}
                                                onChange={(e) => handleTimeChange(dayKey, index, 'start', e.target.value)}
                                                className="px-2 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                            />
                                            <span className="text-gray-400">đến</span>
                                            <input
                                                type="time"
                                                value={slot.end}
                                                onChange={(e) => handleTimeChange(dayKey, index, 'end', e.target.value)}
                                                className="px-2 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                            />
                                            <button
                                                onClick={() => handleRemoveSlot(dayKey, index)}
                                                className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))
                                )}

                                <button
                                    onClick={() => handleAddSlot(dayKey)}
                                    className="flex items-center gap-1 text-sm text-purple-500 hover:text-purple-600"
                                >
                                    <Plus size={14} />
                                    Thêm khung giờ
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className="p-4 border-t bg-gray-50 text-xs text-gray-500">
                💡 Bạn có thể thêm nhiều khung giờ trong ngày. Để lại trống nếu nghỉ ngày đó.
            </div>
        </div>
    )
}
