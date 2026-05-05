import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchRemittanceApi } from "../services/apiCalls";

export const fetchRemittanceData = createAsyncThunk(
  "remittance/fetchData",
  async (params, { rejectWithValue }) => {
    try {
      return await fetchRemittanceApi(params);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch remittance");
    }
  }
);

const remittanceSlice = createSlice({
  name: "remittance",
  initialState: {
    items: [],
    summary: {
      remittedTillDate: 0,
      remittedOrders: 0,
      dueAmount: 0,
      dueOrders: 0
    },
    pagination: { total: 0, page: 1, limit: 25, pages: 1 },
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRemittanceData.pending, (state) => { state.loading = true; })
      .addCase(fetchRemittanceData.fulfilled, (state, action) => {
        state.loading = false;
        const data = Array.isArray(action.payload) ? action.payload : (action.payload.items || [action.payload]);
        state.items = data;
        
        // Calculate Summary from items (Logic depends on your backend summary availability)
        state.summary.remittedTillDate = data.filter(i => i.status === 'paid').reduce((acc, curr) => acc + curr.total_amount, 0);
        state.summary.remittedOrders = data.filter(i => i.status === 'paid').reduce((acc, curr) => acc + curr.orders_count, 0);
        state.summary.dueAmount = data.filter(i => i.status === 'pending').reduce((acc, curr) => acc + curr.total_amount, 0);
        state.summary.dueOrders = data.filter(i => i.status === 'pending').reduce((acc, curr) => acc + curr.orders_count, 0);
        
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchRemittanceData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default remittanceSlice.reducer;