import { Link } from 'react-router-dom'
import { formatCurrency, getInitials } from '../../utils/formatters'

export default function ClientCard({ client }) {
  return (
    <div className="card border-0 shadow-sm h-100 hover-shadow">
      <div className="card-body">
        <div className="d-flex align-items-center gap-3 mb-3">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
            style={{ width: 48, height: 48, background: 'var(--color-primary)', fontSize: '14px' }}
          >
            {getInitials(client.name)}
          </div>
          <div className="overflow-hidden">
            <h6 className="fw-semibold mb-0 text-truncate">{client.name}</h6>
            <div className="small text-muted text-truncate">{client.email}</div>
          </div>
          {!client.isActive && (
            <span className="badge bg-secondary ms-auto">Inactive</span>
          )}
        </div>
        <div className="row g-2 text-center mb-3">
          <div className="col-6">
            <div className="small text-muted">Invoices</div>
            <div className="fw-semibold">{client.totalInvoices || 0}</div>
          </div>
          <div className="col-6">
            <div className="small text-muted">Revenue</div>
            <div className="fw-semibold text-success">{formatCurrency(client.totalRevenue)}</div>
          </div>
        </div>
        <div className="d-flex gap-2">
          <Link to={`/clients/${client.id}/edit`} className="btn btn-sm btn-outline-primary flex-grow-1">
            <i className="bi bi-pencil me-1" />Edit
          </Link>
          <Link to={`/invoices?clientId=${client.id}`} className="btn btn-sm btn-outline-secondary flex-grow-1">
            <i className="bi bi-receipt me-1" />Invoices
          </Link>
        </div>
      </div>
    </div>
  )
}
