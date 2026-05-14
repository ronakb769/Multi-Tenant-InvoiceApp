export default function StatCard({ title, value, icon, trend, color = 'primary' }) {
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
      <div className="card-body p-3">
        {/* Icon + title row — icon stays contained here, never competes with wide value text */}
        <div className="d-flex align-items-center justify-content-between mb-2">
          <p className="text-muted fw-semibold mb-0 text-uppercase text-truncate pe-2"
            style={{ fontSize: '0.68rem', letterSpacing: '0.06em' }}>
            {title}
          </p>
          <div className="stat-icon-box flex-shrink-0" style={{ background: `${bgColor}18`, color: bgColor }}>
            <i className={`bi ${icon}`} />
          </div>
        </div>

        {/* Value — full width, no icon competing for space */}
        <div className="fw-bold text-truncate" style={{ fontSize: '1.2rem', lineHeight: 1.3 }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>

        {trend !== undefined && (
          <small className={`mt-1 d-block ${trend >= 0 ? 'text-success' : 'text-danger'}`}>
            <i className={`bi ${trend >= 0 ? 'bi-arrow-up-short' : 'bi-arrow-down-short'}`} />
            {Math.abs(trend)}% vs last month
          </small>
        )}
      </div>
    </div>
  )
}
