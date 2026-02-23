import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { mockUnits, mockSubmissions, mockAssignments, getStudentById } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Eye, Star, AlertTriangle, CheckCircle, User, Calendar } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export const SubmissionsByUnit = () => {
  const { lecturer } = useAuth();
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [grading, setGrading] = useState<{ subId: string; grade: string; feedback: string } | null>(null);

  if (!lecturer) return null;
  const units = mockUnits.filter((u) => lecturer.teachingUnits.includes(u.id));

  const submissions = selectedUnitId
    ? mockSubmissions.filter((s) => s.unitId === selectedUnitId)
    : mockSubmissions.filter((s) => lecturer.teachingUnits.includes(s.unitId));

  const handleGrade = () => {
    if (!grading) return;
    toast({ title: "Grade submitted!", description: "The student will be notified." });
    setGrading(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" /> Student Submissions
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Review and grade student submissions.</p>
      </div>

      <Tabs value={selectedUnitId || "all"} onValueChange={(v) => setSelectedUnitId(v === "all" ? "" : v)}>
        <TabsList className="flex-wrap h-auto gap-1 bg-transparent p-0">
          <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            All Units
          </TabsTrigger>
          {units.map((u) => (
            <TabsTrigger key={u.id} value={u.id} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              {u.code}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="space-y-3">
        {submissions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">No submissions yet.</p>
        ) : (
          submissions.map((sub) => {
            const student = getStudentById(sub.studentId);
            const assignment = mockAssignments.find((a) => a.id === sub.assignmentId);
            const unit = mockUnits.find((u) => u.id === sub.unitId);
            return (
              <Card key={sub.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs font-mono">{unit?.code}</Badge>
                        <span className="text-sm font-medium">{assignment?.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" /> {student?.fullName} ({student?.admissionNumber})
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Submitted: {new Date(sub.submittedAt).toLocaleString()}
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 max-w-[200px]">
                          <div className="flex justify-between text-xs mb-1">
                            <span>Plagiarism</span>
                            <span className={sub.plagiarismScore > 15 ? "text-destructive font-bold" : "text-success font-bold"}>
                              {sub.plagiarismScore}%
                            </span>
                          </div>
                          <Progress value={sub.plagiarismScore} className={`h-2 ${sub.plagiarismScore > 15 ? "[&>div]:bg-destructive" : "[&>div]:bg-success"}`} />
                        </div>
                        {sub.plagiarismScore > 15 ? (
                          <Badge variant="destructive" className="text-[10px] gap-1"><AlertTriangle className="h-3 w-3" /> High</Badge>
                        ) : (
                          <Badge className="text-[10px] gap-1 bg-success text-success-foreground"><CheckCircle className="h-3 w-3" /> OK</Badge>
                        )}
                      </div>
                      {sub.status === "graded" && (
                        <Badge variant="outline" className="text-xs">Grade: {sub.grade}/{assignment?.totalMarks}</Badge>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button variant="outline" size="sm"><Eye className="h-3.5 w-3.5 mr-1" /> Preview</Button>
                      {sub.status !== "graded" && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" onClick={() => setGrading({ subId: sub.id, grade: "", feedback: "" })}>
                              <Star className="h-3.5 w-3.5 mr-1" /> Grade
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>Grade Submission</DialogTitle></DialogHeader>
                            <div className="space-y-4 pt-2">
                              <p className="text-sm"><strong>{student?.fullName}</strong> — {assignment?.title}</p>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Grade (out of {assignment?.totalMarks})</label>
                                <Input type="number" min="0" max={assignment?.totalMarks} value={grading?.grade || ""} onChange={(e) => setGrading((g) => g ? { ...g, grade: e.target.value } : null)} />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Feedback</label>
                                <Textarea value={grading?.feedback || ""} onChange={(e) => setGrading((g) => g ? { ...g, feedback: e.target.value } : null)} placeholder="Provide feedback..." />
                              </div>
                              <Button className="w-full" onClick={handleGrade}>Submit Grade</Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
