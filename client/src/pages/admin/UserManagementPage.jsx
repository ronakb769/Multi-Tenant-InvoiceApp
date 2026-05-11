import { useState } from 'react'
import { useGetAdminUsersQuery } from '../../services/adminApi'
import Loader from '../../components/common/Loader'
import SearchBar from '../../components/common/SearchBar'
import { formatDateTime } from '../../utils/formatters'

const ROLES = ['SuperAdmin', 'TenantAdmin', 'User']
const ROLE_COLORS = { SuperAdmin: 'danger', TenantAdmin: 'primary', User: 'secondary' }

export default function UserManagementPage() {
  const [filters, setFilters] = useState({ search: '', role: '', isActive: undefined })
  const { data, isLoading } = useGetAdminUsersQuery(filters)
  const users = data?.data || []

  if (isLoading) return <Loader />

  return (
    <div>
      <div className="mb-4">
        <h4 className="fw-bold mb-1">User Management</h4>
        <p className="text-muted mb-0 small">{users.length} users across all tenants</p>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-5">
              <SearchBar
                value={filters.search}
                onChange={(v) => setFilters((f) => ({ ...f, search: v }))}
                placeholder="Search users..."
              />
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={filters.role}
                onChange={(e) => setFilters((f) => ({ ...f, role: e.target.value }))}
              >
                <option value="">All roles</option>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <select
                className="form-select"
                onChange={(e) => setFilters((f) => ({
                  ...f,
                  isActive: e.target.value === '' ? undefined : e.target.value === 'true'
                }))}
              >
                <option value="">All statuses</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Tenant</th>
                <th>Status</th>
                <th>Last Login</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="fw-semibold">{u.name}</div>
                    <div className="text-muted small">{u.email}</div>
                  </td>
                  <td>
                    <span className={`badge bg-${ROLE_COLORS[u.role] || 'secondary'}`}>{u.role}</span>
                  </td>
                  <td className="text-muted small">{u.tenantName || '—'}</td>
                  <td>
                    <span className={`badge ${u.isActive ? 'bg-success' : 'bg-secondary'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="text-muted small">{u.lastLogin ? formatDateTime(u.lastLogin) : 'Never'}</td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={5} className="text-center text-muted py-4">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
