import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Cookies from "js-cookie";
import { Toaster } from "react-hot-toast";

import { Login } from "./pages/Login";
import { ForgotPassword } from "./pages/ForgotPassword";
import { Profile } from "./pages/Profile";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { Dashboard } from "./pages/Dashboard";
import NewOrder from "./pages/NewOrder";
import { ProcessingOrders } from "./pages/ProcessingOrders";
import { ServiceablePincode } from "./pages/ServiceablePincode";
import { RateCalculator } from "./pages/RateCalculator";
import { ChannelIntegration } from "./pages/ChannelIntegration";
import { Wallet } from "./pages/Wallet";
import { CODRemittance } from "./pages/CODRemittance";
import { Invoices } from "./pages/Invoices";
import { Consignees } from "./pages/Consignees";
import { Tickets } from "./pages/Tickets";
import { Reports } from "./pages/Reports";
import { ChangePassword } from "./pages/ChangePassword";
import { PickupAddress } from "./pages/PickupAddress";
import { GeneralDetails } from "./pages/GeneralDetails";
import { RTOAddress } from "./pages/RTOAddress";
import { LabelSetting } from "./pages/LabelSetting";
import { KYC } from "./pages/KYC";
import { Permissions } from "./pages/admin/Permissions";
import { Roles } from "./pages/admin/Roles";
import { Users } from "./pages/admin/Users";
import { Franchise } from "./pages/Franchise";
import StaffRegistration from "./pages/StaffRegistration";
import FranchiseWizard from "./components/common/FranchiseWizard";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import { NotFound } from "./pages/NotFound";
import { ThemeProvider } from "./contexts/ThemeContext";

export default function App() {
  const token = Cookies.get("access_token");

  return (
    <ThemeProvider>
       <Toaster
        position="top-right"
        reverseOrder={false}
      />
      <Router>
        <Routes>

          <Route
            path="/"
            element={
              token ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
            }
          />

          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />

            <Route path="new-orders" element={<NewOrder />} />
            <Route path="processing-order" element={<ProcessingOrders />} />
            <Route path="all-orders" element={<ProcessingOrders />} />
            <Route path="manifested" element={<ProcessingOrders />} />
            <Route path="not-picked" element={<ProcessingOrders />} />
            <Route path="in-transit" element={<ProcessingOrders />} />
            <Route path="pending" element={<ProcessingOrders />} />
            <Route path="out-for-delivery" element={<ProcessingOrders />} />
            <Route path="delivered" element={<ProcessingOrders />} />
            <Route path="rto-in-transit" element={<ProcessingOrders />} />
            <Route path="rto-delivered" element={<ProcessingOrders />} />
            <Route path="lost" element={<ProcessingOrders />} />
            <Route path="cancelled" element={<ProcessingOrders />} />
            <Route path="returned" element={<ProcessingOrders />} />

            <Route path="serviceable-pincode" element={<ServiceablePincode />} />
            <Route path="rate-calculator" element={<RateCalculator />} />
            <Route path="channel-integration" element={<ChannelIntegration />} />
            <Route path="wallet" element={<Wallet />} />
            <Route path="cod-remittance" element={<CODRemittance />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="consignees" element={<Consignees />} />
            <Route path="tickets" element={<Tickets />} />
            <Route path="reports" element={<Reports />} />

            {/* Settings */}
            <Route path="settings/general" element={<GeneralDetails />} />
            <Route path="settings/password" element={<ChangePassword />} />
            <Route path="settings/pickup" element={<PickupAddress />} />
            <Route path="settings/rto" element={<RTOAddress />} />
            <Route path="settings/label" element={<LabelSetting />} />
            <Route path="settings/kyc" element={<KYC />} />

            {/* Admin */}
            <Route path="admin/modules" element={<Permissions />} />
            <Route path="admin/roles" element={<Roles />} />
            <Route path="admin/users" element={<Users />} />

            {/* Franchise */}
            <Route path="franchise" element={<Franchise />} />
            <Route path="franchise/add-staff" element={<StaffRegistration />} />
            <Route path="franchise/edit-staff/:id" element={<StaffRegistration />} />
            <Route path="franchise/add" element={<FranchiseWizard />} />
            <Route path="franchise/edit/:id" element={<FranchiseWizard />} />
          </Route>

          {/* Profile (outside dashboard layout) */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />

        </Routes>
      </Router>
    </ThemeProvider>
  );
}
