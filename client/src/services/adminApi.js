import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosBaseQuery } from '../utils/axiosBaseQuery'

export const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['AdminTenant', 'AdminUser'],
  endpoints: (builder) => ({
    getAdminStats: builder.query({
      query: () => ({ url: '/admin/stats' }),
    }),
    getAdminTenants: builder.query({
      query: () => ({ url: '/admin/tenants' }),
      providesTags: ['AdminTenant'],
    }),
    getAdminTenant: builder.query({
      query: (id) => ({ url: `/admin/tenants/${id}` }),
      providesTags: (result, error, id) => [{ type: 'AdminTenant', id }],
    }),
    updateTenantStatus: builder.mutation({
      query: ({ tenantId, isActive }) => ({
        url: `/admin/tenants/${tenantId}/status`,
        method: 'PATCH',
        body: { isActive },
      }),
      invalidatesTags: ['AdminTenant'],
    }),
    updateTenantPlan: builder.mutation({
      query: ({ tenantId, plan }) => ({
        url: `/admin/tenants/${tenantId}/plan`,
        method: 'PATCH',
        body: { plan },
      }),
      invalidatesTags: ['AdminTenant'],
    }),
    getAdminUsers: builder.query({
      query: (params) => ({ url: '/admin/users', params }),
      providesTags: ['AdminUser'],
    }),
    getPlatformRevenue: builder.query({
      query: () => ({ url: '/admin/platform-revenue' }),
    }),
  }),
})

export const {
  useGetAdminStatsQuery,
  useGetAdminTenantsQuery,
  useGetAdminTenantQuery,
  useUpdateTenantStatusMutation,
  useUpdateTenantPlanMutation,
  useGetAdminUsersQuery,
  useGetPlatformRevenueQuery,
} = adminApi
