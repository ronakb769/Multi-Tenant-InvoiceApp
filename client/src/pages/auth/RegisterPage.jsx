import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useDispatch } from 'react-redux'
import { useRegisterMutation } from '../../services/authApi'
import { setCredentials } from '../../features/auth/authSlice'
import { useToast } from '../../hooks/useToast'
import axiosInstance from '../../utils/axiosBaseQuery'

const schema = yup.object({
  name: yup.string().required('Full name is required').min(2),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required().min(8, 'Min 8 characters'),
  confirmPassword: yup.string().oneOf([yup.ref('password')], 'Passwords must match').required(),
  tenantName: yup.string().required('Company name is required').min(2),
  subdomain: yup.string().required('Subdomain is required').matches(/^[a-z0-9-]+$/, 'Only lowercase, numbers, hyphens'),
  terms: yup.boolean().oneOf([true], 'You must accept terms'),
})

const getStrength = (password) => {
  if (!password || password.length < 6) return { label: 'Weak', color: 'danger', width: 25 }
  const checks = [/[A-Z]/, /[a-z]/, /[0-9]/, /[\W_]/].filter((r) => r.test(password)).length
  if (checks >= 4 && password.length >= 10) return { label: 'Strong', color: 'success', width: 100 }
  if (checks >= 2) return { label: 'Fair', color: 'warning', width: 60 }
  return { label: 'Weak', color: 'danger', width: 25 }
}

export default function RegisterPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { showError, showSuccess } = useToast()
  const [register, { isLoading }] = useRegisterMutation()
  const [showPassword, setShowPassword] = useState(false)
  const [subdomainAvailable, setSubdomainAvailable] = useState(null)
  const [checkingSubdomain, setCheckingSubdomain] = useState(false)

  const { register: reg, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: yupResolver(schema)
  })

  const password = watch('password', '')
  const tenantName = watch('tenantName', '')
  const subdomain = watch('subdomain', '')
  const strength = getStrength(password)

  // Auto-fill subdomain from company name
  useEffect(() => {
    if (tenantName) {
      const slug = tenantName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      setValue('subdomain', slug)
    }
  }, [tenantName])

  // Check subdomain availability
  useEffect(() => {
    if (!subdomain || subdomain.length < 3) { setSubdomainAvailable(null); return }
    setCheckingSubdomain(true)
    const timer = setTimeout(async () => {
      try {
        const res = await axiosInstance.get(`/tenant/check-subdomain?subdomain=${subdomain}`)
        setSubdomainAvailable(res.data.data)
      } catch {
        setSubdomainAvailable(null)
      } finally {
        setCheckingSubdomain(false)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [subdomain])

  const onSubmit = async (data) => {
    try {
      const result = await register(data).unwrap()
      dispatch(setCredentials({ user: result.data.user, accessToken: result.data.accessToken }))
      showSuccess('Account created! Welcome to InvoicePro.')
      navigate('/dashboard')
    } catch (err) {
      showError(err?.data?.message || 'Registration failed.')
    }
  }

  return (
    <div className="min-vh-100 d-flex">
      <div className="d-none d-lg-flex flex-column justify-content-center p-5 col-lg-5" style={{ background: 'var(--color-primary)', color: 'white' }}>
        <div className="d-flex align-items-center gap-3 mb-5">
          <i className="bi bi-receipt-cutoff fs-2" />
          <span className="fs-4 fw-bold">InvoicePro</span>
        </div>
        <h2 className="fw-bold mb-3">Start invoicing in minutes</h2>
        <p className="text-white-75 mb-5">Join hundreds of businesses that trust InvoicePro for their billing needs.</p>
        <ul className="list-unstyled">
          {['Free plan, no credit card required', 'Setup in under 2 minutes', 'Send unlimited invoices', 'Get paid with Stripe'].map((f) => (
            <li key={f} className="mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-check-circle-fill text-warning" /><span>{f}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex-grow-1 d-flex align-items-center justify-content-center p-4 overflow-auto" style={{ background: 'var(--color-light-bg)' }}>
        <div className="w-100 py-4" style={{ maxWidth: 460 }}>
          <div className="text-center mb-4">
            <h3 className="fw-bold">Create your account</h3>
            <p className="text-muted">Already have one? <Link to="/login" className="text-primary fw-semibold">Sign in</Link></p>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Full Name</label>
                  <input {...reg('name')} className={`form-control ${errors.name ? 'is-invalid' : ''}`} placeholder="John Smith" />
                  {errors.name && <div className="invalid-feedback">{errors.name.message}</div>}
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Email Address</label>
                  <input {...reg('email')} type="email" className={`form-control ${errors.email ? 'is-invalid' : ''}`} placeholder="you@company.com" />
                  {errors.email && <div className="invalid-feedback">{errors.email.message}</div>}
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Password</label>
                  <div className="input-group">
                    <input
                      {...reg('password')}
                      type={showPassword ? 'text' : 'password'}
                      className={`form-control border-end-0 ${errors.password ? 'is-invalid' : ''}`}
                      placeholder="Min 8 characters"
                    />
                    <button type="button" className="btn btn-outline-secondary" onClick={() => setShowPassword(!showPassword)}>
                      <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
                    </button>
                  </div>
                  {password && (
                    <div className="mt-1">
                      <div className="progress" style={{ height: 4 }}>
                        <div className={`progress-bar bg-${strength.color}`} style={{ width: `${strength.width}%` }} />
                      </div>
                      <small className={`text-${strength.color}`}>Strength: {strength.label}</small>
                    </div>
                  )}
                  {errors.password && <div className="text-danger small">{errors.password.message}</div>}
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Confirm Password</label>
                  <input {...reg('confirmPassword')} type="password" className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`} placeholder="Repeat password" />
                  {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword.message}</div>}
                </div>

                {/* Tenant section */}
                <div className="card bg-light border-0 p-3 mb-3">
                  <div className="fw-semibold mb-3">
                    <i className="bi bi-building me-2" style={{ color: 'var(--color-primary)' }} />Your Organization
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Company Name</label>
                    <input {...reg('tenantName')} className={`form-control ${errors.tenantName ? 'is-invalid' : ''}`} placeholder="Acme Corporation" />
                    {errors.tenantName && <div className="invalid-feedback">{errors.tenantName.message}</div>}
                  </div>

                  <div className="mb-2">
                    <label className="form-label fw-semibold small">Subdomain</label>
                    <div className="input-group">
                      <input
                        {...reg('subdomain')}
                        className={`form-control ${errors.subdomain ? 'is-invalid' : subdomainAvailable === false ? 'is-invalid' : subdomainAvailable === true ? 'is-valid' : ''}`}
                        placeholder="your-company"
                      />
                      <span className="input-group-text">.invoiceapp.com</span>
                    </div>
                    {checkingSubdomain && <small className="text-muted">Checking availability...</small>}
                    {!checkingSubdomain && subdomainAvailable === true && <small className="text-success"><i className="bi bi-check-circle me-1" />Available!</small>}
                    {!checkingSubdomain && subdomainAvailable === false && <small className="text-danger"><i className="bi bi-x-circle me-1" />Already taken</small>}
                    {errors.subdomain && <div className="text-danger small">{errors.subdomain.message}</div>}
                    {subdomain && <small className="text-muted d-block mt-1">Preview: <strong>{subdomain}.invoiceapp.com</strong></small>}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="form-check">
                    <input {...reg('terms')} className="form-check-input" type="checkbox" id="terms" />
                    <label className="form-check-label small" htmlFor="terms">
                      I agree to the <a href="#" className="text-primary">Terms of Service</a> and <a href="#" className="text-primary">Privacy Policy</a>
                    </label>
                    {errors.terms && <div className="text-danger small">{errors.terms.message}</div>}
                  </div>
                </div>

                <button type="submit" className="btn btn-primary w-100 py-2 fw-semibold" disabled={isLoading}>
                  {isLoading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                  Create Account
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
