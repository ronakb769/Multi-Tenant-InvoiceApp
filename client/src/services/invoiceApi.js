import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosBaseQuery } from '../utils/axiosBaseQuery'

export const invoiceApi = createApi({
  reducerPath: 'invoiceApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Invoice', 'InvoiceStats'],
  endpoints: (builder) => ({
    getInvoices: builder.query({
      query: (params) => ({ url: '/invoices', params }),
      providesTags: ['Invoice'],
    }),
    getInvoice: builder.query({
      query: (id) => ({ url: `/invoices/${id}` }),
      providesTags: (result, error, id) => [{ type: 'Invoice', id }],
    }),
    createInvoice: builder.mutation({
      query: (body) => ({ url: '/invoices', method: 'POST', body }),
      invalidatesTags: ['Invoice', 'InvoiceStats'],
    }),
    updateInvoice: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/invoices/${id}`, method: 'PUT', body }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Invoice', id }, 'InvoiceStats'],
    }),
    deleteInvoice: builder.mutation({
      query: (id) => ({ url: `/invoices/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Invoice', 'InvoiceStats'],
    }),
    sendInvoice: builder.mutation({
      query: (id) => ({ url: `/invoices/${id}/send`, method: 'PATCH' }),
      invalidatesTags: (result, error, id) => [{ type: 'Invoice', id }, 'InvoiceStats'],
    }),
    cancelInvoice: builder.mutation({
      query: (id) => ({ url: `/invoices/${id}/cancel`, method: 'PATCH' }),
      invalidatesTags: (result, error, id) => [{ type: 'Invoice', id }, 'InvoiceStats'],
    }),
    createPaymentLink: builder.mutation({
      query: (id) => ({ url: `/invoices/${id}/payment-link`, method: 'POST' }),
    }),
    getInvoiceStatsSummary: builder.query({
      query: () => ({ url: '/invoices/stats/summary' }),
      providesTags: ['InvoiceStats'],
    }),
    getInvoiceMonthlyStats: builder.query({
      query: () => ({ url: '/invoices/stats/monthly' }),
      providesTags: ['InvoiceStats'],
    }),
  }),
})

export const {
  useGetInvoicesQuery,
  useGetInvoiceQuery,
  useCreateInvoiceMutation,
  useUpdateInvoiceMutation,
  useDeleteInvoiceMutation,
  useSendInvoiceMutation,
  useCancelInvoiceMutation,
  useCreatePaymentLinkMutation,
  useGetInvoiceStatsSummaryQuery,
  useGetInvoiceMonthlyStatsQuery,
} = invoiceApi
