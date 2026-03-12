import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
// Removed mockData imports. Will fetch from backend.
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Send, Clock, FileText, Search, BookOpen, ExternalLink, Loader } from "lucide-react";
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

  const [studentAssignments, setStudentAssignments] = useState<any[]>([]);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);

  useEffect(() => {
    if (!student) return;
    // Fetch assignments for registered units
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
          // For each unit, fetch assignments
          Promise.all(result.data.map((unit: any) =>
            fetch(`http://localhost:3000/api/resources/units/${unit.id}/resources?type=assignment`, {
              headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {})
              }
            })
              .then(res => res.json())
              .then(r => (r.success && Array.isArray(r.resources)) ? r.resources.map((a: any) => ({ ...a, unit })) : [])
          )).then(allAssignments => {
            setStudentAssignments(allAssignments.flat());
          });
        }
      });

    // Fetch drafts for each assignment using GET /workspace/drafts/:resourceId
    // Wait for assignments to be loaded first
    // We'll use a timeout to ensure assignments are loaded, or you can refactor to useEffect on studentAssignments
    setTimeout(() => {
      if (studentAssignments.length > 0) {
        Promise.all(studentAssignments.map((a: any) =>
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
      }
    }, 1000);
  }, [student]);

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
          toast({ 
            title: "Assignment submitted!", 
            description: "Your assignment is being analyzed. Check Document Analysis page in a moment for results."
          });
          setContent("");
          setLastSaved(null);
          setSelectedAssignment("");
          
          // Store submission ID for reference
          localStorage.setItem(`submission_${submissionId}`, JSON.stringify({
            submission_id: submissionId,
            timestamp: new Date().toISOString()
          }));
        } else {
          toast({ title: "Error", description: result.message || "Failed to submit assignment", variant: "destructive" });
        }
      })
      .catch(err => {
        console.error('Submit error:', err);
        toast({ title: "Error", description: "Failed to submit assignment", variant: "destructive" });
      })
      .finally(() => setSubmitting(false));
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" /> Workspace
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Work on assignments, save drafts, and submit when ready.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Select Assignment</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedAssignment} onValueChange={setSelectedAssignment}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an assignment to work on..." />
                </SelectTrigger>
                <SelectContent>
                  {studentAssignments.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.unit?.code || a.unitId} — {a.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {selectedAssignment && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Assignment Document</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Assignment Document Viewer */}
                {(() => {
                  const assignment = studentAssignments.find(a => a.id === selectedAssignment);
                  if (assignment && assignment.file_path) {
                    // Assume file_path is a relative path to the backend uploads folder
                    // You may need to adjust the URL if served differently
                    const fileUrl = `http://localhost:3000/uploads/${assignment.file_path}`;
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
                  <CardTitle className="text-base">Editor</CardTitle>
                  {lastSaved && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Last saved: {new Date(lastSaved).toLocaleString()}
                    </span>
                  )}
                </div>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Start writing your assignment here... (Markdown supported)"
                  className="min-h-[300px] font-mono text-sm"
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={saveDraft} disabled={savingDraft || submitting || !content.trim()}>
                    {savingDraft ? (
                      <><Loader className="h-3.5 w-3.5 mr-1 animate-spin" /> Saving...</>
                    ) : (
                      <><Save className="h-3.5 w-3.5 mr-1" /> Save Draft</>
                    )}
                  </Button>
                  <Button onClick={submitAssignment} disabled={submitting || savingDraft || !content.trim()}>
                    {submitting ? (
                      <><Loader className="h-3.5 w-3.5 mr-1 animate-spin" /> Submitting...</>
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
