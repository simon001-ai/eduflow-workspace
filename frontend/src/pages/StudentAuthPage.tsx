import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { StudentLoginForm } from "@/components/auth/StudentLoginForm";
//import { StudentSignupForm } from "@/components/auth/StudentSignupForm";
import { GraduationCap, ArrowLeft } from "lucide-react";

export const StudentAuthPage = () => {
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
            <div className="mx-auto h-12 w-12 rounded-xl gradient-primary flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <CardTitle>Student Portal</CardTitle>
            <CardDescription>Sign in to access your courses and resources</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="w-full">
                <TabsTrigger value="login" className="flex-1">Sign In</TabsTrigger>
              </TabsList>
              <TabsContent value="login" className="mt-4">
                <StudentLoginForm onSuccess={() => navigate("/student/dashboard")} />
              </TabsContent>
              
            </Tabs>
          </CardContent>
        </Card>
        <p className="text-xs text-center text-muted-foreground mt-4">
          Demo: Use admission <strong>SCT221-0001/2022</strong> / password <strong>student123</strong>
        </p>
      </div>
    </div>
  );
};

export default StudentAuthPage;
