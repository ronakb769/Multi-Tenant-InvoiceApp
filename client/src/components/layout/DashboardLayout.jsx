import { Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import Footer from './Footer'

export default function DashboardLayout() {
  const collapsed = useSelector((s) => s.ui.sidebarCollapsed)

  return (
    <div className="d-flex">
      <Sidebar />
      <div className={`main-content ${collapsed ? 'collapsed' : ''} d-flex flex-column w-100`} style={{ minHeight: '100vh' }}>
        <Navbar />
        <main className="flex-grow-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  )
}
