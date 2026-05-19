import { NavLink } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useAuth } from '../../hooks/useAuth'
import { useRole } from '../../hooks/useRole'
import { toggleSidebarCollapsed } from '../../features/ui/uiSlice'
import { getInitials } from '../../utils/formatters'

const tenantNav = [
  { to: '/dashboard', icon: 'bi-speedometer2', label: 'Dashboard' },
  { to: '/invoices', icon: 'bi-receipt-cutoff', label: 'Invoices' },
  { to: '/clients', icon: 'bi-people-fill', label: 'Clients' },
  { to: '/users', icon: 'bi-person-badge-fill', label: 'Users', adminOnly: true },
]

const adminNav = [
  { to: '/admin/dashboard', icon: 'bi-speedometer2', label: 'Platform Dashboard' },
  { to: '/admin/tenants', icon: 'bi-building-fill', label: 'Tenants' },
  { to: '/admin/users', icon: 'bi-people-fill', label: 'Users' },
  { to: '/admin/analytics', icon: 'bi-bar-chart-line-fill', label: 'Analytics' },
]

export default function Sidebar() {
  const { user } = useAuth()
  const { isSuperAdmin, isTenantAdmin } = useRole()
  const dispatch = useDispatch()
  const collapsed = useSelector((s) => s.ui.sidebarCollapsed)
  const navItems = isSuperAdmin
    ? adminNav
    : tenantNav.filter((item) => !item.adminOnly || isTenantAdmin)

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>

      {/* Brand logo */}
      <div className="sidebar-brand d-flex align-items-center gap-2 px-4 border-bottom border-white border-opacity-10"
        style={{ height: 64, minHeight: 64, flexShrink: 0 }}>
        <i className="bi bi-receipt-cutoff text-white flex-shrink-0" style={{ fontSize: 22 }} />
        <span className="sidebar-label fw-bold text-white" style={{ fontSize: '1.05rem', letterSpacing: '0.02em' }}>
          InvoicePro
        </span>
      </div>

      {/* User info */}
      <div className="px-3 py-3 border-bottom border-white border-opacity-10">
        <div className="d-flex align-items-center gap-2">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
            style={{ width: 38, height: 38, background: 'rgba(255,255,255,0.18)', fontSize: '13px' }}
          >
            {getInitials(user?.name)}
          </div>
          <div className="sidebar-label overflow-hidden">
            <div className="fw-semibold text-white text-truncate" style={{ fontSize: '0.85rem' }}>
              {user?.name}
            </div>
            <div className="text-white-50 text-truncate" style={{ fontSize: '0.72rem' }}>
              {user?.tenantName || user?.role}
            </div>
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

      {/* Collapse toggle */}
      <div className="border-top border-white border-opacity-10">
        <button
          className="sidebar-nav-item btn w-100 text-start border-0"
          style={{ padding: '12px 20px', background: 'transparent' }}
          onClick={() => dispatch(toggleSidebarCollapsed())}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <i className={`bi ${collapsed ? 'bi-arrow-bar-right' : 'bi-arrow-bar-left'}`} />
          <span className="sidebar-label small text-white-50">Collapse sidebar</span>
        </button>
      </div>
    </aside>
  )
}
