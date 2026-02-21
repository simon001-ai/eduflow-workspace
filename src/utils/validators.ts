import { z } from "zod";

export const studentSignupSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters").max(100),
  admissionNumber: z.string().trim().min(3, "Enter a valid admission number"),
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const studentLoginSchema = z.object({
  admissionNumber: z.string().trim().min(1, "Admission number is required"),
  password: z.string().min(1, "Password is required"),
});

export const lecturerSignupSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters").max(100),
  email: z.string().trim().email("Enter a valid institutional email"),
  staffNumber: z.string().trim().min(1, "Staff number is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const lecturerLoginSchema = z.object({
  staffNumber: z.string().trim().min(1, "Staff number is required"),
  password: z.string().min(1, "Password is required"),
});

export const emailSchema = z.object({
  to: z.string().trim().min(1, "Recipient is required"),
  subject: z.string().trim().min(1, "Subject is required").max(200),
  body: z.string().trim().min(1, "Message body is required").max(5000),
});

export type StudentSignupData = z.infer<typeof studentSignupSchema>;
export type StudentLoginData = z.infer<typeof studentLoginSchema>;
export type LecturerSignupData = z.infer<typeof lecturerSignupSchema>;
export type LecturerLoginData = z.infer<typeof lecturerLoginSchema>;
