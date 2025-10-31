import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const handleRequest = async (request) => {
  try {
    const response = await request;
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    console.error("API Error:", errorMessage);
    throw new Error(errorMessage);
  }
};

export const get = (url, params) => handleRequest(api.get(url, { params }));
export const post = (url, data) => handleRequest(api.post(url, data));
export const put = (url, data) => handleRequest(api.put(url, data));
export const del = (url) => handleRequest(api.delete(url));

export const uploadFile = (url, file, onUploadProgress) => {
  const formData = new FormData();
  formData.append("excelFile", file);

  return handleRequest(
    api.post(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress,
    })
  );
};

export default api;
