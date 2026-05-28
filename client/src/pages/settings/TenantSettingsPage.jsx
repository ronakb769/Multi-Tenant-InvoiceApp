import { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { toast } from 'react-toastify'
import { updateUser } from '../../features/auth/authSlice'
import {
  useGetTenantSettingsQuery,
  useUpdateTenantBrandingMutation,
} from '../../services/tenantApi'

const PRESET_COLORS = [
  { label: 'Navy', value: '#1d3557' },
  { label: 'Indigo', value: '#4f46e5' },
  { label: 'Teal', value: '#0d9488' },
  { label: 'Emerald', value: '#059669' },
  { label: 'Violet', value: '#7c3aed' },
  { label: 'Rose', value: '#e11d48' },
  { label: 'Amber', value: '#d97706' },
  { label: 'Slate', value: '#475569' },
]

export default function TenantSettingsPage() {
  const dispatch = useDispatch()
  const { data, isLoading } = useGetTenantSettingsQuery()
  const [updateBranding, { isLoading: saving }] = useUpdateTenantBrandingMutation()

  const settings = data?.data

  const [logoUrl, setLogoUrl] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#1d3557')
  const [logoError, setLogoError] = useState(false)

  useEffect(() => {
    if (settings) {
      setLogoUrl(settings.logoUrl ?? '')
      setPrimaryColor(settings.primaryColor ?? '#1d3557')
    }
  }, [settings])

  // Live-preview the selected color
  useEffect(() => {
    document.documentElement.style.setProperty('--color-primary', primaryColor)
  }, [primaryColor])

  const handleSave = async () => {
    try {
      const result = await updateBranding({
        logoUrl: logoUrl || null,
        primaryColor,
      }).unwrap()

      // Sync color + logo into Redux so navbar/sidebar update immediately
      dispatch(updateUser({
        logoUrl: result.data.logoUrl,
        tenantPrimaryColor: result.data.primaryColor,
      }))

      toast.success('Branding saved successfully.')
    } catch (err) {
      toast.error(err?.data?.message ?? 'Failed to save branding.')
    }
  }

  if (isLoading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: 300 }}>
        <span className="spinner-border" style={{ color: 'var(--color-primary)' }} />
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <h4 className="fw-bold mb-1">Tenant Branding</h4>
        <p className="text-muted mb-0">
          Customize your logo and brand color — applied to the dashboard, invoices, PDF exports, and the client payment page.
        </p>
      </div>

      <div className="row g-4">
        {/* Left: form */}
        <div className="col-12 col-lg-7">
          {/* Logo */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
              <h6 className="fw-bold mb-3">
                <i className="bi bi-image me-2" style={{ color: 'var(--color-primary)' }} />
                Company Logo
              </h6>
              <label className="form-label">Logo URL</label>
              <input
                type="url"
                className="form-control mb-2"
                placeholder="https://example.com/logo.png"
                value={logoUrl}
                onChange={(e) => { setLogoUrl(e.target.value); setLogoError(false) }}
              />
              <div className="form-text">
                Paste a direct image URL (PNG, SVG, or JPEG). Shown on your invoices and PDF exports.
              </div>

              {logoUrl && !logoError && (
                <div className="mt-3 p-3 border rounded bg-light d-inline-flex align-items-center gap-3">
                  <img
                    src={logoUrl}
                    alt="logo preview"
                    style={{ maxHeight: 56, maxWidth: 200, objectFit: 'contain' }}
                    onError={() => setLogoError(true)}
                  />
                  <span className="text-muted small">Preview</span>
                </div>
              )}
              {logoError && (
                <div className="alert alert-warning mt-2 py-2 mb-0" style={{ fontSize: 13 }}>
                  <i className="bi bi-exclamation-triangle me-1" />
                  Could not load image from that URL.
                </div>
              )}
            </div>
          </div>

          {/* Color */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
              <h6 className="fw-bold mb-3">
                <i className="bi bi-palette me-2" style={{ color: 'var(--color-primary)' }} />
                Brand Color
              </h6>

              <div className="d-flex flex-wrap gap-2 mb-3">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    title={c.label}
                    onClick={() => setPrimaryColor(c.value)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: c.value,
                      border: primaryColor === c.value ? '3px solid #fff' : '3px solid transparent',
                      outline: primaryColor === c.value ? `2px solid ${c.value}` : 'none',
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </div>

              <div className="d-flex align-items-center gap-3">
                <div>
                  <label className="form-label mb-1 small fw-semibold">Custom color</label>
                  <input
                    type="color"
                    className="form-control form-control-color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    style={{ width: 56, height: 40 }}
                  />
                </div>
                <div>
                  <label className="form-label mb-1 small fw-semibold">Hex value</label>
                  <input
                    type="text"
                    className="form-control"
                    value={primaryColor}
                    onChange={(e) => {
                      const v = e.target.value
                      if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) setPrimaryColor(v)
                    }}
                    style={{ width: 110, fontFamily: 'monospace' }}
                    maxLength={7}
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            className="btn btn-primary px-4 py-2 fw-semibold"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="bi bi-check2 me-2" />}
            Save branding
          </button>
        </div>

        {/* Right: live preview */}
        <div className="col-12 col-lg-5">
          <div className="card border-0 shadow-sm sticky-top" style={{ top: 80 }}>
            <div className="card-header fw-semibold bg-white border-bottom">
              <i className="bi bi-eye me-2" />Live preview
            </div>
            <div className="card-body p-0 overflow-hidden" style={{ borderRadius: '0 0 8px 8px' }}>
              {/* Sidebar preview strip */}
              <div style={{ background: primaryColor, padding: '16px 20px', color: 'white' }}>
                <div className="d-flex align-items-center gap-2 mb-3">
                  {logoUrl && !logoError ? (
                    <img
                      src={logoUrl}
                      alt=""
                      style={{ height: 32, maxWidth: 120, objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
                      onError={() => {}}
                    />
                  ) : (
                    <i className="bi bi-receipt-cutoff" style={{ fontSize: 22 }} />
                  )}
                  <span className="fw-bold">{settings?.name || 'Your Company'}</span>
                </div>
                {['Dashboard', 'Invoices', 'Clients'].map((label) => (
                  <div key={label} className="d-flex align-items-center gap-2 mb-1 px-2 py-1 rounded"
                    style={{ background: 'rgba(255,255,255,0.12)', fontSize: 13 }}>
                    <i className="bi bi-circle-fill" style={{ fontSize: 5 }} />
                    {label}
                  </div>
                ))}
              </div>

              {/* Invoice PDF header preview */}
              <div style={{ padding: '20px 20px 16px' }}>
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    {logoUrl && !logoError ? (
                      <img src={logoUrl} alt="" style={{ maxHeight: 40, maxWidth: 120, objectFit: 'contain' }} onError={() => {}} />
                    ) : (
                      <div className="fw-bold" style={{ color: primaryColor, fontSize: 16 }}>{settings?.name || 'Your Company'}</div>
                    )}
                  </div>
                  <div className="text-end">
                    <div className="fw-bold small" style={{ color: primaryColor }}>INV-DEMO-2024-0001</div>
                    <span className="badge" style={{ background: '#198754', fontSize: 10 }}>Paid</span>
                  </div>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr>
                      {['Description', 'Qty', 'Amount'].map((h) => (
                        <td key={h} style={{ background: primaryColor, color: 'white', padding: '6px 8px', fontWeight: 600 }}>{h}</td>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '6px 8px', borderBottom: '1px solid #dee2e6' }}>Web Development</td>
                      <td style={{ padding: '6px 8px', borderBottom: '1px solid #dee2e6', textAlign: 'center' }}>1</td>
                      <td style={{ padding: '6px 8px', borderBottom: '1px solid #dee2e6', textAlign: 'right' }}>$1,200.00</td>
                    </tr>
                    <tr style={{ background: '#f8f9fa' }}>
                      <td colSpan={2} style={{ padding: '6px 8px', fontWeight: 700, textAlign: 'right' }}>Total</td>
                      <td style={{ padding: '6px 8px', fontWeight: 700, color: primaryColor, textAlign: 'right' }}>$1,200.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
