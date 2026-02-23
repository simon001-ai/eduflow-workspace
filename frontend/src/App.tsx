import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import LandingPage from "@/pages/LandingPage";
import StudentAuthPage from "@/pages/StudentAuthPage";
import LecturerAuthPage from "@/pages/LecturerAuthPage";
import StudentLayout from "@/pages/StudentLayout";
import LecturerLayout from "@/pages/LecturerLayout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth/student" element={<StudentAuthPage />} />
            <Route path="/auth/lecturer" element={<LecturerAuthPage />} />
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
