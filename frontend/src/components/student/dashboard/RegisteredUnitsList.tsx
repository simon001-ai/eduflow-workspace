import { useAuth } from "@/context/AuthContext";
import { mockUnits, getLecturerById } from "@/data/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, User, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const RegisteredUnitsList = () => {
  const { student } = useAuth();
  const navigate = useNavigate();
  if (!student) return null;

  const units = mockUnits.filter((u) => student.registeredUnits.includes(u.id));

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-primary" /> My Registered Units
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {units.map((unit) => {
          const lecturer = getLecturerById(unit.lecturerId);
          return (
            <Card
              key={unit.id}
              className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group"
              onClick={() => navigate(`/student/unit/${unit.id}`)}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs font-mono">{unit.code}</Badge>
                    <span className="text-xs text-muted-foreground">{unit.semester}</span>
                  </div>
                  <p className="font-medium text-sm">{unit.name}</p>
                  {lecturer && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" /> {lecturer.fullName}
                    </p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
