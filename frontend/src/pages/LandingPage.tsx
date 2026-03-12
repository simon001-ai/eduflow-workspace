import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, BookOpen, Shield, Mail, FileText, Users, ArrowRight, CheckCircle } from "lucide-react";

const features = [
  { icon: BookOpen, title: "Unit Resources", desc: "Access notes, assignments, and materials organized by course units." },
  { icon: FileText, title: "Document Analysis", desc: "Check plagiarism levels before submission with detailed reports." },
  { icon: Mail, title: "Secure Messaging", desc: "Built-in email with spam detection and link scanning protection." },
  { icon: Shield, title: "Anti-Spoofing", desc: "Background link scanning to protect against phishing and malicious URLs." },
  { icon: Users, title: "Collaboration", desc: "Seamless communication between students and lecturers." },
  { icon: GraduationCap, title: "Smart Grading", desc: "Lecturers can preview, grade, and provide feedback on submissions." },
];

export const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <header className="gradient-hero text-white">
        <nav className="container mx-auto flex items-center justify-between py-4 px-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-7 w-7" />
            <span className="font-bold text-lg tracking-tight">EduFlow Workspace</span>
          </div>
          <div className="flex gap-2">
            <Button  className="bg-white/20 hover:bg-white/30 text-white border border-white/30"  onClick={() => navigate("/auth/student")}>
              Student Login
            </Button>
            <Button className="bg-white/20 hover:bg-white/30 text-white border border-white/30" onClick={() => navigate("/auth/lecturer")}>
              Lecturer Login
            </Button>
          </div>
        </nav>
        <div className="container mx-auto px-4 py-20 lg:py-32 text-center max-w-3xl">
          <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight mb-6">
            Your Academic Hub,<br />
            <span style={{ color: "hsl(168, 60%, 70%)" }}>Simplified.</span>
          </h1>
          <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
            A seamless platform connecting students and lecturers — manage units, submit assignments, analyze documents, and communicate securely.
          </p>
        </div>
      </header>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Everything You Need</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">Powerful tools designed for modern academic workflows.</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="hover:shadow-lg transition-shadow border-transparent hover:border-primary/20">
              <CardContent className="p-6">
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-3">Ready to Transform Your Academic Experience?</h2>
          <p className="text-muted-foreground mb-6">Join EduFlow Workspace today and streamline your learning journey.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            <span>EduFlow Workspace © 2025</span>
          </div>
          <p>Built for academic excellence</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
