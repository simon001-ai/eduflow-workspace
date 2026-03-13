import { useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, AlertTriangle, CheckCircle, RefreshCw, BookOpen, ExternalLink, Send, RotateCcw, Loader } from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

interface AnalysisResult {
  plagiarism_percentage: number;
  ai_score: number | null;
  ai_probability: number | null;
  human_probability: number | null;
  matches: any[];
  recommendations: string[];
  submission_id: string;
  submitted_at?: string;
  status?: 'analyzed' | 'submitted';
}

interface UploadState {
  idle: 'idle' | 'uploading' | 'analyzing' | 'analyzed' | 'submitting' | 'submitted';
}

export const UploadDocument = () => {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorSuggestion, setErrorSuggestion] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  
  // Assignment selection state
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<string>("");
  const [assignmentDetails, setAssignmentDetails] = useState<any>(null);
  
  // Recent submissions state
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  const { student } = useAuth();
  const [units, setUnits] = useState<any[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string>("");

  // Fetch units for student
  useEffect(() => {
    if (!student) return;
    const token = localStorage.getItem("token");
    fetch(`http://localhost:3000/api/units/students/${student.id}/units`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    })
      .then(res => res.json())
      .then(result => {
        if (result.success && Array.isArray(result.data)) {
          setUnits(result.data);
        }
      })
      .catch(err => console.error('Error fetching units:', err));
  }, [student]);

  // Fetch recent submissions for student
  useEffect(() => {
    if (!student) return;
    setLoadingSubmissions(true);
    const token = localStorage.getItem("token");
    fetch(`http://localhost:3000/api/submissions?limit=5&offset=0`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    })
      .then(res => res.json())
      .then(result => {
        if (result.success && Array.isArray(result.data)) {
          setRecentSubmissions(result.data);
        }
      })
      .catch(err => console.error('Error fetching submissions:', err))
      .finally(() => setLoadingSubmissions(false));
  }, [student]);

  // Fetch assignments for selected unit
  useEffect(() => {
    if (!selectedUnit) {
      setAssignments([]);
      setSelectedAssignment("");
      setAssignmentDetails(null);
      return;
    }
    const token = localStorage.getItem("token");
    fetch(`http://localhost:3000/api/resources/units/${selectedUnit}/resources?type=assignment`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    })
      .then(res => res.json())
      .then(result => {
        const arr = Array.isArray(result.data) ? result.data : result.resources;
        if (Array.isArray(arr)) {
          setAssignments(arr);
        } else {
          setAssignments([]);
        }
      })
      .catch(err => console.error('Error fetching assignments:', err));
  }, [selectedUnit]);

  // Update assignment details when selection changes
  useEffect(() => {
    const selected = assignments.find(a => a.id === selectedAssignment);
    setAssignmentDetails(selected || null);
  }, [selectedAssignment, assignments]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setError(null);
    }
  };

  const pollForResult = (submissionId: string, attempt = 0) => {
    if (attempt > 300) { // 300 x 2s = 600s = 10 minutes
      setAnalyzing(false);
      setError("Analysis timed out. Please try again later.");
      return;
    }
    const token = localStorage.getItem("token");
    fetch(`http://localhost:3000/api/plagiarism/analyze/result/${submissionId}`, {
      credentials: "include",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    })
      .then(res => res.json())
      .then(result => {
        if (result.success && result.submission_id) {
          setResult({
            plagiarism_percentage: result.plagiarism_percentage || 0,
            ai_score: result.ai_score || null,
            ai_probability: result.ai_probability || null,
            human_probability: result.human_probability || null,
            matches: result.plagiarism_reports || [],
            recommendations: result.recommendations || [],
            submission_id: result.submission_id
          });
          setAnalyzing(false);
          setError(null);
        } else if (result.success === false && result.message) {
          setError(result.message);
          setAnalyzing(false);
        } else {
          pollingRef.current = setTimeout(() => pollForResult(submissionId, attempt + 1), 2000);
        }
      })
      .catch(() => {
        setError("Failed to fetch analysis result.");
        setAnalyzing(false);
      });
  };

  const analyzeDocument = useCallback(() => {
    if (!file || !selectedAssignment) {
      setError("Please select an assignment and upload a file.");
      return;
    }
    setAnalyzing(true);
    setError(null);
    setResult(null);
    setSuccessMessage(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("resource_id", selectedAssignment);
    if (student && student.id) {
      formData.append("student_id", student.id);
    }

    const token = localStorage.getItem("token");
    fetch("http://localhost:3000/api/plagiarism/analyze", {
      method: "POST",
      body: formData,
      credentials: "include",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    })
      .then(res => res.json())
      .then(result => {
        if (result.success && result.submission_id) {
          pollForResult(result.submission_id);
        } else if (result.success === false && result.message) {
          setError(result.message);
          setErrorSuggestion(result.suggestion || null);
          setAnalyzing(false);
        } else {
          setError("Unexpected response from server.");
          setErrorSuggestion(null);
          setAnalyzing(false);
        }
      })
      .catch(err => {
        console.error('Analysis error:', err);
        setError("Failed to start analysis. Please try again.");
        setErrorSuggestion(null);
        setAnalyzing(false);
      });
  }, [file, selectedAssignment, student]);

  const handleSubmitToLecturer = async () => {
    if (!result || !selectedAssignment || !student) {
      setError("Missing required information for submission.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3000/api/submissions/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          submission_id: result.submission_id,
          resource_id: selectedAssignment,
          student_id: student.id
        })
      });

      const data = await response.json();
      if (data.success && data.data) {
        // Update result with submission confirmation data (includes ai_score and probabilities)
        setResult({
          plagiarism_percentage: data.data.plagiarism_percentage || 0,
          ai_score: data.data.ai_score || null,
          ai_probability: data.data.ai_probability || null,
          human_probability: data.data.human_probability || null,
          matches: result.matches || [],
          recommendations: result.recommendations || [],
          submission_id: data.data.submission_id,
          submitted_at: data.data.submitted_at,
          status: 'submitted'
        });
        setSuccessMessage("Document submitted successfully to your lecturer!");
        setFile(null);
        setSelectedAssignment("");
        setSelectedUnit("");
        setTimeout(() => {
          setSuccessMessage(null);
          setResult(null);
        }, 6000);
      } else {
        setError(data.message || "Submission failed. Please try again.");
      }
    } catch (err) {
      console.error('Submission error:', err);
      setError("Failed to submit document. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRedo = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setErrorSuggestion(null);
    setSelectedAssignment("");
    setAssignmentDetails(null);
  };

  const handleRedoFull = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setErrorSuggestion(null);
    setSelectedUnit("");
    setSelectedAssignment("");
    setAssignmentDetails(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" /> Document Analysis & Submission
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Upload and analyze your document for plagiarism and AI content, then submit to your lecturer.</p>
      </div>

      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded text-green-700 text-sm flex items-center gap-2">
          <CheckCircle className="h-5 w-5 shrink-0" />
          {successMessage}
        </div>
      )}

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded text-destructive text-sm">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
          {errorSuggestion && (
            <div className="ml-7 text-xs text-muted-foreground bg-background/50 p-2 rounded border-l-2 border-destructive/30">
              💡 {errorSuggestion}
            </div>
          )}
        </div>
      )}

      {/* Recent Submissions from Turn In */}
      {!result && !loadingSubmissions && recentSubmissions.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-5 w-5" /> Recently Turned In
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentSubmissions.map((submission) => (
                <div key={submission.id} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{submission.resource?.title || "Assignment"}</p>
                    <p className="text-xs text-muted-foreground">
                      Status: <Badge variant={submission.status === 'submitted' ? 'default' : 'secondary'} className="ml-1">
                        {submission.status === 'analyzing' ? 'Analyzing' : submission.status === 'submitted' ? 'Analyzed' : submission.status}
                      </Badge>
                    </p>
                  </div>
                  {submission.plagiarism_percentage !== null && (
                    <div className="flex items-center gap-2 ml-4">
                      <div className="text-right">
                        <p className="text-sm font-semibold">{submission.plagiarism_percentage}%</p>
                        <p className="text-xs text-muted-foreground">Plagiarism</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!result ? (
        // Upload and Analysis Phase
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Select Unit & Assignment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Unit</label>
              <select
                className="w-full border rounded p-2.5 bg-white"
                value={selectedUnit}
                onChange={e => {
                  setSelectedUnit(e.target.value);
                  setError(null);
                  setErrorSuggestion(null);
                  handleRedo();
                }}
                disabled={units.length === 0}
              >
                <option value="">-- Choose a unit --</option>
                {units.map(u => (
                  <option key={u.id} value={u.id}>{u.code} — {u.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Select Assignment</label>
              <select
                className="w-full border rounded p-2.5 bg-white"
                value={selectedAssignment}
                onChange={e => setSelectedAssignment(e.target.value)}
                disabled={assignments.length === 0 || !selectedUnit}
              >
                <option value="">-- Choose an assignment --</option>
                {assignments.map(a => (
                  <option key={a.id} value={a.id}>{a.title}</option>
                ))}
              </select>
              {assignmentDetails && (
                <p className="text-xs text-muted-foreground mt-2">
                  Deadline: {new Date(assignmentDetails.deadline).toLocaleDateString()}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {!result ? (
        // Document Upload Phase
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Upload Document</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/40 transition-colors cursor-pointer">
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium mb-1">Drop your document here or click to browse</p>
              <p className="text-xs text-muted-foreground mb-4">Supports PDF, DOCX, TXT (max 10MB)</p>
              <input type="file" accept=".pdf,.docx,.txt,.doc" onChange={handleFileChange} className="hidden" id="doc-upload" />
              <Button variant="outline" asChild disabled={!selectedAssignment}>
                <label htmlFor="doc-upload" className="cursor-pointer">Choose File</label>
              </Button>
            </div>

            {file && (
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border">
                <div className="flex items-center gap-2 flex-1">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <Button
                  onClick={analyzeDocument}
                  disabled={analyzing || !selectedAssignment}
                  size="sm"
                  className="ml-2"
                >
                  {analyzing ? (
                    <><Loader className="h-3.5 w-3.5 mr-1 animate-spin" /> Analyzing...</>
                  ) : (
                    <>Analyze</>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {/* Analysis Results Phase */}
      {result && !error && (
        <div className="space-y-4 animate-fade-in">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Analysis Complete ✓</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Your document has been analyzed. Review the results below before submitting to your lecturer.
            </CardContent>
          </Card>

          {/* Plagiarism Score */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Plagiarism Detection</span>
                {result.plagiarism_percentage > 15 ? (
                  <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> High Risk</Badge>
                ) : (
                  <Badge className="gap-1 bg-green-600 text-white"><CheckCircle className="h-3 w-3" /> Low Risk</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Similarity Score</span>
                <span className={`text-lg font-bold ${result.plagiarism_percentage > 15 ? "text-destructive" : "text-green-600"}`}>
                  {result.plagiarism_percentage}%
                </span>
              </div>
              <Progress value={result.plagiarism_percentage} className="h-3" />
              <p className="text-xs text-muted-foreground">
                ⚠️ Threshold: 15% — Content above this level may require revision. {result.plagiarism_percentage > 15 && "Your document exceeds this threshold."}
              </p>
            </CardContent>
          </Card>

          {/* AI Detection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>AI Content Detection</span>
                <Badge className="gap-1 bg-blue-600 text-white">{result.ai_probability !== null ? Math.round(result.ai_probability) : 'N/A'}%</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {/* AI Probability */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">AI Generated</span>
                    <span className="text-lg font-bold text-blue-600">{result.ai_probability !== null ? Math.round(result.ai_probability) : 'N/A'}%</span>
                  </div>
                  {result.ai_probability !== null && <Progress value={result.ai_probability} className="h-3 [&>div]:bg-blue-600" />}
                </div>
                
                {/* Human Probability */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">Human Written</span>
                    <span className="text-lg font-bold text-green-600">{result.human_probability !== null ? Math.round(result.human_probability) : 'N/A'}%</span>
                  </div>
                  {result.human_probability !== null && <Progress value={result.human_probability} className="h-3 [&>div]:bg-green-600" />}
                </div>
              </div>
              <p className="text-xs text-muted-foreground pt-2 border-t">
                {result.ai_probability !== null ? 'This analysis shows the likelihood of content being AI-generated vs human-written. Your institution may have policies regarding AI usage.' : 'AI detection score not available for this submission.'}
              </p>
            </CardContent>
          </Card>

          {/* Submission Confirmation */}
          {result.status === 'submitted' && (
            <Card className="border-green-600/20 bg-green-50 dark:bg-green-950/20 animate-fade-in">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle className="h-5 w-5" /> Submission Confirmed
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Plagiarism</p>
                    <p className="text-lg font-semibold">{result.plagiarism_percentage}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">AI Generated</p>
                    <p className="text-lg font-semibold text-blue-600">{result.ai_probability !== null ? Math.round(result.ai_probability) : 'N/A'}%</p>
                  </div>
                  {result.human_probability !== null && (
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Human Written</p>
                      <p className="text-lg font-semibold text-green-600">{Math.round(result.human_probability)}%</p>
                    </div>
                  )}
                </div>
                <div className="pt-2 border-t border-green-200 dark:border-green-800">
                  <p className="text-green-700 dark:text-green-400">✓ Your document has been submitted to your lecturer. They will review your submission and provide feedback.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Flagged Sections */}
          {result.matches && result.matches.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" /> Flagged Sections
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.matches.slice(0, 5).map((match, i) => (
                  <div key={i} className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm italic text-foreground flex-1">"{match.text || 'Section'}"</p>
                      <Badge variant="outline" className="text-xs ml-2 shrink-0">
                        {match.type === 'ai_detected' ? 'AI Detected' : 'Plagiarism'}
                      </Badge>
                    </div>
                    {match.type === 'ai_detected' ? (
                      <p className="text-xs text-muted-foreground">
                        AI Probability: <span className="font-medium">{match.ai_probability}%</span>
                      </p>
                    ) : (
                      <>
                        {match.source && (
                          <p className="text-xs text-muted-foreground">
                            Source: <span className="font-medium">{match.source}</span>
                          </p>
                        )}
                        {match.similarity && (
                          <p className="text-xs text-muted-foreground">
                            Similarity: <span className="font-medium">{match.similarity}%</span>
                          </p>
                        )}
                      </>
                    )}
                  </div>
                ))}
                {result.matches.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center">
                    ... and {result.matches.length - 5} more flagged sections
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {result.recommendations && result.recommendations.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" /> Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <Card className="bg-muted/30">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Button
                  onClick={handleSubmitToLecturer}
                  disabled={submitting}
                  className="flex-1 gap-2"
                  size="lg"
                >
                  {submitting ? (
                    <><Loader className="h-4 w-4 animate-spin" /> Submitting...</>
                  ) : (
                    <><Send className="h-4 w-4" /> Submit to Lecturer</>
                  )}
                </Button>
                <Button
                  onClick={handleRedoFull}
                  variant="outline"
                  disabled={submitting}
                  className="gap-2"
                  size="lg"
                >
                  <RotateCcw className="h-4 w-4" /> Redo
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                📤 Submit: Send your document and analysis to your lecturer for grading.
                <br />
                🔄 Redo: Start over with a different document.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
