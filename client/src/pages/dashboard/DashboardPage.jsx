import { Link } from 'react-router-dom'
import { Line, Doughnut, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js'
import { useAuth } from '../../hooks/useAuth'
import { useRole } from '../../hooks/useRole'
import StatCard from '../../components/common/StatCard'
import Loader from '../../components/common/Loader'
import InvoiceStatusBadge from '../../components/invoice/InvoiceStatusBadge'
import { formatCurrency, formatDate, getDaysOverdue } from '../../utils/formatters'
import {
  useGetDashboardStatsQuery,
  useGetRevenueChartQuery,
  useGetInvoiceStatusChartQuery,
  useGetTopClientsQuery,
  useGetRecentInvoicesQuery,
  useGetOverdueAlertsQuery,
} from '../../services/dashboardApi'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler)

export default function DashboardPage() {
  const { user } = useAuth()
  const { isTenantAdmin } = useRole()

  const { data: statsData, isLoading: statsLoading } = useGetDashboardStatsQuery()
  const { data: revenueData } = useGetRevenueChartQuery(undefined, { skip: !isTenantAdmin })
  const { data: statusData } = useGetInvoiceStatusChartQuery(undefined, { skip: !isTenantAdmin })
  const { data: topClientsData } = useGetTopClientsQuery(undefined, { skip: !isTenantAdmin })
  const { data: recentData } = useGetRecentInvoicesQuery()
  const { data: overdueData } = useGetOverdueAlertsQuery(undefined, { skip: !isTenantAdmin })

  const stats = statsData?.data
  const revenueChart = revenueData?.data || []
  const statusChart = statusData?.data || {}
  const topClients = topClientsData?.data || []
  const recentInvoices = recentData?.data || []
  const overdueAlerts = overdueData?.data || []

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'

  const revenueChartData = {
    labels: revenueChart.map((d) => d.month),
    datasets: [{
      label: 'Revenue',
      data: revenueChart.map((d) => d.revenue),
      fill: true,
      borderColor: '#1d3557',
      backgroundColor: 'rgba(29,53,87,0.1)',
      tension: 0.4,
    }],
  }

  const statusColors = { Draft: '#6c757d', Sent: '#0d6efd', Paid: '#2d6a4f', Overdue: '#e63946', Cancelled: '#212529' }
  const statusChartData = {
    labels: Object.keys(statusChart),
    datasets: [{
      data: Object.values(statusChart),
      backgroundColor: Object.keys(statusChart).map((k) => statusColors[k] || '#ccc'),
    }],
  }

  const topClientChartData = {
    labels: topClients.map((c) => c.name),
    datasets: [{
      label: 'Revenue',
      data: topClients.map((c) => c.totalRevenue),
      backgroundColor: 'rgba(29,53,87,0.8)',
      borderRadius: 4,
    }],
  }

  if (statsLoading) return <Loader />

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">Good {greeting}, {user?.name?.split(' ')[0]}! 👋</h4>
          <p className="text-muted mb-0 small">{now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <Link to="/invoices/new" className="btn btn-primary">
          <i className="bi bi-plus-lg me-2" />New Invoice
        </Link>
      </div>

      {/* Stats */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-xl-2">
          <StatCard title="Total Clients" value={stats?.totalClients || 0} icon="bi-people" color="primary" />
        </div>
        <div className="col-sm-6 col-xl-2">
          <StatCard title="Total Invoices" value={stats?.totalInvoices || 0} icon="bi-receipt" color="secondary" />
        </div>
        <div className="col-sm-6 col-xl-2">
          <StatCard title="Total Revenue" value={formatCurrency(stats?.totalRevenue)} icon="bi-currency-dollar" color="success" />
        </div>
        <div className="col-sm-6 col-xl-2">
          <StatCard title="Outstanding" value={formatCurrency(stats?.outstandingAmount)} icon="bi-hourglass-split" color="warning" />
        </div>
        <div className="col-sm-6 col-xl-2">
          <StatCard title="Overdue" value={stats?.overdueCount || 0} icon="bi-exclamation-triangle" color="danger" />
        </div>
        <div className="col-sm-6 col-xl-2">
          <StatCard title="Paid This Month" value={formatCurrency(stats?.paidThisMonth)} icon="bi-check-circle" color="success" />
        </div>
      </div>

      {/* Charts row */}
      {isTenantAdmin && (
        <div className="row g-3 mb-4">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white border-0 pt-3 pb-0">
                <h6 className="fw-semibold mb-0">Monthly Revenue</h6>
              </div>
              <div className="card-body">
                <Line data={revenueChartData} options={{ responsive: true, plugins: { legend: { display: false } } }} height={80} />
              </div>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white border-0 pt-3 pb-0">
                <h6 className="fw-semibold mb-0">Invoice Status</h6>
              </div>
              <div className="card-body d-flex align-items-center justify-content-center">
                {Object.keys(statusChart).length > 0 ? (
                  <Doughnut data={statusChartData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
                ) : <p className="text-muted">No data</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top clients + overdue alerts */}
      {isTenantAdmin && (
        <div className="row g-3 mb-4">
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0 pt-3 pb-0">
                <h6 className="fw-semibold mb-0">Top Clients by Revenue</h6>
              </div>
              <div className="card-body">
                {topClients.length > 0 ? (
                  <Bar data={topClientChartData} options={{ responsive: true, indexAxis: 'y', plugins: { legend: { display: false } } }} height={120} />
                ) : <p className="text-muted small">No data yet</p>}
              </div>
            </div>
          </div>
          {overdueAlerts.length > 0 && (
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm border-danger border-opacity-25">
                <div className="card-header bg-danger bg-opacity-10 border-0 pt-3 pb-0 d-flex align-items-center gap-2">
                  <i className="bi bi-exclamation-triangle text-danger" />
                  <h6 className="fw-semibold mb-0 text-danger">Overdue Alerts ({overdueAlerts.length})</h6>
                </div>
                <div className="card-body p-0">
                  <div className="list-group list-group-flush">
                    {overdueAlerts.slice(0, 5).map((inv) => (
                      <Link key={inv.id} to={`/invoices/${inv.id}`} className="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-2 px-3">
                        <div>
                          <div className="fw-semibold small">{inv.invoiceNumber}</div>
                          <div className="text-muted" style={{ fontSize: '12px' }}>{inv.clientName}</div>
                        </div>
                        <div className="text-end">
                          <div className="fw-semibold text-danger small">{formatCurrency(inv.totalAmount)}</div>
                          <div style={{ fontSize: '11px' }} className="text-danger">{inv.daysOverdue}d overdue</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent invoices */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <h6 className="fw-semibold mb-0">Recent Invoices</h6>
          <Link to="/invoices" className="btn btn-sm btn-outline-primary">View all</Link>
        </div>
        <div className="table-responsive">
          <table className="table table-hover mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th>Invoice #</th>
                <th>Client</th>
                <th className="text-end">Amount</th>
                <th>Status</th>
                <th>Due Date</th>
              </tr>
            </thead>
            <tbody>
              {recentInvoices.map((inv) => (
                <tr key={inv.id}>
                  <td><Link to={`/invoices/${inv.id}`} className="fw-semibold text-decoration-none">{inv.invoiceNumber}</Link></td>
                  <td className="text-muted">{inv.clientName}</td>
                  <td className="text-end fw-semibold">{formatCurrency(inv.totalAmount)}</td>
                  <td><InvoiceStatusBadge status={inv.status} /></td>
                  <td className={`small ${inv.status === 'Overdue' ? 'text-danger fw-semibold' : 'text-muted'}`}>{formatDate(inv.dueDate)}</td>
                </tr>
              ))}
              {recentInvoices.length === 0 && (
                <tr><td colSpan={5} className="text-center text-muted py-4">No invoices yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
