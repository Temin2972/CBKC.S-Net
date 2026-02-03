/**
 * Settings Context Provider
 * Manages user preferences like Calm Mode
 */
import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'

const SettingsContext = createContext(null)

// Settings keys for localStorage
const STORAGE_KEYS = {
    CALM_MODE: 's-net-calm-mode',
    REDUCED_MOTION: 's-net-reduced-motion'
}

export function SettingsProvider({ children }) {
    // Initialize from localStorage or system preference
    const [calmMode, setCalmModeState] = useState(() => {
        const stored = localStorage.getItem(STORAGE_KEYS.CALM_MODE)
        if (stored !== null) return stored === 'true'
        // Default: respect prefers-reduced-motion
        return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches || false
    })

    // Persist to localStorage
    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.CALM_MODE, String(calmMode))

        // Also update document class for global CSS targeting
        if (calmMode) {
            document.documentElement.classList.add('calm-mode')
        } else {
            document.documentElement.classList.remove('calm-mode')
        }
    }, [calmMode])

    // Listen for system preference changes
    useEffect(() => {
        const mediaQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)')

        const handleChange = (e) => {
            // Only auto-update if user hasn't manually set preference
            const stored = localStorage.getItem(STORAGE_KEYS.CALM_MODE)
            if (stored === null) {
                setCalmModeState(e.matches)
            }
        }

        mediaQuery?.addEventListener?.('change', handleChange)
        return () => mediaQuery?.removeEventListener?.('change', handleChange)
    }, [])

    const setCalmMode = useCallback((value) => {
        setCalmModeState(value)
    }, [])

    const toggleCalmMode = useCallback(() => {
        setCalmModeState(prev => !prev)
    }, [])

    const value = useMemo(() => ({
        calmMode,
        setCalmMode,
        toggleCalmMode
    }), [calmMode, setCalmMode, toggleCalmMode])

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    )
}

/**
 * Hook to access settings context
 */
export function useSettings() {
    const context = useContext(SettingsContext)

    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider')
    }

    return context
}

export default SettingsContext
