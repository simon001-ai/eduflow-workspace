import { useAuth } from "@/context/AuthContext";
import { getNotificationsForStudent } from "@/data/mockData";
import { NotificationBell } from "@/components/common/NotificationBell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const StudentDashboardHeader = () => {
  const { student } = useAuth();
  if (!student) return null;
  const notifications = getNotificationsForStudent(student.id);
  const initials = student.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2);

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, <span className="text-primary">{student.fullName.split(" ")[0]}</span> 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Here's what's happening in your courses today.</p>
      </div>
      <div className="flex items-center gap-3">
        <NotificationBell notifications={notifications} />
        <Avatar className="h-9 w-9 border-2 border-primary/20">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">{initials}</AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
};
