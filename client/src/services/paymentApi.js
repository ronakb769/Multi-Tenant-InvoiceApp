import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosBaseQuery } from '../utils/axiosBaseQuery'

export const paymentApi = createApi({
  reducerPath: 'paymentApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Payment'],
  endpoints: (builder) => ({
    getPayments: builder.query({
      query: (params) => ({ url: '/payments', params }),
      providesTags: ['Payment'],
    }),
    getInvoicePayments: builder.query({
      query: (invoiceId) => ({ url: `/payments/${invoiceId}` }),
      providesTags: (result, error, id) => [{ type: 'Payment', id }],
    }),
  }),
})

export const {
  useGetPaymentsQuery,
  useGetInvoicePaymentsQuery,
} = paymentApi
