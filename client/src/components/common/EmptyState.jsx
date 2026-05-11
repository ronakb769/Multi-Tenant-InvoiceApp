export default function EmptyState({ icon = 'bi-inbox', title = 'No data found', description = '', action }) {
  return (
    <div className="text-center py-5">
      <i className={`bi ${icon} text-muted`} style={{ fontSize: '3rem' }}></i>
      <h5 className="mt-3 text-muted">{title}</h5>
      {description && <p className="text-muted small">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
