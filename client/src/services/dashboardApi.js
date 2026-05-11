import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosBaseQuery } from '../utils/axiosBaseQuery'

export const dashboardApi = createApi({
  reducerPath: 'dashboardApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Dashboard'],
  endpoints: (builder) => ({
    getDashboardStats: builder.query({
      query: () => ({ url: '/dashboard/stats' }),
      providesTags: ['Dashboard'],
    }),
    getRevenueChart: builder.query({
      query: () => ({ url: '/dashboard/revenue-chart' }),
    }),
    getInvoiceStatusChart: builder.query({
      query: () => ({ url: '/dashboard/invoice-status-chart' }),
    }),
    getTopClients: builder.query({
      query: () => ({ url: '/dashboard/top-clients' }),
    }),
    getRecentInvoices: builder.query({
      query: () => ({ url: '/dashboard/recent-invoices' }),
    }),
    getOverdueAlerts: builder.query({
      query: () => ({ url: '/dashboard/overdue-alerts' }),
    }),
  }),
})

export const {
  useGetDashboardStatsQuery,
  useGetRevenueChartQuery,
  useGetInvoiceStatusChartQuery,
  useGetTopClientsQuery,
  useGetRecentInvoicesQuery,
  useGetOverdueAlertsQuery,
} = dashboardApi
