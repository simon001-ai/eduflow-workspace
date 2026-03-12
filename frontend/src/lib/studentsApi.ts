import axios from "axios";

export const fetchStudents = async () => {
  const res = await axios.get("/api/students");
  return res.data.data;
};
