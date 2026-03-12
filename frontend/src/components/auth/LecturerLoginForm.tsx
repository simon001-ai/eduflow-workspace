import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/AuthContext";
import { lecturerLoginSchema, LecturerLoginData } from "@/utils/validators";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LogIn } from "lucide-react";

export const LecturerLoginForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const { loginLecturer } = useAuth();
  const [error, setError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LecturerLoginData>({
    resolver: zodResolver(lecturerLoginSchema),
  });

  const onSubmit = async (data: LecturerLoginData) => {
    setError("");
    const success = await loginLecturer(data.staffNumber, data.password);
    if (success) {
      onSuccess();
    } else {
      setError("Invalid staff number or password");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Staff Number</Label>
        <Input placeholder="e.g. STF-001" {...register("staffNumber")} />
        {errors.staffNumber && <p className="text-xs text-destructive">{errors.staffNumber.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>Password</Label>
        <Input type="password" placeholder="Enter your password" {...register("password")} />
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>
      {error && <p className="text-sm text-destructive text-center">{error}</p>}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        <LogIn className="mr-2 h-4 w-4" /> Sign In
      </Button>
    </form>
  );
};
