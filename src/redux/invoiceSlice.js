import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchInvoicesApi, fetchInvoiceByIdApi } from "../services/apiCalls";

export const fetchInvoices = createAsyncThunk("invoices/fetchAll", async (params) => {
  return await fetchInvoicesApi(params);
});

export const fetchInvoiceDetail = createAsyncThunk("invoices/fetchDetail", async (id) => {
  return await fetchInvoiceByIdApi(id);
});

const invoiceSlice = createSlice({
  name: "invoices",
  initialState: {
    items: [],
    selectedInvoice: null,
    pagination: { total: 0, page: 1, limit: 25, pages: 1 },
    loading: false,
    detailLoading: false,
  },
  reducers: {
    clearSelectedInvoice: (state) => { state.selectedInvoice = null; }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInvoices.pending, (state) => { state.loading = true; })
      .addCase(fetchInvoices.fulfilled, (state, action) => {
        state.loading = false;
        state.items = Array.isArray(action.payload) ? action.payload : (action.payload.items || [action.payload]);
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchInvoiceDetail.pending, (state) => { state.detailLoading = true; })
      .addCase(fetchInvoiceDetail.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedInvoice = action.payload;
      });
  },
});

export const { clearSelectedInvoice } = invoiceSlice.actions;
export default invoiceSlice.reducer;