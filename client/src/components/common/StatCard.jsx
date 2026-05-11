export default function StatCard({ title, value, icon, trend, color = 'primary', prefix = '', suffix = '' }) {
  const colorMap = {
    primary: '#1d3557',
    secondary: '#457b9d',
    success: '#2d6a4f',
    danger: '#e63946',
    warning: '#f4a261',
    info: '#0dcaf0',
  }

  const bgColor = colorMap[color] || colorMap.primary

  return (
    <div className="card stat-card border-0 shadow-sm h-100">
      <div className="card-body">
        <div className="d-flex align-items-start justify-content-between">
          <div>
            <p className="text-muted small mb-1 fw-medium text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>
              {title}
            </p>
            <h3 className="fw-bold mb-0">
              {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
            </h3>
            {trend !== undefined && (
              <small className={trend >= 0 ? 'text-success' : 'text-danger'}>
                <i className={`bi ${trend >= 0 ? 'bi-arrow-up-short' : 'bi-arrow-down-short'}`} />
                {Math.abs(trend)}% vs last month
              </small>
            )}
          </div>
          <div
            className="stat-icon-box"
            style={{ background: `${bgColor}20` }}
          >
            <i className={`bi ${icon}`} style={{ color: bgColor }} />
          </div>
        </div>
      </div>
    </div>
  )
}
