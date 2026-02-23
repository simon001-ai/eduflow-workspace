import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, AlertTriangle, CheckCircle, RefreshCw, BookOpen, ExternalLink } from "lucide-react";

interface PlagiarismMatch {
  text: string;
  source: string;
  similarity: number;
}

export const UploadDocument = () => {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    matches: PlagiarismMatch[];
    recommendations: string[];
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const analyzeDocument = useCallback(() => {
    if (!file) return;
    setAnalyzing(true);
    // Simulate plagiarism check
    setTimeout(() => {
      const mockScore = Math.random() * 40;
      const isHigh = mockScore > 15;
      setResult({
        score: Math.round(mockScore * 10) / 10,
        matches: isHigh
          ? [
              { text: "Machine learning is a subset of artificial intelligence that enables systems to learn from data.", source: "Wikipedia - Machine Learning", similarity: 92 },
              { text: "The algorithm optimizes the loss function using gradient descent.", source: "Deep Learning by Goodfellow et al.", similarity: 78 },
              { text: "Neural networks consist of layers of interconnected nodes.", source: "Stanford CS229 Notes", similarity: 65 },
            ]
          : [
              { text: "Minor textual overlap detected in introduction paragraph.", source: "Common academic phrases", similarity: 12 },
            ],
        recommendations: isHigh
          ? [
              "Paraphrase the highlighted sections using your own words",
              "Add proper citations for referenced material",
              "Review: 'Journal of Machine Learning Research' for original perspectives",
              "Consider reading: 'Pattern Recognition and ML' by Bishop",
              "Use quotation marks for direct quotes and cite sources",
            ]
          : ["Your document has acceptable originality. You may proceed to submit."],
      });
      setAnalyzing(false);
    }, 2500);
  }, [file]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" /> Document Analysis
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Upload your document to check for plagiarism before submission.</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/40 transition-colors">
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm font-medium mb-1">Drop your document here or click to browse</p>
            <p className="text-xs text-muted-foreground mb-4">Supports PDF, DOCX, TXT (max 10MB)</p>
            <input type="file" accept=".pdf,.docx,.txt,.doc" onChange={handleFileChange} className="hidden" id="doc-upload" />
            <Button variant="outline" asChild>
              <label htmlFor="doc-upload" className="cursor-pointer">Choose File</label>
            </Button>
          </div>
          {file && (
            <div className="mt-4 flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{file.name}</span>
                <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
              <Button onClick={analyzeDocument} disabled={analyzing} size="sm">
                {analyzing ? <><RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" /> Analyzing...</> : "Analyze"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4 animate-fade-in">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Plagiarism Score</span>
                {result.score > 15 ? (
                  <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> High Plagiarism</Badge>
                ) : (
                  <Badge className="gap-1 bg-success text-success-foreground"><CheckCircle className="h-3 w-3" /> Acceptable</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Similarity</span>
                  <span className={`font-bold ${result.score > 15 ? "text-destructive" : "text-success"}`}>{result.score}%</span>
                </div>
                <Progress value={result.score} className={`h-3 ${result.score > 15 ? "[&>div]:bg-destructive" : "[&>div]:bg-success"}`} />
                <p className="text-xs text-muted-foreground">Threshold: 15% — documents above this require revision.</p>
              </div>
            </CardContent>
          </Card>

          {result.matches.length > 0 && result.score > 15 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Flagged Sections</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.matches.map((match, i) => (
                  <div key={i} className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                    <p className="text-sm italic text-foreground">"{match.text}"</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-muted-foreground">Source: {match.source}</p>
                      <Badge variant="outline" className="text-xs">{match.similarity}% match</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

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
                    <ExternalLink className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
