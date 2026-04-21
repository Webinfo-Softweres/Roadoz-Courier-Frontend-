import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { loginApi, logoutApi, checkRoleApi } from "../services/apiCalls";
import Cookies from "js-cookie";

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (userData, { rejectWithValue }) => {
    try {
      const data = await loginApi(userData);
      // console.log("LOGIN RESPONSE:", data);
      Cookies.set("access_token", data.access_token, { expires: 7 });
      // console.log("COOKIE AFTER SET:", Cookies.get("access_token"));
      Cookies.set("role", data.role, { expires: 7 });
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Login failed");
    }
  },
);

export const checkUserRole = createAsyncThunk(
  "auth/checkUserRole",
  async (email, { rejectWithValue }) => {
    try {
      const data = await checkRoleApi(email);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Role check failed");
    }
  },
);

export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      const response = await logoutApi();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Logout failed");
    } finally {
      Cookies.remove("access_token");
      Cookies.remove("role");
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    role: Cookies.get("role") || null,
    loading: false,
    error: null,
    isAuthenticated: !!Cookies.get("access_token"),
    roleCheckLoading: false,
    roleCheckData: null,
  },
  reducers: {
    logout: (state) => {
      Cookies.remove("access_token");
      Cookies.remove("role");
      state.user = null;
      state.role = null;
      state.isAuthenticated = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.role = action.payload.role;
        state.user = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.role = null;
        state.isAuthenticated = false;
      })
      .addCase(logoutUser.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.role = null;
        state.isAuthenticated = false;
      })
      .addCase(checkUserRole.pending, (state) => {
        state.roleCheckLoading = true;
      })
      .addCase(checkUserRole.fulfilled, (state, action) => {
        state.roleCheckLoading = false;
        state.roleCheckData = action.payload;
      })
      .addCase(checkUserRole.rejected, (state, action) => {
        state.roleCheckLoading = false;
        state.error = action.payload;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
