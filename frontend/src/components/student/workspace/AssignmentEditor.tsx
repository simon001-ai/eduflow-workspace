import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
// Removed mockData imports. Will fetch from backend.
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Save, Send, Clock, FileText, Search, BookOpen, ExternalLink, Loader, AlertTriangle, CheckCircle, Bold, Italic, Underline, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Quote, Code, Link, Type, Download, FileDown } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export const AssignmentEditor = () => {
  const { student } = useAuth();
  const [searchParams] = useSearchParams();
  const preselectedId = searchParams.get("assignmentId");

  const [selectedAssignment, setSelectedAssignment] = useState(preselectedId || "");
  const [content, setContent] = useState("");
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [aiQuery, setAiQuery] = useState("");
  const [aiResults, setAiResults] = useState<{ title: string; authors: string; year: string; url: string }[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  // Plagiarism analysis state
  const [showPlagiarismDialog, setShowPlagiarismDialog] = useState(false);
  const [plagiarismResults, setPlagiarismResults] = useState<any>(null);
  const [analyzingSubmissionId, setAnalyzingSubmissionId] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  // Unit and assignment selection
  const [selectedUnit, setSelectedUnit] = useState("");
  const [studentAssignments, setStudentAssignments] = useState<any[]>([]);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [assignmentsForUnit, setAssignmentsForUnit] = useState<any[]>([]);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);

  // Fetch units on mount
  useEffect(() => {
    if (!student) return;
    const token = localStorage.getItem("token");
    setUnitsLoading(true);
    
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
      .catch(err => console.error('Error fetching units:', err))
      .finally(() => setUnitsLoading(false));
  }, [student]);

  // Fetch assignments when unit is selected
  useEffect(() => {
    if (!selectedUnit) {
      setAssignmentsForUnit([]);
      setSelectedAssignment("");
      return;
    }

    const token = localStorage.getItem("token");
    console.log('[Workspace] Fetching assignments for unit:', selectedUnit);
    
    fetch(`http://localhost:3000/api/resources/units/${selectedUnit}/resources?type=assignment`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    })
      .then(res => res.json())
      .then(r => {
        console.log('[Workspace] Assignment response:', r);
        if (r.success && Array.isArray(r.data)) {
          console.log('[Workspace] Found assignments:', r.data.length);
          const assignments = r.data.map((a: any) => ({
            ...a,
            unit: units.find(u => u.id === selectedUnit)
          }));
          setAssignmentsForUnit(assignments);
        } else {
          console.warn('[Workspace] Unexpected response format:', r);
          setAssignmentsForUnit([]);
        }
      })
      .catch(err => {
        console.error('[Workspace] Error fetching assignments:', err);
        setAssignmentsForUnit([]);
      });
  }, [selectedUnit, units]);

  // Fetch drafts for assignments in selected unit
  useEffect(() => {
    if (assignmentsForUnit.length === 0 || !student) return;
    
    const token = localStorage.getItem("token");
    Promise.all(assignmentsForUnit.map((a: any) =>
      fetch(`http://localhost:3000/api/workspace/drafts/${a.id}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      })
        .then(res => res.ok ? res.json() : null)
        .then(result => (result && result.success && result.data) ? result.data : null)
    )).then(draftsArr => {
      setDrafts(draftsArr.filter(Boolean));
    });
  }, [assignmentsForUnit, student]);

  useEffect(() => {
    if (selectedAssignment && student) {
      const draft = drafts.find(
        (d: any) => d.assignmentId === selectedAssignment && d.studentId === student.id
      );
      if (draft) {
        setContent(draft.content);
        setLastSaved(draft.lastSaved);
      } else {
        setContent("");
        setLastSaved(null);
      }
    }
  }, [selectedAssignment, student]);

  // Calculate word and character count
  const updateCounts = (text: string) => {
    // Strip HTML tags for word count
    const plainText = text.replace(/<[^>]*>/g, '').trim();
    const words = plainText ? plainText.split(/\s+/).length : 0;
    const chars = plainText.length;
    setWordCount(words);
    setCharCount(chars);
  };

  // Handle content changes
  const handleContentChange = (value: string) => {
    setContent(value);
    updateCounts(value);
  };

  // Initialize counts on component mount and when content changes
  useEffect(() => {
    updateCounts(content);
  }, []);

  const pollSubmissionAnalysis = (submissionId: string) => {
    const token = localStorage.getItem("token");
    const maxAttempts = 60; // 30 seconds with 500ms intervals
    let attempts = 0;

    const poll = () => {
      attempts++;
      if (attempts > maxAttempts) {
        console.error('Analysis timeout');
        clearInterval(pollingIntervalRef.current!);
        toast({ title: "Timeout", description: "Analysis took too long. Please check back later.", variant: "destructive" });
        setSubmitting(false);
        return;
      }

      fetch(`http://localhost:3000/api/submissions/${submissionId}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      })
        .then(res => res.json())
        .then(result => {
          if (result.success && result.data) {
            const { status, plagiarism_percentage, ai_score, ai_report } = result.data;

            // Analysis complete
            if (status !== 'analyzing') {
              clearInterval(pollingIntervalRef.current!);
              setPlagiarismResults({
                plagiarism_percentage: plagiarism_percentage || 0,
                ai_score: ai_score || null,
                status: status,
                ai_report: ai_report || null
              });
              setShowPlagiarismDialog(true);
              setSubmitting(false);
            }
          }
        })
        .catch(err => {
          console.error('Polling error:', err);
        });
    };

    pollingIntervalRef.current = setInterval(poll, 500);
    poll(); // Call immediately
  };

  const saveDraft = () => {
    if (!selectedAssignment || !student || !content.trim()) {
      toast({ title: "Cannot save", description: "Please write something before saving.", variant: "destructive" });
      return;
    }
    
    setSavingDraft(true);
    const token = localStorage.getItem("token");
    fetch(`http://localhost:3000/api/workspace/drafts`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ 
        resource_id: selectedAssignment, 
        content,
        title: studentAssignments.find(a => a.id === selectedAssignment)?.title || "Assignment"
      })
    })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setLastSaved(new Date().toISOString());
          toast({ title: "Draft saved", description: "Your work has been saved successfully as PDF." });
        } else {
          toast({ title: "Error", description: result.message || "Failed to save draft", variant: "destructive" });
        }
      })
      .catch(err => {
        console.error('Save draft error:', err);
        toast({ title: "Error", description: "Failed to save draft", variant: "destructive" });
      })
      .finally(() => setSavingDraft(false));
  };

  const submitAssignment = () => {
    if (!content.trim() || !selectedAssignment || !student) {
      toast({ title: "Cannot submit", description: "Please write something before submitting.", variant: "destructive" });
      return;
    }
    
    setSubmitting(true);
    const token = localStorage.getItem("token");
    fetch(`http://localhost:3000/api/workspace/turn-in`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ 
        resource_id: selectedAssignment, 
        content 
      })
    })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          const submissionId = result.submission_id;
          setAnalyzingSubmissionId(submissionId);
          toast({ 
            title: "Assignment submitted for analysis!", 
            description: "Analyzing for plagiarism..."
          });
          
          // Start polling for plagiarism results
          pollSubmissionAnalysis(submissionId);
        } else {
          toast({ title: "Error", description: result.message || "Failed to submit assignment", variant: "destructive" });
          setSubmitting(false);
        }
      })
      .catch(err => {
        console.error('Submit error:', err);
        toast({ title: "Error", description: "Failed to submit assignment", variant: "destructive" });
        setSubmitting(false);
      });
  };

  const [aiError, setAiError] = useState<string | null>(null);
  const searchResearch = () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setAiError(null);
    const token = localStorage.getItem("token");
    fetch(`http://localhost:3000/api/workspace/ai-recommend`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      credentials: "include",
      body: JSON.stringify({ text: aiQuery })
    })
      .then(res => res.json())
      .then(result => {
        if (result.success && Array.isArray(result.papers)) {
          setAiResults(result.papers);
        } else if (result.success === false && result.message) {
          setAiError(result.message);
        } else {
          setAiError("Unexpected response from server.");
        }
        setAiLoading(false);
      })
      .catch(() => {
        setAiError("Failed to fetch research results. Please try again.");
        setAiLoading(false);
      });
  };

  const handleSubmitAnyway = () => {
    if (!analyzingSubmissionId || !plagiarismResults) return;
    
    setFinalizing(true);
    const token = localStorage.getItem("token");
    
    // Get the submission details to get file_path
    fetch(`http://localhost:3000/api/submissions/${analyzingSubmissionId}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          const { file_path } = result.data;
          
          // Call submitAssignment to finalize it
          return fetch(`http://localhost:3000/api/submissions/submit-assignment`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            body: JSON.stringify({
              resource_id: selectedAssignment,
              file_path: file_path,
              plagiarism_percentage: plagiarismResults.plagiarism_percentage,
              status: 'final'
            })
          });
        }
        throw new Error('Failed to get submission');
      })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          toast({
            title: "Assignment submitted!",
            description: `Your assignment has been submitted to the lecturer despite ${plagiarismResults.plagiarism_percentage}% plagiarism detection.`
          });
          setContent("");
          setLastSaved(null);
          setSelectedAssignment("");
          setShowPlagiarismDialog(false);
          setPlagiarismResults(null);
          setAnalyzingSubmissionId(null);
        } else {
          toast({ title: "Error", description: "Failed to finalize submission", variant: "destructive" });
        }
      })
      .catch(err => {
        console.error('Submit anyway error:', err);
        toast({ title: "Error", description: "Failed to finalize submission", variant: "destructive" });
      })
      .finally(() => setFinalizing(false));
  };

  const handleRedo = () => {
    if (!analyzingSubmissionId) return;
    
    setFinalizing(true);
    const token = localStorage.getItem("token");
    
    // Cancel the submission
    fetch(`http://localhost:3000/api/submissions/${analyzingSubmissionId}/cancel`, {
      method: "DELETE",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          toast({ title: "Redo", description: "Submission cancelled. You can now redo your assignment." });
          setShowPlagiarismDialog(false);
          setPlagiarismResults(null);
          setAnalyzingSubmissionId(null);
          // Keep content and assignment selected for editing
        } else {
          toast({ title: "Error", description: "Failed to cancel submission", variant: "destructive" });
        }
      })
      .catch(err => {
        console.error('Redo error:', err);
        toast({ title: "Error", description: "Failed to cancel submission", variant: "destructive" });
      })
      .finally(() => setFinalizing(false));
  };

  const exportToWord = () => {
    // Create a simple HTML document that can be opened in Word
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Assignment Export</title>
          <style>
            body { font-family: 'Times New Roman', serif; margin: 1in; }
            h1 { font-size: 24pt; margin-bottom: 12pt; }
            h2 { font-size: 18pt; margin-bottom: 10pt; }
            h3 { font-size: 14pt; margin-bottom: 8pt; }
            p { margin-bottom: 8pt; line-height: 1.5; }
            blockquote { margin: 12pt 0; padding-left: 12pt; border-left: 3pt solid #ccc; font-style: italic; }
            ul, ol { margin-bottom: 8pt; }
            li { margin-bottom: 4pt; }
            code { font-family: 'Courier New', monospace; background: #f5f5f5; padding: 2pt 4pt; }
            pre { font-family: 'Courier New', monospace; background: #f5f5f5; padding: 8pt; margin: 8pt 0; }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `;

    // Create a blob and download it
    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assignment_${selectedAssignment || 'draft'}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({ title: "Export Complete", description: "Document exported as Word-compatible file." });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Plagiarism Results Dialog */}
      <Dialog open={showPlagiarismDialog} onOpenChange={setShowPlagiarismDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Plagiarism Analysis Results</DialogTitle>
            <DialogDescription>
              Your assignment has been analyzed. Review the results below.
            </DialogDescription>
          </DialogHeader>

          {plagiarismResults && (
            <div className="space-y-4">
              {plagiarismResults.plagiarism_percentage >= 30 ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    High plagiarism detected: <strong>{plagiarismResults.plagiarism_percentage}%</strong>
                  </AlertDescription>
                </Alert>
              ) : plagiarismResults.plagiarism_percentage >= 10 ? (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Moderate plagiarism detected: <strong>{plagiarismResults.plagiarism_percentage}%</strong>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Low plagiarism: <strong>{plagiarismResults.plagiarism_percentage}%</strong> - Looks good!
                  </AlertDescription>
                </Alert>
              )}

              {plagiarismResults.ai_score !== null && (
                <div className="p-3 bg-muted rounded-lg space-y-2">
                  <p className="text-sm font-medium">AI Generation Score</p>
                  <p className="text-2xl font-bold text-primary">{(plagiarismResults.ai_score * 100).toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">Likelihood of AI generation</p>
                </div>
              )}

              {plagiarismResults.ai_report?.sentences && Array.isArray(plagiarismResults.ai_report.sentences) && plagiarismResults.ai_report.sentences.length > 0 && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg space-y-2">
                  <p className="text-sm font-semibold text-orange-900 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" /> AI-Detected Sentences
                  </p>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {plagiarismResults.ai_report.sentences.map((sent: any, idx: number) => (
                      <div key={idx} className="p-2 bg-white rounded border border-orange-100 text-xs">
                        <p className="text-orange-900 leading-relaxed">{sent.sentence || sent.text || 'N/A'}</p>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-orange-700 font-medium">
                            {typeof sent.probability === 'number' ? (sent.probability * 100).toFixed(1) : (sent.score * 100).toFixed(1)}% AI
                          </span>
                          <span className="text-xs text-orange-600">
                            {typeof sent.probability === 'number' && sent.probability > 0.7 
                              ? '🔴 High' 
                              : typeof sent.probability === 'number' && sent.probability > 0.4 
                              ? '🟡 Medium' 
                              : '🟢 Low'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-sm text-muted-foreground">
                You can submit anyway if you believe the detection is a false positive, or redo your assignment to lower the plagiarism score.
              </p>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleRedo}
              disabled={finalizing}
            >
              {finalizing ? "Redoing..." : "Redo"}
            </Button>
            <Button
              onClick={handleSubmitAnyway}
              disabled={finalizing}
            >
              {finalizing ? "Finalizing..." : "Submit Anyway"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" /> Workspace
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Work on assignments, save drafts, and submit when ready.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Unit Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Step 1: Select Unit</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a unit..." />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.code} — {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {units.length === 0 && !unitsLoading && (
                <p className="text-xs text-muted-foreground mt-2">No units found. Register for units first.</p>
              )}
            </CardContent>
          </Card>

          {/* Assignment Selection */}
          {selectedUnit && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Step 2: Select Assignment</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedAssignment} onValueChange={setSelectedAssignment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an assignment to work on..." />
                  </SelectTrigger>
                  <SelectContent>
                    {assignmentsForUnit.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {assignmentsForUnit.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-2">No assignments found for this unit.</p>
                )}
              </CardContent>
            </Card>
          )}

          {selectedAssignment && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Step 4: Write Your Solution</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedAssignment("")}>
                    Change Assignment
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Assignment Document Viewer */}
                {(() => {
                  const assignment = assignmentsForUnit.find(a => a.id === selectedAssignment);
                  if (assignment && assignment.file_path) {
                    // Handle file_path that may or may not already have /uploads/ prefix
                    const cleanPath = assignment.file_path.startsWith('/uploads/') 
                      ? assignment.file_path 
                      : `/uploads/${assignment.file_path}`;
                    const fileUrl = `http://localhost:3000${cleanPath}`;
                    
                    console.log('[AssignmentEditor] File path:', assignment.file_path, 'Clean path:', cleanPath, 'Full URL:', fileUrl);
                    
                    if (assignment.file_path.endsWith('.pdf')) {
                      return (
                        <iframe
                          src={fileUrl}
                          title="Assignment PDF"
                          width="100%"
                          height="500px"
                          style={{ border: '1px solid #ccc', borderRadius: 8 }}
                        />
                      );
                    } else {
                      return (
                        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="underline text-primary">
                          Download/View Assignment Document
                        </a>
                      );
                    }
                  } else {
                    return <p className="text-xs text-muted-foreground">No assignment document uploaded.</p>;
                  }
                })()}
                <div className="border-b my-2" />
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Type className="h-4 w-4" /> Rich Text Editor
                  </CardTitle>
                  {lastSaved && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Last saved: {new Date(lastSaved).toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Formatting Toolbar Info */}
                <div className="bg-muted/50 p-3 rounded-lg mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-medium mb-2 text-muted-foreground">Formatting Tools:</p>
                      <div className="flex flex-wrap gap-1 text-xs">
                        <span className="flex items-center gap-1 px-2 py-1 bg-background rounded border">
                          <Bold className="h-3 w-3" /> Bold (Ctrl+B)
                        </span>
                        <span className="flex items-center gap-1 px-2 py-1 bg-background rounded border">
                          <Italic className="h-3 w-3" /> Italic (Ctrl+I)
                        </span>
                        <span className="flex items-center gap-1 px-2 py-1 bg-background rounded border">
                          <Underline className="h-3 w-3" /> Underline (Ctrl+U)
                        </span>
                        <span className="flex items-center gap-1 px-2 py-1 bg-background rounded border">
                          <List className="h-3 w-3" /> Lists
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-2 text-muted-foreground">Advanced Features:</p>
                      <div className="flex flex-wrap gap-1 text-xs">
                        <span className="flex items-center gap-1 px-2 py-1 bg-background rounded border">
                          <Type className="h-3 w-3" /> Headings
                        </span>
                        <span className="flex items-center gap-1 px-2 py-1 bg-background rounded border">
                          <AlignLeft className="h-3 w-3" /> Alignment
                        </span>
                        <span className="flex items-center gap-1 px-2 py-1 bg-background rounded border">
                          <Link className="h-3 w-3" /> Links & Images
                        </span>
                        <span className="flex items-center gap-1 px-2 py-1 bg-background rounded border">
                          <Quote className="h-3 w-3" /> Quotes & Code
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    💡 Use keyboard shortcuts for quick formatting. Changes are auto-saved as drafts.
                  </p>
                </div>

                <RichTextEditor
                  value={content}
                  onChange={handleContentChange}
                  placeholder="Start writing your assignment here... Use the toolbar above for formatting."
                  className="min-h-[400px]"
                />

                {/* Word and Character Count */}
                <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/30 p-2 rounded mt-2">
                  <span>Words: {wordCount.toLocaleString()}</span>
                  <span>Characters: {charCount.toLocaleString()}</span>
                  <span>Characters (with spaces): {(content.replace(/<[^>]*>/g, '').length).toLocaleString()}</span>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={saveDraft} disabled={savingDraft || submitting || !content.trim()}>
                    {savingDraft ? (
                      <><Loader className="h-3.5 w-3.5 mr-1 animate-spin" /> Saving...</>
                    ) : (
                      <><Save className="h-3.5 w-3.5 mr-1" /> Save Draft</>
                    )}
                  </Button>
                  <Button variant="outline" onClick={exportToWord} disabled={!content.trim()}>
                    <FileDown className="h-3.5 w-3.5 mr-1" /> Export to Word
                  </Button>
                  <Button onClick={submitAssignment} disabled={submitting || savingDraft || !content.trim()}>
                    {submitting ? (
                      <><Loader className="h-3.5 w-3.5 mr-1 animate-spin" /> {analyzingSubmissionId ? 'Analyzing...' : 'Submitting...'}</>
                    ) : lastSaved ? (
                      <><Send className="h-3.5 w-3.5 mr-1" /> Submit</>
                    ) : (
                      <><Send className="h-3.5 w-3.5 mr-1" /> Turn In</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" /> AI Research Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Search for journals and research papers related to your topic. Powered by Semantic Scholar API.
              </p>
              <div className="flex gap-2">
                <input
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchResearch()}
                  placeholder="e.g. sorting algorithms comparison"
                  className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
                />
                <Button size="sm" onClick={searchResearch} disabled={aiLoading}>
                  <Search className="h-3.5 w-3.5" />
                </Button>
              </div>

              {aiLoading && <p className="text-xs text-muted-foreground text-center py-4">Searching papers...</p>}
              {aiError && <p className="text-xs text-destructive text-center py-4">{aiError}</p>}
              {aiResults.length > 0 && !aiError && (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {aiResults.map((r, i) => (
                    <div key={i} className="p-2.5 rounded-lg border bg-muted/30 space-y-1">
                      <p className="text-xs font-medium leading-tight">{r.title}</p>
                      <p className="text-[10px] text-muted-foreground">{r.authors} • {r.year}</p>
                      <Button variant="link" size="sm" className="h-auto p-0 text-xs" asChild>
                        <a href={r.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3 mr-1" /> View Paper
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
