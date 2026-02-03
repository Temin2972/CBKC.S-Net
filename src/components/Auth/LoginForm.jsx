/**
 * Login Form Component
 * Handles user authentication with email/username and password
 */
import { useState, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useForm, validators } from '../../hooks/useForm'
import { Input, PasswordInput, Button, Alert } from '../UI'
import { AUTH_MESSAGES, FORM_LABELS, BUTTON_LABELS } from '../../constants/messages'

export default function LoginForm({ onSuccess }) {
  const { signIn } = useAuth()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { values, errors, handleChange, validate } = useForm({
    email: '',
    password: '',
  })

  const validationSchema = {
    email: [validators.required('Email hoặc tên đăng nhập không được để trống')],
    password: [validators.required('Mật khẩu không được để trống')],
  }

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault()
      setError('')

      if (!validate(validationSchema)) return

      setLoading(true)

      const { error: signInError } = await signIn(values.email, values.password)

      if (signInError) {
        setError(AUTH_MESSAGES.LOGIN_ERROR)
        setLoading(false)
      } else {
        onSuccess?.()
      }
    },
    [values, signIn, validate, onSuccess]
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in-scale">
      <div className="list-item-enter" style={{ animationDelay: '0.1s' }}>
        <Input
          name="email"
          type="text"
          label={FORM_LABELS.EMAIL}
          value={values.email}
          onChange={handleChange}
          placeholder="your@email.com"
          error={errors.email}
          autoComplete="email"
          required
        />
      </div>

      <div className="list-item-enter" style={{ animationDelay: '0.2s' }}>
        <PasswordInput
          name="password"
          label={FORM_LABELS.PASSWORD}
          value={values.password}
          onChange={handleChange}
          placeholder="Nhập mật khẩu"
          error={errors.password}
          autoComplete="current-password"
          required
        />
      </div>

      {error && (
        <div className="animate-shake">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <div className="list-item-enter" style={{ animationDelay: '0.3s' }}>
        <Button
          type="submit"
          size="xl"
          loading={loading}
          disabled={loading}
          className="hover-pop w-full"
        >
          {loading ? AUTH_MESSAGES.LOGGING_IN : BUTTON_LABELS.LOGIN}
      </Button>
    </form>
  )
}
