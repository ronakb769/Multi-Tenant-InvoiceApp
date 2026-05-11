import { NavLink } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useAuth } from '../../hooks/useAuth'
import { useRole } from '../../hooks/useRole'
import { getInitials } from '../../utils/formatters'

const tenantNav = [
  { to: '/dashboard', icon: 'bi-speedometer2', label: 'Dashboard' },
  { to: '/invoices', icon: 'bi-receipt', label: 'Invoices' },
  { to: '/clients', icon: 'bi-people', label: 'Clients' },
]

const adminNav = [
  { to: '/admin/dashboard', icon: 'bi-speedometer2', label: 'Platform Dashboard' },
  { to: '/admin/tenants', icon: 'bi-building', label: 'Tenants' },
  { to: '/admin/users', icon: 'bi-people', label: 'Users' },
  { to: '/admin/analytics', icon: 'bi-bar-chart-line', label: 'Analytics' },
]

export default function Sidebar() {
  const { user } = useAuth()
  const { isSuperAdmin } = useRole()
  const collapsed = useSelector((s) => s.ui.sidebarCollapsed)
  const navItems = isSuperAdmin ? adminNav : tenantNav

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* User info */}
      <div className="p-3 border-bottom border-white border-opacity-10">
        <div className="d-flex align-items-center gap-3">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
            style={{ width: 50, height: 50, background: 'rgba(255,255,255,0.2)', fontSize: '16px' }}
          >
            {getInitials(user?.name)}
          </div>
          <div className="sidebar-label overflow-hidden">
            <div className="fw-semibold text-truncate">{user?.name}</div>
            <span className="badge bg-white bg-opacity-25 text-white" style={{ fontSize: '10px' }}>
              {user?.role}
            </span>
            {user?.tenantName && (
              <div className="text-white-50 small text-truncate">{user.tenantName}</div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-grow-1 py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
          >
            <i className={`bi ${item.icon}`} title={collapsed ? item.label : ''} />
            <span className="sidebar-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Collapse hint */}
      <div className="p-3 border-top border-white border-opacity-10">
        <div className="sidebar-nav-item" style={{ padding: '8px 0' }}>
          <i className={`bi ${collapsed ? 'bi-arrow-bar-right' : 'bi-arrow-bar-left'}`} />
          <span className="sidebar-label small text-white-50">Collapse sidebar</span>
        </div>
      </div>
    </aside>
  )
}
