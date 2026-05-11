import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  selectCurrentUser,
  selectAccessToken,
  selectIsAuthenticated,
  selectIsInitialized,
  setCredentials,
  clearCredentials,
} from '../features/auth/authSlice'
import { useLoginMutation, useLogoutMutation } from '../services/authApi'
import { useToast } from './useToast'

export const useAuth = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()

  const user = useSelector(selectCurrentUser)
  const accessToken = useSelector(selectAccessToken)
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const isInitialized = useSelector(selectIsInitialized)

  const [loginMutation] = useLoginMutation()
  const [logoutMutation] = useLogoutMutation()

  const login = async (credentials) => {
    const result = await loginMutation(credentials).unwrap()
    dispatch(setCredentials({ user: result.data.user, accessToken: result.data.accessToken }))
    showSuccess('Welcome back!')
    const role = result.data.user.role
    if (role === 'SuperAdmin') navigate('/admin/dashboard')
    else navigate('/dashboard')
  }

  const logout = async () => {
    try {
      await logoutMutation().unwrap()
    } catch {}
    dispatch(clearCredentials())
    navigate('/login')
    showSuccess('Logged out successfully.')
  }

  return { user, accessToken, isAuthenticated, isInitialized, login, logout }
}
