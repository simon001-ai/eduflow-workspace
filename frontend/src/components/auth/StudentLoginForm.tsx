import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/AuthContext";
import { studentLoginSchema, StudentLoginData } from "@/utils/validators";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LogIn } from "lucide-react";

export const StudentLoginForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const { loginStudent } = useAuth();
  const [error, setError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<StudentLoginData>({
    resolver: zodResolver(studentLoginSchema),
  });

  const onSubmit = async (data: StudentLoginData) => {
    setError("");
    const success = await loginStudent(data.admissionNumber, data.password);
    if (success) {
      onSuccess();
    } else {
      setError("Invalid admission number or password");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="admissionNumber">Admission Number</Label>
        <Input id="admissionNumber" placeholder="e.g. SCT221-0001/2022" {...register("admissionNumber")} />
        {errors.admissionNumber && <p className="text-xs text-destructive">{errors.admissionNumber.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" placeholder="Enter your password" {...register("password")} />
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>
      {error && <p className="text-sm text-destructive text-center">{error}</p>}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        <LogIn className="mr-2 h-4 w-4" /> Sign In
      </Button>
    </form>
  );
};
