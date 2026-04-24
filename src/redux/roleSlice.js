import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchRolesApi } from "../services/apiCalls";

export const getRoles = createAsyncThunk("roles/get", async () => {
  return await fetchRolesApi();
});

const roleSlice = createSlice({
  name: "roles",
  initialState: { items: [], loading: false },
  extraReducers: (builder) => {
    builder
      .addCase(getRoles.pending, (state) => { state.loading = true; })
      .addCase(getRoles.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
      });
  }
});
export default roleSlice.reducer;