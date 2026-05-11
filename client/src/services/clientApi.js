import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosBaseQuery } from '../utils/axiosBaseQuery'

export const clientApi = createApi({
  reducerPath: 'clientApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Client'],
  endpoints: (builder) => ({
    getClients: builder.query({
      query: (params) => ({ url: '/clients', params }),
      providesTags: ['Client'],
    }),
    getClient: builder.query({
      query: (id) => ({ url: `/clients/${id}` }),
      providesTags: (result, error, id) => [{ type: 'Client', id }],
    }),
    createClient: builder.mutation({
      query: (body) => ({ url: '/clients', method: 'POST', body }),
      invalidatesTags: ['Client'],
    }),
    updateClient: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/clients/${id}`, method: 'PUT', body }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Client', id }, 'Client'],
    }),
    deleteClient: builder.mutation({
      query: (id) => ({ url: `/clients/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Client'],
    }),
    getClientInvoices: builder.query({
      query: ({ id, ...params }) => ({ url: `/clients/${id}/invoices`, params }),
    }),
  }),
})

export const {
  useGetClientsQuery,
  useGetClientQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
  useDeleteClientMutation,
  useGetClientInvoicesQuery,
} = clientApi
