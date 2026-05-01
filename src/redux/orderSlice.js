import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { createPickupAddressApi } from "../services/apiCalls";

// CREATE PICKUP ADDRESS
export const createPickupAddress = createAsyncThunk(
  "orders/createPickupAddress",
  async (data, { rejectWithValue }) => {
    try {
      return await createPickupAddressApi(data);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || "Failed to create pickup address",
      );
    }
  },
);

const orderSlice = createSlice({
  name: "orders",
  initialState: {
    pickupAddresses: [],
    selectedAddress: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearOrderError: (state) => {
      state.error = null;
    },
    clearSelectedAddress: (state) => {
      state.selectedAddress = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // CREATE PICKUP ADDRESS
      .addCase(createPickupAddress.pending, (state) => {
        state.loading = true;
      })
      .addCase(createPickupAddress.fulfilled, (state, action) => {
        state.loading = false;
        state.pickupAddresses.unshift(action.payload);
        state.selectedAddress = action.payload;
        state.error = null;
      })
      .addCase(createPickupAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearOrderError, clearSelectedAddress } = orderSlice.actions;
export default orderSlice.reducer;
