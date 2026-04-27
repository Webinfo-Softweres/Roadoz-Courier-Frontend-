import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import Cookies from "js-cookie";
import { loginApi, logoutApi, checkRoleApi } from "../services/apiCalls";

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (userData, { rejectWithValue }) => {
    try {
      const data = await loginApi(userData);
      
      // Save Token and Role name to Cookies
      Cookies.set("access_token", data.access_token, { expires: 7 });
      Cookies.set("role", data.role.name, { expires: 7 });
      
      // Save full permissions list to LocalStorage for persistence
      localStorage.setItem("permissions", JSON.stringify(data.permissions || []));
      
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Login failed");
    }
  }
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
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      await logoutApi();
    } catch (error) {
      return rejectWithValue(error.response?.data || "Logout failed");
    } finally {
      // Clear all auth data
      Cookies.remove("access_token");
      Cookies.remove("role");
      localStorage.removeItem("permissions");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    role: Cookies.get("role") || null,
    permissions: JSON.parse(localStorage.getItem("permissions") || "[]"),
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
      localStorage.removeItem("permissions");
      state.user = null;
      state.role = null;
      state.permissions = [];
      state.isAuthenticated = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // LOGIN
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.role = action.payload.role.name;
        state.permissions = action.payload.permissions || [];
        state.user = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // LOGOUT
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.role = null;
        state.permissions = [];
        state.isAuthenticated = false;
        state.loading = false;
      })
      // ROLE CHECK
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