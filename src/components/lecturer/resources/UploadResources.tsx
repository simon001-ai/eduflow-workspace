import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getUnitById, getNotesByUnit } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Upload, FileText, Calendar, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export const UploadResources = () => {
  const { unitId } = useParams<{ unitId: string }>();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);

  if (!unitId) return null;
  const unit = getUnitById(unitId);
  const notes = getNotesByUnit(unitId);

  if (!unit) return <p className="p-6 text-muted-foreground">Unit not found.</p>;

  const handleUpload = () => {
    if (!title || !file) {
      toast({ title: "Missing fields", description: "Please provide a title and select a file.", variant: "destructive" });
      return;
    }
    setUploading(true);
    setTimeout(() => {
      toast({ title: "Upload successful! ✓", description: `"${title}" has been uploaded to ${unit.code}.` });
      setTitle("");
      setDescription("");
      setFile(null);
      setUploading(false);
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">{unit.code} — Resources</h1>
          <p className="text-sm text-muted-foreground">{unit.name}</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Upload New Resource</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Week 5 Lecture Notes" />
          </div>
          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description..." />
          </div>
          <div className="space-y-2">
            <Label>File</Label>
            <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} accept=".pdf,.docx,.pptx,.txt" />
          </div>
          <Button onClick={handleUpload} disabled={uploading} className="w-full">
            <Upload className="h-3.5 w-3.5 mr-1" /> {uploading ? "Uploading..." : "Upload Resource"}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-base font-semibold">Upload History</h2>
        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No resources uploaded yet.</p>
        ) : (
          notes.map((note) => (
            <Card key={note.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-success/10 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-success" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{note.title}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {new Date(note.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
