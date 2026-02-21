import { useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { mockUnits, getLecturerById } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { GraduationCap, LayoutDashboard, BookOpen, FileText, PenTool, Mail, HelpCircle, LogOut, Menu, X } from "lucide-react";

import { StudentDashboardHeader } from "@/components/student/dashboard/StudentDashboardHeader";
import { RegisteredUnitsList } from "@/components/student/dashboard/RegisteredUnitsList";
import { UnitDetails } from "@/components/student/resources/UnitDetails";
import { UploadDocument } from "@/components/student/document-analysis/UploadDocument";
import { AssignmentEditor } from "@/components/student/workspace/AssignmentEditor";
import { InboxLayout } from "@/components/student/inbox/InboxLayout";
import { HelpContent } from "@/components/student/help/HelpContent";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/student" },
  { label: "Resources", icon: BookOpen, path: "/student/resources" },
  { label: "Document Analysis", icon: FileText, path: "/student/document-analysis" },
  { label: "Workspace", icon: PenTool, path: "/student/workspace" },
  { label: "Inbox", icon: Mail, path: "/student/inbox" },
  { label: "Help", icon: HelpCircle, path: "/student/help" },
];

const StudentDashboard = () => (
  <div className="space-y-6">
    <StudentDashboardHeader />
    <RegisteredUnitsList />
  </div>
);

const StudentResources = () => {
  const { student } = useAuth();
  const navigate = useNavigate();
  if (!student) return null;
  const units = mockUnits.filter((u) => student.registeredUnits.includes(u.id));
  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-xl font-bold flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /> Resources</h1>
      <p className="text-sm text-muted-foreground">Select a unit to view its resources.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {units.map((u: any) => {
          const lec = getLecturerById(u.lecturerId);
          return (
            <button key={u.id} onClick={() => navigate(`/student/unit/${u.id}`)} className="text-left p-4 rounded-lg border bg-card hover:shadow-md hover:border-primary/30 transition-all">
              <span className="text-xs font-mono text-muted-foreground">{u.code}</span>
              <p className="font-medium text-sm mt-1">{u.name}</p>
              {lec && <p className="text-xs text-muted-foreground mt-1">{lec.fullName}</p>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const StudentLayout = () => {
  const { student, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!student) return null;
  const initials = student.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2);

  return (
    <div className="min-h-screen bg-background">
      {/* Top Nav */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/student")}>
              <GraduationCap className="h-6 w-6 text-primary" />
              <span className="font-bold text-sm hidden sm:inline">EduFlow Connect</span>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map(({ label, icon: Icon, path }) => (
              <Button
                key={path}
                variant={location.pathname === path ? "secondary" : "ghost"}
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => navigate(path)}
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </Button>
            ))}
          </nav>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-bold">{initials}</AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline text-xs">{student.fullName}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="text-xs font-medium">{student.admissionNumber}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { logout(); navigate("/"); }} className="text-destructive">
                <LogOut className="h-3.5 w-3.5 mr-2" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t bg-card p-2">
            {navItems.map(({ label, icon: Icon, path }) => (
              <Button key={path} variant={location.pathname === path ? "secondary" : "ghost"} size="sm" className="w-full justify-start gap-2 mb-1"
                onClick={() => { navigate(path); setMobileMenuOpen(false); }}>
                <Icon className="h-4 w-4" /> {label}
              </Button>
            ))}
          </div>
        )}
      </header>

      <main className="container mx-auto px-4 py-6 max-w-5xl">
        <Routes>
          <Route index element={<StudentDashboard />} />
          <Route path="resources" element={<StudentResources />} />
          <Route path="unit/:unitId" element={<UnitDetails />} />
          <Route path="document-analysis" element={<UploadDocument />} />
          <Route path="workspace" element={<AssignmentEditor />} />
          <Route path="inbox" element={<InboxLayout />} />
          <Route path="help" element={<HelpContent />} />
        </Routes>
      </main>
    </div>
  );
};

export default StudentLayout;
