import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosBaseQuery } from '../utils/axiosBaseQuery'

export const tenantApi = createApi({
  reducerPath: 'tenantApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['TenantUser', 'TenantSettings'],
  endpoints: (builder) => ({
    getTenantUsers: builder.query({
      query: () => ({ url: '/tenant/users' }),
      providesTags: ['TenantUser'],
    }),
    createTenantUser: builder.mutation({
      query: (body) => ({ url: '/tenant/users', method: 'POST', body }),
      invalidatesTags: ['TenantUser'],
    }),
    toggleTenantUserStatus: builder.mutation({
      query: (id) => ({ url: `/tenant/users/${id}/status`, method: 'PATCH' }),
      invalidatesTags: ['TenantUser'],
    }),
    getTenantSettings: builder.query({
      query: () => ({ url: '/tenant/settings' }),
      providesTags: ['TenantSettings'],
    }),
    updateTenantBranding: builder.mutation({
      query: (body) => ({ url: '/tenant/settings/branding', method: 'PATCH', body }),
      invalidatesTags: ['TenantSettings'],
    }),
  }),
})

export const {
  useGetTenantUsersQuery,
  useCreateTenantUserMutation,
  useToggleTenantUserStatusMutation,
  useGetTenantSettingsQuery,
  useUpdateTenantBrandingMutation,
} = tenantApi
