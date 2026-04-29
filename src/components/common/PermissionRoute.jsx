import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useEffect } from "react";

export const PermissionRoute = ({ children, permission }) => {
  const { role, permissions, isAuthenticated } = useSelector((state) => state.auth);

  const hasAccess = role === "super_admin" || (permission ? permissions.includes(permission) : true);

  useEffect(() => {
    if (isAuthenticated && !hasAccess) {
      toast.error("No Permission: Access Denied to this module.");
    }
  }, [hasAccess, isAuthenticated]);

  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!hasAccess) return <Navigate to="/dashboard" />;

  return children;
};