import axios from 'axios'
import { clearCredentials, setCredentials } from '../features/auth/authSlice'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const axiosInstance = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  withCredentials: true,
})

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token)
  })
  failedQueue = []
}

export const setupAxiosInterceptors = (store) => {
  axiosInstance.interceptors.request.use((config) => {
    const token = store.getState().auth.accessToken
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })

  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config
      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject })
          }).then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return axiosInstance(originalRequest)
          })
        }

        originalRequest._retry = true
        isRefreshing = true

        try {
          const response = await axiosInstance.post('/auth/refresh')
          const { accessToken, user } = response.data.data
          store.dispatch(setCredentials({ accessToken, user }))
          processQueue(null, accessToken)
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return axiosInstance(originalRequest)
        } catch (refreshError) {
          processQueue(refreshError)
          store.dispatch(clearCredentials())
          window.location.href = '/login'
          return Promise.reject(refreshError)
        } finally {
          isRefreshing = false
        }
      }
      return Promise.reject(error)
    }
  )
}

export const axiosBaseQuery = () => async ({ url, method = 'GET', body, params }) => {
  try {
    const result = await axiosInstance({ url, method, data: body, params })
    return { data: result.data }
  } catch (axiosError) {
    return {
      error: {
        status: axiosError.response?.status,
        data: axiosError.response?.data || axiosError.message,
      },
    }
  }
}

export default axiosInstance
