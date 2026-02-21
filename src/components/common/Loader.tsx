import { Loader2 } from "lucide-react";

export const Loader = ({ text = "Loading..." }: { text?: string }) => (
  <div className="flex flex-col items-center justify-center py-12 gap-3">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
    <p className="text-sm text-muted-foreground">{text}</p>
  </div>
);
