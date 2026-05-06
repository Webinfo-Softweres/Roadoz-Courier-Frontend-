import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  createConsigneeApi,
  fetchConsigneesApi,
  updateConsigneeApi,
  deleteConsigneeApi,
} from "../services/apiCalls";

export const createConsignee = createAsyncThunk(
  "consignees/createConsignee",
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
  "consignees/fetchConsignees",
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

export const updateConsignee = createAsyncThunk(
  "consignees/updateConsignee",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await updateConsigneeApi(id, data);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || "Failed to update consignee",
      );
    }
  },
);

export const deleteConsignee = createAsyncThunk(
  "consignees/deleteConsignee",
  async (id, { rejectWithValue }) => {
    try {
      await deleteConsigneeApi(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || "Failed to delete consignee",
      );
    }
  },
);

const consigneeSlice = createSlice({
  name: "consignees",
  initialState: {
    consignees: [],
    totalConsignees: 0,
    currentPage: 1,
    totalPages: 1,
    limit: 25,
    loading: false,
    error: null,
  },

  reducers: {
    clearConsigneeError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder

      // CREATE
      .addCase(createConsignee.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(createConsignee.fulfilled, (state, action) => {
        state.loading = false;
        state.consignees.unshift(action.payload);
      })

      .addCase(createConsignee.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // FETCH
      .addCase(fetchConsignees.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchConsignees.fulfilled, (state, action) => {
        state.loading = false;

        state.consignees = action.payload.items || [];

        state.totalConsignees = action.payload.total || 0;

        state.currentPage = action.payload.page || 1;

        state.totalPages = action.payload.pages || 1;

        state.limit = action.payload.limit || 25;
      })

      .addCase(fetchConsignees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // UPDATE
      .addCase(updateConsignee.pending, (state) => {
        state.loading = true;
      })

      .addCase(updateConsignee.fulfilled, (state, action) => {
        state.loading = false;

        state.consignees = state.consignees.map((c) =>
          c.id === action.payload.id ? action.payload : c,
        );
      })

      .addCase(updateConsignee.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // DELETE
      .addCase(deleteConsignee.pending, (state) => {
        state.loading = true;
      })

      .addCase(deleteConsignee.fulfilled, (state, action) => {
        state.loading = false;

        state.consignees = state.consignees.filter(
          (c) => c.id !== action.payload,
        );
      })

      .addCase(deleteConsignee.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearConsigneeError } = consigneeSlice.actions;

export default consigneeSlice.reducer;
