export default function Pagination({ page, totalPages, onPageChange, totalCount, limit }) {
  if (totalPages <= 1) return null
  const from = (page - 1) * limit + 1
  const to = Math.min(page * limit, totalCount)

  return (
    <div className="d-flex align-items-center justify-content-between mt-3">
      <small className="text-muted">Showing {from}–{to} of {totalCount} items</small>
      <nav>
        <ul className="pagination pagination-sm mb-0">
          <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => onPageChange(page - 1)}>
              <i className="bi bi-chevron-left" />
            </button>
          </li>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => Math.abs(p - page) <= 2)
            .map((p) => (
              <li key={p} className={`page-item ${p === page ? 'active' : ''}`}>
                <button className="page-link" onClick={() => onPageChange(p)}>{p}</button>
              </li>
            ))}
          <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => onPageChange(page + 1)}>
              <i className="bi bi-chevron-right" />
            </button>
          </li>
        </ul>
      </nav>
    </div>
  )
}
