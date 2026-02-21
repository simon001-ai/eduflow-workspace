import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/AuthContext";
import { studentSignupSchema, StudentSignupData } from "@/utils/validators";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";

export const StudentSignupForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const { signupStudent } = useAuth();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<StudentSignupData>({
    resolver: zodResolver(studentSignupSchema),
  });

  const onSubmit = (data: StudentSignupData) => {
    signupStudent(data as { fullName: string; admissionNumber: string; email: string; password: string });
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Full Name</Label>
        <Input placeholder="John Doe" {...register("fullName")} />
        {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>Admission Number</Label>
        <Input placeholder="e.g. SCT221-0003/2023" {...register("admissionNumber")} />
        {errors.admissionNumber && <p className="text-xs text-destructive">{errors.admissionNumber.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input type="email" placeholder="you@student.edu" {...register("email")} />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>Password</Label>
        <Input type="password" placeholder="At least 6 characters" {...register("password")} />
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        <UserPlus className="mr-2 h-4 w-4" /> Create Account
      </Button>
    </form>
  );
};
