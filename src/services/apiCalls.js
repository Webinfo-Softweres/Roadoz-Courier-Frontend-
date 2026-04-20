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

export const getProfileImageApi = async () => {
  const res = await API.get(ENDPOINTS.PROFILE_IMAGE);
  return res.data;
};

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
