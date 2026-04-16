import { Navigate } from "react-router-dom";

export const ProtectedRoute = ({ children }) => {
  const isAuth = localStorage.getItem("isAuth");

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  return children;
};
