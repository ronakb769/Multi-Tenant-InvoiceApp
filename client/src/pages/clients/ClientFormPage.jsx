import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useGetClientQuery, useCreateClientMutation, useUpdateClientMutation } from '../../services/clientApi'
import { useGetClientInvoicesQuery } from '../../services/clientApi'
import Loader from '../../components/common/Loader'
import { useToast } from '../../hooks/useToast'
import { formatCurrency, formatDate } from '../../utils/formatters'
import InvoiceStatusBadge from '../../components/invoice/InvoiceStatusBadge'
import { Link } from 'react-router-dom'

const schema = yup.object({
  name: yup.string().required('Name is required').min(2),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string(),
  address: yup.string(),
  city: yup.string(),
  country: yup.string(),
  taxNumber: yup.string(),
})

export default function ClientFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showSuccess, handleError } = useToast()
  const isEdit = !!id

  const { data: clientData, isLoading } = useGetClientQuery(id, { skip: !isEdit })
  const { data: invoicesData } = useGetClientInvoicesQuery({ id }, { skip: !isEdit })
  const [createClient, { isLoading: creating }] = useCreateClientMutation()
  const [updateClient, { isLoading: updating }] = useUpdateClientMutation()

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  })

  const client = clientData?.data

  useEffect(() => {
    if (client) reset(client)
  }, [client])

  if (isEdit && isLoading) return <Loader />

  const onSubmit = async (data) => {
    try {
      if (isEdit) {
        await updateClient({ id, ...data }).unwrap()
        showSuccess('Client updated.')
      } else {
        const res = await createClient(data).unwrap()
        showSuccess('Client created.')
        navigate(`/clients/${res.data.id}/edit`)
        return
      }
    } catch (err) {
      handleError(err)
    }
  }

  const invoices = invoicesData?.data?.items || []

  return (
    <div>
      <div className="d-flex align-items-center gap-3 mb-4">
        <button className="btn btn-link text-secondary p-0" onClick={() => navigate('/clients')}>
          <i className="bi bi-arrow-left fs-5" />
        </button>
        <h4 className="fw-bold mb-0">{isEdit ? `Edit Client` : 'New Client'}</h4>
        {client && <span className="badge bg-secondary">{client.isActive ? 'Active' : 'Inactive'}</span>}
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white fw-semibold">Client Information</div>
            <div className="card-body">
              <form id="clientForm" onSubmit={handleSubmit(onSubmit)}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Full Name <span className="text-danger">*</span></label>
                    <input {...register('name')} className={`form-control ${errors.name ? 'is-invalid' : ''}`} placeholder="Acme Corporation" />
                    {errors.name && <div className="invalid-feedback">{errors.name.message}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Email <span className="text-danger">*</span></label>
                    <input {...register('email')} type="email" className={`form-control ${errors.email ? 'is-invalid' : ''}`} placeholder="billing@company.com" />
                    {errors.email && <div className="invalid-feedback">{errors.email.message}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Phone</label>
                    <input {...register('phone')} className="form-control" placeholder="+1-555-0100" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Tax Number</label>
                    <input {...register('taxNumber')} className="form-control" placeholder="TAX-123456" />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold">Address</label>
                    <input {...register('address')} className="form-control" placeholder="Street address" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">City</label>
                    <input {...register('city')} className="form-control" placeholder="City" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Country</label>
                    <input {...register('country')} className="form-control" placeholder="Country" />
                  </div>
                </div>
              </form>
            </div>
            <div className="card-footer bg-white d-flex gap-2">
              <button type="submit" form="clientForm" className="btn btn-primary" disabled={creating || updating}>
                {(creating || updating) ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                {isEdit ? 'Save Changes' : 'Create Client'}
              </button>
              <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/clients')}>Cancel</button>
            </div>
          </div>

          {/* Invoice history (edit mode only) */}
          {isEdit && invoices.length > 0 && (
            <div className="card border-0 shadow-sm mt-4">
              <div className="card-header bg-white fw-semibold d-flex justify-content-between">
                Invoice History
                <Link to={`/invoices/new`} className="btn btn-sm btn-outline-primary">New Invoice</Link>
              </div>
              <div className="table-responsive">
                <table className="table table-hover mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Invoice #</th>
                      <th>Date</th>
                      <th className="text-end">Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id}>
                        <td><Link to={`/invoices/${inv.id}`} className="text-decoration-none fw-semibold">{inv.invoiceNumber}</Link></td>
                        <td className="text-muted small">{formatDate(inv.issueDate)}</td>
                        <td className="text-end fw-semibold">{formatCurrency(inv.totalAmount)}</td>
                        <td><InvoiceStatusBadge status={inv.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Stats sidebar */}
        {isEdit && client && (
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white fw-semibold">Quick Stats</div>
              <div className="card-body">
                <div className="mb-3">
                  <div className="text-muted small">Total Invoices</div>
                  <div className="fw-bold fs-4">{client.totalInvoices}</div>
                </div>
                <div className="mb-3">
                  <div className="text-muted small">Total Revenue</div>
                  <div className="fw-bold fs-4 text-success">{formatCurrency(client.totalRevenue)}</div>
                </div>
                <div>
                  <div className="text-muted small">Status</div>
                  <span className={`badge ${client.isActive ? 'bg-success' : 'bg-secondary'}`}>
                    {client.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
