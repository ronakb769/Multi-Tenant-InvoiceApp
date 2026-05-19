import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useForgotPasswordMutation } from '../../services/authApi'

const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
})

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false)
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation()

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  })

  const onSubmit = async (data) => {
    try {
      await forgotPassword(data).unwrap()
    } catch {
      // Silently succeed — backend never reveals whether email exists
    }
    setSubmitted(true)
  }

  return (
    <div className="min-vh-100 d-flex">
      {/* Left branded panel */}
      <div className="d-none d-lg-flex flex-column justify-content-center p-5 col-lg-5" style={{ background: 'var(--color-primary)', color: 'white' }}>
        <div className="d-flex align-items-center gap-3 mb-5">
          <i className="bi bi-receipt-cutoff fs-2" />
          <span className="fs-4 fw-bold">InvoicePro</span>
        </div>
        <h2 className="fw-bold mb-3">Forgot your password?</h2>
        <p className="text-white-75">No worries — enter your email and we'll send you a secure link to reset it.</p>
      </div>

      {/* Right form panel */}
      <div className="flex-grow-1 d-flex align-items-center justify-content-center p-4" style={{ background: 'var(--color-light-bg)' }}>
        <div className="w-100" style={{ maxWidth: 420 }}>
          <div className="text-center mb-4">
            <div className="d-lg-none mb-3">
              <i className="bi bi-receipt-cutoff fs-2" style={{ color: 'var(--color-primary)' }} />
            </div>
            <h3 className="fw-bold">Reset your password</h3>
            <p className="text-muted">Remember it? <Link to="/login" className="text-primary fw-semibold">Sign in</Link></p>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              {submitted ? (
                <div className="text-center py-3">
                  <div className="mb-3">
                    <i className="bi bi-envelope-check-fill fs-1" style={{ color: 'var(--color-primary)' }} />
                  </div>
                  <h5 className="fw-bold mb-2">Check your inbox</h5>
                  <p className="text-muted mb-4">
                    If that email address is registered, we've sent a password reset link. It expires in 1 hour.
                  </p>
                  <Link to="/login" className="btn btn-primary w-100 py-2 fw-semibold">
                    Back to Sign in
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="mb-4">
                    <label className="form-label fw-semibold">Email address</label>
                    <input
                      {...register('email')}
                      type="email"
                      className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                      placeholder="you@company.com"
                      autoComplete="email"
                      autoFocus
                    />
                    {errors.email && <div className="invalid-feedback">{errors.email.message}</div>}
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-2 fw-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                    Send reset link
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
