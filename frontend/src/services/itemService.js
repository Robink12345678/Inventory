import { get, post, put, del, uploadFile } from "./api";

export const getItems = (params) => get("/items", params);
export const createItem = (data) => post("/items", data);
export const updateItem = (id, data) => put(`/items/${id}`, data);
export const deleteItem = (id) => del(`/items/${id}`);
export const uploadItems = (file, onUploadProgress) =>
  uploadFile("/upload/items", file, onUploadProgress);
export const loadTestData = () => post("/dev/test-data");
