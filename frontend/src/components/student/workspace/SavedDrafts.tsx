import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { toast } from "@/hooks/use-toast";
import { FileText, Trash2, Download, Calendar, Book, AlertCircle, Send, AlertTriangle, CheckCircle, Loader } from "lucide-react";

interface SavedDraft {
  id: string;
  student_id: string;
  resource_id: string;
  content: string;
  file_path: string;
  file_url: string;
  draft_title: string;
  last_saved: string;
  created_at: string;
  resources?: {
    id: string;
    title: string;
    type: string;
    unit_id: string;
    units?: {
      id: string;
      code: string;
      name: string;
    };
  };
}

export const SavedDrafts = () => {
  const { student } = useAuth();
  const [drafts, setDrafts] = useState<SavedDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewingDraft, setViewingDraft] = useState<SavedDraft | null>(null);
  const [deletingDraftId, setDeletingDraftId] = useState<string | null>(null);

  // Plagiarism analysis state
  const [showPlagiarismDialog, setShowPlagiarismDialog] = useState(false);
  const [plagiarismResults, setPlagiarismResults] = useState<any>(null);
  const [analyzingSubmissionId, setAnalyzingSubmissionId] = useState<string | null>(null);
  const [submittingDraftId, setSubmittingDraftId] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!student) return;
    loadDrafts();
  }, [student]);

  const loadDrafts = () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    fetch("http://localhost:3000/api/workspace/drafts", {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    })
      .then(res => res.json())
      .then(result => {
        if (result.success && Array.isArray(result.data)) {
          setDrafts(result.data);
        }
      })
      .catch(err => {
        console.error("Error loading drafts:", err);
        toast({ title: "Error", description: "Failed to load drafts", variant: "destructive" });
      })
      .finally(() => setLoading(false));
  };

  const handleDelete = (draftId: string) => {
    if (!student) return;
    
    const token = localStorage.getItem("token");
    fetch(`http://localhost:3000/api/workspace/drafts/${draftId}`, {
      method: "DELETE",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setDrafts(drafts.filter(d => d.id !== draftId));
          toast({ title: "Success", description: "Draft deleted successfully" });
          setDeletingDraftId(null);
        } else {
          toast({ title: "Error", description: result.message || "Failed to delete draft", variant: "destructive" });
        }
      })
      .catch(err => {
        console.error("Delete error:", err);
        toast({ title: "Error", description: "Failed to delete draft", variant: "destructive" });
      });
  };

  const handleDownload = (draft: SavedDraft) => {
    const link = document.createElement('a');
    link.href = draft.file_url;
    link.download = `${draft.draft_title}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
        setSubmittingDraftId(null);
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
              setSubmittingDraftId(null);
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

  const submitDraft = (draft: SavedDraft) => {
    if (!student || !draft.content.trim()) {
      toast({ title: "Cannot submit", description: "Draft content is empty.", variant: "destructive" });
      return;
    }
    
    setSubmittingDraftId(draft.id);
    const token = localStorage.getItem("token");
    fetch(`http://localhost:3000/api/workspace/turn-in`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ 
        resource_id: draft.resource_id, 
        content: draft.content 
      })
    })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          const submissionId = result.submission_id;
          setAnalyzingSubmissionId(submissionId);
          toast({ 
            title: "Draft submitted for analysis!", 
            description: "Analyzing for plagiarism..."
          });
          
          // Start polling for plagiarism results
          pollSubmissionAnalysis(submissionId);
        } else {
          toast({ title: "Error", description: result.message || "Failed to submit draft", variant: "destructive" });
          setSubmittingDraftId(null);
        }
      })
      .catch(err => {
        console.error('Submit error:', err);
        toast({ title: "Error", description: "Failed to submit draft", variant: "destructive" });
        setSubmittingDraftId(null);
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
          const { file_path, resource_id } = result.data;
          
          // Call submitAssignment to finalize it
          return fetch(`http://localhost:3000/api/submissions/submit-assignment`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            body: JSON.stringify({
              resource_id: resource_id,
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
            description: `Your draft has been submitted to the lecturer despite ${plagiarismResults.plagiarism_percentage}% plagiarism detection.`
          });
          setShowPlagiarismDialog(false);
          setPlagiarismResults(null);
          setAnalyzingSubmissionId(null);
          setSubmittingDraftId(null);
          loadDrafts(); // Reload drafts
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
          toast({ title: "Redo", description: "Submission cancelled. You can modify and resubmit this draft." });
          setShowPlagiarismDialog(false);
          setPlagiarismResults(null);
          setAnalyzingSubmissionId(null);
          setSubmittingDraftId(null);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Plagiarism Results Dialog */}
      <Dialog open={showPlagiarismDialog} onOpenChange={setShowPlagiarismDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Plagiarism Analysis Results</DialogTitle>
            <DialogDescription>
              Your draft has been analyzed. Review the results below.
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
                You can submit anyway if you believe the detection is a false positive, or redo to modify your draft before resubmitting.
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
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" /> Saved Drafts
        </h1>
        <p className="text-sm text-muted-foreground mt-1">View and manage your previously saved assignment drafts</p>
      </div>

      {drafts.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12 text-muted-foreground space-y-3">
              <AlertCircle className="h-12 w-12 mx-auto opacity-40" />
              <p className="text-base font-medium">No saved drafts yet</p>
              <p className="text-sm">Start working on an assignment and save your progress</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {drafts.map((draft) => (
            <Card key={draft.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold truncate">{draft.draft_title}</h3>
                      <Badge variant="outline" className="text-xs whitespace-nowrap">
                        {draft.resources?.units?.code || "Assignment"}
                      </Badge>
                    </div>
                    
                    {draft.resources && (
                      <p className="text-sm text-muted-foreground mb-3 flex items-center gap-1">
                        <Book className="h-3.5 w-3.5" /> {draft.resources.title}
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          Last saved: {new Date(draft.last_saved).toLocaleDateString()} {' '}
                          {new Date(draft.last_saved).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-right">
                        {(draft.content.length / 1024).toFixed(1)} KB
                      </div>
                    </div>

                    {/* Draft Preview */}
                    <div className="mt-3 p-3 bg-muted/30 rounded-lg border max-h-20 overflow-hidden">
                      <p className="text-xs text-foreground line-clamp-3 leading-relaxed">
                        {draft.content.substring(0, 200)}...
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      onClick={() => submitDraft(draft)}
                      disabled={submittingDraftId === draft.id}
                      className="gap-1 whitespace-nowrap bg-primary hover:bg-primary/90"
                    >
                      {submittingDraftId === draft.id ? (
                        <>Submitting...</>
                      ) : (
                        <><Send className="h-3.5 w-3.5" /> Submit</>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(draft)}
                      className="gap-1 whitespace-nowrap"
                    >
                      <Download className="h-3.5 w-3.5" /> Download
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setViewingDraft(draft)}
                      className="gap-1 whitespace-nowrap"
                    >
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeletingDraftId(draft.id)}
                      className="gap-1 whitespace-nowrap"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Draft Dialog */}
      <Dialog open={!!viewingDraft} onOpenChange={() => setViewingDraft(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewingDraft?.draft_title}</DialogTitle>
            <DialogDescription>
              Saved on {viewingDraft && new Date(viewingDraft.last_saved).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {viewingDraft?.resources && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Course</p>
                  <p className="font-semibold">{viewingDraft.resources.units?.code || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Assignment</p>
                  <p className="font-semibold">{viewingDraft.resources.title}</p>
                </div>
              </div>
            )}

            <div className="border rounded-lg p-4 bg-muted/20 max-h-96 overflow-y-auto">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <pre className="whitespace-pre-wrap font-mono text-xs">
                  {viewingDraft?.content}
                </pre>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => viewingDraft && handleDownload(viewingDraft)}
              className="gap-1"
            >
              <Download className="h-3.5 w-3.5" /> Download PDF
            </Button>
            <Button
              variant="default"
              onClick={() => setViewingDraft(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingDraftId} onOpenChange={() => setDeletingDraftId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Draft?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this draft? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingDraftId(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingDraftId && handleDelete(deletingDraftId)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
