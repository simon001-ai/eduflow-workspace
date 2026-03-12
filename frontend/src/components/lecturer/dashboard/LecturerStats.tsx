import React from "react";
import { useAuth } from "@/context/AuthContext";
// Removed mockData imports. Will fetch stats from backend.
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, FileText, Upload, BookOpen } from "lucide-react";

export const LecturerStats = () => {
  const { lecturer } = useAuth();
  if (!lecturer) return null;

  const [stats, setStats] = React.useState([
    { icon: FileText, label: "New Submissions", value: 0, color: "text-warning" },
    { icon: Users, label: "Total Students", value: 0, color: "text-primary" },
    { icon: Upload, label: "Resources Uploaded", value: 0, color: "text-accent" },
    { icon: BookOpen, label: "Units Teaching", value: 0, color: "text-info" },
  ]);

  React.useEffect(() => {
    if (!lecturer) return;
    const token = localStorage.getItem("token");
    fetch("http://localhost:3000/api/lecturers/dashboard", {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    })
      .then(res => res.json())
      .then(result => {
        console.log("[LecturerStats] Dashboard response:", result);
        // Backend returns top-level fields
        if (typeof result.newSubmissionsCount === "number") {
          setStats([
            { icon: FileText, label: "New Submissions", value: result.newSubmissionsCount, color: "text-warning" },
            { icon: Users, label: "Total Students", value: result.totalStudentsCount || 0, color: "text-primary" },
            { icon: Upload, label: "Resources Uploaded", value: result.resourceCount || 0, color: "text-accent" },
            { icon: BookOpen, label: "Units Teaching", value: result.unitsTeachingCount || 0, color: "text-info" },
          ]);
        }
      })
      .catch(err => console.error("[LecturerStats] Error fetching dashboard:", err));
  }, [lecturer]);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map(({ icon: Icon, label, value, color }) => (
        <Card key={label}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className={`h-11 w-11 rounded-lg bg-muted flex items-center justify-center`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
