export default function Footer() {
  return (
    <footer className="border-top py-3 px-4 mt-auto" style={{ background: 'white' }}>
      <div className="d-flex justify-content-between align-items-center">
        <small className="text-muted">© {new Date().getFullYear()} InvoicePro. All rights reserved.</small>
        <small className="text-muted">v1.0.0</small>
      </div>
    </footer>
  )
}
