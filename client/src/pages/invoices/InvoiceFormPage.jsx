import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useCreateInvoiceMutation, useUpdateInvoiceMutation, useGetInvoiceQuery } from '../../services/invoiceApi'
import LineItemsEditor from '../../components/invoice/LineItemsEditor'
import ClientSelectDropdown from '../../components/client/ClientSelectDropdown'
import InvoiceStatusBadge from '../../components/invoice/InvoiceStatusBadge'
import Loader from '../../components/common/Loader'
import { formatCurrency } from '../../utils/formatters'
import { useToast } from '../../hooks/useToast'

const schema = yup.object({
  clientId: yup.string().required('Client is required'),
  issueDate: yup.string().required('Issue date is required'),
  dueDate: yup.string().required('Due date is required'),
  lineItems: yup.array().of(yup.object({
    description: yup.string().required('Description is required'),
    quantity: yup.number().min(0.01).required(),
    unitPrice: yup.number().min(0).required(),
  })).min(1, 'At least one line item required'),
  taxRate: yup.number().min(0).max(100),
  discountAmount: yup.number().min(0),
  notes: yup.string(),
})

export default function InvoiceFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showSuccess, handleError } = useToast()
  const isEdit = !!id

  const { data: invoiceData, isLoading: invoiceLoading } = useGetInvoiceQuery(id, { skip: !isEdit })
  const [createInvoice, { isLoading: creating }] = useCreateInvoiceMutation()
  const [updateInvoice, { isLoading: updating }] = useUpdateInvoiceMutation()

  const { register, control, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      lineItems: [{ description: '', quantity: 1, unitPrice: 0 }],
      taxRate: 0,
      discountAmount: 0,
    }
  })

  const lineItems = useWatch({ control, name: 'lineItems' }) || []
  const taxRate = useWatch({ control, name: 'taxRate' }) || 0
  const discountAmount = useWatch({ control, name: 'discountAmount' }) || 0

  const subTotal = lineItems.reduce((sum, li) => sum + (parseFloat(li.quantity) || 0) * (parseFloat(li.unitPrice) || 0), 0)
  const taxAmount = subTotal * (parseFloat(taxRate) / 100)
  const total = subTotal + taxAmount - parseFloat(discountAmount || 0)

  const invoice = invoiceData?.data

  useEffect(() => {
    if (invoice) {
      const today = new Date().toISOString().split('T')[0]
      reset({
        clientId: invoice.clientId,
        issueDate: invoice.issueDate?.split('T')[0] || today,
        dueDate: invoice.dueDate?.split('T')[0] || today,
        lineItems: invoice.lineItems?.map((li) => ({
          description: li.description,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
        })) || [{ description: '', quantity: 1, unitPrice: 0 }],
        taxRate: invoice.taxRate || 0,
        discountAmount: invoice.discountAmount || 0,
        notes: invoice.notes || '',
      })
    }
  }, [invoice])

  if (isEdit && invoiceLoading) return <Loader />

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        issueDate: new Date(data.issueDate).toISOString(),
        dueDate: new Date(data.dueDate).toISOString(),
        lineItems: data.lineItems.map((li) => ({
          description: li.description,
          quantity: parseFloat(li.quantity),
          unitPrice: parseFloat(li.unitPrice),
          amount: parseFloat(li.quantity) * parseFloat(li.unitPrice),
        })),
        taxRate: parseFloat(data.taxRate),
        discountAmount: parseFloat(data.discountAmount),
      }
      if (isEdit) {
        await updateInvoice({ id, ...payload }).unwrap()
        showSuccess('Invoice updated.')
      } else {
        const res = await createInvoice(payload).unwrap()
        showSuccess('Invoice created.')
        navigate(`/invoices/${res.data.id}`)
        return
      }
      navigate(`/invoices/${id}`)
    } catch (err) {
      handleError(err)
    }
  }

  return (
    <div>
      <div className="d-flex align-items-center gap-3 mb-4">
        <button className="btn btn-link text-secondary p-0" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left fs-5" />
        </button>
        <div>
          <h4 className="fw-bold mb-0">{isEdit ? 'Edit Invoice' : 'New Invoice'}</h4>
          {invoice && <InvoiceStatusBadge status={invoice.status} />}
        </div>
        {invoice && <span className="badge bg-light text-dark border ms-2">{invoice.invoiceNumber}</span>}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="row g-4">
          {/* Left column */}
          <div className="col-lg-8">
            {/* Client + dates */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-white fw-semibold">Invoice Details</div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label fw-semibold">Client <span className="text-danger">*</span></label>
                  <ClientSelectDropdown
                    value={useWatch({ control, name: 'clientId' })}
                    onChange={(v) => setValue('clientId', v, { shouldValidate: true })}
                    error={errors.clientId?.message}
                  />
                </div>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Issue Date <span className="text-danger">*</span></label>
                    <input type="date" {...register('issueDate')} className={`form-control ${errors.issueDate ? 'is-invalid' : ''}`} />
                    {errors.issueDate && <div className="invalid-feedback">{errors.issueDate.message}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Due Date <span className="text-danger">*</span></label>
                    <input type="date" {...register('dueDate')} className={`form-control ${errors.dueDate ? 'is-invalid' : ''}`} />
                    {errors.dueDate && <div className="invalid-feedback">{errors.dueDate.message}</div>}
                  </div>
                </div>
              </div>
            </div>

            {/* Line items */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-white fw-semibold">Line Items</div>
              <div className="card-body">
                <LineItemsEditor control={control} register={register} errors={errors} />
                {errors.lineItems?.message && <div className="text-danger small mt-2">{errors.lineItems.message}</div>}
              </div>
            </div>

            {/* Notes */}
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white fw-semibold">Notes</div>
              <div className="card-body">
                <textarea {...register('notes')} className="form-control" rows={3} placeholder="Additional notes or payment terms..." />
              </div>
            </div>
          </div>

          {/* Right column — summary */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm sticky-top" style={{ top: 80 }}>
              <div className="card-header bg-white fw-semibold">Invoice Summary</div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Tax Rate (%)</label>
                  <div className="input-group">
                    <input type="number" {...register('taxRate')} step="0.1" min="0" max="100" className="form-control" />
                    <span className="input-group-text">%</span>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Discount</label>
                  <div className="input-group">
                    <span className="input-group-text">$</span>
                    <input type="number" {...register('discountAmount')} step="0.01" min="0" className="form-control" />
                  </div>
                </div>

                <hr />
                <table className="table table-borderless table-sm mb-0">
                  <tbody>
                    <tr>
                      <td className="text-muted small">Subtotal</td>
                      <td className="text-end small">{formatCurrency(subTotal)}</td>
                    </tr>
                    <tr>
                      <td className="text-muted small">Tax ({parseFloat(taxRate) || 0}%)</td>
                      <td className="text-end small">{formatCurrency(taxAmount)}</td>
                    </tr>
                    {parseFloat(discountAmount) > 0 && (
                      <tr>
                        <td className="text-muted small">Discount</td>
                        <td className="text-end small text-danger">-{formatCurrency(parseFloat(discountAmount))}</td>
                      </tr>
                    )}
                    <tr className="border-top">
                      <td className="fw-bold fs-5">Total</td>
                      <td className="text-end fw-bold fs-5">{formatCurrency(total)}</td>
                    </tr>
                  </tbody>
                </table>

                <div className="d-grid gap-2 mt-3">
                  <button type="submit" className="btn btn-primary" disabled={creating || updating}>
                    {(creating || updating) ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                    {isEdit ? 'Save Changes' : 'Save as Draft'}
                  </button>
                  <button type="button" className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
