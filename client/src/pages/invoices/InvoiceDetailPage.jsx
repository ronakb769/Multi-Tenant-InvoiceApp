import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useGetInvoiceQuery, useSendInvoiceMutation, useCancelInvoiceMutation, useCreatePaymentLinkMutation } from '../../services/invoiceApi'
import InvoiceStatusBadge from '../../components/invoice/InvoiceStatusBadge'
import Loader from '../../components/common/Loader'
import ConfirmModal from '../../components/common/ConfirmModal'
import { formatCurrency, formatDate, formatDateTime, getDaysOverdue } from '../../utils/formatters'
import { useToast } from '../../hooks/useToast'
import { useRole } from '../../hooks/useRole'
import axiosInstance from '../../utils/axiosBaseQuery'

export default function InvoiceDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showSuccess, handleError } = useToast()
  const { isTenantAdmin } = useRole()
  const [confirmModal, setConfirmModal] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  const { data, isLoading } = useGetInvoiceQuery(id)
  const [sendInvoice] = useSendInvoiceMutation()
  const [cancelInvoice] = useCancelInvoiceMutation()
  const [createPaymentLink] = useCreatePaymentLinkMutation()

  if (isLoading) return <Loader />

  const invoice = data?.data
  if (!invoice) return <div className="alert alert-danger">Invoice not found.</div>

   console.log(invoice,"invoice");
  const isOverdue = invoice.status === 'Overdue'
  const daysOverdue = isOverdue ? getDaysOverdue(invoice.dueDate) : 0

  const handleSend = () => setConfirmModal({ type: 'send', title: 'Send Invoice', message: `Send invoice ${invoice.invoiceNumber} to ${invoice.client?.email}?` })
  const handleCancel = () => setConfirmModal({ type: 'cancel', title: 'Cancel Invoice', message: 'Are you sure? This action cannot be undone.' })

  const handleConfirm = async () => {
    setActionLoading(true)
    try {
      if (confirmModal.type === 'send') {
        await sendInvoice(id).unwrap()
        showSuccess('Invoice sent!')
      } else if (confirmModal.type === 'cancel') {
        await cancelInvoice(id).unwrap()
        showSuccess('Invoice cancelled.')
      }
    } catch (err) {
      handleError(err)
    } finally {
      setActionLoading(false)
      setConfirmModal(null)
    }
  }

  const handleDownloadPdf = async () => {
    try {
      const response = await axiosInstance.get(`/invoices/${id}/pdf`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${invoice.invoiceNumber}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      handleError(err)
    }
  }

  const handlePaymentLink = async () => {
    try {
      const res = await createPaymentLink(id).unwrap()
      navigator.clipboard?.writeText(res.data)
      showSuccess('Payment link copied to clipboard!')
    } catch (err) {
      handleError(err)
    }
  }

  return (
    <div>
      {/* Overdue alert */}
      {isOverdue && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-4">
          <i className="bi bi-exclamation-triangle-fill fs-5" />
          <div>
            <strong>This invoice is {daysOverdue} days overdue!</strong> Please follow up with the client.
          </div>
        </div>
      )}

      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div className="d-flex align-items-center gap-3">
          <button className="btn btn-link text-secondary p-0" onClick={() => navigate('/invoices')}>
            <i className="bi bi-arrow-left fs-5" />
          </button>
          <div>
            <h4 className="fw-bold mb-1">{invoice.invoiceNumber}</h4>
            <InvoiceStatusBadge status={invoice.status} />
          </div>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          {invoice.status === 'Draft' && (
            <Link to={`/invoices/${id}/edit`} className="btn btn-outline-primary btn-sm">
              <i className="bi bi-pencil me-1" />Edit
            </Link>
          )}
          {(invoice.status === 'Draft') && (
            <button className="btn btn-success btn-sm" onClick={handleSend}>
              <i className="bi bi-send me-1" />Send
            </button>
          )}
          <button className="btn btn-outline-secondary btn-sm" onClick={handleDownloadPdf}>
            <i className="bi bi-file-earmark-pdf me-1" />PDF
          </button>
          {(invoice.status === 'Sent' || invoice.status === 'Overdue') && (
            <button className="btn btn-info btn-sm text-white" onClick={handlePaymentLink}>
              <i className="bi bi-credit-card me-1" />Payment Link
            </button>
          )}
          {isTenantAdmin && invoice.status !== 'Paid' && invoice.status !== 'Cancelled' && (
            <button className="btn btn-outline-danger btn-sm" onClick={handleCancel}>
              <i className="bi bi-x me-1" />Cancel
            </button>
          )}
        </div>
      </div>

      <div className="row g-4">
        {/* Left — invoice preview */}
        <div className="col-lg-8">
          <div className="invoice-preview">
            {/* From / To */}
            <div className="row mb-4">
              <div className="col-6">
                <div className="text-muted small fw-bold text-uppercase mb-2">From</div>
               
                <div className="fw-semibold">{invoice.tenantName ? `${invoice.tenantName}` : "Your Company"}</div>
              </div>
              <div className="col-6">
                <div className="text-muted small fw-bold text-uppercase mb-2">Bill To</div>
                <div className="fw-semibold">{invoice.client?.name}</div>
                <div className="text-muted small">{invoice.client?.email}</div>
                {invoice.client?.address && <div className="text-muted small">{invoice.client.address}</div>}
                {invoice.client?.city && <div className="text-muted small">{invoice.client.city}, {invoice.client.country}</div>}
              </div>
            </div>

            <div className="row mb-4">
              <div className="col-6">
                <div className="text-muted small">Issue Date</div>
                <div className="fw-semibold">{formatDate(invoice.issueDate)}</div>
              </div>
              <div className="col-6">
                <div className="text-muted small">Due Date</div>
                <div className={`fw-semibold ${isOverdue ? 'text-danger' : ''}`}>{formatDate(invoice.dueDate)}</div>
              </div>
            </div>

            {/* Line items table */}
            <table className="table table-bordered mb-3">
              <thead className="table-dark">
                <tr>
                  <th>Description</th>
                  <th className="text-center" style={{ width: 80 }}>Qty</th>
                  <th className="text-end" style={{ width: 110 }}>Unit Price</th>
                  <th className="text-end" style={{ width: 120 }}>Amount</th>
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
                <tr className="table-active fw-bold fs-5">
                  <td colSpan={3} className="text-end">Total</td>
                  <td className="text-end">{formatCurrency(invoice.totalAmount)}</td>
                </tr>
              </tfoot>
            </table>

            {invoice.notes && (
              <div>
                <div className="text-muted small fw-bold text-uppercase mb-1">Notes</div>
                <div className="small text-muted">{invoice.notes}</div>
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="col-lg-4">
          {/* Timeline */}
          <div className="card border-0 shadow-sm mb-3">
            <div className="card-header bg-white fw-semibold">Timeline</div>
            <div className="card-body">
              {[
                { label: 'Created', date: invoice.createdAt, icon: 'bi-plus-circle', color: 'secondary' },
                { label: 'Sent', date: invoice.sentAt, icon: 'bi-send', color: 'primary' },
                { label: 'Paid', date: invoice.paidAt, icon: 'bi-check-circle', color: 'success' },
              ].map((t) => (
                <div key={t.label} className={`d-flex align-items-center gap-3 mb-3 ${!t.date ? 'opacity-25' : ''}`}>
                  <i className={`bi ${t.icon} text-${t.color} fs-5`} />
                  <div>
                    <div className="fw-semibold small">{t.label}</div>
                    <div className="text-muted" style={{ fontSize: '12px' }}>{t.date ? formatDateTime(t.date) : 'Not yet'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Client info */}
          <div className="card border-0 shadow-sm mb-3">
            <div className="card-header bg-white fw-semibold d-flex justify-content-between">
              Client
              <Link to={`/clients/${invoice.clientId}/edit`} className="btn btn-link btn-sm p-0">Edit</Link>
            </div>
            <div className="card-body">
              <div className="fw-semibold">{invoice.client?.name}</div>
              <div className="text-muted small">{invoice.client?.email}</div>
              {invoice.client?.phone && <div className="text-muted small">{invoice.client.phone}</div>}
            </div>
          </div>

          {/* Payment history */}
          {invoice.payments?.length > 0 && (
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white fw-semibold">Payment History</div>
              <div className="card-body p-0">
                {invoice.payments.map((p) => (
                  <div key={p.id} className="p-3 border-bottom">
                    <div className="d-flex justify-content-between">
                      <div className="fw-semibold small">{formatCurrency(p.amount)}</div>
                      <span className={`badge ${p.status === 'Succeeded' ? 'bg-success' : 'bg-danger'}`}>{p.status}</span>
                    </div>
                    <div className="text-muted" style={{ fontSize: '12px' }}>{formatDateTime(p.paidAt)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        show={!!confirmModal}
        title={confirmModal?.title}
        message={confirmModal?.message}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmModal(null)}
        confirmVariant={confirmModal?.type === 'cancel' ? 'danger' : 'success'}
        confirmText={confirmModal?.type === 'send' ? 'Send Invoice' : 'Cancel Invoice'}
        loading={actionLoading}
      />
    </div>
  )
}
