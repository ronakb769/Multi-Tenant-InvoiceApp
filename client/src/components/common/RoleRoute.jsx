import { Navigate, Outlet } from 'react-router-dom'
import { useRole } from '../../hooks/useRole'

export default function RoleRoute({ allowedRoles }) {
  const { role } = useRole()
  if (!allowedRoles.includes(role)) return <Navigate to="/unauthorized" replace />
  return <Outlet />
}
