import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchUsersApi, createUserApi, updateUserApi, deleteUserApi } from "../services/apiCalls";

export const getUsers = createAsyncThunk("users/get", async (params) => {
  return await fetchUsersApi(params);
});

export const addUser = createAsyncThunk("users/add", async (data) => {
  return await createUserApi(data);
});

export const editUser = createAsyncThunk("users/edit", async ({ id, data }) => {
  return await updateUserApi(id, data);
});

export const removeUser = createAsyncThunk("users/delete", async (id) => {
  await deleteUserApi(id);
  return id;
});

const userSlice = createSlice({
  name: "users",
  initialState: { items: [], loading: false, pagination: {} },
  extraReducers: (builder) => {
    builder
      .addCase(getUsers.pending, (state) => { state.loading = true; })
      .addCase(getUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.pagination = action.payload;
      })
      .addCase(getUsers.rejected, (state) => { state.loading = false; })
      .addCase(removeUser.fulfilled, (state, action) => {
        state.items = state.items.filter(u => u.id !== action.payload);
      });
  }
});
export default userSlice.reducer;