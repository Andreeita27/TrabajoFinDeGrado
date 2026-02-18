import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function AdminRoute() {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role !== "ADMIN") return <Navigate to="/" replace />;

  return <Outlet />;
}
