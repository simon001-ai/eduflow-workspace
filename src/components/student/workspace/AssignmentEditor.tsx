import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { mockAssignments, mockDrafts, getUnitById, Draft } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Send, Clock, FileText, Search, BookOpen, ExternalLink } from "lucide-react";
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

  const studentAssignments = student
    ? mockAssignments.filter((a) => student.registeredUnits.includes(a.unitId))
    : [];

  useEffect(() => {
    if (selectedAssignment && student) {
      const draft = mockDrafts.find(
        (d) => d.assignmentId === selectedAssignment && d.studentId === student.id
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
    setLastSaved(new Date().toISOString());
    toast({ title: "Draft saved", description: "Your work has been saved successfully." });
  };

  const submitAssignment = () => {
    if (!content.trim()) {
      toast({ title: "Cannot submit", description: "Please write something before submitting.", variant: "destructive" });
      return;
    }
    toast({ title: "Assignment submitted! 🎉", description: "Your assignment has been turned in successfully." });
  };

  const searchResearch = () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setTimeout(() => {
      setAiResults([
        { title: "A Survey of Sorting Algorithms", authors: "Astrachan, O.", year: "2003", url: "#" },
        { title: "Comparison of Sorting Algorithms on Random Data", authors: "Kumar, R. & Singh, P.", year: "2018", url: "#" },
        { title: "Efficient Graph Traversal Algorithms", authors: "Tarjan, R.E.", year: "1972", url: "#" },
        { title: "Modern Approaches to Algorithm Design", authors: "Chen, W. et al.", year: "2021", url: "#" },
      ]);
      setAiLoading(false);
    }, 1500);
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
                  {studentAssignments.map((a) => {
                    const unit = getUnitById(a.unitId);
                    return (
                      <SelectItem key={a.id} value={a.id}>
                        {unit?.code} — {a.title}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {selectedAssignment && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Editor</CardTitle>
                  {lastSaved && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Last saved: {new Date(lastSaved).toLocaleString()}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Start writing your assignment here... (Markdown supported)"
                  className="min-h-[300px] font-mono text-sm"
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={saveDraft}>
                    <Save className="h-3.5 w-3.5 mr-1" /> Save Draft
                  </Button>
                  <Button onClick={submitAssignment}>
                    <Send className="h-3.5 w-3.5 mr-1" /> Turn In
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

              {aiResults.length > 0 && (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {aiResults.map((r, i) => (
                    <div key={i} className="p-2.5 rounded-lg border bg-muted/30 space-y-1">
                      <p className="text-xs font-medium leading-tight">{r.title}</p>
                      <p className="text-[10px] text-muted-foreground">{r.authors} • {r.year}</p>
                      <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                        <ExternalLink className="h-3 w-3 mr-1" /> View Paper
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
