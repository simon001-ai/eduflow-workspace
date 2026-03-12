import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import LandingPage from "@/pages/LandingPage";
import StudentAuthPage from "@/pages/StudentAuthPage";
import LecturerAuthPage from "@/pages/LecturerAuthPage";
import StudentLayout from "@/pages/StudentLayout";
import LecturerLayout from "@/pages/LecturerLayout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// redirect component used on the “/” route
const HomeRedirect = () => {
  const { isAuthenticated, role } = useAuth();

  if (isAuthenticated) {
    if (role === "student") return <Navigate to="/student/dashboard" replace />;
    if (role === "lecturer") return <Navigate to="/lecturer/dashboard" replace />;
  }

  return <LandingPage />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* if already logged in go straight to the appropriate dashboard */}
            <Route path="/" element={<HomeRedirect />} />

            {/* authentication pages */}
            <Route path="/auth/student" element={<StudentAuthPage />} />
            <Route path="/auth/lecturer" element={<LecturerAuthPage />} />

            {/* student/lecturer areas – layouts include their own
                child routes such as “dashboard”, “assignments”, etc. */}
            <Route
              path="/student/*"
              element={
                <ProtectedRoute role="student">
                  <StudentLayout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lecturer/*"
              element={
                <ProtectedRoute role="lecturer">
                  <LecturerLayout />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
