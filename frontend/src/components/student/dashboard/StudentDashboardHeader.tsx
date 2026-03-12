import React from "react";
import { useAuth } from "@/context/AuthContext";
// Removed mockData import. Will fetch notifications from backend.
import { NotificationBell } from "@/components/common/NotificationBell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const StudentDashboardHeader = () => {
  const { student } = useAuth();
  if (!student) return null;
  // Fetch notifications from backend API
  const [notifications, setNotifications] = React.useState([]);
  React.useEffect(() => {
    if (!student) return;
    const token = localStorage.getItem("token");
    fetch(`http://localhost:3000/api/notifications/students/${student.id}/notifications`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    })
      .then(async res => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Error ${res.status}: ${text}`);
        }
        return res.json();
      })
      .then(result => {
        if (result.success && Array.isArray(result.data)) {
          // Map backend notification fields to frontend Notification type
          const mapped = result.data.map((n: any) => ({
            id: n.id,
            // Map backend type to frontend type
            type: n.type === "note_uploaded" ? "note" : (n.type || "note"),
            title: n.title || "Notification",
            message: n.title || "New notification", // fallback to title if no message
            createdAt: n.created_at || n.createdAt,
            read: !!n.read_at,
            unitId: n.resource_id || n.unitId,
          }));
          setNotifications(mapped);
        }
      })
      .catch(err => {
        setNotifications([]);
        console.error("Notification fetch error:", err); // DEBUG
      });
  }, [student]);
  const initials = student.fullname.split(" ").map((n) => n[0]).join("").slice(0, 2);

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, <span className="text-primary">{student.fullname.split(" ")[0]}</span> 👋
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
