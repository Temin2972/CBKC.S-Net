/**
 * CalmModeToggle Component
 * Provides a toggle switch for Calm Mode
 * Reduces animations and visual complexity for better focus
 */
import { Moon, Sun, Sparkles } from 'lucide-react'
import { useSettings } from '../../contexts/SettingsContext'

export default function CalmModeToggle({ compact = false }) {
    const { calmMode, toggleCalmMode } = useSettings()

    if (compact) {
        // Compact version for navbar
        return (
            <button
                onClick={toggleCalmMode}
                className={`p-2 rounded-full transition-all ${calmMode
                        ? 'bg-indigo-100 text-indigo-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                title={calmMode ? 'Tắt chế độ yên tĩnh' : 'Bật chế độ yên tĩnh'}
                aria-label={calmMode ? 'Tắt chế độ yên tĩnh' : 'Bật chế độ yên tĩnh'}
            >
                {calmMode ? <Moon size={20} /> : <Sparkles size={20} />}
            </button>
        )
    }

    // Full version with label
    return (
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
                {calmMode ? (
                    <Moon size={18} className="text-indigo-600" />
                ) : (
                    <Sparkles size={18} className="text-purple-500" />
                )}
                <span className="text-sm font-medium text-gray-700">
                    Chế độ yên tĩnh
                </span>
            </div>

            <button
                onClick={toggleCalmMode}
                className={`relative w-12 h-6 rounded-full transition-colors ${calmMode ? 'bg-indigo-500' : 'bg-gray-300'
                    }`}
                role="switch"
                aria-checked={calmMode}
                aria-label="Chế độ yên tĩnh"
            >
                <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-transform ${calmMode ? 'translate-x-7' : 'translate-x-1'
                        }`}
                />
            </button>

            {calmMode && (
                <span className="text-xs text-indigo-600 animate-fade-in">
                    Đang bật
                </span>
            )}
        </div>
    )
}
