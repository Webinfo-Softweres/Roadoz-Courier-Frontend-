import axios from "axios";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { ENDPOINTS } from "./endpoints";

const BASE_URL =
  import.meta.env.VITE_APP_BASE_URL || "http://api.roadozcourier.com/api/v1";

const API = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const isTokenExpired = (token) => {
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch (err) {
    return true;
  }
};

API.interceptors.request.use((config) => {
  const token = Cookies.get("access_token");

  if (token) {
    if (isTokenExpired(token)) {
      console.warn("Token expired. Logging out...");

      Cookies.remove("access_token");
      window.location.href = "/login";

      return Promise.reject("Token expired");
    }

    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const checkRoleApi = async (email) => {
  const res = await API.post(ENDPOINTS.CHECK_ROLE, { email });
  return res.data;
};

export const loginApi = async (data) => {
  const res = await API.post(ENDPOINTS.LOGIN, data);
  return res.data;
};

export const logoutApi = async () => {
  const res = await API.post(ENDPOINTS.LOGOUT);
  return res.data;
};

export const getProfileApi = async () => {
  const res = await API.get(ENDPOINTS.PROFILE);
  return res.data;
};

// export const getProfileImageApi = async () => {
//   const res = await API.get(ENDPOINTS.PROFILE_IMAGE);
//   return res.data;
// };

export const updateProfileApi = async (data) => {
  const res = await API.put(ENDPOINTS.PROFILE, data);
  return res.data;
};

export const uploadProfileImageApi = async (formData) => {
  const res = await API.post(ENDPOINTS.UPLOAD_IMAGE, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

export const changePasswordRequestApi = async (data) => {
  const res = await API.post(ENDPOINTS.CHANGE_PASSWORD_REQUEST, data);
  return res.data;
};

export const changePasswordVerifyApi = async (data) => {
  const res = await API.post(ENDPOINTS.CHANGE_PASSWORD_VERIFY, data);
  return res.data;
};

export const fetchFranchisesApi = async (params) => {
  const res = await API.get(ENDPOINTS.FRANCHISE, { params });
  return res.data;
};

export const fetchFranchiseByIdApi = async (id) => {
  const res = await API.get(`${ENDPOINTS.FRANCHISE}/${id}`);
  return res.data;
};

export const createFranchiseApi = async (data) => {
  const res = await API.post(ENDPOINTS.FRANCHISE, data);
  return res.data;
};

export const updateFranchiseApi = async (id, data) => {
  const res = await API.put(`${ENDPOINTS.FRANCHISE}/${id}`, data);
  return res.data;
};

export const deleteFranchiseApi = async (id) => {
  const res = await API.delete(`${ENDPOINTS.FRANCHISE}/${id}`);
  return res.data;
};

export const fetchUsersApi = async (params) => {
  const res = await API.get(ENDPOINTS.USERS, { params });
  return res.data;
};

export const createUserApi = async (data) => {
  const res = await API.post("/rbac/users", data);
  return res.data;
};

export const updateUserApi = async (id, data) => {
  const res = await API.put(`/rbac/users/${id}`, data);
  return res.data;
};

export const deleteUserApi = async (id) => {
  const res = await API.delete(`/rbac/users/${id}`);
  return res.data;
};

export const fetchRolesApi = async () => {
  const res = await API.get("/rbac/roles");
  return res.data; 
};

export const assignRoleToUserApi = async (userId, roleId) => {
  const res = await API.put(`/rbac/users/${userId}`, { role_id: roleId });
  return res.data;
};

