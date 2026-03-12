import React from "react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
// Removed mockData imports. Will fetch from backend.
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Email {
  id: string;
  subject: string;
  body: string;
  fromName: string;
  toName?: string;
  sentAt: string;
  read: boolean;
  isSpam?: boolean;
}
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Inbox, Send, AlertTriangle, ArrowLeft, Mail, Paperclip, Shield, ExternalLink } from "lucide-react";
import { scanEmailForThreats } from "@/utils/linkScanner";
import { toast } from "@/hooks/use-toast";
import { sendInboxEmail } from "@/lib/inboxApi";

export const InboxLayout = () => {
  const { student } = useAuth();
  const userId = student?.id || "";
  const [activeTab, setActiveTab] = useState("inbox");
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [composing, setComposing] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [inboxEmails, setInboxEmails] = useState<any[]>([]);
  const [sentEmails, setSentEmails] = useState<any[]>([]);
  const [spamEmails, setSpamEmails] = useState<any[]>([]);
  const [lecturers, setLecturers] = useState<any[]>([]);

  React.useEffect(() => {
    if (!userId) return;
    const token = localStorage.getItem("token");
    // Fetch inbox
    fetch(`http://localhost:3000/api/inbox/`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(result => { if (result.success && Array.isArray(result.data)) setInboxEmails(result.data); })
      .catch(() => setInboxEmails([]));
    // Fetch sent
    fetch(`http://localhost:3000/api/inbox/sent`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(result => { if (result.success && Array.isArray(result.data)) setSentEmails(result.data); })
      .catch(() => setSentEmails([]));
    // Fetch spam
    fetch(`http://localhost:3000/api/inbox/spam`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(result => { if (result.success && Array.isArray(result.data)) setSpamEmails(result.data); })
      .catch(() => setSpamEmails([]));
    // Fetch lecturers for compose dropdown (only lecturers for student's units)
    if (userId) {
      fetch(`http://localhost:3000/api/lecturers/students/${userId}/lecturers`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      })
        .then(res => res.ok ? res.json() : Promise.reject(res))
        .then(result => { if (result.success && Array.isArray(result.data)) setLecturers(result.data); })
        .catch(() => setLecturers([]));
    }
  }, [userId]);

  const getEmailsForTab = () => {
    if (activeTab === "inbox") return inboxEmails;
    if (activeTab === "sent") return sentEmails;
    if (activeTab === "spam") return spamEmails;
    return [];
  };

  const sendEmail = () => {
    if (!composeTo || !composeSubject || !composeBody) {
      toast({ title: "Missing fields", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }
    // Use the updated API util for sending
    sendInboxEmail(composeTo, composeSubject, composeBody, composeBody, attachment ? [attachment] : undefined)
      .then(result => {
        if (result.success) {
          toast({ title: "Email sent!", description: `Message sent to ${lecturers.find(l => l.id === composeTo)?.full_name || composeTo}` });
          setComposing(false);
          setComposeTo("");
          setComposeSubject("");
          setComposeBody("");
          setAttachment(null);
        }
      });
  };

  if (selectedEmail) {
    const threats = scanEmailForThreats(selectedEmail.body);
    return (
      <div className="space-y-4 animate-fade-in">
        <Button variant="ghost" size="sm" onClick={() => setSelectedEmail(null)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to {activeTab}
        </Button>
        <Card>
          <CardHeader>
            <div className="space-y-2">
              <CardTitle className="text-base">{selectedEmail.subject}</CardTitle>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  From: <span className="font-medium text-foreground">{selectedEmail.fromName}</span>
                </p>
                <p className="text-xs text-muted-foreground">{new Date(selectedEmail.sentAt).toLocaleString()}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {threats.hasThreats && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 space-y-2">
                <p className="text-sm font-medium text-destructive flex items-center gap-2">
                  <Shield className="h-4 w-4" /> Security Warning
                </p>
                {threats.results.filter(r => !r.isSafe).map((r, i) => (
                  <div key={i} className="text-xs text-muted-foreground">
                    <span className="font-mono text-destructive">{r.url}</span>
                    <ul className="ml-4 list-disc">
                      {r.warnings.map((w, j) => <li key={j}>{w}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            )}
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{selectedEmail.body}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (composing) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Button variant="ghost" size="sm" onClick={() => setComposing(false)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Cancel
        </Button>
        <Card>
          <CardHeader><CardTitle className="text-base">Compose Email</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Select value={composeTo} onValueChange={setComposeTo}>
              <SelectTrigger><SelectValue placeholder="Select recipient..." /></SelectTrigger>
              <SelectContent>
                {lecturers.map((l: any) => (
                  <SelectItem key={l.id} value={l.institutional_email || l.email}>{l.full_name || l.fullName} ({l.institutional_email || l.email})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input value={composeSubject} onChange={(e) => setComposeSubject(e.target.value)} placeholder="Subject" />
            <Textarea value={composeBody} onChange={(e) => setComposeBody(e.target.value)} placeholder="Write your message..." className="min-h-[200px]" />
            <div className="flex justify-between items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={e => setAttachment(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
              />
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-3.5 w-3.5 mr-1" /> Attach File
              </Button>
              {attachment && <span className="text-xs ml-2">{attachment.name}</span>}
              <Button onClick={sendEmail}><Send className="h-3.5 w-3.5 mr-1" /> Send</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2"><Mail className="h-5 w-5 text-primary" /> Inbox</h1>
        <Button size="sm" onClick={() => setComposing(true)}><Send className="h-3.5 w-3.5 mr-1" /> Compose</Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="inbox" className="gap-1">
            <Inbox className="h-3.5 w-3.5" /> Inbox
            {inboxEmails.filter(e => !e.read).length > 0 && (
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">{inboxEmails.filter(e => !e.read).length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent" className="gap-1"><Send className="h-3.5 w-3.5" /> Sent</TabsTrigger>
          <TabsTrigger value="spam" className="gap-1">
            <AlertTriangle className="h-3.5 w-3.5" /> Spam
            {spamEmails.length > 0 && <Badge variant="destructive" className="ml-1 h-4 px-1 text-[10px]">{spamEmails.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        {["inbox", "sent", "spam"].map((tab) => (
          <TabsContent key={tab} value={tab}>
            <ScrollArea className="h-[400px]">
              {getEmailsForTab().length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">No emails in {tab}.</p>
              ) : (
                getEmailsForTab().map((email) => (
                  <button
                    key={email.id}
                    onClick={() => setSelectedEmail(email)}
                    className={`w-full flex items-start gap-3 p-3 text-left border-b hover:bg-muted/50 transition-colors ${!email.read ? "bg-primary/5" : ""}`}
                  >
                    <Mail className={`h-4 w-4 mt-0.5 shrink-0 ${!email.read ? "text-primary" : "text-muted-foreground"}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm ${!email.read ? "font-semibold" : "font-medium text-muted-foreground"}`}>
                          {tab === "sent" ? `To: ${email.toName}` : email.fromName}
                        </p>
                        <span className="text-[10px] text-muted-foreground">{new Date(email.sentAt).toLocaleDateString()}</span>
                      </div>
                      <p className={`text-xs ${!email.read ? "text-foreground" : "text-muted-foreground"}`}>{email.subject}</p>
                      <p className="text-xs text-muted-foreground truncate">{email.body.slice(0, 80)}...</p>
                    </div>
                    {email.isSpam && <Badge variant="destructive" className="text-[10px] shrink-0">Spam</Badge>}
                  </button>
                ))
              )}
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
