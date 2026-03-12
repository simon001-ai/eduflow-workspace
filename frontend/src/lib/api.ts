import axios from "axios";

const API_BASE = "http://localhost:3000/api";

export const fetchUnits = async (teachingUnits: string[]) => {
  const token = localStorage.getItem("token");
  const response = await axios.get(`${API_BASE}/lecturers/units`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return Array.isArray(response.data.units) ? response.data.units : [];
};

export const fetchSubmissions = async () => {
  const token = localStorage.getItem("token");
  const response = await axios.get(`${API_BASE}/lecturers/submissions`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  // Backend returns { success, units }
  return Array.isArray(response.data.units) ? response.data.units : [];
};

export const getSubmissionDetails = async (submissionId: string) => {
  const token = localStorage.getItem("token");
  const response = await axios.get(`${API_BASE}/submissions/${submissionId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data.data;
};

export const gradeSubmission = async (submissionId: string, grade: number, feedback: string) => {
  const token = localStorage.getItem("token");
  const response = await axios.post(`${API_BASE}/submissions/${submissionId}/grade`, 
    { grade, feedback },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const fetchAssignmentDetails = async (assignmentId: string) => {
  const token = localStorage.getItem("token");
  const response = await axios.get(`${API_BASE}/assignments/${assignmentId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};