import React from "react";
import { useParams, useNavigate } from "react-router-dom";
// Removed mockData imports. Will fetch from backend.
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, BookOpen, Library, Download, ExternalLink, Calendar, Video, Link2, ClipboardCheck } from "lucide-react";

const typeIcons = { pdf: FileText, video: Video, link: Link2, article: BookOpen };

export const UnitDetails = () => {
  const { unitId } = useParams<{ unitId: string }>();
  const navigate = useNavigate();
  if (!unitId) return null;

  const [unit, setUnit] = React.useState<any>(null);
  const [notes, setNotes] = React.useState<any[]>([]);
  const [assignments, setAssignments] = React.useState<any[]>([]);
  const [materials, setMaterials] = React.useState<any[]>([]);
  const [cats, setCats] = React.useState<any[]>([]);
  const [lecturer, setLecturer] = React.useState<any>(null);

  React.useEffect(() => {
    if (!unitId) return;
    const token = localStorage.getItem("token");
    
    // Fetch unit details
    fetch(`http://localhost:3000/api/units/${unitId}`)
      .then(res => res.json())
      .then(result => {
        if (result.success && result.data) {
          setUnit(result.data);
          // Fetch lecturer info only if lecturerId exists
          if (result.data.lecturerId) {
            fetch(`http://localhost:3000/api/users/${result.data.lecturerId}`)
              .then(res => res.json())
              .then(lecResult => {
                if (lecResult.success && lecResult.data) setLecturer(lecResult.data);
              })
              .catch(err => console.error("Error fetching lecturer:", err));
          }
        }
      })
      .catch(err => console.error("Error fetching unit:", err));
    
    // Fetch ALL resources for this unit (no type filter)
    console.log("[UnitDetails] Fetching resources for unitId:", unitId);
    fetch(`http://localhost:3000/api/resources/units/${unitId}/resources`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(result => {
        console.log("[UnitDetails] API Response:", result);
        if (result.success && result.data) {
          console.log("[UnitDetails] Resources object:", result.data);
          // Backend organized resources by type
          const notesData = result.data.notes || [];
          const assignmentsData = result.data.assignments || [];
          const materialsData = result.data.materials || [];
          const catsData = result.data.cats || [];
          
          console.log("[UnitDetails] Notes:", notesData.length);
          console.log("[UnitDetails] Assignments:", assignmentsData.length);
          console.log("[UnitDetails] Materials:", materialsData.length);
          console.log("[UnitDetails] CATs:", catsData.length);
          
          setNotes(notesData);
          setAssignments(assignmentsData);
          setMaterials(materialsData);
          setCats(catsData);
        } else {
          console.warn("[UnitDetails] Unexpected response format:", result);
        }
      })
      .catch(err => {
        console.error("[UnitDetails] Error fetching resources:", err);
        setNotes([]);
        setAssignments([]);
        setMaterials([]);
        setCats([]);
      });
  }, [unitId]);

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
          <TabsTrigger value="cats" className="gap-1"><ClipboardCheck className="h-3.5 w-3.5" /> CATs</TabsTrigger>
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (note.file_path) {
                      // Remove leading slashes from file_path to avoid double slashes
                      let cleanPath = note.file_path;
                      if (cleanPath.startsWith('/')) cleanPath = cleanPath.slice(1);
                      // If file_path already contains 'uploads/', avoid duplicating
                      if (cleanPath.startsWith('uploads/')) {
                        cleanPath = cleanPath.replace(/^uploads\//, '');
                      }
                      const url = `http://localhost:3000/uploads/${cleanPath}`;
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = note.title || 'note';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }
                  }}
                >
                  <Download className="h-3.5 w-3.5 mr-1" /> Download
                </Button>
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
        <TabsContent value="cats" className="space-y-3 mt-4">
          {cats.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No CATs uploaded yet.</p>
          ) : cats.map((cat) => {
            const catMetadata = cat.metadata || {};
            const duration = catMetadata.cat_duration_minutes || 'Not specified';
            const isTimed = catMetadata.is_timed || false;
            return (
              <Card key={cat.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{cat.title}</p>
                      <div className="flex gap-2 mt-2">
                        {isTimed && <Badge variant="secondary" className="text-xs">Timed: {duration} min</Badge>}
                        <Badge variant="outline" className="text-xs">{new Date(cat.created_at).toLocaleDateString()}</Badge>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => navigate(`/student/workspace?catId=${cat.id}`)}>  
                      Take Assessment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>      </Tabs>
    </div>
  );
};
