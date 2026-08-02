import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchPendingOrdersApi } from "../services/apiCalls";

export const getPendingOrders = createAsyncThunk(
  "orderApproval/getPending",
  async (params, { rejectWithValue }) => {
    try {
      const response = await fetchPendingOrdersApi(params);
      return response;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch orders");
    }
  }
);

const orderApprovalSlice = createSlice({
  name: "orderApproval",
  initialState: {
    items: [],
    loading: false,
    pagination: { page: 1, limit: 10, total: 0, total_pages: 1 },
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getPendingOrders.pending, (state) => {
        state.loading = true;
      })
      .addCase(getPendingOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total,
          total_pages: action.payload.total_pages,
        };
      })
      .addCase(getPendingOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default orderApprovalSlice.reducer;