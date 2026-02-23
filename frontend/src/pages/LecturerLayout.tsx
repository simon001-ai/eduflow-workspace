import { useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { mockUnits } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { GraduationCap, LayoutDashboard, BookOpen, FileText, Mail, LogOut, Menu, X } from "lucide-react";

import { LecturerStats } from "@/components/lecturer/dashboard/LecturerStats";
import { TeachingUnitsList } from "@/components/lecturer/dashboard/TeachingUnitsList";
import { UploadResources } from "@/components/lecturer/resources/UploadResources";
import { SubmissionsByUnit } from "@/components/lecturer/submissions/SubmissionsByUnit";
import { LecturerInboxLayout } from "@/components/lecturer/inbox/LecturerInboxLayout";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/lecturer" },
  { label: "Resources", icon: BookOpen, path: "/lecturer/resources" },
  { label: "Submissions", icon: FileText, path: "/lecturer/submissions" },
  { label: "Inbox", icon: Mail, path: "/lecturer/inbox" },
];

const LecturerDashboard = () => {
  const { lecturer } = useAuth();
  if (!lecturer) return null;
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Welcome, <span className="text-primary">{lecturer.fullName.split(" ").pop()}</span> 👋</h1>
        <p className="text-sm text-muted-foreground mt-1">Here's an overview of your teaching activities.</p>
      </div>
      <LecturerStats />
      <TeachingUnitsList />
    </div>
  );
};

const LecturerResourcesList = () => {
  const { lecturer } = useAuth();
  const navigate = useNavigate();
  if (!lecturer) return null;
  const units = mockUnits.filter((u) => lecturer.teachingUnits.includes(u.id));
  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-xl font-bold flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /> My Resources</h1>
      <p className="text-sm text-muted-foreground">Select a unit to manage its resources.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {units.map((u: any) => (
          <button key={u.id} onClick={() => navigate(`/lecturer/resources/${u.id}`)} className="text-left p-4 rounded-lg border bg-card hover:shadow-md hover:border-primary/30 transition-all">
            <span className="text-xs font-mono text-muted-foreground">{u.code}</span>
            <p className="font-medium text-sm mt-1">{u.name}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export const LecturerLayout = () => {
  const { lecturer, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!lecturer) return null;
  const initials = lecturer.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/lecturer")}>
              <GraduationCap className="h-6 w-6 text-accent" />
              <span className="font-bold text-sm hidden sm:inline">EduFlow Connect</span>
            </div>
          </div>
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map(({ label, icon: Icon, path }) => (
              <Button key={path} variant={location.pathname === path || location.pathname.startsWith(path + "/") ? "secondary" : "ghost"} size="sm" className="gap-1.5 text-xs"
                onClick={() => navigate(path)}>
                <Icon className="h-3.5 w-3.5" /> {label}
              </Button>
            ))}
          </nav>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-accent text-accent-foreground text-[10px] font-bold">{initials}</AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline text-xs">{lecturer.fullName}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="text-xs font-medium">{lecturer.staffNumber}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { logout(); navigate("/"); }} className="text-destructive">
                <LogOut className="h-3.5 w-3.5 mr-2" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
          <Route index element={<LecturerDashboard />} />
          <Route path="resources" element={<LecturerResourcesList />} />
          <Route path="resources/:unitId" element={<UploadResources />} />
          <Route path="submissions" element={<SubmissionsByUnit />} />
          <Route path="inbox" element={<LecturerInboxLayout />} />
        </Routes>
      </main>
    </div>
  );
};

export default LecturerLayout;
