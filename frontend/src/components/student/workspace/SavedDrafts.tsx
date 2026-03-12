import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Loader } from "@/components/common/Loader";
import { toast } from "@/hooks/use-toast";
import { FileText, Trash2, Download, Calendar, Book, AlertCircle } from "lucide-react";

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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
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
