import { useParams, useNavigate } from "react-router-dom";
import { getUnitById, getNotesByUnit, getAssignmentsByUnit, getMaterialsByUnit, getLecturerById } from "@/data/mockData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, BookOpen, Library, Download, ExternalLink, Calendar, Video, Link2 } from "lucide-react";

const typeIcons = { pdf: FileText, video: Video, link: Link2, article: BookOpen };

export const UnitDetails = () => {
  const { unitId } = useParams<{ unitId: string }>();
  const navigate = useNavigate();
  if (!unitId) return null;

  const unit = getUnitById(unitId);
  const notes = getNotesByUnit(unitId);
  const assignments = getAssignmentsByUnit(unitId);
  const materials = getMaterialsByUnit(unitId);
  const lecturer = unit ? getLecturerById(unit.lecturerId) : null;

  if (!unit) return <p className="p-6 text-muted-foreground">Unit not found.</p>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">{unit.code} — {unit.name}</h1>
          {lecturer && <p className="text-sm text-muted-foreground">Lecturer: {lecturer.fullName}</p>}
        </div>
      </div>

      <Tabs defaultValue="notes" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="notes" className="gap-1"><FileText className="h-3.5 w-3.5" /> Notes</TabsTrigger>
          <TabsTrigger value="assignments" className="gap-1"><BookOpen className="h-3.5 w-3.5" /> Assignments</TabsTrigger>
          <TabsTrigger value="materials" className="gap-1"><Library className="h-3.5 w-3.5" /> Materials</TabsTrigger>
        </TabsList>

        <TabsContent value="notes" className="space-y-3 mt-4">
          {notes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No notes uploaded yet.</p>
          ) : notes.map((note) => (
            <Card key={note.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium text-sm">{note.title}</p>
                  <p className="text-xs text-muted-foreground">{note.description}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {new Date(note.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
                <Button variant="outline" size="sm"><Download className="h-3.5 w-3.5 mr-1" /> Download</Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="assignments" className="space-y-3 mt-4">
          {assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No assignments posted yet.</p>
          ) : assignments.map((a) => {
            const isPastDue = new Date(a.dueDate) < new Date();
            return (
              <Card key={a.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{a.description}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant={isPastDue ? "destructive" : "secondary"} className="text-xs">
                          Due: {new Date(a.dueDate).toLocaleDateString()}
                        </Badge>
                        <Badge variant="outline" className="text-xs">{a.totalMarks} marks</Badge>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => navigate(`/student/workspace?assignmentId=${a.id}`)}>
                      Work on it
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="materials" className="space-y-3 mt-4">
          {materials.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No additional materials yet.</p>
          ) : materials.map((m) => {
            const Icon = typeIcons[m.type] || FileText;
            return (
              <Card key={m.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{m.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">{m.type} • {new Date(m.uploadedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm"><ExternalLink className="h-3.5 w-3.5 mr-1" /> Open</Button>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
};
