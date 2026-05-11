import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  user: null,
  accessToken: localStorage.getItem('accessToken') || null,
  isAuthenticated: !!localStorage.getItem('accessToken'),
  isInitialized: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, accessToken } = action.payload
      state.user = user
      state.accessToken = accessToken
      state.isAuthenticated = true
      state.isInitialized = true
      localStorage.setItem('accessToken', accessToken)
    },
    clearCredentials: (state) => {
      state.user = null
      state.accessToken = null
      state.isAuthenticated = false
      state.isInitialized = true
      localStorage.removeItem('accessToken')
    },
    setInitialized: (state) => {
      state.isInitialized = true
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload }
    },
  },
})

export const { setCredentials, clearCredentials, setInitialized, updateUser } = authSlice.actions
export default authSlice.reducer

export const selectCurrentUser = (state) => state.auth.user
export const selectAccessToken = (state) => state.auth.accessToken
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated
export const selectIsInitialized = (state) => state.auth.isInitialized
