import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: 'var(--color-light-bg)' }}>
      <div className="text-center">
        <div className="display-1 fw-bold mb-0" style={{ color: 'var(--color-primary)', fontSize: '8rem' }}>404</div>
        <h2 className="fw-bold mb-2">Page Not Found</h2>
        <p className="text-muted mb-4">The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/" className="btn btn-primary px-4">
          <i className="bi bi-house me-2" />Back to Home
        </Link>
      </div>
    </div>
  )
}
