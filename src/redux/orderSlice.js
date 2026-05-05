import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  createPickupAddressApi,
  fetchPickupAddressesApi,
  createConsigneeApi,
  fetchConsigneesApi,
  createOrderApi,
  fetchOrdersApi,
} from "../services/apiCalls";

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

export const fetchPickupAddresses = createAsyncThunk(
  "orders/fetchPickupAddresses",
  async (params, { rejectWithValue }) => {
    try {
      return await fetchPickupAddressesApi(params);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || "Failed to fetch pickup addresses",
      );
    }
  },
);

export const createConsignee = createAsyncThunk(
  "orders/createConsignee",
  async (data, { rejectWithValue }) => {
    try {
      return await createConsigneeApi(data);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || "Failed to create consignee",
      );
    }
  },
);

export const fetchConsignees = createAsyncThunk(
  "orders/fetchConsignees",
  async (params, { rejectWithValue }) => {
    try {
      return await fetchConsigneesApi(params);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || "Failed to fetch consignees",
      );
    }
  },
);

export const createOrder = createAsyncThunk(
  "orders/createOrder",
  async (orderData, { rejectWithValue }) => {
    try {
      return await createOrderApi(orderData);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || "Failed to create order",
      );
    }
  },
);

export const fetchOrders = createAsyncThunk(
  "orders/fetchOrders",
  async (params, { rejectWithValue }) => {
    try {
      return await fetchOrdersApi(params);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || "Failed to fetch orders",
      );
    }
  },
);

const orderSlice = createSlice({
  name: "orders",
  initialState: {
    pickupAddresses: [],
    consignees: [],
    orders: [],
    totalOrders: 0,
    page: 1,
    limit: 10,
    selectedAddress: null,
    totalPickupAddresses: 0,
    totalConsignees: 0,
    loading: false,
    orderLoading: false,
    error: null,
    lastCreatedOrder: null,
  },
  reducers: {
    clearOrderError: (state) => {
      state.error = null;
    },
    clearSelectedAddress: (state) => {
      state.selectedAddress = null;
    },
    setSelectedAddress: (state, action) => {
      state.selectedAddress = action.payload;
    },
    resetOrderState: (state) => {
      state.lastCreatedOrder = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
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
      })

      .addCase(fetchPickupAddresses.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPickupAddresses.fulfilled, (state, action) => {
        state.loading = false;
        state.pickupAddresses = action.payload.items || [];
        state.totalPickupAddresses = action.payload.total || 0;
        state.error = null;

        if (!state.selectedAddress && action.payload.items?.length > 0) {
          state.selectedAddress = action.payload.items[0];
        }
      })
      .addCase(fetchPickupAddresses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchConsignees.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchConsignees.fulfilled, (state, action) => {
        state.loading = false;
        state.consignees = action.payload.items || [];
        state.totalConsignees = action.payload.total || 0;
      })
      .addCase(fetchConsignees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(createConsignee.fulfilled, (state, action) => {
        state.consignees.unshift(action.payload);
      })

      .addCase(createOrder.pending, (state) => {
        state.orderLoading = true;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.orderLoading = false;
        state.lastCreatedOrder = action.payload;
        state.error = null;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.orderLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload.items || [];
        state.totalOrders = action.payload.total || 0;
        state.page = action.payload.page || 1;
        state.limit = action.payload.limit || 10;
        state.error = null;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearOrderError,
  clearSelectedAddress,
  setSelectedAddress,
  resetOrderState,
} = orderSlice.actions;

export default orderSlice.reducer;
