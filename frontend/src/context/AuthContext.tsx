import React, { createContext, useContext, useState, ReactNode } from "react";
import { Student, Lecturer, mockStudents, mockLecturers } from "@/data/mockData";

type UserRole = "student" | "lecturer" | null;

interface AuthState {
  isAuthenticated: boolean;
  role: UserRole;
  student: Student | null;
  lecturer: Lecturer | null;
}

interface AuthContextType extends AuthState {
  loginStudent: (admissionNumber: string, password: string) => Promise<boolean>;
  loginLecturer: (staffNumber: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    role: null,
    student: null,
    lecturer: null,
  });

  const loginStudent = async (admissionNumber: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch("http://localhost:3000/api/auth/student/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admission_number: admissionNumber, password })
      });
      const result = await res.json();
      if (result.success && result.data && result.data.user && result.data.token) {
        setAuth({ isAuthenticated: true, role: "student", student: result.data.user, lecturer: null });
        localStorage.setItem("token", result.data.token);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const loginLecturer = async (staffNumber: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch("http://localhost:3000/api/auth/lecturer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staff_number: staffNumber, password })
      });
      const result = await res.json();
      if (result.success && result.data && result.data.user && result.data.token) {
        setAuth({ isAuthenticated: true, role: "lecturer", student: null, lecturer: result.data.user });
        localStorage.setItem("token", result.data.token);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Signup logic removed: signup is not allowed from frontend

  const logout = () => {
    setAuth({ isAuthenticated: false, role: null, student: null, lecturer: null });
  };

  return (
    <AuthContext.Provider value={{ ...auth, loginStudent, loginLecturer, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
