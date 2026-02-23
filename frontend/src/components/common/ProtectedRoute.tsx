import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export const ProtectedRoute = ({ children, role }: { children: React.ReactNode; role: "student" | "lecturer" }) => {
  const { isAuthenticated, role: userRole } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (userRole !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
};
