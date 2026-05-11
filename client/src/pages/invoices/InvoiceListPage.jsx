import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useGetInvoicesQuery, useSendInvoiceMutation, useCancelInvoiceMutation, useCreatePaymentLinkMutation } from '../../services/invoiceApi'
import InvoiceTable from '../../components/invoice/InvoiceTable'
import Loader from '../../components/common/Loader'
import Pagination from '../../components/common/Pagination'
import SearchBar from '../../components/common/SearchBar'
import ConfirmModal from '../../components/common/ConfirmModal'
import { useToast } from '../../hooks/useToast'

const STATUSES = ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled']

export default function InvoiceListPage() {
  const { showSuccess, showError, handleError } = useToast()
  const navigate = useNavigate()
  const [filters, setFilters] = useState({ page: 1, limit: 10, search: '', status: '', sort: '' })
  const [confirmModal, setConfirmModal] = useState(null)
  const [actionId, setActionId] = useState(null)

  const { data, isLoading, isFetching } = useGetInvoicesQuery(filters)
  const [sendInvoice] = useSendInvoiceMutation()
  const [cancelInvoice] = useCancelInvoiceMutation()
  const [createPaymentLink] = useCreatePaymentLinkMutation()

  const result = data?.data
  const invoices = result?.items || []

  const handleSend = async (id) => {
    setConfirmModal({ type: 'send', id, title: 'Send Invoice', message: 'This will generate a PDF and email it to the client.' })
  }

  const handleCancel = (id) => {
    setConfirmModal({ type: 'cancel', id, title: 'Cancel Invoice', message: 'Are you sure you want to cancel this invoice?' })
  }

  const handlePaymentLink = async (id) => {
    try {
      const res = await createPaymentLink(id).unwrap()
      navigator.clipboard?.writeText(res.data)
      showSuccess('Payment link copied to clipboard!')
    } catch (err) {
      handleError(err)
    }
  }

  const handleConfirm = async () => {
    if (!confirmModal) return
    setActionId(confirmModal.id)
    try {
      if (confirmModal.type === 'send') {
        await sendInvoice(confirmModal.id).unwrap()
        showSuccess('Invoice sent successfully!')
      } else if (confirmModal.type === 'cancel') {
        await cancelInvoice(confirmModal.id).unwrap()
        showSuccess('Invoice cancelled.')
      }
    } catch (err) {
      handleError(err)
    } finally {
      setActionId(null)
      setConfirmModal(null)
    }
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">Invoices</h4>
          <p className="text-muted mb-0 small">Manage and track all your invoices</p>
        </div>
        <Link to="/invoices/new" className="btn btn-primary">
          <i className="bi bi-plus-lg me-2" />Create Invoice
        </Link>
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-4">
              <SearchBar
                value={filters.search}
                onChange={(v) => setFilters((f) => ({ ...f, search: v, page: 1 }))}
                placeholder="Search by invoice # or client..."
              />
            </div>
            <div className="col-md-2">
              <select
                className="form-select"
                value={filters.status}
                onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))}
              >
                <option value="">All statuses</option>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <select
                className="form-select"
                value={filters.sort}
                onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}
              >
                <option value="">Sort: Newest</option>
                <option value="date_asc">Date: Oldest</option>
                <option value="amount_desc">Amount: High</option>
                <option value="amount_asc">Amount: Low</option>
              </select>
            </div>
            <div className="col-md-2">
              <input
                type="date"
                className="form-control"
                onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value || undefined, page: 1 }))}
              />
            </div>
            <div className="col-md-2">
              <input
                type="date"
                className="form-control"
                onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value || undefined, page: 1 }))}
              />
            </div>
          </div>

          {/* Active filters */}
          <div className="d-flex gap-2 flex-wrap mt-2">
            {filters.status && (
              <span className="badge bg-primary d-flex align-items-center gap-1">
                Status: {filters.status}
                <button className="btn-close btn-close-white" style={{ fontSize: '10px' }} onClick={() => setFilters((f) => ({ ...f, status: '' }))} />
              </span>
            )}
            {filters.search && (
              <span className="badge bg-secondary d-flex align-items-center gap-1">
                Search: {filters.search}
                <button className="btn-close btn-close-white" style={{ fontSize: '10px' }} onClick={() => setFilters((f) => ({ ...f, search: '' }))} />
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {isLoading || isFetching ? (
            <Loader />
          ) : (
            <>
              <InvoiceTable
                invoices={invoices}
                onSend={handleSend}
                onCancel={handleCancel}
                onDelete={() => {}}
                onPaymentLink={handlePaymentLink}
                loadingId={actionId}
              />
              <div className="px-3 pb-3">
                <Pagination
                  page={result?.page || 1}
                  totalPages={result?.totalPages || 1}
                  totalCount={result?.totalCount || 0}
                  limit={filters.limit}
                  onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <ConfirmModal
        show={!!confirmModal}
        title={confirmModal?.title}
        message={confirmModal?.message}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmModal(null)}
        confirmText={confirmModal?.type === 'cancel' ? 'Cancel Invoice' : 'Send'}
        confirmVariant={confirmModal?.type === 'cancel' ? 'danger' : 'primary'}
        loading={!!actionId}
      />
    </div>
  )
}
