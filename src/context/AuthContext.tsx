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
  loginStudent: (admissionNumber: string, password: string) => boolean;
  loginLecturer: (staffNumber: string, password: string) => boolean;
  signupStudent: (data: { fullName: string; admissionNumber: string; email: string; password: string }) => boolean;
  signupLecturer: (data: { fullName: string; email: string; staffNumber: string; password: string }) => boolean;
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

  const loginStudent = (admissionNumber: string, password: string): boolean => {
    const student = mockStudents.find(
      (s) => s.admissionNumber === admissionNumber && s.password === password
    );
    if (student) {
      setAuth({ isAuthenticated: true, role: "student", student, lecturer: null });
      return true;
    }
    return false;
  };

  const loginLecturer = (staffNumber: string, password: string): boolean => {
    const lecturer = mockLecturers.find(
      (l) => l.staffNumber === staffNumber && l.password === password
    );
    if (lecturer) {
      setAuth({ isAuthenticated: true, role: "lecturer", student: null, lecturer });
      return true;
    }
    return false;
  };

  const signupStudent = (data: { fullName: string; admissionNumber: string; email: string; password: string }): boolean => {
    const newStudent: Student = {
      id: `s${mockStudents.length + 1}`,
      ...data,
      registeredUnits: ["u1", "u2"],
    };
    mockStudents.push(newStudent);
    setAuth({ isAuthenticated: true, role: "student", student: newStudent, lecturer: null });
    return true;
  };

  const signupLecturer = (data: { fullName: string; email: string; staffNumber: string; password: string }): boolean => {
    const newLecturer: Lecturer = {
      id: `l${mockLecturers.length + 1}`,
      ...data,
      teachingUnits: [],
    };
    mockLecturers.push(newLecturer);
    setAuth({ isAuthenticated: true, role: "lecturer", student: null, lecturer: newLecturer });
    return true;
  };

  const logout = () => {
    setAuth({ isAuthenticated: false, role: null, student: null, lecturer: null });
  };

  return (
    <AuthContext.Provider value={{ ...auth, loginStudent, loginLecturer, signupStudent, signupLecturer, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
