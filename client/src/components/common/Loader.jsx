export default function Loader({ size = 'md', text = 'Loading...' }) {
  const sizeClass = size === 'sm' ? 'spinner-border-sm' : ''
  return (
    <div className="d-flex flex-column align-items-center justify-content-center py-5">
      <div className={`spinner-border text-primary ${sizeClass}`} role="status">
        <span className="visually-hidden">{text}</span>
      </div>
      {size !== 'sm' && <p className="text-muted mt-3 mb-0">{text}</p>}
    </div>
  )
}
