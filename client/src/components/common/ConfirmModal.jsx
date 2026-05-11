export default function ConfirmModal({ show, title, message, onConfirm, onCancel, confirmText = 'Confirm', confirmVariant = 'danger', loading = false }) {
  if (!show) return null
  return (
    <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button className="btn-close" onClick={onCancel} disabled={loading} />
          </div>
          <div className="modal-body">
            <p className="mb-0">{message}</p>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onCancel} disabled={loading}>
              Cancel
            </button>
            <button
              className={`btn btn-${confirmVariant}`}
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
