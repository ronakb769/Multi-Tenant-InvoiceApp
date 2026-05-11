import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js'
import { useGetPlatformRevenueQuery, useGetAdminTenantsQuery, useGetAdminStatsQuery } from '../../services/adminApi'
import Loader from '../../components/common/Loader'
import { formatCurrency } from '../../utils/formatters'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler)

export default function PlatformAnalyticsPage() {
  const { data: revenueData, isLoading: revLoading } = useGetPlatformRevenueQuery()
  const { data: tenantsData } = useGetAdminTenantsQuery()
  const { data: statsData } = useGetAdminStatsQuery()

  const revenue = revenueData?.data || []
  const tenants = tenantsData?.data || []

  const planCounts = tenants.reduce((acc, t) => {
    acc[t.plan] = (acc[t.plan] || 0) + 1
    return acc
  }, {})

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

  const tenantRevenueData = {
    labels: tenants.sort((a, b) => b.revenue - a.revenue).slice(0, 10).map((t) => t.name),
    datasets: [{
      label: 'Revenue',
      data: tenants.sort((a, b) => b.revenue - a.revenue).slice(0, 10).map((t) => t.revenue),
      backgroundColor: 'rgba(29,53,87,0.8)',
      borderRadius: 4,
    }],
  }

  const planChartData = {
    labels: Object.keys(planCounts),
    datasets: [{
      data: Object.values(planCounts),
      backgroundColor: ['#6c757d', '#0d6efd', '#2d6a4f'],
    }],
  }

  if (revLoading) return <Loader />

  return (
    <div>
      <div className="mb-4">
        <h4 className="fw-bold mb-1">Platform Analytics</h4>
        <p className="text-muted mb-0 small">Aggregate metrics across all tenants</p>
      </div>

      {/* Revenue over time */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white fw-semibold">Platform Revenue (12 months)</div>
        <div className="card-body">
          <Line data={revenueChartData} options={{ responsive: true, plugins: { legend: { display: false } } }} height={60} />
        </div>
      </div>

      <div className="row g-4">
        {/* Revenue by tenant */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white fw-semibold">Revenue by Tenant (Top 10)</div>
            <div className="card-body">
              <Bar
                data={tenantRevenueData}
                options={{ responsive: true, indexAxis: 'y', plugins: { legend: { display: false } } }}
                height={200}
              />
            </div>
          </div>
        </div>

        {/* Plan distribution */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white fw-semibold">Plan Distribution</div>
            <div className="card-body d-flex align-items-center justify-content-center">
              {Object.keys(planCounts).length > 0 ? (
                <Pie data={planChartData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
              ) : <p className="text-muted">No data</p>}
            </div>
          </div>
          <div className="card border-0 shadow-sm mt-4">
            <div className="card-header bg-white fw-semibold">Platform Summary</div>
            <div className="card-body">
              {[
                { label: 'Total Tenants', value: statsData?.data?.totalTenants || 0 },
                { label: 'Active Tenants', value: statsData?.data?.activeTenants || 0 },
                { label: 'Total Users', value: statsData?.data?.totalUsers || 0 },
                { label: 'Total Revenue', value: formatCurrency(statsData?.data?.totalRevenue) },
              ].map((item) => (
                <div key={item.label} className="d-flex justify-content-between py-2 border-bottom">
                  <span className="text-muted small">{item.label}</span>
                  <span className="fw-semibold small">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
