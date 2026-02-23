import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle, BookOpen, Video, Mail, MessageCircle } from "lucide-react";

const faqs = [
  { q: "How do I submit an assignment?", a: "Go to Workspace, select the assignment, write or paste your work, and click 'Turn In'. You can save drafts and revisit later." },
  { q: "How does plagiarism checking work?", a: "Upload your document in Document Analysis. The system scans for similarity against academic databases. Documents with >15% similarity are flagged with specific matched sections." },
  { q: "How do I contact my lecturer?", a: "Use the Inbox feature to compose and send emails directly to your lecturers. All communication is tracked within the platform." },
  { q: "What file formats are supported?", a: "The platform supports PDF, DOCX, TXT, and DOC files for document uploads. Maximum file size is 10MB." },
  { q: "How do I access unit materials?", a: "Go to Dashboard and click on any registered unit to see notes, assignments, and additional learning materials uploaded by your lecturer." },
  { q: "What happens if my plagiarism score is high?", a: "You'll see flagged sections with sources. The system recommends research materials to help you revise. You can redo and resubmit before the deadline." },
];

export const HelpContent = () => (
  <div className="space-y-6 animate-fade-in">
    <div>
      <h1 className="text-xl font-bold flex items-center gap-2">
        <HelpCircle className="h-5 w-5 text-primary" /> Help Center
      </h1>
      <p className="text-sm text-muted-foreground mt-1">Everything you need to know about using EduFlow Connect.</p>
    </div>

    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[
        { icon: BookOpen, title: "User Guide", desc: "Step-by-step guide to all features" },
        { icon: Video, title: "Video Tutorials", desc: "Watch how-to videos" },
        { icon: Mail, title: "Email Support", desc: "Contact our support team" },
        { icon: MessageCircle, title: "Live Chat", desc: "Chat with a support agent" },
      ].map(({ icon: Icon, title, desc }) => (
        <Card key={title} className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all">
          <CardContent className="p-4 text-center">
            <div className="h-10 w-10 mx-auto rounded-lg bg-primary/10 flex items-center justify-center mb-3">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <p className="font-medium text-sm">{title}</p>
            <p className="text-xs text-muted-foreground mt-1">{desc}</p>
          </CardContent>
        </Card>
      ))}
    </div>

    <Card>
      <CardHeader><CardTitle className="text-base">Frequently Asked Questions</CardTitle></CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="text-sm text-left">{faq.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">{faq.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  </div>
);
