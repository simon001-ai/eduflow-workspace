import { useAuth } from "@/context/AuthContext";
import { mockUnits, mockSubmissions, mockNotes, mockStudents } from "@/data/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, FileText, Upload, BookOpen } from "lucide-react";

export const LecturerStats = () => {
  const { lecturer } = useAuth();
  if (!lecturer) return null;

  const teachingUnits = mockUnits.filter((u) => lecturer.teachingUnits.includes(u.id));
  const totalStudents = new Set(
    mockStudents.filter((s) => s.registeredUnits.some((uid) => lecturer.teachingUnits.includes(uid))).map((s) => s.id)
  ).size;
  const newSubmissions = mockSubmissions.filter(
    (s) => lecturer.teachingUnits.includes(s.unitId) && s.status === "submitted"
  ).length;
  const totalResources = mockNotes.filter((n) => lecturer.teachingUnits.includes(n.unitId)).length;

  const stats = [
    { icon: FileText, label: "New Submissions", value: newSubmissions, color: "text-warning" },
    { icon: Users, label: "Total Students", value: totalStudents, color: "text-primary" },
    { icon: Upload, label: "Resources Uploaded", value: totalResources, color: "text-accent" },
    { icon: BookOpen, label: "Units Teaching", value: teachingUnits.length, color: "text-info" },
  ];

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
