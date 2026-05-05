import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import profileReducer from "./profileSlice";
import franchiseReducer from "./franchiseSlice";
import userReducer from "./userSlice";
import roleReducer from "./roleSlice";
import permissionReducer from "./permissionSlice";
import orderReducer from "./orderSlice";
import walletReducer from "./walletSlice";
import remittanceReducer from "./remittanceSlice";
import invoiceReducer from "./invoiceSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    profile: profileReducer,
    franchise: franchiseReducer,
    users: userReducer,
    roles: roleReducer,
    permissions: permissionReducer,
    orders: orderReducer,
    wallet: walletReducer,
    remittance: remittanceReducer,
    invoices: invoiceReducer,
  },
});

