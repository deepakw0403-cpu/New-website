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

// Sellers
export const getSellers = (includeInactive = false) => api.get("/sellers", { params: { include_inactive: includeInactive } });
export const getSeller = (id) => api.get(`/sellers/${id}`);
export const createSeller = (data) => api.post("/sellers", data);
export const updateSeller = (id, data) => api.put(`/sellers/${id}`, data);
export const deleteSeller = (id) => api.delete(`/sellers/${id}`);

// Fabrics
export const getFabrics = (params) => api.get("/fabrics", { params });
export const getFabricsCount = (params) => api.get("/fabrics/count", { params });
export const getFabric = (id) => api.get(`/fabrics/${id}`);
export const createFabric = (data) => api.post("/fabrics", data);
export const updateFabric = (id, data) => api.put(`/fabrics/${id}`, data);
export const deleteFabric = (id) => api.delete(`/fabrics/${id}`);

// Articles (Color Variant Grouping)
export const getArticles = (params) => api.get("/articles", { params });
export const getArticle = (id) => api.get(`/articles/${id}`);
export const getArticleVariants = (id) => api.get(`/articles/${id}/variants`);
export const createArticle = (data) => api.post("/articles", data);
export const updateArticle = (id, data) => api.put(`/articles/${id}`, data);
export const deleteArticle = (id) => api.delete(`/articles/${id}`);

// Enquiries
export const createEnquiry = (data) => api.post("/enquiries", data);
export const getEnquiries = () => api.get("/enquiries");
export const updateEnquiryStatus = (id, status) => api.put(`/enquiries/${id}/status?status=${status}`);

// Collections
export const getCollections = () => api.get("/collections");
export const getFeaturedCollections = () => api.get("/collections/featured");
export const getCollection = (id) => api.get(`/collections/${id}`);
export const getCollectionFabrics = (id) => api.get(`/collections/${id}/fabrics`);
export const createCollection = (data) => api.post("/collections", data);
export const updateCollection = (id, data) => api.put(`/collections/${id}`, data);
export const deleteCollection = (id) => api.delete(`/collections/${id}`);

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

// SEO
export const getFabricSEO = (id) => api.get(`/seo/fabric/${id}`);
export const generateFabricSEO = (id) => api.post(`/seo/fabric/${id}/generate`);
export const regenerateSEOBlock = (id, blockName) => api.post(`/seo/fabric/${id}/regenerate-block`, { block_name: blockName });
export const updateFabricSEO = (id, data) => api.put(`/seo/fabric/${id}`, data);
export const getSEOPreview = (id) => api.get(`/seo/fabric/${id}/preview`);
export const getRelatedFabrics = (id) => api.get(`/seo/fabric/${id}/related`);
export const batchGenerateSlugs = () => api.post(`/seo/batch-generate-slugs`);

// Blog - Categories
export const getBlogCategories = () => api.get("/blog/categories");
export const getBlogCategory = (id) => api.get(`/blog/categories/${id}`);
export const getBlogCategoryBySlug = (slug) => api.get(`/blog/categories/slug/${slug}`);
export const createBlogCategory = (data) => api.post("/blog/categories", data);
export const updateBlogCategory = (id, data) => api.put(`/blog/categories/${id}`, data);
export const deleteBlogCategory = (id) => api.delete(`/blog/categories/${id}`);

// Blog - Tags
export const getBlogTags = () => api.get("/blog/tags");
export const getBlogTag = (id) => api.get(`/blog/tags/${id}`);
export const getBlogTagBySlug = (slug) => api.get(`/blog/tags/slug/${slug}`);
export const createBlogTag = (data) => api.post("/blog/tags", data);
export const updateBlogTag = (id, data) => api.put(`/blog/tags/${id}`, data);
export const deleteBlogTag = (id) => api.delete(`/blog/tags/${id}`);

// Blog - Posts
export const getBlogPosts = (params) => api.get("/blog/posts", { params });
export const getBlogPostsCount = (params) => api.get("/blog/posts/count", { params });
export const getBlogPost = (id) => api.get(`/blog/posts/${id}`);
export const getBlogPostBySlug = (slug) => api.get(`/blog/posts/slug/${slug}`);
export const createBlogPost = (data) => api.post("/blog/posts", data);
export const updateBlogPost = (id, data) => api.put(`/blog/posts/${id}`, data);
export const deleteBlogPost = (id) => api.delete(`/blog/posts/${id}`);

// Blog - Stats & Sitemap
export const getBlogStats = () => api.get("/blog/stats");
export const getBlogSitemap = () => api.get("/blog/sitemap");

export default api;
