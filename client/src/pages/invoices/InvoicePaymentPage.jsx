import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import axiosInstance from '../../utils/axiosBaseQuery'
import { formatCurrency, formatDate } from '../../utils/formatters'
import Loader from '../../components/common/Loader'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_placeholder')

function PaymentForm({ invoice, clientSecret, onSuccess }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    setError('')

    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: elements.getElement(CardElement) }
    })

    if (result.error) {
      setError(result.error.message)
      setLoading(false)
    } else if (result.paymentIntent.status === 'succeeded') {
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4 p-3 border rounded" style={{ background: '#f8f9fa' }}>
        <CardElement options={{ style: { base: { fontSize: '16px', color: '#212529' } } }} />
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      <button type="submit" className="btn btn-primary w-100 py-3 fw-semibold" disabled={!stripe || loading}>
        {loading ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="bi bi-lock-fill me-2" />}
        Pay {formatCurrency(invoice.totalAmount)}
      </button>
      <div className="text-center mt-2">
        <small className="text-muted"><i className="bi bi-shield-lock me-1" />Secured by Stripe</small>
      </div>
    </form>
  )
}

export default function InvoicePaymentPage() {
  const { invoiceId } = useParams()
  const [searchParams] = useSearchParams()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paid, setPaid] = useState(false)
  const clientSecret = searchParams.get('client_secret')

  useEffect(() => {
    axiosInstance.get(`/invoices/${invoiceId}`)
      .then((res) => setInvoice(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [invoiceId])

  if (loading) return <Loader />
  if (!invoice) return <div className="alert alert-danger m-4">Invoice not found.</div>

  if (paid) return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: 'var(--color-light-bg)' }}>
      <div className="text-center">
        <div className="mb-4 rounded-circle bg-success d-flex align-items-center justify-content-center mx-auto" style={{ width: 80, height: 80 }}>
          <i className="bi bi-check-lg text-white fs-1" />
        </div>
        <h2 className="fw-bold mb-2">Payment Successful!</h2>
        <p className="text-muted">Your payment of <strong>{formatCurrency(invoice.totalAmount)}</strong> has been processed.</p>
        <div className="card border-0 shadow-sm mx-auto mt-4" style={{ maxWidth: 360 }}>
          <div className="card-body text-start">
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Invoice</span>
              <strong>{invoice.invoiceNumber}</strong>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Amount</span>
              <strong className="text-success">{formatCurrency(invoice.totalAmount)}</strong>
            </div>
            <div className="d-flex justify-content-between">
              <span className="text-muted">Date</span>
              <strong>{formatDate(new Date())}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center py-5" style={{ background: 'var(--color-light-bg)' }}>
      <div className="w-100" style={{ maxWidth: 500 }}>
        {/* Header */}
        <div className="text-center mb-4">
          <i className="bi bi-receipt-cutoff fs-2 mb-2 d-block" style={{ color: 'var(--color-primary)' }} />
          <h4 className="fw-bold">Pay Invoice</h4>
          <span className="badge bg-secondary">{invoice.invoiceNumber}</span>
        </div>

        {/* Invoice summary */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">From</span>
              <strong>{invoice.client?.name}</strong>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Due date</span>
              <strong>{formatDate(invoice.dueDate)}</strong>
            </div>
            <hr />
            <div className="d-flex justify-content-between">
              <span className="fw-bold fs-5">Amount Due</span>
              <strong className="fs-5" style={{ color: 'var(--color-primary)' }}>{formatCurrency(invoice.totalAmount)}</strong>
            </div>
          </div>
        </div>

        {/* Payment form */}
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white fw-semibold">
            <i className="bi bi-credit-card me-2" />Payment Details
          </div>
          <div className="card-body">
            {clientSecret ? (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <PaymentForm invoice={invoice} clientSecret={clientSecret} onSuccess={() => setPaid(true)} />
              </Elements>
            ) : (
              <div className="alert alert-warning">
                No payment link found. Please request a payment link from the invoicing party.
              </div>
            )}
          </div>
        </div>

        <div className="text-center mt-4">
          <small className="text-muted">
            Test card: 4242 4242 4242 4242 | Any future date | Any CVC
          </small>
        </div>
      </div>
    </div>
  )
}
