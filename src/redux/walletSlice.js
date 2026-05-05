import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchWalletTransactionsApi } from "../services/apiCalls";

export const fetchTransactions = createAsyncThunk(
  "wallet/fetchTransactions",
  async (params, { rejectWithValue }) => {
    try {
      const data = await fetchWalletTransactionsApi(params);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch transactions");
    }
  }
);

const walletSlice = createSlice({
  name: "wallet",
  initialState: {
    transactions: [],
    pagination: {
      total: 0,
      page: 1,
      limit: 25,
      pages: 1,
    },
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactions.pending, (status) => {
        status.loading = true;
        status.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = action.payload.items;
        state.pagination = {
          total: action.payload.total,
          page: action.payload.page,
          limit: action.payload.limit,
          pages: action.payload.pages,
        };
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default walletSlice.reducer;