import React from "react";
import { useAuth } from "@/context/AuthContext";
// Removed mockData imports. Will fetch units from backend.
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, User, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const RegisteredUnitsList = () => {
  const { student } = useAuth();
  const navigate = useNavigate();
  if (!student) return null;

  // Fetch units from backend API
  const [units, setUnits] = React.useState([]);
  React.useEffect(() => {
    if (!student) return;
    const token = localStorage.getItem("token");
    console.log("Token being sent (units):", token); // DEBUG
    fetch(`http://localhost:3000/api/units/students/${student.id}/units`, {
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
          setUnits(result.data);
        }
      })
      .catch(err => {
        setUnits([]);
        console.error("Units fetch error:", err); // DEBUG
      });
  }, [student]);

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-primary" /> My Registered Units
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {units.length === 0 ? (
          <div className="text-muted-foreground text-sm">No registered units found.</div>
        ) : units.map((unit: any) => (
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
                {unit.lecturer && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" /> {unit.lecturer.fullName}
                  </p>
                )}
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
