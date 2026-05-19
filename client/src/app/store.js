import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/authSlice'
import uiReducer from '../features/ui/uiSlice'
import { authApi } from '../services/authApi'
import { invoiceApi } from '../services/invoiceApi'
import { clientApi } from '../services/clientApi'
import { paymentApi } from '../services/paymentApi'
import { dashboardApi } from '../services/dashboardApi'
import { adminApi } from '../services/adminApi'
import { tenantApi } from '../services/tenantApi'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    [authApi.reducerPath]: authApi.reducer,
    [invoiceApi.reducerPath]: invoiceApi.reducer,
    [clientApi.reducerPath]: clientApi.reducer,
    [paymentApi.reducerPath]: paymentApi.reducer,
    [dashboardApi.reducerPath]: dashboardApi.reducer,
    [adminApi.reducerPath]: adminApi.reducer,
    [tenantApi.reducerPath]: tenantApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      invoiceApi.middleware,
      clientApi.middleware,
      paymentApi.middleware,
      dashboardApi.middleware,
      adminApi.middleware,
      tenantApi.middleware
    ),
})
