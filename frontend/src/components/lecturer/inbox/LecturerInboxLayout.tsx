import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchInbox, fetchSent, fetchSpam, sendInboxEmail } from "@/lib/inboxApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Inbox, Send, AlertTriangle, ArrowLeft, Mail, Paperclip, Shield } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { scanEmailForThreats } from "@/utils/linkScanner";
// import { fetchStudents } from "@/lib/studentsApi";
import axios from "axios";

export const LecturerInboxLayout = () => {
  const { lecturer } = useAuth();
  const userId = lecturer?.id || "";
  const [activeTab, setActiveTab] = useState("inbox");
  const [selectedEmail, setSelectedEmail] = useState<any | null>(null);
  const [composing, setComposing] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [inboxEmails, setInboxEmails] = useState<any[]>([]);
  const [sentEmails, setSentEmails] = useState<any[]>([]);
  const [spamEmails, setSpamEmails] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [selectedUnit, setSelectedUnit] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [unread, setUnread] = useState(false);
  const [date, setDate] = useState("");

  const fetchFilteredEmails = useCallback(() => {
    fetchInbox({ search, filter, unread, date }).then(setInboxEmails);
    fetchSent({ search, filter, date }).then(setSentEmails);
    fetchSpam({ search, filter, date }).then(setSpamEmails);
  }, [search, filter, unread, date]);

  useEffect(() => {
    fetchFilteredEmails();
    // Fetch lecturer units
    const token = localStorage.getItem("token");
    fetch("http://localhost:3000/api/lecturers/units", {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    })
      .then(res => res.json())
      .then(result => {
        if (result.success && Array.isArray(result.units)) setUnits(result.units);
      });
  }, [fetchFilteredEmails]);

  useEffect(() => {
    if (!selectedUnit) {
      setStudents([]);
      return;
    }
    const token = localStorage.getItem("token");
    fetch(`http://localhost:3000/api/inbox/unit/${selectedUnit}/students`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    })
      .then(res => res.json())
      .then(result => {
        if (result.success && Array.isArray(result.data)) setStudents(result.data);
      });
  }, [selectedUnit]);

  const getEmailsForTab = () => {
    if (activeTab === "inbox") return inboxEmails;
    if (activeTab === "sent") return sentEmails;
    if (activeTab === "spam") return spamEmails;
    return [];
  };

  const sendEmail = async () => {
    if (!composeTo || !composeSubject || !composeBody) {
      toast({ title: "Missing fields", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }
    try {
      // Send both body and html (html can be the same as body or a formatted version)
      await sendInboxEmail(composeTo, composeSubject, composeBody, composeBody, attachments);
      toast({ title: "Email sent!", description: `Message sent successfully.` });
      setComposing(false);
      setComposeTo("");
      setComposeSubject("");
      setComposeBody("");
      setAttachments([]);
      fetchSent().then(setSentEmails);
    } catch (e) {
      toast({ title: "Error", description: "Failed to send email.", variant: "destructive" });
    }
  };

  const markSpam = async (id: string) => {
    await axios.post(`/api/inbox/${id}/mark-spam`);
    fetchFilteredEmails();
  };
  const unmarkSpam = async (id: string) => {
    await axios.post(`/api/inbox/${id}/unmark-spam`);
    fetchFilteredEmails();
  };

  if (selectedEmail) {
    const threats = scanEmailForThreats(selectedEmail.body);
    return (
      <div className="space-y-4 animate-fade-in">
        <Button variant="ghost" size="sm" onClick={() => setSelectedEmail(null)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{selectedEmail.subject}</CardTitle>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">From: <span className="font-medium text-foreground">{selectedEmail.fromName}</span></p>
              <p className="text-xs text-muted-foreground">{new Date(selectedEmail.sentAt).toLocaleString()}</p>
            </div>
          </CardHeader>
          <CardContent>
            {threats.hasThreats && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm font-medium text-destructive flex items-center gap-2"><Shield className="h-4 w-4" /> Security Warning — Suspicious links detected</p>
              </div>
            )}
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{selectedEmail.body}</div>
            {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold mb-1">Attachments:</p>
                <ul className="space-y-1">
                  {selectedEmail.attachments.map((att: any, idx: number) => (
                    att.mime_type && att.mime_type.startsWith("image") ? (
                      <img src={att.url || `/uploads/${att.file_path?.split('/').pop()}`} alt={att.name} className="max-w-xs max-h-40 mb-2" />
                    ) : att.mime_type === "application/pdf" ? (
                      <a href={att.url || `/uploads/${att.file_path?.split('/').pop()}`} target="_blank" rel="noopener noreferrer" className="text-primary underline flex items-center gap-1">
                        <Paperclip className="h-3 w-3 inline" /> PDF Preview
                      </a>
                    ) : (
                      <a href={att.url || `/uploads/${att.file_path?.split('/').pop()}`} target="_blank" rel="noopener noreferrer" className="text-primary underline flex items-center gap-1">
                        <Paperclip className="h-3 w-3 inline" />
                        {att.name || att.file_path?.split('/').pop() || `Attachment ${idx + 1}`}
                      </a>
                    )
                  ))}
                </ul>
              </div>
            )}
            {/* Spam management buttons */}
            {selectedEmail.folder === "inbox" && (
              <Button variant="destructive" size="sm" onClick={() => markSpam(selectedEmail.id)}>Mark as Spam</Button>
            )}
            {selectedEmail.folder === "spam" && (
              <Button variant="outline" size="sm" onClick={() => unmarkSpam(selectedEmail.id)}>Not Spam</Button>
            )}
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
            <Select value={selectedUnit} onValueChange={setSelectedUnit}>
              <SelectTrigger><SelectValue placeholder="Select unit..." /></SelectTrigger>
              <SelectContent>
                {units.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.code} — {u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={composeTo} onValueChange={setComposeTo} disabled={!selectedUnit}>
              <SelectTrigger><SelectValue placeholder={selectedUnit ? "Select student..." : "Select unit first"} /></SelectTrigger>
              <SelectContent>
                {Array.isArray(students) && students.map((s) => (
                  <SelectItem key={s.id} value={s.email}>{s.fullname} ({s.email})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input value={composeSubject} onChange={(e) => setComposeSubject(e.target.value)} placeholder="Subject" />
            <Textarea value={composeBody} onChange={(e) => setComposeBody(e.target.value)} placeholder="Write your message..." className="min-h-[200px]" />
            <div className="flex justify-between items-center gap-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={e => {
                    if (e.target.files) {
                      setAttachments(Array.from(e.target.files));
                    }
                  }}
                />
                <Button variant="outline" size="sm" asChild>
                  <span><Paperclip className="h-3.5 w-3.5 mr-1" /> Attach</span>
                </Button>
                {attachments.length > 0 && (
                  <span className="ml-2 text-xs text-muted-foreground">{attachments.length} file(s) attached</span>
                )}
              </label>
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
      {/* Search/filter UI */}
      <div className="flex gap-2 mb-2">
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search subject/body..." />
        <Input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter by sender..." />
        <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={unread} onChange={e => setUnread(e.target.checked)} /> Unread
        </label>
        <Button size="sm" onClick={fetchFilteredEmails}>Apply</Button>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="inbox"><Inbox className="h-3.5 w-3.5 mr-1" /> Inbox</TabsTrigger>
          <TabsTrigger value="sent"><Send className="h-3.5 w-3.5 mr-1" /> Sent</TabsTrigger>
          <TabsTrigger value="spam"><AlertTriangle className="h-3.5 w-3.5 mr-1" /> Spam</TabsTrigger>
        </TabsList>
        {["inbox", "sent", "spam"].map((tab) => (
          <TabsContent key={tab} value={tab}>
            <ScrollArea className="h-[400px]">
              {Array.isArray(getEmailsForTab()) && getEmailsForTab().length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">No emails found.</p>
              ) : (
                Array.isArray(getEmailsForTab()) && getEmailsForTab().map((email) => (
                  <button key={email.id} onClick={() => setSelectedEmail(email)} className={`w-full flex items-start gap-3 p-3 text-left border-b hover:bg-muted/50 transition-colors ${!email.read ? "bg-primary/5" : ""}`}>
                    <Mail className={`h-4 w-4 mt-0.5 shrink-0 ${!email.read ? "text-primary" : "text-muted-foreground"}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between">
                        <p className={`text-sm ${!email.read ? "font-semibold" : "text-muted-foreground"}`}>
                          {tab === "sent" ? `To: ${email.toName}` : email.fromName}
                        </p>
                        <span className="text-[10px] text-muted-foreground">{new Date(email.sentAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs">{email.subject}</p>
                      <p className="text-xs text-muted-foreground truncate">{email.body.slice(0, 80)}...</p>
                    </div>
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
