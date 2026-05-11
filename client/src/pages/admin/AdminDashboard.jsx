import { Line, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Legend
} from 'chart.js'
import { useGetAdminStatsQuery, useGetAdminTenantsQuery, useGetPlatformRevenueQuery } from '../../services/adminApi'
import StatCard from '../../components/common/StatCard'
import Loader from '../../components/common/Loader'
import { formatCurrency } from '../../utils/formatters'
import { Link } from 'react-router-dom'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend)

const PLAN_COLORS = { Free: '#6c757d', Pro: '#0d6efd', Enterprise: '#2d6a4f' }

export default function AdminDashboard() {
  const { data: statsData, isLoading: statsLoading } = useGetAdminStatsQuery()
  const { data: tenantsData } = useGetAdminTenantsQuery()
  const { data: revenueData } = useGetPlatformRevenueQuery()

  const stats = statsData?.data
  const tenants = tenantsData?.data || []
  const revenue = revenueData?.data || []

  const revenueChartData = {
    labels: revenue.map((r) => r.month),
    datasets: [{
      label: 'Platform Revenue',
      data: revenue.map((r) => r.revenue),
      borderColor: '#1d3557',
      backgroundColor: 'rgba(29,53,87,0.1)',
      fill: true,
      tension: 0.4,
    }],
  }

  if (statsLoading) return <Loader />

  return (
    <div>
      <div className="mb-4">
        <h4 className="fw-bold mb-1">Platform Dashboard</h4>
        <p className="text-muted mb-0 small">Super admin view — all tenants</p>
      </div>

      {/* KPI row */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-xl-2">
          <StatCard title="Total Tenants" value={stats?.totalTenants || 0} icon="bi-building" color="primary" />
        </div>
        <div className="col-sm-6 col-xl-2">
          <StatCard title="Active Tenants" value={stats?.activeTenants || 0} icon="bi-building-check" color="success" />
        </div>
        <div className="col-sm-6 col-xl-2">
          <StatCard title="Total Users" value={stats?.totalUsers || 0} icon="bi-people" color="secondary" />
        </div>
        <div className="col-sm-6 col-xl-2">
          <StatCard title="Total Invoices" value={stats?.totalInvoices || 0} icon="bi-receipt" color="warning" />
        </div>
        <div className="col-sm-6 col-xl-2">
          <StatCard title="Platform Revenue" value={formatCurrency(stats?.totalRevenue)} icon="bi-currency-dollar" color="success" />
        </div>
        <div className="col-sm-6 col-xl-2">
          <StatCard title="New This Month" value={stats?.newTenantsThisMonth || 0} icon="bi-plus-circle" color="info" />
        </div>
      </div>

      {/* Charts */}
      <div className="row g-3 mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white fw-semibold">Platform Revenue (12 months)</div>
            <div className="card-body">
              <Line data={revenueChartData} options={{ responsive: true, plugins: { legend: { display: false } } }} height={60} />
            </div>
          </div>
        </div>
      </div>

      {/* Tenants table */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white d-flex justify-content-between align-items-center fw-semibold">
          Recent Tenants
          <Link to="/admin/tenants" className="btn btn-sm btn-outline-primary">View all</Link>
        </div>
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
                <th></th>
              </tr>
            </thead>
            <tbody>
              {tenants.slice(0, 10).map((t) => (
                <tr key={t.id}>
                  <td>
                    <div className="fw-semibold">{t.name}</div>
                    <div className="text-muted small">{t.subdomain}.invoiceapp.com</div>
                  </td>
                  <td>
                    <span className="badge" style={{ background: PLAN_COLORS[t.plan] || '#ccc', color: 'white' }}>
                      {t.plan}
                    </span>
                  </td>
                  <td>{t.userCount}</td>
                  <td>{t.invoiceCount}</td>
                  <td className="text-end fw-semibold">{formatCurrency(t.revenue)}</td>
                  <td>
                    <span className={`badge ${t.isActive ? 'bg-success' : 'bg-danger'}`}>
                      {t.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <Link to={`/admin/tenants`} className="btn btn-xs btn-outline-secondary" style={{ padding: '2px 8px', fontSize: '12px' }}>
                      View
                    </Link>
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
