import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
// Removed mockData imports. Will fetch from backend.
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Upload, FileText, Calendar, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useEffect } from "react";

export const UploadResources = () => {
  const { unitId } = useParams<{ unitId: string }>();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState<string>("note");

  const [unit, setUnit] = useState<any>(null);
  const [resources, setResources] = useState<any[]>([]);

  useEffect(() => {
    if (!unitId || unitId === "undefined") {
      setUnit(null);
      setResources([]);
      return;
    }
    const token = localStorage.getItem("token");
    fetch(`http://localhost:3000/api/units/${unitId}`)
      .then(res => res.json())
      .then(result => { if (result.success && result.data) setUnit(result.data); });
    fetch(`http://localhost:3000/api/lecturers/resources/${unitId}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    })
      .then(res => res.json())
      .then(result => { if (result.success && Array.isArray(result.resources)) setResources(result.resources); });
  }, [unitId]);

  if (!unitId || unitId === "undefined") {
    return <p className="p-6 text-destructive">Error: No unit selected. Please select a valid teaching unit.</p>;
  }
  if (!unit) return <p className="p-6 text-muted-foreground">Unit not found.</p>;

  const handleUpload = () => {
    if (!title || !file || !type) {
      toast({ title: "Missing fields", description: "Please provide a title, select a file, and choose a type.", variant: "destructive" });
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append("unit_id", unitId);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("type", type);
    formData.append("file", file);
    const token = localStorage.getItem("token");
    fetch(`http://localhost:3000/api/lecturers/resources/upload`, {
      method: "POST",
      body: formData,
      credentials: "include",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          toast({ title: "Upload successful! ✓", description: `"${title}" has been uploaded to ${unit.code}.` });
          setTitle("");
          setDescription("");
          setFile(null);
          setType("note");
          // Refresh resource list
          const token = localStorage.getItem("token");
          fetch(`http://localhost:3000/api/lecturers/resources/${unitId}`, {
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            }
          })
            .then(res => res.json())
            .then(result => { if (result.success && Array.isArray(result.resources)) setResources(result.resources); });
        }
        setUploading(false);
      })
      .catch(() => setUploading(false));
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
            <Label>Type</Label>
            <select
              className="w-full border rounded px-2 py-1 text-sm"
              value={type}
              onChange={e => setType(e.target.value)}
            >
              <option value="note">Note</option>
              <option value="assignment">Assignment</option>
              <option value="additional_material">Additional Material</option>
              <option value="cat">CAT</option>
            </select>
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
        {resources.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No resources uploaded yet.</p>
        ) : (
          resources.map((resource) => (
            <Card key={resource.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-success/10 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-success" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{resource.title}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <span className="font-mono">{resource.type}</span>
                      <Calendar className="h-3 w-3" /> {new Date(resource.created_at).toLocaleDateString()}
                    </p>
                    {resource.metadata && (
                      <p className="text-xs text-muted-foreground">{typeof resource.metadata === 'object' ? JSON.stringify(resource.metadata) : resource.metadata}</p>
                    )}
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

