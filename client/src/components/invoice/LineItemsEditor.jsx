import { useFieldArray, useWatch } from 'react-hook-form'
import { formatCurrency } from '../../utils/formatters'

export default function LineItemsEditor({ control, register, errors }) {
  const { fields, append, remove } = useFieldArray({ control, name: 'lineItems' })
  const lineItems = useWatch({ control, name: 'lineItems' })

  const getAmount = (index) => {
    const li = lineItems?.[index]
    if (!li) return 0
    return Math.round((parseFloat(li.quantity) || 0) * (parseFloat(li.unitPrice) || 0) * 100) / 100
  }

  return (
    <div>
      <div className="table-responsive">
        <table className="table line-items-table align-middle mb-2">
          <thead className="table-light">
            <tr>
              <th>Description</th>
              <th style={{ width: 90 }}>Qty</th>
              <th style={{ width: 120 }}>Unit Price</th>
              <th style={{ width: 120 }}>Amount</th>
              <th style={{ width: 50 }}></th>
            </tr>
          </thead>
          <tbody>
            {fields.map((field, index) => (
              <tr key={field.id}>
                <td>
                  <input
                    {...register(`lineItems.${index}.description`)}
                    className={`form-control form-control-sm ${errors?.lineItems?.[index]?.description ? 'is-invalid' : ''}`}
                    placeholder="Service or product description"
                  />
                  {errors?.lineItems?.[index]?.description && (
                    <div className="invalid-feedback">{errors.lineItems[index].description.message}</div>
                  )}
                </td>
                <td>
                  <input
                    {...register(`lineItems.${index}.quantity`, { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    min="0.01"
                    className={`form-control form-control-sm text-center ${errors?.lineItems?.[index]?.quantity ? 'is-invalid' : ''}`}
                    placeholder="1"
                  />
                </td>
                <td>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text">$</span>
                    <input
                      {...register(`lineItems.${index}.unitPrice`, { valueAsNumber: true })}
                      type="number"
                      step="0.01"
                      min="0"
                      className={`form-control form-control-sm ${errors?.lineItems?.[index]?.unitPrice ? 'is-invalid' : ''}`}
                      placeholder="0.00"
                    />
                  </div>
                </td>
                <td>
                  <div className="form-control form-control-sm bg-light border-0 fw-semibold">
                    {formatCurrency(getAmount(index))}
                  </div>
                </td>
                <td>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                  >
                    <i className="bi bi-trash" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        className="btn btn-sm btn-outline-primary"
        onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}
      >
        <i className="bi bi-plus-lg me-1" />Add Line Item
      </button>
    </div>
  )
}
