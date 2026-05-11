const statusConfig = {
  Draft:     { cls: 'bg-secondary',  icon: 'bi-pencil' },
  Sent:      { cls: 'bg-primary',    icon: 'bi-send' },
  Paid:      { cls: 'bg-success',    icon: 'bi-check-circle' },
  Overdue:   { cls: 'bg-danger',     icon: 'bi-exclamation-triangle' },
  Cancelled: { cls: 'bg-dark',       icon: 'bi-x-circle' },
}

export default function InvoiceStatusBadge({ status, showIcon = true }) {
  const config = statusConfig[status] || { cls: 'bg-secondary', icon: 'bi-question' }
  return (
    <span className={`badge ${config.cls} d-inline-flex align-items-center gap-1`}>
      {showIcon && <i className={`bi ${config.icon}`} style={{ fontSize: '11px' }} />}
      {status}
    </span>
  )
}
