import { Link, useNavigate } from 'react-router-dom'

export default function UnauthorizedPage() {
  const navigate = useNavigate()
  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: 'var(--color-light-bg)' }}>
      <div className="text-center">
        <i className="bi bi-shield-exclamation text-danger" style={{ fontSize: '5rem' }} />
        <h2 className="fw-bold mb-2 mt-3">Access Denied</h2>
        <p className="text-muted mb-4">You don't have permission to view this page.</p>
        <div className="d-flex gap-2 justify-content-center">
          <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>Go Back</button>
          <Link to="/dashboard" className="btn btn-primary">Dashboard</Link>
        </div>
      </div>
    </div>
  )
}
