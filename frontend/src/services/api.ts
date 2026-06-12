import axios from 'axios';

// Use environment variable or vite proxy in dev
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

const toCamel = (key: string) => key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

const camelizeKeys = (value: any): any => {
  if (Array.isArray(value)) return value.map(camelizeKeys);
  if (!value || typeof value !== 'object' || value instanceof Date || value instanceof File) return value;

  return Object.entries(value).reduce<Record<string, any>>((acc, [key, child]) => {
    const normalizedChild = camelizeKeys(child);
    acc[key] = normalizedChild;
    acc[toCamel(key)] = normalizedChild;
    return acc;
  }, {});
};

// Request interceptor — attach JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 (token expired)
api.interceptors.response.use(
  (response) => {
    response.data = camelizeKeys(response.data);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          const res = await axios.post(`${BASE_URL}/api/auth/refresh`, { refreshToken });
          const { accessToken, refreshToken: newRefresh } = res.data.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefresh);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      } else {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login:   (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }),
  register: (data: any) => api.post('/api/auth/register', data),
  logout:   () => api.post('/api/auth/logout'),
  profile:  () => api.get('/api/auth/profile'),
  getUsers: () => api.get('/api/users'),
  deleteUser: (id: string) => api.delete(`/api/users/${id}`),
};

// ─── Invoices ────────────────────────────────────────────────────────────────
export const invoiceApi = {
  getAll:     (params?: any) => api.get('/api/invoices', { params }),
  getById:    (id: string)   => api.get(`/api/invoices/${id}`),
  upload:     (formData: FormData) =>
    api.post('/api/invoices/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateStatus: (id: string, status: string, comments?: string) =>
    api.patch(`/api/invoices/${id}/status`, { status, comments }),
  getDashboard: () => api.get('/api/invoices/dashboard'),
};

// ─── Vendors ────────────────────────────────────────────────────────────────
export const vendorApi = {
  getAll:   (params?: any)  => api.get('/api/vendors', { params }),
  getById:  (id: string)    => api.get(`/api/vendors/${id}`),
  create:   (data: any)     => api.post('/api/vendors', data),
  update:   (id: string, data: any) => api.put(`/api/vendors/${id}`, data),
  assess:   (id: string, notes?: string) => api.post(`/api/vendors/${id}/assess`, { notes }),
};

// ─── Approvals ───────────────────────────────────────────────────────────────
export const approvalApi = {
  getQueue:    (params?: any)  => api.get('/api/approval/queue', { params }),
  getWorkflow: (invoiceId: string) => api.get(`/api/approval/workflow/${invoiceId}`),
  action:      (data: any)     => api.post('/api/approval/action', data),
};

// ─── Notifications ───────────────────────────────────────────────────────────
export const notificationApi = {
  getAll:      (params?: any)  => api.get('/api/notifications', { params }),
  markRead:    (id: string)    => api.patch(`/api/notifications/${id}/read`),
  markAllRead: ()              => api.patch('/api/notifications/read-all'),
};

// ─── Analytics ───────────────────────────────────────────────────────────────
export const analyticsApi = {
  getDashboard: () => api.get('/api/analytics/dashboard'),
  getSpend:     (period?: string) => api.get('/api/analytics/spend', { params: { period } }),
  getFraud:     () => api.get('/api/analytics/fraud'),
  getAuditLogs: (params?: any) => api.get('/api/analytics/audit-logs', { params }),
};

// ─── Fraud ───────────────────────────────────────────────────────────────────
export const fraudApi = {
  getScore:         (invoiceId: string) => api.get(`/api/fraud/score/${invoiceId}`),
  getTrends:        () => api.get('/api/fraud/trends'),
  getHighRiskVendors: () => api.get('/api/fraud/high-risk-vendors'),
};

// ─── Duplicate ───────────────────────────────────────────────────────────────
export const duplicateApi = {
  getAlerts: () => api.get('/api/duplicate/alerts'),
  resolve:   (id: string, data: any) => api.post(`/api/duplicate/resolve/${id}`, data),
};

export default api;
