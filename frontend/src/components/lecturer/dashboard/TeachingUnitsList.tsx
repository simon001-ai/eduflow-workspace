import React from "react";
import { useAuth } from "@/context/AuthContext";
// Removed mockData import. Will fetch units from backend.
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const TeachingUnitsList = () => {
  const { lecturer } = useAuth();
  const navigate = useNavigate();
  if (!lecturer) return null;

  // Fetch units from backend API
  const [units, setUnits] = React.useState([]);
  React.useEffect(() => {
    if (!lecturer) return;
    const token = localStorage.getItem("token");
    fetch("http://localhost:3000/api/lecturers/units", {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    })
      .then(res => res.json())
      .then(result => {
        // Backend returns { success, units }
        if (result.success && Array.isArray(result.units)) {
          setUnits(result.units);
        }
      });
  }, [lecturer]);

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-primary" /> My Teaching Units
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {units.length === 0 ? (
          <div className="text-muted-foreground text-sm">No teaching units found.</div>
        ) : (
          units.map((unit: any, idx: number) => (
            <Card key={unit.id || (unit.code + unit.name + idx)} className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group" onClick={() => navigate(`/lecturer/resources/${unit.id}`)}>
              <CardContent className="flex flex-col gap-2 p-4">
                <span className="text-xs font-mono text-muted-foreground">{unit.code}</span>
                <span className="font-medium text-sm">{unit.name}</span>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
