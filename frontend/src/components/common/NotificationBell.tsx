import React, { useState } from "react";
import { Bell, AlertCircle } from "lucide-react";
import { Notification } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, BookOpen, GraduationCap, Mail } from "lucide-react";

const iconMap: Record<string, any> = {
  note: FileText,
  assignment: BookOpen,
  grade: GraduationCap,
  message: Mail,
};

export const NotificationBell = ({ notifications }: { notifications: Notification[] }) => {
  const [items, setItems] = useState(notifications);
  React.useEffect(() => {
    setItems(notifications);
    console.log("[NotificationBell] notifications prop:", notifications);
  }, [notifications]);
  const unreadCount = items.filter((n) => !n.read).length;

  const markRead = (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  console.log("[NotificationBell] items state:", items);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b">
          <h4 className="font-semibold text-sm">Notifications</h4>
        </div>
        <ScrollArea className="h-72">
          {items.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground text-center">No notifications</p>
          ) : (
            items.map((n) => {
              const Icon = iconMap[n.type] || AlertCircle;
              return (
                <button
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`w-full flex gap-3 p-3 text-left hover:bg-muted/50 border-b last:border-0 transition-colors ${!n.read ? "bg-primary/5" : ""}`}
                >
                  <Icon className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className={`text-xs font-medium ${!n.read ? "text-foreground" : "text-muted-foreground"}`}>{n.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleDateString()}</p>
                  </div>
                  {!n.read && <Badge variant="secondary" className="h-2 w-2 p-0 rounded-full bg-primary shrink-0 mt-1" />}
                </button>
              );
            })
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
