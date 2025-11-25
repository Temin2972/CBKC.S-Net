import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Student signup - username only (no email)
  const signUpStudent = async (username, password, fullName) => {
    try {
      // Use Gmail format which Supabase definitely accepts
      // Format: username+student@gmail.com
      // The +student tag ensures it won't conflict with real emails
      const email = `${username}.student@mentalhealth.app`
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            full_name: fullName,
            role: 'student'
          }
        }
      })
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Login with username (for students) or email (for counselors)
  const signIn = async (identifier, password) => {
    try {
      let email = identifier
      
      // Check if it's a username (no @ symbol)
      if (!identifier.includes('@')) {
        // Convert username to the same email format used in signup
        email = `${identifier}.student@mentalhealth.app`
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  return { user, loading, signUpStudent, signIn, signOut }
}
