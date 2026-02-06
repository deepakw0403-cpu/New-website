import axios from "axios";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const api = axios.create({
  baseURL: `${API_URL}/api`,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("locofast_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("locofast_token");
      localStorage.removeItem("locofast_admin");
      if (window.location.pathname.startsWith("/admin") && window.location.pathname !== "/admin/login") {
        window.location.href = "/admin/login";
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (email, password) => api.post("/auth/login", { email, password });
export const register = (email, password, name) => api.post("/auth/register", { email, password, name });
export const getMe = () => api.get("/auth/me");

// Categories
export const getCategories = () => api.get("/categories");
export const getCategory = (id) => api.get(`/categories/${id}`);
export const createCategory = (data) => api.post("/categories", data);
export const updateCategory = (id, data) => api.put(`/categories/${id}`, data);
export const deleteCategory = (id) => api.delete(`/categories/${id}`);

// Fabrics
export const getFabrics = (params) => api.get("/fabrics", { params });
export const getFabric = (id) => api.get(`/fabrics/${id}`);
export const createFabric = (data) => api.post("/fabrics", data);
export const updateFabric = (id, data) => api.put(`/fabrics/${id}`, data);
export const deleteFabric = (id) => api.delete(`/fabrics/${id}`);

// Enquiries
export const createEnquiry = (data) => api.post("/enquiries", data);
export const getEnquiries = () => api.get("/enquiries");
export const updateEnquiryStatus = (id, status) => api.put(`/enquiries/${id}/status?status=${status}`);

// Stats
export const getStats = () => api.get("/stats");

// Upload
export const uploadImage = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export default api;
