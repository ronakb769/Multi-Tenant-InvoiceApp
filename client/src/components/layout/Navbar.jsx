import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useAuth } from '../../hooks/useAuth'
import { useRole } from '../../hooks/useRole'
import { toggleSidebarCollapsed } from '../../features/ui/uiSlice'
import { getInitials } from '../../utils/formatters'
import { useGetOverdueAlertsQuery } from '../../services/dashboardApi'

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const { isSuperAdmin } = useRole()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const { data: overdueData } = useGetOverdueAlertsQuery(undefined, {
    skip: !isAuthenticated || isSuperAdmin,
  })
  const overdueCount = overdueData?.data?.length || 0

  return (
    <nav className="navbar app-navbar px-3 px-md-4">
      <div className="d-flex align-items-center gap-3">
        {isAuthenticated ? (
          <button
            className="btn btn-link text-secondary p-0"
            onClick={() => dispatch(toggleSidebarCollapsed())}
            title="Toggle sidebar"
          >
            <i className="bi bi-list fs-4" />
          </button>
        ) : (
          <Link to="/" className="navbar-brand d-flex align-items-center gap-2 mb-0">
            <i className="bi bi-receipt-cutoff fs-4" style={{ color: 'var(--color-primary)' }} />
            <span className="fw-bold" style={{ color: 'var(--color-primary)' }}>InvoicePro</span>
          </Link>
        )}
      </div>

      <div className="d-flex align-items-center gap-3">
        {!isAuthenticated ? (
          <>
            <Link to="/login" className="btn btn-outline-primary btn-sm">Login</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
          </>
        ) : (
          <>
            {!isSuperAdmin && (
              <div className="position-relative">
                <button className="btn btn-link text-secondary p-0" onClick={() => navigate('/invoices?status=Overdue')}>
                  <i className="bi bi-bell fs-5" />
                  {overdueCount > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '10px' }}>
                      {overdueCount}
                    </span>
                  )}
                </button>
              </div>
            )}
            <div className="dropdown" ref={dropdownRef}>
              <button
                className="btn btn-link d-flex align-items-center gap-2 text-decoration-none text-dark p-0"
                onClick={() => setDropdownOpen(prev => !prev)}
              >
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white"
                  style={{ width: 36, height: 36, background: 'var(--color-primary)', fontSize: '13px' }}
                >
                  {getInitials(user?.name)}
                </div>
                <div className="d-none d-md-block text-start">
                  <div className="small fw-semibold">{user?.name}</div>
                  <div style={{ fontSize: '11px' }} className="text-muted">{user?.role}</div>
                </div>
                <i className="bi bi-chevron-down small" />
              </button>
              <ul className={`dropdown-menu dropdown-menu-end shadow${dropdownOpen ? ' show' : ''}`}>
                <li><h6 className="dropdown-header">{user?.tenantName || 'Platform'}</h6></li>
                <li>
                  <button className="dropdown-item" onClick={() => { navigate(isSuperAdmin ? '/admin/dashboard' : '/dashboard'); setDropdownOpen(false) }}>
                    <i className="bi bi-speedometer2 me-2" />Dashboard
                  </button>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button className="dropdown-item text-danger" onClick={() => { logout(); setDropdownOpen(false) }}>
                    <i className="bi bi-box-arrow-right me-2" />Logout
                  </button>
                </li>
              </ul>
            </div>
          </>
        )}
      </div>
    </nav>
  )
}
