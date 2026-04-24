import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import profileReducer from "./profileSlice";
import franchiseReducer from "./franchiseSlice";
import userReducer from "./userSlice";
import roleReducer from "./roleSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    profile: profileReducer,
    franchise: franchiseReducer,
    users: userReducer, 
    roles: roleReducer,
  },
});
