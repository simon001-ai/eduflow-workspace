import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader } from "@/components/common/Loader";
import { toast } from "@/hooks/use-toast";
import io, { Socket } from "socket.io-client";
import { Send, ArrowLeft, Search, Paperclip, ImageIcon, FileIcon, BookOpen, Check, CheckCheck, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

interface Unit {
  id: string;
  code: string;
  name: string;
}

interface Student {
  id: string;
  fullname: string;
  admission_number: string;
  email: string;
}

interface ChatMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  message_type: string;
  file_path?: string;
  file_name?: string;
  is_read: boolean;
  status?: 'sent' | 'delivered' | 'read';
  created_at: string;
  sender_name?: string;
}

export const LecturerChatLayout = () => {
  const { lecturer } = useAuth();
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [deleteOption, setDeleteOption] = useState<'self' | 'everyone'>('self');
  const [deletingMessages, setDeletingMessages] = useState(false);
  const imageInputRef = React.useRef<HTMLInputElement>(null);
  const documentInputRef = React.useRef<HTMLInputElement>(null);

  if (!lecturer) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedStudent) return;
    
    console.log('[Lecturer Chat] Uploading image:', file.name);
    
    try {
      setSendingMessage(true);
      
      // Upload to backend
      const formData = new FormData();
      formData.append('file', file);
      
      const token = localStorage.getItem("token");
      const uploadRes = await fetch('http://localhost:3000/api/chat/upload-image', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (!uploadRes.ok) {
        throw new Error('Image upload failed');
      }
      
      const uploadData = await uploadRes.json();
      const { file_path, file_name, file_size } = uploadData.data;
      
      // Send as message via Socket
      if (socket) {
        socket.emit('chat:message', {
          recipient_id: selectedStudent.id,
          content: file_name,
          message_type: 'image',
          file_path,
          file_name,
          file_size,
        });
      }
      
      toast({ title: "Success", description: "Image sent!" });
    } catch (err) {
      console.error('[Lecturer Chat] Image upload error:', err);
      toast({ title: "Error", description: "Failed to send image", variant: "destructive" });
    } finally {
      setSendingMessage(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedStudent) return;
    
    console.log('[Lecturer Chat] Uploading document:', file.name);
    
    try {
      setSendingMessage(true);
      
      // Upload to backend
      const formData = new FormData();
      formData.append('file', file);
      
      const token = localStorage.getItem("token");
      const uploadRes = await fetch('http://localhost:3000/api/chat/upload-document', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (!uploadRes.ok) {
        throw new Error('Document upload failed');
      }
      
      const uploadData = await uploadRes.json();
      const { file_path, file_name, file_size } = uploadData.data;
      
      // Send as message via Socket
      if (socket) {
        socket.emit('chat:message', {
          recipient_id: selectedStudent.id,
          content: file_name,
          message_type: 'document',
          file_path,
          file_name,
          file_size,
        });
      }
      
      toast({ title: "Success", description: "Document sent!" });
    } catch (err) {
      console.error('[Lecturer Chat] Document upload error:', err);
      toast({ title: "Error", description: "Failed to send document", variant: "destructive" });
    } finally {
      setSendingMessage(false);
      if (documentInputRef.current) documentInputRef.current.value = "";
    }
  };

  // Initialize socket
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const newSocket = io("http://localhost:3000", {
      auth: { token },
      reconnection: true,
    });

    newSocket.on("connect", () => {
      console.log("[Lecturer Chat] Connected to socket");
    });

    // Message received from other user
    newSocket.on("chat:new_message", (message: ChatMessage) => {
      console.log("[Lecturer Chat] New message received:", message);
      setMessages(prev => [...prev, { ...message, status: 'delivered' }]);
    });

    // Own message sent confirmation
    newSocket.on("chat:message_sent", (message: ChatMessage) => {
      console.log("[Lecturer Chat] Message sent (own):", message);
      setMessages(prev => [...prev, { ...message, status: 'sent' }]);
    });

    // Message delivery status update (delivered/read)
    newSocket.on("chat:status_update", (data: { message_id: string; status: 'delivered' | 'read' }) => {
      console.log("[Lecturer Chat] Status update:", data);
      setMessages(prev =>
        prev.map(msg =>
          msg.id === data.message_id ? { ...msg, status: data.status, is_read: data.status === 'read' } : msg
        )
      );
    });

    // Message deleted
    newSocket.on("chat:message_deleted", (data: { message_id: string; deleted_for: string }) => {
      console.log("[Lecturer Chat] Message deleted:", data);
      if (data.deleted_for === 'both' || data.deleted_for === 'sender') {
        setMessages(prev => prev.filter(msg => msg.id !== data.message_id));
      }
    });

    newSocket.on("disconnect", () => {
      console.log("[Lecturer Chat] Disconnected from socket");
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Fetch units when component mounts
  useEffect(() => {
    if (!lecturer) return;

    const token = localStorage.getItem("token");
    setLoadingUnits(true);

    fetch("http://localhost:3000/api/lecturers/submissions", {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    })
      .then(res => res.json())
      .then(result => {
        if (result.success && Array.isArray(result.units)) {
          const unitsData = result.units.map((u: any) => ({
            id: u.unit_id,
            code: u.code,
            name: u.name,
          }));
          setUnits(unitsData);
        }
      })
      .catch(err => {
        console.error("[Lecturer Chat] Error fetching units:", err);
        toast({ title: "Error", description: "Failed to load units", variant: "destructive" });
      })
      .finally(() => setLoadingUnits(false));
  }, [lecturer]);

  // Fetch students when unit is selected
  useEffect(() => {
    if (!selectedUnit) return;

    const token = localStorage.getItem("token");
    setLoadingStudents(true);

    fetch(`http://localhost:3000/api/chat/lecturer/unit/${selectedUnit.id}/students`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    })
      .then(res => res.json())
      .then(result => {
        if (result.success && Array.isArray(result.data)) {
          setStudents(result.data);
          setFilteredStudents(result.data);
        }
      })
      .catch(err => {
        console.error("[Lecturer Chat] Error fetching students:", err);
        toast({ title: "Error", description: "Failed to load students", variant: "destructive" });
      })
      .finally(() => setLoadingStudents(false));
  }, [selectedUnit]);

  // Filter students based on search
  useEffect(() => {
    if (!searchQuery) {
      setFilteredStudents(students);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredStudents(
        students.filter(s =>
          s.fullname.toLowerCase().includes(query) ||
          s.admission_number.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, students]);

  // Fetch chat room when student is selected
  useEffect(() => {
    if (!selectedStudent) return;

    const token = localStorage.getItem("token");
    setLoadingMessages(true);

    fetch(`http://localhost:3000/api/chat/room/${selectedStudent.id}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    })
      .then(res => res.json())
      .then(result => {
        if (result.success && Array.isArray(result.data)) {
          setMessages(result.data);
          // Join room with socket
          socket?.emit("chat:join_room", { other_user_id: selectedStudent.id });
          // Mark messages as read
          socket?.emit("chat:mark_read", { other_user_id: selectedStudent.id });
        }
      })
      .catch(err => {
        console.error("[Lecturer Chat] Error fetching chat room:", err);
        toast({ title: "Error", description: "Failed to load messages", variant: "destructive" });
      })
      .finally(() => setLoadingMessages(false));
  }, [selectedStudent, socket]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedStudent || !socket) return;

    setSendingMessage(true);
    try {
      // Send via socket only (backend saves to DB)
      socket.emit("chat:message", {
        recipient_id: selectedStudent.id,
        content: messageInput,
        message_type: "text",
      });

      setMessageInput("");
    } catch (error) {
      console.error("[Lecturer Chat] Error sending message:", error);
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
    } finally {
      setSendingMessage(false);
    }
  };

  const toggleMessageSelection = (messageId: string) => {
    const newSelected = new Set(selectedMessages);
    if (newSelected.has(messageId)) {
      newSelected.delete(messageId);
    } else {
      newSelected.add(messageId);
    }
    setSelectedMessages(newSelected);
  };

  const handleDeleteMessages = () => {
    if (selectedMessages.size === 0) {
      toast({ title: "Error", description: "No messages selected", variant: "destructive" });
      return;
    }
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setDeletingMessages(true);
      const token = localStorage.getItem("token");

      // Delete each selected message
      for (const messageId of selectedMessages) {
        const response = await fetch(`http://localhost:3000/api/chat/message/${messageId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ deletion_type: deleteOption }),
        });

        if (!response.ok) {
          throw new Error('Failed to delete message');
        }

        // Emit via socket for real-time update
        socket?.emit('chat:delete_message', {
          message_id: messageId,
          deletion_type: deleteOption,
        });
      }

      // Local state update for immediate feedback
      setMessages(prev => prev.filter(msg => !selectedMessages.has(msg.id)));
      setSelectedMessages(new Set());
      setDeleteMode(false);
      setShowDeleteDialog(false);

      const deletedCount = selectedMessages.size;
      toast({
        title: "Success",
        description: `Deleted ${deletedCount} message${deletedCount > 1 ? 's' : ''} ${deleteOption === 'everyone' ? 'for everyone' : 'for you'}`,
      });
    } catch (error) {
      console.error("[Lecturer Chat] Error deleting messages:", error);
      toast({ title: "Error", description: "Failed to delete messages", variant: "destructive" });
    } finally {
      setDeletingMessages(false);
    }
  };

  // Step 3: Chat with selected student
  if (selectedStudent) {
    return (
      <div className="flex flex-col h-screen bg-background">
        {/* Header */}
        <div className="border-b p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setSelectedStudent(null)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="font-semibold">{selectedStudent.fullname}</h2>
              <p className="text-xs text-muted-foreground">{selectedStudent.admission_number}</p>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loadingMessages ? (
            <Loader />
          ) : messages.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No messages yet. Start the conversation!</p>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.sender_id === lecturer?.id;
              const isSelected = selectedMessages.has(msg.id);
              return (
                <div 
                  key={msg.id} 
                  className={`flex gap-2 ${isOwn ? "justify-end" : "justify-start"}`}
                  onClick={() => deleteMode && isOwn && toggleMessageSelection(msg.id)}
                >
                  {deleteMode && isOwn && (
                    <div className="flex items-center mt-1">
                      <Checkbox
                        checked={isSelected}
                        onChange={(checked) => {
                          if (checked) {
                            setSelectedMessages(prev => new Set([...prev, msg.id]));
                          } else {
                            setSelectedMessages(prev => {
                              const next = new Set(prev);
                              next.delete(msg.id);
                              return next;
                            });
                          }
                        }}
                      />
                    </div>
                  )}
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg cursor-pointer transition-all ${
                      isOwn
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    } ${isSelected ? 'ring-2 ring-offset-2' : ''}`}
                  >
                    {msg.message_type === "text" ? (
                      <p className="text-sm">{msg.content}</p>
                    ) : msg.message_type === "image" ? (
                      <img src={`http://localhost:3000/uploads/${msg.file_path}`} alt="Chat image" className="max-w-xs rounded" />
                    ) : (
                      <a href={`http://localhost:3000/uploads/${msg.file_path}`} className="text-sm underline flex items-center gap-1">
                        <FileIcon className="h-3 w-3" /> {msg.file_name}
                      </a>
                    )}
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <p className="text-xs opacity-70">
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </p>
                      {isOwn && (
                        <div>
                          {msg.status === 'sent' && (
                            <Check className="h-3.5 w-3.5 opacity-70" />
                          )}
                          {msg.status === 'delivered' && (
                            <CheckCheck className="h-3.5 w-3.5 opacity-70" />
                          )}
                          {msg.status === 'read' && (
                            <CheckCheck className="h-3.5 w-3.5 text-blue-400" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input Area */}
        <div className="border-t p-4 space-y-3">
          <div className="flex gap-2">
            <Textarea
              placeholder="Type your message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              rows={3}
              className="resize-none"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!messageInput.trim() || sendingMessage}
              size="icon"
              className="mt-auto"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant={deleteMode ? "destructive" : "outline"}
              size="sm"
              onClick={() => {
                setDeleteMode(!deleteMode);
                setSelectedMessages(new Set());
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleteMode ? "Cancel" : "Delete"}
            </Button>
            {deleteMode && selectedMessages.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteMessages}
              >
                Delete ({selectedMessages.size})
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => imageInputRef.current?.click()}
              disabled={deleteMode}
            >
              <ImageIcon className="h-4 w-4 mr-2" /> Image
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => documentInputRef.current?.click()}
              disabled={deleteMode}
            >
              <Paperclip className="h-4 w-4 mr-2" /> Document
            </Button>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <input
              ref={documentInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,.xlsx,.pptx"
              onChange={handleDocumentUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Message{selectedMessages.size > 1 ? "s" : ""}</DialogTitle>
              <DialogDescription>
                Choose how you want to delete {selectedMessages.size} message{selectedMessages.size > 1 ? "s" : ""}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="delete-self"
                  name="delete-option"
                  value="self"
                  checked={deleteOption === "self"}
                  onChange={() => setDeleteOption("self")}
                  className="w-4 h-4"
                />
                <label htmlFor="delete-self" className="cursor-pointer">
                  <div className="font-medium">Delete for you</div>
                  <p className="text-xs text-muted-foreground">You won't see these messages, but the recipient will</p>
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="delete-everyone"
                  name="delete-option"
                  value="everyone"
                  checked={deleteOption === "everyone"}
                  onChange={() => setDeleteOption("everyone")}
                  className="w-4 h-4"
                />
                <label htmlFor="delete-everyone" className="cursor-pointer">
                  <div className="font-medium">Delete for everyone</div>
                  <p className="text-xs text-muted-foreground">Both you and the recipient will no longer see these messages</p>
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={deletingMessages}
              >
                {deletingMessages ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Step 2: Select a student from unit
  if (selectedUnit) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelectedUnit(null)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-xl font-bold">{selectedUnit.code} — {selectedUnit.name}</h2>
            <p className="text-sm text-muted-foreground">Select a student to message</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or admission number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Students List */}
        {loadingStudents ? (
          <Loader />
        ) : filteredStudents.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground py-8">No students found.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {filteredStudents.map((student) => (
              <Card
                key={student.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedStudent(student)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{student.fullname}</p>
                    <p className="text-sm text-muted-foreground">{student.admission_number}</p>
                  </div>
                  <Button variant="ghost" size="sm">Chat</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Step 1: Select a unit
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Chat</h1>
        <p className="text-sm text-muted-foreground mt-1">Message your students</p>
      </div>

      {loadingUnits ? (
        <Loader />
      ) : units.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground py-8">No units assigned yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {units.map((unit) => (
            <Card
              key={unit.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedUnit(unit)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mt-1">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{unit.code}</p>
                    <p className="text-xs text-muted-foreground">{unit.name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
