import { useState } from 'react'
import {
  useGetAdminTenantsQuery,
  useUpdateTenantStatusMutation,
  useUpdateTenantPlanMutation,
} from '../../services/adminApi'
import Loader from '../../components/common/Loader'
import SearchBar from '../../components/common/SearchBar'
import { formatCurrency } from '../../utils/formatters'
import { useToast } from '../../hooks/useToast'

const PLANS = ['Free', 'Pro', 'Enterprise']
const PLAN_COLORS = { Free: 'secondary', Pro: 'primary', Enterprise: 'success' }

export default function TenantManagementPage() {
  const { showSuccess, handleError } = useToast()
  const { data, isLoading } = useGetAdminTenantsQuery()
  const [updateStatus] = useUpdateTenantStatusMutation()
  const [updatePlan] = useUpdateTenantPlanMutation()
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const tenants = (data?.data || []).filter((t) => {
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.subdomain.includes(search.toLowerCase())
    const matchPlan = !planFilter || t.plan === planFilter
    const matchStatus = !statusFilter || (statusFilter === 'active' ? t.isActive : !t.isActive)
    return matchSearch && matchPlan && matchStatus
  })

  const handleToggleStatus = async (tenantId, isActive) => {
    try {
      await updateStatus({ tenantId, isActive: !isActive }).unwrap()
      showSuccess(`Tenant ${isActive ? 'deactivated' : 'activated'}.`)
    } catch (err) {
      handleError(err)
    }
  }

  const handlePlanChange = async (tenantId, plan) => {
    try {
      await updatePlan({ tenantId, plan }).unwrap()
      showSuccess('Plan updated.')
    } catch (err) {
      handleError(err)
    }
  }

  if (isLoading) return <Loader />

  return (
    <div>
      <div className="mb-4">
        <h4 className="fw-bold mb-1">Tenant Management</h4>
        <p className="text-muted mb-0 small">{tenants.length} tenants</p>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-5">
              <SearchBar value={search} onChange={setSearch} placeholder="Search tenants..." />
            </div>
            <div className="col-md-3">
              <select className="form-select" value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}>
                <option value="">All plans</option>
                {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
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
                <th>Tenant</th>
                <th>Plan</th>
                <th>Users</th>
                <th>Invoices</th>
                <th className="text-end">Revenue</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div className="fw-semibold">{t.name}</div>
                    <div className="text-muted small">{t.subdomain}.invoiceapp.com</div>
                  </td>
                  <td>
                    <select
                      className="form-select form-select-sm border-0"
                      value={t.plan}
                      onChange={(e) => handlePlanChange(t.id, e.target.value)}
                      style={{ width: 'auto' }}
                    >
                      {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </td>
                  <td>{t.userCount}</td>
                  <td>{t.invoiceCount}</td>
                  <td className="text-end fw-semibold">{formatCurrency(t.revenue)}</td>
                  <td>
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={t.isActive}
                        onChange={() => handleToggleStatus(t.id, t.isActive)}
                      />
                    </div>
                  </td>
                  <td>
                    <span className={`badge bg-${PLAN_COLORS[t.plan]}`}>{t.plan}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
