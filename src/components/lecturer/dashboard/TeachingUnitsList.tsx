import { useAuth } from "@/context/AuthContext";
import { mockUnits } from "@/data/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const TeachingUnitsList = () => {
  const { lecturer } = useAuth();
  const navigate = useNavigate();
  if (!lecturer) return null;

  const units = mockUnits.filter((u) => lecturer.teachingUnits.includes(u.id));

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-primary" /> My Teaching Units
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {units.map((unit) => (
          <Card key={unit.id} className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group"
            onClick={() => navigate(`/lecturer/resources/${unit.id}`)}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <Badge variant="secondary" className="text-xs font-mono">{unit.code}</Badge>
                <p className="font-medium text-sm">{unit.name}</p>
                <p className="text-xs text-muted-foreground">{unit.semester}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
