import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/AuthContext";
import { lecturerSignupSchema, LecturerSignupData } from "@/utils/validators";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";

export const LecturerSignupForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const { signupLecturer } = useAuth();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LecturerSignupData>({
    resolver: zodResolver(lecturerSignupSchema),
  });

  const onSubmit = (data: LecturerSignupData) => {
    signupLecturer(data as { fullName: string; email: string; staffNumber: string; password: string });
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Full Name</Label>
        <Input placeholder="Dr. Jane Smith" {...register("fullName")} />
        {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>Institutional Email</Label>
        <Input type="email" placeholder="you@university.ac.ke" {...register("email")} />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>Staff Number</Label>
        <Input placeholder="e.g. STF-003" {...register("staffNumber")} />
        {errors.staffNumber && <p className="text-xs text-destructive">{errors.staffNumber.message}</p>}
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
