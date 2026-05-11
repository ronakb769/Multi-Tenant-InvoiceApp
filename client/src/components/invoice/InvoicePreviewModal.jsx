import { formatCurrency, formatDate } from '../../utils/formatters'
import InvoiceStatusBadge from './InvoiceStatusBadge'

export default function InvoicePreviewModal({ invoice, show, onClose }) {
  if (!show || !invoice) return null

  return (
    <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Invoice Preview</h5>
            <button className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body p-4">
            <div className="invoice-preview">
              <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                  <h2 className="fw-bold" style={{ color: 'var(--color-primary)' }}>INVOICE</h2>
                  <div className="text-muted">{invoice.invoiceNumber}</div>
                </div>
                <div className="text-end">
                  <InvoiceStatusBadge status={invoice.status} />
                  <div className="small text-muted mt-2">Issue: {formatDate(invoice.issueDate)}</div>
                  <div className="small text-muted">Due: {formatDate(invoice.dueDate)}</div>
                </div>
              </div>

              <div className="row mb-4">
                <div className="col-6">
                  <div className="text-muted small fw-bold text-uppercase mb-1">Bill To</div>
                  <div className="fw-semibold">{invoice.client?.name}</div>
                  <div className="small text-muted">{invoice.client?.email}</div>
                  <div className="small text-muted">{invoice.client?.address}</div>
                </div>
              </div>

              <table className="table table-bordered">
                <thead className="table-dark">
                  <tr>
                    <th>Description</th>
                    <th className="text-center" style={{ width: 80 }}>Qty</th>
                    <th className="text-end" style={{ width: 110 }}>Unit Price</th>
                    <th className="text-end" style={{ width: 110 }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lineItems?.map((li, i) => (
                    <tr key={i}>
                      <td>{li.description}</td>
                      <td className="text-center">{li.quantity}</td>
                      <td className="text-end">{formatCurrency(li.unitPrice)}</td>
                      <td className="text-end fw-semibold">{formatCurrency(li.amount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr><td colSpan={3} className="text-end text-muted">Subtotal</td><td className="text-end">{formatCurrency(invoice.subTotal)}</td></tr>
                  <tr><td colSpan={3} className="text-end text-muted">Tax ({invoice.taxRate}%)</td><td className="text-end">{formatCurrency(invoice.taxAmount)}</td></tr>
                  {invoice.discountAmount > 0 && <tr><td colSpan={3} className="text-end text-muted">Discount</td><td className="text-end text-danger">-{formatCurrency(invoice.discountAmount)}</td></tr>}
                  <tr className="table-active"><td colSpan={3} className="text-end fw-bold fs-5">Total</td><td className="text-end fw-bold fs-5">{formatCurrency(invoice.totalAmount)}</td></tr>
                </tfoot>
              </table>

              {invoice.notes && (
                <div className="mt-3">
                  <div className="text-muted small fw-bold text-uppercase mb-1">Notes</div>
                  <div className="small">{invoice.notes}</div>
                </div>
              )}
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  )
}
