import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchSubmissions, gradeSubmission, getSubmissionDetails } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Loader } from "@/components/common/Loader";
import { toast } from "@/hooks/use-toast";
import { FileText, Eye, AlertTriangle, CheckCircle, User, Calendar, Download, BookOpen, Loader2 } from "lucide-react";

interface Submission {
  id: string;
  student_id: string;
  student_name: string;
  student_admission_number: string;
  resource_id: string;
  resource_title: string;
  resource_type: string;
  file_path: string;
  plagiarism_percentage: number;
  ai_score: number;
  ai_probability?: number | null;
  human_probability?: number | null;
  extracted_text: string;
  grade?: number;
  feedback?: string;
  created_at: string;
}

interface Unit {
  unit_id: string;
  code: string;
  name: string;
  submissions: Submission[];
}

export const SubmissionsByUnit = () => {
  const { lecturer } = useAuth();
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [viewingSubmission, setViewingSubmission] = useState<Submission | null>(null);
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
  const [gradeInput, setGradeInput] = useState("");
  const [feedbackInput, setFeedbackInput] = useState("");
  const [submittingGrade, setSubmittingGrade] = useState(false);

  // Load submissions on mount
  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const data = await fetchSubmissions();
      setUnits(data);
      // Select first unit by default
      if (data.length > 0) {
        setSelectedUnitId(data[0].unit_id);
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
      toast({ 
        title: "Error", 
        description: "Failed to load submissions", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const getCurrentUnitSubmissions = () => {
    if (!selectedUnitId) return [];
    const unit = units.find(u => u.unit_id === selectedUnitId);
    return unit?.submissions || [];
  };

  const handleGradeClick = (submission: Submission) => {
    setGradingSubmission(submission);
    setGradeInput(submission.grade !== undefined && submission.grade !== null ? String(submission.grade) : "");
    setFeedbackInput(submission.feedback || "");
  };

  const handleSaveGrade = async () => {
    if (!gradingSubmission || !gradeInput) {
      toast({ 
        title: "Error", 
        description: "Please enter a grade", 
        variant: "destructive" 
      });
      return;
    }

    setSubmittingGrade(true);
    try {
      await gradeSubmission(gradingSubmission.id, Number(gradeInput), feedbackInput);
      toast({ 
        title: "Success", 
        description: "Grade submitted successfully!" 
      });
      // Refresh submissions
      await loadSubmissions();
      setGradingSubmission(null);
      setGradeInput("");
      setFeedbackInput("");
    } catch (error) {
      console.error("Error saving grade:", error);
      toast({ 
        title: "Error", 
        description: "Failed to save grade", 
        variant: "destructive" 
      });
    } finally {
      setSubmittingGrade(false);
    }
  };

  if (!lecturer) return null;

  const currentSubmissions = getCurrentUnitSubmissions();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" /> Student Submissions
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Review and grade student submissions for your units.</p>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <>
          {/* Units Tabs */}
          <Tabs value={selectedUnitId || ""} onValueChange={setSelectedUnitId} className="w-full">
            <TabsList className="flex-wrap h-auto gap-1 bg-transparent p-0 mb-4">
              {units.length === 0 ? (
                <p className="text-sm text-muted-foreground">No units available</p>
              ) : (
                units.map((unit) => (
                  <TabsTrigger 
                    key={unit.unit_id} 
                    value={unit.unit_id}
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <BookOpen className="h-4 w-4 mr-1" />
                    {unit.code}
                  </TabsTrigger>
                ))
              )}
            </TabsList>

            {/* Submissions List */}
            <div className="space-y-4">
              {currentSubmissions.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground py-12">No submissions for this unit yet.</p>
                  </CardContent>
                </Card>
              ) : (
                currentSubmissions.map((submission) => (
                  <Card key={submission.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* Header Row */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <Badge variant="secondary">{submission.resource_type}</Badge>
                              <span className="font-medium text-sm">{submission.resource_title}</span>
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <User className="h-3 w-3" /> {submission.student_admission_number} • {submission.student_name}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" /> {new Date(submission.created_at).toLocaleString()}
                            </p>
                          </div>

                          {/* Grading Badge */}
                          {submission.grade !== undefined && submission.grade !== null ? (
                            <div className="text-right">
                              <div className="text-2xl font-bold text-primary">{submission.grade}</div>
                              <p className="text-xs text-muted-foreground">Mark</p>
                            </div>
                          ) : (
                            <div className="text-right">
                              <div className="text-sm text-muted-foreground">Not graded</div>
                            </div>
                          )}
                        </div>

                        {/* Analysis Scores */}
                        <div className="grid grid-cols-2 gap-4">
                          {/* Plagiarism Score */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">Plagiarism</span>
                              <span className={submission.plagiarism_percentage > 15 ? "text-destructive font-bold" : "text-success"}>
                                {submission.plagiarism_percentage?.toFixed(1) || 0}%
                              </span>
                            </div>
                            <Progress 
                              value={submission.plagiarism_percentage || 0} 
                              className="h-2"
                            />
                          </div>

                          {/* AI Score */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">AI Detection</span>
                              <span className={submission.ai_probability && submission.ai_probability > 30 ? "text-destructive font-bold" : "text-success"}>
                                {submission.ai_probability !== undefined && submission.ai_probability !== null ? submission.ai_probability.toFixed(1) : 'N/A'}%
                              </span>
                            </div>
                            {submission.ai_probability !== undefined && submission.ai_probability !== null && (
                              <Progress 
                                value={submission.ai_probability} 
                                className="h-2"
                              />
                            )}
                            {submission.human_probability !== undefined && submission.human_probability !== null && (
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Human: {submission.human_probability.toFixed(1)}%</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Risk Badges */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {submission.plagiarism_percentage > 15 && (
                            <Badge variant="destructive" className="text-xs gap-1">
                              <AlertTriangle className="h-3 w-3" /> High Plagiarism
                            </Badge>
                          )}
                          {submission.ai_probability && submission.ai_probability > 30 && (
                            <Badge variant="destructive" className="text-xs gap-1">
                              <AlertTriangle className="h-3 w-3" /> High AI Content
                            </Badge>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setViewingSubmission(submission)}
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" /> View Submission
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handleGradeClick(submission)}
                          >
                            Grade
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </Tabs>

          {/* View Submission Details Modal */}
          <Dialog open={!!viewingSubmission} onOpenChange={(open) => !open && setViewingSubmission(null)}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Submission Details</DialogTitle>
              </DialogHeader>
              {viewingSubmission && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground font-medium">Student Admission</p>
                      <p>{viewingSubmission.student_admission_number}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-medium">Student Name</p>
                      <p>{viewingSubmission.student_name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-medium">Resource</p>
                      <p>{viewingSubmission.resource_title}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-medium">Plagiarism Score</p>
                      <p className={viewingSubmission.plagiarism_percentage > 15 ? "text-destructive font-bold" : "text-success font-bold"}>
                        {viewingSubmission.plagiarism_percentage?.toFixed(1) || 0}%
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-medium">AI Generated</p>
                      <p className={viewingSubmission.ai_probability && viewingSubmission.ai_probability > 30 ? "text-destructive font-bold" : "text-success font-bold"}>
                        {viewingSubmission.ai_probability !== undefined && viewingSubmission.ai_probability !== null ? viewingSubmission.ai_probability.toFixed(1) : 'N/A'}%
                      </p>
                    </div>
                    {viewingSubmission.human_probability !== undefined && viewingSubmission.human_probability !== null && (
                      <div>
                        <p className="text-muted-foreground font-medium">Human Written</p>
                        <p className="text-success font-bold">
                          {viewingSubmission.human_probability.toFixed(1)}%
                        </p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Extracted Text */}
                  <div className="space-y-2">
                    <p className="font-medium">Extracted Text</p>
                    <div className="bg-muted p-4 rounded-md max-h-96 overflow-y-auto text-sm whitespace-pre-wrap">
                      {viewingSubmission.extracted_text || "No text extracted from submission."}
                    </div>
                  </div>

                  {/* Current Feedback */}
                  {viewingSubmission.feedback && (
                    <div className="space-y-2">
                      <p className="font-medium">Feedback</p>
                      <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-md text-sm">
                        {viewingSubmission.feedback}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Grade Submission Modal */}
          <Dialog open={!!gradingSubmission} onOpenChange={(open) => !open && setGradingSubmission(null)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Grade Submission</DialogTitle>
                <DialogDescription>
                  Enter grade and feedback for {gradingSubmission?.student_admission_number} • {gradingSubmission?.student_name}
                </DialogDescription>
              </DialogHeader>
              {gradingSubmission && (
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="grade-input">Grade (0-100)</Label>
                    <Input
                      id="grade-input"
                      type="number"
                      min="0"
                      max="100"
                      placeholder="Enter grade"
                      value={gradeInput}
                      onChange={(e) => setGradeInput(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="feedback-input">Feedback (optional)</Label>
                    <Textarea
                      id="feedback-input"
                      placeholder="Enter feedback for the student"
                      value={feedbackInput}
                      onChange={(e) => setFeedbackInput(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setGradingSubmission(null);
                        setGradeInput("");
                        setFeedbackInput("");
                      }}
                      disabled={submittingGrade}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveGrade}
                      disabled={submittingGrade || !gradeInput}
                    >
                      {submittingGrade ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Grade"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};
