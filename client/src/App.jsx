import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { setupAxiosInterceptors } from './utils/axiosBaseQuery'
import { store } from './app/store'

// Layout
import DashboardLayout from './components/layout/DashboardLayout'
import Navbar from './components/layout/Navbar'

// Auth guards
import ProtectedRoute from './components/common/ProtectedRoute'
import RoleRoute from './components/common/RoleRoute'

// Public pages
import LandingPage from './pages/public/LandingPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import InvoicePaymentPage from './pages/invoices/InvoicePaymentPage'

// Dashboard
import DashboardPage from './pages/dashboard/DashboardPage'

// Invoices
import InvoiceListPage from './pages/invoices/InvoiceListPage'
import InvoiceFormPage from './pages/invoices/InvoiceFormPage'
import InvoiceDetailPage from './pages/invoices/InvoiceDetailPage'

// Clients
import ClientListPage from './pages/clients/ClientListPage'
import ClientFormPage from './pages/clients/ClientFormPage'

// Users
import TenantUsersPage from './pages/users/TenantUsersPage'

// Admin
import AdminDashboard from './pages/admin/AdminDashboard'
import TenantManagementPage from './pages/admin/TenantManagementPage'
import UserManagementPage from './pages/admin/UserManagementPage'
import PlatformAnalyticsPage from './pages/admin/PlatformAnalyticsPage'

// Misc
import NotFoundPage from './pages/misc/NotFoundPage'
import UnauthorizedPage from './pages/misc/UnauthorizedPage'

setupAxiosInterceptors(store)

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/pay/:invoiceId" element={<InvoicePaymentPage />} />

      {/* Authenticated */}
      <Route element={<ProtectedRoute />}>
        {/* Tenant users */}
        <Route element={<RoleRoute allowedRoles={['TenantAdmin', 'User']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/invoices" element={<InvoiceListPage />} />
            <Route path="/invoices/new" element={<InvoiceFormPage />} />
            <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
            <Route path="/invoices/:id/edit" element={<InvoiceFormPage />} />
            <Route path="/clients" element={<ClientListPage />} />
            <Route path="/clients/new" element={<ClientFormPage />} />
            <Route path="/clients/:id/edit" element={<ClientFormPage />} />
            <Route path="/users" element={<TenantUsersPage />} />
          </Route>
        </Route>

        {/* SuperAdmin */}
        <Route element={<RoleRoute allowedRoles={['SuperAdmin']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/tenants" element={<TenantManagementPage />} />
            <Route path="/admin/users" element={<UserManagementPage />} />
            <Route path="/admin/analytics" element={<PlatformAnalyticsPage />} />
          </Route>
        </Route>
      </Route>

      {/* Misc */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
