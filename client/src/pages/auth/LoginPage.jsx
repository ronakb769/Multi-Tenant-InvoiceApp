import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'

const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required'),
})

export default function LoginPage() {
  const { login } = useAuth()
  const { handleError } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema)
  })

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await login(data)
    } catch (err) {
      handleError(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-vh-100 d-flex">
      {/* Left branded panel */}
      <div className="d-none d-lg-flex flex-column justify-content-center p-5 col-lg-5" style={{ background: 'var(--color-primary)', color: 'white' }}>
        <div className="d-flex align-items-center gap-3 mb-5">
          <i className="bi bi-receipt-cutoff fs-2" />
          <span className="fs-4 fw-bold">InvoicePro</span>
        </div>
        <h2 className="fw-bold mb-3">Welcome back!</h2>
        <p className="text-white-75 mb-5">Sign in to access your invoicing dashboard and manage your business finances.</p>
        <ul className="list-unstyled">
          {['Create & send professional invoices', 'Track payments in real-time', 'Automated overdue detection', 'Stripe-powered checkout'].map((f) => (
            <li key={f} className="mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-check-circle-fill text-warning" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Right form panel */}
      <div className="flex-grow-1 d-flex align-items-center justify-content-center p-4" style={{ background: 'var(--color-light-bg)' }}>
        <div className="w-100" style={{ maxWidth: 420 }}>
          <div className="text-center mb-4">
            <div className="d-lg-none mb-3">
              <i className="bi bi-receipt-cutoff fs-2" style={{ color: 'var(--color-primary)' }} />
            </div>
            <h3 className="fw-bold">Sign in to your account</h3>
            <p className="text-muted">Don't have an account? <Link to="/register" className="text-primary fw-semibold">Create one free</Link></p>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Email address</label>
                  <input
                    {...register('email')}
                    type="email"
                    className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                    placeholder="you@company.com"
                    autoComplete="email"
                  />
                  {errors.email && <div className="invalid-feedback">{errors.email.message}</div>}
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Password</label>
                  <div className="input-group">
                    <input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      className={`form-control border-end-0 ${errors.password ? 'is-invalid' : ''}`}
                      placeholder="Your password"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
                    </button>
                    {errors.password && <div className="invalid-feedback">{errors.password.message}</div>}
                  </div>
                </div>

                <div className="mb-4 d-flex align-items-center justify-content-between">
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" id="rememberMe" />
                    <label className="form-check-label small" htmlFor="rememberMe">Remember me</label>
                  </div>
                  <Link to="/forgot-password" className="small text-primary fw-semibold">
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 py-2 fw-semibold"
                  disabled={loading}
                >
                  {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                  Sign in
                </button>
              </form>
            </div>
          </div>

          <div className="text-center mt-4">
            <div className="text-muted small mb-2">Test credentials:</div>
            <div className="d-flex gap-2 flex-wrap justify-content-center">
              {[
                { email: 'admin@techcorp.com', label: 'TenantAdmin' },
                { email: 'superadmin@invoiceapp.com', label: 'SuperAdmin' },
              ].map((c) => (
                <span key={c.email} className="badge bg-light text-dark border" style={{ cursor: 'pointer', fontSize: '11px' }}>
                  {c.label}: {c.email}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
