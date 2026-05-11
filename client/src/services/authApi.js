import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosBaseQuery } from '../utils/axiosBaseQuery'

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: axiosBaseQuery(),
  endpoints: (builder) => ({
    register: builder.mutation({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),
    login: builder.mutation({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    logout: builder.mutation({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
    }),
    getMe: builder.query({
      query: () => ({ url: '/auth/me' }),
      providesTags: ['Auth'],
    }),
    updateProfile: builder.mutation({
      query: (body) => ({ url: '/auth/me/profile', method: 'PUT', body }),
      invalidatesTags: ['Auth'],
    }),
    changePassword: builder.mutation({
      query: (body) => ({ url: '/auth/me/password', method: 'PUT', body }),
    }),
    checkSubdomain: builder.query({
      query: (subdomain) => ({ url: '/tenant/check-subdomain', params: { subdomain } }),
    }),
  }),
})

export const {
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useGetMeQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useCheckSubdomainQuery,
} = authApi
