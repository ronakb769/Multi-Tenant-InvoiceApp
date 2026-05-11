import { useSelector } from 'react-redux'
import { selectCurrentUser } from '../features/auth/authSlice'

export const useRole = () => {
  const user = useSelector(selectCurrentUser)
  const role = user?.role || ''

  return {
    isSuperAdmin: role === 'SuperAdmin',
    isTenantAdmin: role === 'TenantAdmin',
    isUser: role === 'User',
    role,
    hasRole: (...roles) => roles.includes(role),
  }
}
