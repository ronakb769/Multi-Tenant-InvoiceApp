import { Link } from 'react-router-dom'
import InvoiceStatusBadge from './InvoiceStatusBadge'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { useRole } from '../../hooks/useRole'

export default function InvoiceTable({ invoices, onSend, onCancel, onDelete, onPaymentLink, loadingId }) {
  const { isTenantAdmin } = useRole()

  if (!invoices?.length) return (
    <div className="text-center py-5 text-muted">
      <i className="bi bi-receipt fs-1 d-block mb-2" />
      No invoices found
    </div>
  )

  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle mb-0">
        <thead className="table-light">
          <tr>
            <th>Invoice #</th>
            <th>Client</th>
            <th>Issue Date</th>
            <th>Due Date</th>
            <th className="text-end">Amount</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr key={inv.id}>
              <td>
                <Link to={`/invoices/${inv.id}`} className="fw-semibold text-decoration-none">
                  {inv.invoiceNumber}
                </Link>
              </td>
              <td>{inv.client?.name || '—'}</td>
              <td className="text-muted">{formatDate(inv.issueDate)}</td>
              <td className={inv.status === 'Overdue' ? 'text-danger fw-semibold' : 'text-muted'}>
                {formatDate(inv.dueDate)}
              </td>
              <td className="text-end fw-semibold">{formatCurrency(inv.totalAmount)}</td>
              <td><InvoiceStatusBadge status={inv.status} /></td>
              <td>
                <div className="d-flex gap-1 flex-wrap">
                  <Link to={`/invoices/${inv.id}`} className="btn btn-xs btn-outline-secondary" style={{ padding: '2px 8px', fontSize: '12px' }}>
                    <i className="bi bi-eye" />
                  </Link>
                  {inv.status === 'Draft' && (
                    <Link to={`/invoices/${inv.id}/edit`} className="btn btn-xs btn-outline-primary" style={{ padding: '2px 8px', fontSize: '12px' }}>
                      <i className="bi bi-pencil" />
                    </Link>
                  )}
                  {(inv.status === 'Draft' || inv.status === 'Sent') && (
                    <button
                      className="btn btn-xs btn-outline-success"
                      style={{ padding: '2px 8px', fontSize: '12px' }}
                      onClick={() => onSend(inv.id)}
                      disabled={loadingId === inv.id}
                    >
                      <i className="bi bi-send" />
                    </button>
                  )}
                  {(inv.status === 'Sent' || inv.status === 'Overdue') && (
                    <button
                      className="btn btn-xs btn-outline-info"
                      style={{ padding: '2px 8px', fontSize: '12px' }}
                      onClick={() => onPaymentLink(inv.id)}
                      title="Create payment link"
                    >
                      <i className="bi bi-credit-card" />
                    </button>
                  )}
                  {isTenantAdmin && inv.status !== 'Paid' && inv.status !== 'Cancelled' && (
                    <button
                      className="btn btn-xs btn-outline-danger"
                      style={{ padding: '2px 8px', fontSize: '12px' }}
                      onClick={() => onCancel(inv.id)}
                    >
                      <i className="bi bi-x" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
