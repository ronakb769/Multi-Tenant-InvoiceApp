import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { toast } from 'react-toastify'
import { useResetPasswordMutation } from '../../services/authApi'

const schema = yup.object({
  newPassword: yup
    .string()
    .required('Password is required')
    .min(8, 'Minimum 8 characters')
    .matches(/[A-Z]/, 'Must contain an uppercase letter')
    .matches(/[a-z]/, 'Must contain a lowercase letter')
    .matches(/[0-9]/, 'Must contain a number'),
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('newPassword')], 'Passwords do not match'),
})

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [resetPassword, { isLoading }] = useResetPasswordMutation()

  const token = searchParams.get('token') ?? ''
  const email = searchParams.get('email') ?? ''

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  })

  const onSubmit = async ({ newPassword }) => {
    try {
      await resetPassword({ token, email, newPassword }).unwrap()
      toast.success('Password reset successfully. Please sign in.')
      navigate('/login', { replace: true })
    } catch (err) {
      const msg = err?.data?.message ?? 'Invalid or expired reset link. Please request a new one.'
      toast.error(msg)
    }
  }

  if (!token || !email) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: 'var(--color-light-bg)' }}>
        <div className="card border-0 shadow-sm p-5 text-center" style={{ maxWidth: 420 }}>
          <i className="bi bi-exclamation-circle-fill fs-1 text-danger mb-3" />
          <h5 className="fw-bold mb-2">Invalid reset link</h5>
          <p className="text-muted mb-4">This link is missing required parameters. Please request a new password reset.</p>
          <Link to="/forgot-password" className="btn btn-primary fw-semibold">Request new link</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-vh-100 d-flex">
      {/* Left branded panel */}
      <div className="d-none d-lg-flex flex-column justify-content-center p-5 col-lg-5" style={{ background: 'var(--color-primary)', color: 'white' }}>
        <div className="d-flex align-items-center gap-3 mb-5">
          <i className="bi bi-receipt-cutoff fs-2" />
          <span className="fs-4 fw-bold">InvoicePro</span>
        </div>
        <h2 className="fw-bold mb-3">Choose a new password</h2>
        <p className="text-white-75">Pick something strong. After resetting, all existing sessions will be signed out.</p>
      </div>

      {/* Right form panel */}
      <div className="flex-grow-1 d-flex align-items-center justify-content-center p-4" style={{ background: 'var(--color-light-bg)' }}>
        <div className="w-100" style={{ maxWidth: 420 }}>
          <div className="text-center mb-4">
            <div className="d-lg-none mb-3">
              <i className="bi bi-receipt-cutoff fs-2" style={{ color: 'var(--color-primary)' }} />
            </div>
            <h3 className="fw-bold">Set new password</h3>
            <p className="text-muted small">Resetting for <strong>{email}</strong></p>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">New password</label>
                  <div className="input-group">
                    <input
                      {...register('newPassword')}
                      type={showPassword ? 'text' : 'password'}
                      className={`form-control border-end-0 ${errors.newPassword ? 'is-invalid' : ''}`}
                      placeholder="Min. 8 characters"
                      autoComplete="new-password"
                      autoFocus
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
                    </button>
                    {errors.newPassword && <div className="invalid-feedback">{errors.newPassword.message}</div>}
                  </div>
                  <ul className="mt-2 mb-0 ps-3" style={{ fontSize: '12px', color: 'var(--bs-secondary)' }}>
                    <li>At least 8 characters</li>
                    <li>One uppercase letter, one lowercase, one number</li>
                  </ul>
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold">Confirm password</label>
                  <div className="input-group">
                    <input
                      {...register('confirmPassword')}
                      type={showConfirm ? 'text' : 'password'}
                      className={`form-control border-end-0 ${errors.confirmPassword ? 'is-invalid' : ''}`}
                      placeholder="Repeat your new password"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowConfirm(!showConfirm)}
                    >
                      <i className={`bi ${showConfirm ? 'bi-eye-slash' : 'bi-eye'}`} />
                    </button>
                    {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword.message}</div>}
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 py-2 fw-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                  Reset password
                </button>
              </form>
            </div>
          </div>

          <div className="text-center mt-3">
            <Link to="/forgot-password" className="text-muted small">
              <i className="bi bi-arrow-left me-1" />
              Request a new link
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
