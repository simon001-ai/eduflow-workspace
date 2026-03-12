import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LecturerLoginForm } from "@/components/auth/LecturerLoginForm";
//import { LecturerSignupForm } from "@/components/auth/LecturerSignupForm";
import { GraduationCap, ArrowLeft } from "lucide-react";

export const LecturerAuthPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("login");

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Home
        </Button>
        <Card>
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto h-12 w-12 rounded-xl gradient-accent flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <CardTitle>Lecturer Portal</CardTitle>
            <CardDescription>Sign in to manage your courses and students</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="w-full">
                <TabsTrigger value="login" className="flex-1">Sign In</TabsTrigger>
              </TabsList>
              <TabsContent value="login" className="mt-4">
                <LecturerLoginForm onSuccess={() => navigate("/lecturer/dashboard")} />
              </TabsContent>
              
            </Tabs>
          </CardContent>
        </Card>
        <p className="text-xs text-center text-muted-foreground mt-4">
          Demo: Use staff no <strong>STF-001</strong> / password <strong>lecturer123</strong>
        </p>
      </div>
    </div>
  );
};

export default LecturerAuthPage;
