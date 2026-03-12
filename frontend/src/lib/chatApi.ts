import axios from "axios";

const API_URL = "http://localhost:3000/api";

// Get lecturers for a student
export const getStudentLecturers = async (studentId: string) => {
  const response = await axios.get(`${API_URL}/chat/student/lecturers/${studentId}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  return response.data;
};

// Get students in a unit for lecturer
export const getUnitStudents = async (unitId: string) => {
  const response = await axios.get(`${API_URL}/chat/lecturer/unit/${unitId}/students`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  return response.data;
};

// Get chat room (messages between two users)
export const getChatRoom = async (otherId: string) => {
  const response = await axios.get(`${API_URL}/chat/room/${otherId}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  return response.data;
};

// Get all conversations
export const getConversations = async () => {
  const response = await axios.get(`${API_URL}/chat/conversations`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  return response.data;
};

// Send a message
export const sendMessage = async (recipientId: string, recipientRole: string, content: string, messageType = "text") => {
  const response = await axios.post(
    `${API_URL}/chat/message`,
    {
      recipient_id: recipientId,
      recipient_role: recipientRole,
      content,
      message_type: messageType,
    },
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    }
  );
  return response.data;
};

// Get unread message count
export const getUnreadCount = async () => {
  const response = await axios.get(`${API_URL}/chat/unread-count`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  return response.data;
};
