import { io } from 'socket.io-client';

// Replace with your valid JWT token
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic3R1ZGVudCIsInN0dWRlbnRfaWQiOiI4MjBmYTJkMi0xY2YyLTQyZjMtYWM2YS0yN2E0NDE4ZjlmOTUiLCJzdWIiOiI4MjBmYTJkMi0xY2YyLTQyZjMtYWM2YS0yN2E0NDE4ZjlmOTUiLCJpYXQiOjE3NzE5MTk5MDksImV4cCI6MTc3MTkyMDUxM30.GRENrsi-tHj_8e4XVtCNK2DlrcRm5xREolLqR92rIjM'; // Paste your token here

const socket = io('http://localhost:3000', {
  auth: { token }
});

socket.on('connect', () => {
  console.log('Socket connected:', socket.id);
});

socket.on('new_resource', data => {
  console.log('Resource:', data);
});

socket.on('new_submission', data => {
  console.log('Submission:', data);
});

socket.on('plagiarism_complete', data => {
  console.log('Plagiarism:', data);
});

socket.on('disconnect', reason => {
  console.log('Socket disconnected:', reason);
});

socket.on('connect_error', err => {
  console.error('Socket error:', err.message);
});