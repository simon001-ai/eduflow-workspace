// ============ TYPES ============
export interface Student {
  id: string;
  fullname: string;
  admissionNumber: string;
  email: string;
  password: string;
  registeredUnits: string[];
}

export interface Lecturer {
  id: string;
  full_name: string;
  email: string;
  staffNumber: string;
  password: string;
  teachingUnits: string[];
}

export interface Unit {
  id: string;
  code: string;
  name: string;
  lecturerId: string;
  semester: string;
}

export interface Note {
  id: string;
  unitId: string;
  title: string;
  description: string;
  fileUrl: string;
  uploadedAt: string;
  lecturerId: string;
}

export interface Assignment {
  id: string;
  unitId: string;
  title: string;
  description: string;
  dueDate: string;
  totalMarks: number;
  createdAt: string;
  lecturerId: string;
}

export interface AdditionalMaterial {
  id: string;
  unitId: string;
  title: string;
  type: "pdf" | "video" | "link" | "article";
  url: string;
  uploadedAt: string;
  lecturerId: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  unitId: string;
  fileUrl: string;
  submittedAt: string;
  plagiarismScore: number;
  grade?: number;
  feedback?: string;
  status: "submitted" | "graded" | "returned";
}

export interface Draft {
  id: string;
  studentId: string;
  assignmentId: string;
  content: string;
  lastSaved: string;
}

export interface Email {
  id: string;
  from: string;
  fromName: string;
  to: string;
  toName: string;
  subject: string;
  body: string;
  sentAt: string;
  read: boolean;
  isSpam: boolean;
  attachments?: { name: string; url: string }[];
  folder: "inbox" | "sent" | "spam";
}

export interface Notification {
  id: string;
  type: "note" | "assignment" | "grade" | "message";
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  unitId?: string;
}

// ============ MOCK DATA ============

export const mockStudents: Student[] = [
  {
    id: "s1",
    fullname: "James Mwangi",
    admissionNumber: "SCT221-0001/2022",
    email: "james.mwangi@student.edu",
    password: "student123",
    registeredUnits: ["u1", "u2", "u3", "u4"],
  },
  {
    id: "s2",
    fullname: "Grace Wanjiku",
    admissionNumber: "SCT221-0002/2022",
    email: "grace.wanjiku@student.edu",
    password: "student123",
    registeredUnits: ["u1", "u2", "u5"],
  },
];

export const mockLecturers: Lecturer[] = [
  {
    id: "l1",
    full_name: "Dr. Peter Odhiambo",
    email: "p.odhiambo@university.ac.ke",
    staffNumber: "STF-001",
    password: "lecturer123",
    teachingUnits: ["u1", "u3"],
  },
  {
    id: "l2",
    full_name: "Prof. Sarah Kimani",
    email: "s.kimani@university.ac.ke",
    staffNumber: "STF-002",
    password: "lecturer123",
    teachingUnits: ["u2", "u4", "u5"],
  },
];

export const mockUnits: Unit[] = [
  { id: "u1", code: "CS301", name: "Data Structures & Algorithms", lecturerId: "l1", semester: "2024/2025 Sem 1" },
  { id: "u2", code: "CS302", name: "Database Management Systems", lecturerId: "l2", semester: "2024/2025 Sem 1" },
  { id: "u3", code: "CS303", name: "Computer Networks", lecturerId: "l1", semester: "2024/2025 Sem 1" },
  { id: "u4", code: "CS304", name: "Software Engineering", lecturerId: "l2", semester: "2024/2025 Sem 1" },
  { id: "u5", code: "CS305", name: "Operating Systems", lecturerId: "l2", semester: "2024/2025 Sem 1" },
];

export const mockNotes: Note[] = [
  { id: "n1", unitId: "u1", title: "Introduction to Data Structures", description: "Overview of arrays, linked lists, stacks and queues.", fileUrl: "#", uploadedAt: "2025-01-15T10:00:00Z", lecturerId: "l1" },
  { id: "n2", unitId: "u1", title: "Trees and Graphs", description: "Binary trees, BST, graph representations and traversals.", fileUrl: "#", uploadedAt: "2025-01-22T10:00:00Z", lecturerId: "l1" },
  { id: "n3", unitId: "u2", title: "SQL Fundamentals", description: "SELECT, INSERT, UPDATE, DELETE and JOIN operations.", fileUrl: "#", uploadedAt: "2025-01-14T09:00:00Z", lecturerId: "l2" },
  { id: "n4", unitId: "u2", title: "Normalization", description: "1NF, 2NF, 3NF and BCNF with practical examples.", fileUrl: "#", uploadedAt: "2025-01-21T09:00:00Z", lecturerId: "l2" },
  { id: "n5", unitId: "u3", title: "OSI Model", description: "All 7 layers of the OSI model explained.", fileUrl: "#", uploadedAt: "2025-01-16T11:00:00Z", lecturerId: "l1" },
  { id: "n6", unitId: "u4", title: "Agile Methodology", description: "Scrum, Kanban and XP methodologies.", fileUrl: "#", uploadedAt: "2025-01-18T14:00:00Z", lecturerId: "l2" },
];

export const mockAssignments: Assignment[] = [
  { id: "a1", unitId: "u1", title: "Assignment 1: Sorting Algorithms", description: "Implement quicksort, mergesort and heapsort. Compare their time complexities.", dueDate: "2025-03-01T23:59:00Z", totalMarks: 20, createdAt: "2025-02-01T10:00:00Z", lecturerId: "l1" },
  { id: "a2", unitId: "u2", title: "CAT 1: ER Diagrams", description: "Design an ER diagram for a library management system.", dueDate: "2025-02-20T23:59:00Z", totalMarks: 15, createdAt: "2025-02-05T09:00:00Z", lecturerId: "l2" },
  { id: "a3", unitId: "u1", title: "CAT 2: Graph Traversals", description: "Implement BFS and DFS. Solve shortest path problems.", dueDate: "2025-03-15T23:59:00Z", totalMarks: 15, createdAt: "2025-02-15T10:00:00Z", lecturerId: "l1" },
  { id: "a4", unitId: "u3", title: "Assignment 1: Network Protocols", description: "Compare TCP and UDP protocols with practical examples.", dueDate: "2025-03-10T23:59:00Z", totalMarks: 20, createdAt: "2025-02-10T11:00:00Z", lecturerId: "l1" },
];

export const mockMaterials: AdditionalMaterial[] = [
  { id: "m1", unitId: "u1", title: "Visualizing Data Structures", type: "link", url: "https://visualgo.net", uploadedAt: "2025-01-20T10:00:00Z", lecturerId: "l1" },
  { id: "m2", unitId: "u1", title: "CLRS Textbook Chapter 1-5", type: "pdf", url: "#", uploadedAt: "2025-01-15T10:00:00Z", lecturerId: "l1" },
  { id: "m3", unitId: "u2", title: "Database Design Tutorial", type: "video", url: "#", uploadedAt: "2025-01-18T09:00:00Z", lecturerId: "l2" },
  { id: "m4", unitId: "u3", title: "Wireshark Lab Guide", type: "pdf", url: "#", uploadedAt: "2025-01-22T11:00:00Z", lecturerId: "l1" },
];

export const mockSubmissions: Submission[] = [
  { id: "sub1", assignmentId: "a1", studentId: "s1", unitId: "u1", fileUrl: "#", submittedAt: "2025-02-28T20:30:00Z", plagiarismScore: 8, grade: 17, feedback: "Excellent work on the sorting algorithms!", status: "graded" },
  { id: "sub2", assignmentId: "a2", studentId: "s1", unitId: "u2", fileUrl: "#", submittedAt: "2025-02-19T18:00:00Z", plagiarismScore: 12, status: "submitted" },
  { id: "sub3", assignmentId: "a1", studentId: "s2", unitId: "u1", fileUrl: "#", submittedAt: "2025-02-27T22:00:00Z", plagiarismScore: 22, status: "submitted" },
  { id: "sub4", assignmentId: "a2", studentId: "s2", unitId: "u2", fileUrl: "#", submittedAt: "2025-02-18T15:00:00Z", plagiarismScore: 5, grade: 14, feedback: "Good ER diagram but missing some relationships.", status: "graded" },
];

export const mockDrafts: Draft[] = [
  { id: "d1", studentId: "s1", assignmentId: "a3", content: "# Graph Traversals\n\n## BFS Implementation\n\nBreadth-First Search uses a queue to explore nodes level by level...\n\n```python\ndef bfs(graph, start):\n    visited = set()\n    queue = [start]\n    ...\n```\n\n## DFS Implementation\n\nDepth-First Search uses a stack (or recursion)...", lastSaved: "2025-02-20T14:30:00Z" },
];

export const mockEmails: Email[] = [
  { id: "e1", from: "l1", fromName: "Dr. Peter Odhiambo", to: "s1", toName: "James Mwangi", subject: "Assignment 1 Feedback", body: "Dear James,\n\nGreat work on the sorting algorithms assignment. Your implementation of quicksort was particularly well done.\n\nKeep up the good work!\n\nBest regards,\nDr. Odhiambo", sentAt: "2025-02-28T21:00:00Z", read: true, isSpam: false, folder: "inbox" },
  { id: "e2", from: "l2", fromName: "Prof. Sarah Kimani", to: "s1", toName: "James Mwangi", subject: "CAT 1 Deadline Extension", body: "Dear Students,\n\nThe deadline for CAT 1 on ER Diagrams has been extended by 2 days. New deadline: Feb 22, 2025.\n\nRegards,\nProf. Kimani", sentAt: "2025-02-18T08:00:00Z", read: false, isSpam: false, folder: "inbox" },
  { id: "e3", from: "s1", fromName: "James Mwangi", to: "l1", toName: "Dr. Peter Odhiambo", subject: "Question about Assignment 1", body: "Dear Dr. Odhiambo,\n\nI have a question about the heapsort implementation. Should we implement both min-heap and max-heap?\n\nThank you,\nJames", sentAt: "2025-02-25T16:00:00Z", read: true, isSpam: false, folder: "sent" },
  { id: "e4", from: "unknown@spam.com", fromName: "Prize Winner!", to: "s1", toName: "James Mwangi", subject: "You won $1,000,000!!!", body: "Click here to claim your prize: http://t0tally-legit-n0t-scam.com/claim", sentAt: "2025-02-20T03:00:00Z", read: false, isSpam: true, folder: "spam" },
  { id: "e5", from: "s1", fromName: "James Mwangi", to: "l2", toName: "Prof. Sarah Kimani", subject: "RE: CAT 1 Deadline Extension", body: "Dear Prof. Kimani,\n\nThank you for the extension. I will submit by the new deadline.\n\nRegards,\nJames", sentAt: "2025-02-18T10:00:00Z", read: true, isSpam: false, folder: "sent" },
];

export const mockNotifications: Notification[] = [
  { id: "not1", type: "note", title: "New Notes Uploaded", message: "Dr. Odhiambo uploaded 'Trees and Graphs' for CS301", createdAt: "2025-01-22T10:00:00Z", read: false, unitId: "u1" },
  { id: "not2", type: "assignment", title: "New Assignment Posted", message: "CAT 2: Graph Traversals due March 15, 2025", createdAt: "2025-02-15T10:00:00Z", read: false, unitId: "u1" },
  { id: "not3", type: "grade", title: "Assignment Graded", message: "Your Assignment 1 for CS301 has been graded: 17/20", createdAt: "2025-02-28T21:00:00Z", read: true, unitId: "u1" },
  { id: "not4", type: "assignment", title: "New Assignment Posted", message: "Assignment 1: Network Protocols due March 10, 2025", createdAt: "2025-02-10T11:00:00Z", read: true, unitId: "u3" },
];

// ============ HELPERS ============
export const getUnitById = (id: string) => mockUnits.find((u) => u.id === id);
export const getLecturerById = (id: string) => mockLecturers.find((l) => l.id === id);
export const getStudentById = (id: string) => mockStudents.find((s) => s.id === id);
export const getNotesByUnit = (unitId: string) => mockNotes.filter((n) => n.unitId === unitId);
export const getAssignmentsByUnit = (unitId: string) => mockAssignments.filter((a) => a.unitId === unitId);
export const getMaterialsByUnit = (unitId: string) => mockMaterials.filter((m) => m.unitId === unitId);
export const getSubmissionsByUnit = (unitId: string) => mockSubmissions.filter((s) => s.unitId === unitId);
export const getSubmissionsByStudent = (studentId: string) => mockSubmissions.filter((s) => s.studentId === studentId);
export const getEmailsForUser = (userId: string, folder: string) => mockEmails.filter((e) => {
  if (folder === "inbox") return e.to === userId && e.folder === "inbox";
  if (folder === "sent") return e.from === userId && e.folder === "sent";
  if (folder === "spam") return e.to === userId && e.folder === "spam";
  return false;
});
export const getNotificationsForStudent = (studentId: string) => {
  const student = getStudentById(studentId);
  if (!student) return [];
  return mockNotifications.filter((n) => !n.unitId || student.registeredUnits.includes(n.unitId));
};
