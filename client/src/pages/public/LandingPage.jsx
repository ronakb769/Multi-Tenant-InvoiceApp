import { Link } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'

export default function LandingPage() {
  return (
    <div>
      <Navbar />
      <div style={{ paddingTop: 'var(--navbar-height)' }}>
        {/* Hero */}
        <section className="landing-hero text-white">
          <div className="container py-5">
            <div className="row align-items-center">
              <div className="col-lg-6">
                <span className="badge bg-white bg-opacity-25 text-white mb-3 px-3 py-2">
                  <i className="bi bi-stars me-1" /> Multi-Tenant SaaS Platform
                </span>
                <h1 className="display-4 fw-bold mb-3">
                  Invoice Smarter.<br />
                  <span style={{ color: '#a8dadc' }}>Get Paid Faster.</span>
                </h1>
                <p className="lead mb-4 text-white-75">
                  Professional invoicing and billing management for modern businesses.
                  Create, send, and track invoices with Stripe-powered payments.
                </p>
                <div className="d-flex gap-3 flex-wrap">
                  <Link to="/register" className="btn btn-light btn-lg px-4 fw-semibold" style={{ color: 'var(--color-primary)' }}>
                    <i className="bi bi-rocket-takeoff me-2" />Start Free Trial
                  </Link>
                  <Link to="/login" className="btn btn-outline-light btn-lg px-4">
                    <i className="bi bi-play-circle me-2" />See Demo
                  </Link>
                </div>
              </div>
              <div className="col-lg-6 d-none d-lg-block text-center">
                <div className="card border-0 shadow-lg p-4 ms-4" style={{ borderRadius: '16px' }}>
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div className="rounded-circle bg-success d-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }}>
                      <i className="bi bi-check-lg text-white" />
                    </div>
                    <div className="text-start">
                      <div className="fw-semibold text-dark">INV-TC01-2025-0042</div>
                      <div className="text-muted small">Payment received</div>
                    </div>
                    <div className="ms-auto fw-bold text-success">$4,250.00</div>
                  </div>
                  <div className="progress mb-2" style={{ height: 8 }}>
                    <div className="progress-bar bg-success" style={{ width: '75%' }} />
                  </div>
                  <div className="d-flex justify-content-between text-muted small">
                    <span>75% collected this month</span>
                    <span className="text-success fw-semibold">+18%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats bar */}
        <section className="py-3" style={{ background: 'var(--color-primary)' }}>
          <div className="container">
            <div className="row text-center text-white">
              {[
                { value: '500+', label: 'Businesses' },
                { value: '10,000+', label: 'Invoices Created' },
                { value: '$2M+', label: 'Processed' },
                { value: '99.9%', label: 'Uptime' },
              ].map((stat) => (
                <div key={stat.label} className="col-6 col-md-3 py-2">
                  <div className="fs-4 fw-bold">{stat.value}</div>
                  <div className="small text-white-75">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-5" style={{ background: 'var(--color-light-bg)' }}>
          <div className="container">
            <div className="text-center mb-5">
              <h2 className="fw-bold">Everything you need to get paid</h2>
              <p className="text-muted">Powerful features for modern businesses</p>
            </div>
            <div className="row g-4">
              {[
                { icon: 'bi-shield-lock', title: 'Multi-Tenant Isolation', desc: 'Each organization has its own secure space. Data isolation guaranteed at the database level.' },
                { icon: 'bi-credit-card-2-front', title: 'Stripe Payments', desc: 'Accept online payments instantly. Clients can pay invoices directly via a secure Stripe checkout.' },
                { icon: 'bi-file-earmark-pdf', title: 'PDF Generation', desc: 'Professional PDF invoices generated server-side and emailed automatically to your clients.' },
                { icon: 'bi-graph-up-arrow', title: 'Revenue Analytics', desc: 'Track your revenue, outstanding amounts, and overdue invoices with visual charts.' },
                { icon: 'bi-bell', title: 'Automated Reminders', desc: 'Automatic overdue detection. Get notified when invoices pass their due date.' },
                { icon: 'bi-people', title: 'Team Collaboration', desc: 'Role-based access. TenantAdmins and Users with fine-grained permissions.' },
              ].map((f) => (
                <div key={f.title} className="col-md-4">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body p-4">
                      <div className="mb-3">
                        <i className={`bi ${f.icon} fs-2`} style={{ color: 'var(--color-primary)' }} />
                      </div>
                      <h5 className="fw-semibold">{f.title}</h5>
                      <p className="text-muted mb-0 small">{f.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-5 bg-white">
          <div className="container">
            <div className="text-center mb-5">
              <h2 className="fw-bold">Simple, transparent pricing</h2>
              <p className="text-muted">Start free, scale as you grow</p>
            </div>
            <div className="row g-4 justify-content-center">
              {[
                { name: 'Free', price: '$0', period: '/month', users: '5 users', invoices: '50 invoices/mo', features: ['PDF generation', 'Stripe payments', 'Email notifications'], cta: 'Start Free', variant: 'outline-primary' },
                { name: 'Pro', price: '$29', period: '/month', users: '20 users', invoices: 'Unlimited invoices', features: ['Everything in Free', 'Priority support', 'Custom branding', 'Advanced analytics'], cta: 'Start Pro', variant: 'primary', popular: true },
                { name: 'Enterprise', price: '$99', period: '/month', users: 'Unlimited users', invoices: 'Unlimited invoices', features: ['Everything in Pro', 'Dedicated support', 'SLA guarantee', 'Custom integrations'], cta: 'Contact Sales', variant: 'outline-primary' },
              ].map((plan) => (
                <div key={plan.name} className="col-md-4">
                  <div className={`card border-0 h-100 ${plan.popular ? 'shadow-lg border-2' : 'shadow-sm'}`} style={{ borderColor: plan.popular ? 'var(--color-primary)' : undefined }}>
                    {plan.popular && <div className="card-header text-center py-2 fw-bold text-white" style={{ background: 'var(--color-primary)' }}>Most Popular</div>}
                    <div className="card-body p-4">
                      <h5 className="fw-bold">{plan.name}</h5>
                      <div className="my-3">
                        <span className="fs-1 fw-bold">{plan.price}</span>
                        <span className="text-muted">{plan.period}</span>
                      </div>
                      <div className="text-muted small mb-3">{plan.users} · {plan.invoices}</div>
                      <ul className="list-unstyled mb-4">
                        {plan.features.map((f) => (
                          <li key={f} className="mb-2 small">
                            <i className="bi bi-check-circle-fill text-success me-2" />{f}
                          </li>
                        ))}
                      </ul>
                      <Link to="/register" className={`btn btn-${plan.variant} w-100`}>{plan.cta}</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-5" style={{ background: 'var(--color-light-bg)' }}>
          <div className="container">
            <div className="text-center mb-5">
              <h2 className="fw-bold">Loved by businesses</h2>
            </div>
            <div className="row g-4">
              {[
                { quote: "InvoicePro transformed how we handle billing. We get paid 40% faster now.", name: "Sarah Chen", company: "TechCorp Solutions", initials: "SC" },
                { quote: "The automated overdue detection alone saved us hours every week.", name: "Marcus Rodriguez", company: "Creative Studio", initials: "MR" },
                { quote: "Stripe integration is seamless. Our clients love paying online.", name: "Emma Williams", company: "Digital Agency", initials: "EW" },
              ].map((t) => (
                <div key={t.name} className="col-md-4">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body p-4">
                      <i className="bi bi-quote fs-2 mb-3 d-block" style={{ color: 'var(--color-primary)' }} />
                      <p className="text-muted mb-3">"{t.quote}"</p>
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                          style={{ width: 40, height: 40, background: 'var(--color-primary)', fontSize: '13px' }}
                        >
                          {t.initials}
                        </div>
                        <div>
                          <div className="fw-semibold small">{t.name}</div>
                          <div className="text-muted" style={{ fontSize: '12px' }}>{t.company}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-4 text-center" style={{ background: 'var(--color-primary)', color: 'rgba(255,255,255,0.7)' }}>
          <div className="container">
            <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
              <i className="bi bi-receipt-cutoff text-white fs-5" />
              <span className="fw-bold text-white">InvoicePro</span>
            </div>
            <small>© {new Date().getFullYear()} InvoicePro. All rights reserved.</small>
          </div>
        </footer>
      </div>
    </div>
  )
}
