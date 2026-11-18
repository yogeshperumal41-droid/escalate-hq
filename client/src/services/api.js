import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

// Intercept requests to attach JWT auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('escalate_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept responses for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If 401 and token is invalid, clear token
    if (error.response && error.response.status === 401 && localStorage.getItem('escalate_token')) {
      // Don't auto-redirect on login or demo endpoints
      if (!error.config.url.includes('/auth/login') && !error.config.url.includes('/auth/register')) {
        console.warn('Session expired or unauthorized. Clearing stored token.');
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  getDemoAccounts: () => api.get('/auth/demo-accounts'),
};

export const brandService = {
  getBrands: (params) => api.get('/brands', { params }),
  getBrandBySlug: (slug) => api.get(`/brands/${slug}`),
  createBrand: (data) => api.post('/brands', data),
  deleteBrand: (id) => api.delete(`/brands/${id}`),
};

export const branchService = {
  findOrCreateBranch: (data) => api.post('/branches/find-or-create', data),
  getBranches: (params) => api.get('/branches', { params }),
  getBranchById: (id) => api.get(`/branches/${id}`),
};

export const complaintService = {
  createComplaint: (formData) =>
    api.post('/complaints', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  getComplaints: (params) => api.get('/complaints', { params }),
  getComplaintById: (id) => api.get(`/complaints/${id}`),
  getMyComplaints: () => api.get('/complaints/my-complaints'),
  getMyBrandComplaints: (params) => api.get('/complaints/my-brand', { params }),
  resolveMyBrandComplaint: (id, data) => api.patch(`/complaints/${id}/resolve`, data),
  escalateComplaint: (id, data) => api.patch(`/complaints/${id}/escalate`, data),
  deleteComplaint: (id) => api.delete(`/complaints/${id}`),
  updateStatus: (id, data) => api.patch(`/complaints/${id}/status`, data),
  triggerCron: () => api.post('/complaints/trigger-cron'),
};

export const adminService = {
  getUsers: () => api.get('/admin/users'),
  updateUserRole: (id, data) => api.patch(`/admin/users/${id}/role`, data),
};

export const statsService = {
  getOverview: () => api.get('/stats/overview'),
  getEmailLogs: () => api.get('/stats/email-logs'),
};

export default api;
