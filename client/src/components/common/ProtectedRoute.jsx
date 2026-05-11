import { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { selectIsAuthenticated, selectIsInitialized, setCredentials, setInitialized } from '../../features/auth/authSlice'
import { useGetMeQuery } from '../../services/authApi'
import Loader from './Loader'

export default function ProtectedRoute() {
  const dispatch = useDispatch()
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const isInitialized = useSelector(selectIsInitialized)
  const accessToken = useSelector((s) => s.auth.accessToken)

  const { data, isLoading, isError } = useGetMeQuery(undefined, {
    skip: !accessToken || isInitialized,
  })

  useEffect(() => {
    if (data?.data) {
      dispatch(setCredentials({ user: data.data.user, accessToken }))
    } else if (isError) {
      dispatch(setInitialized())
    }
  }, [data, isError])

  if (isLoading) return <Loader />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Outlet />
}
