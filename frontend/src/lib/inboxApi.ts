import axios from "axios";

// Helper to get auth header
function getAuthHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const fetchInbox = async (params = {}) => {
  const res = await axios.get("http://localhost:3000/api/inbox", {
    params,
    headers: {
      ...getAuthHeader(),
    },
  });
  return res.data.data;
};

export const fetchSent = async (params = {}) => {
  const res = await axios.get("http://localhost:3000/api/inbox/sent", {
    params,
    headers: {
      ...getAuthHeader(),
    },
  });
  return res.data.data;
};

export const fetchSpam = async (params = {}) => {
  const res = await axios.get("http://localhost:3000/api/inbox/spam", {
    params,
    headers: {
      ...getAuthHeader(),
    },
  });
  return res.data.data;
};

export const sendInboxEmail = async (
  to: string,
  subject: string,
  body: string,
  html?: string,
  attachments?: File[]
) => {
  const formData = new FormData();
  formData.append("to", to);
  formData.append("subject", subject);
  formData.append("body", body);
  if (html) formData.append("html", html);
  if (attachments && attachments.length) {
    attachments.forEach((file) => {
      formData.append("attachments", file);
    });
  }
  const res = await axios.post("http://localhost:3000/api/inbox/send", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      ...getAuthHeader(),
    },
  });
  return res.data;
};
