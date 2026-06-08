import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30_000,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error('API Error:', err.response?.data || err.message);
    return Promise.reject(err);
  }
);

// ---- Clients ----
export const clientsApi = {
  getAll: () => api.get('/clients').then((r) => r.data.data),
  getById: (id: string) => api.get(`/clients/${id}`).then((r) => r.data.data),
  create: (data: any) => api.post('/clients', data).then((r) => r.data.data),
  update: (id: string, data: any) => api.put(`/clients/${id}`, data).then((r) => r.data.data),
  archive: (id: string) => api.patch(`/clients/${id}/archive`).then((r) => r.data.data),
  delete: (id: string) => api.delete(`/clients/${id}`).then((r) => r.data),
  getDashboard: (id: string) => api.get(`/clients/${id}/dashboard`).then((r) => r.data.data),
};

// ---- Analytics ----
export const analyticsApi = {
  getForClient: (clientId: string, params?: any) =>
    api.get(`/analytics/client/${clientId}`, { params }).then((r) => r.data.data),
  getSummary: (clientId: string) =>
    api.get(`/analytics/client/${clientId}/summary`).then((r) => r.data.data),
  addSnapshot: (clientId: string, data: any) =>
    api.post(`/analytics/client/${clientId}`, data).then((r) => r.data.data),
  bulkImport: (clientId: string, snapshots: any[]) =>
    api.post(`/analytics/client/${clientId}/bulk`, { snapshots }).then((r) => r.data),
};

// ---- Calendar ----
export const calendarApi = {
  getEntries: (clientId: string, params?: any) =>
    api.get(`/calendar/client/${clientId}`, { params }).then((r) => r.data.data),
  create: (formData: FormData) =>
    api.post('/calendar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data.data),
  update: (id: string, formData: FormData) =>
    api.put(`/calendar/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data.data),
  delete: (id: string) => api.delete(`/calendar/${id}`).then((r) => r.data),
  getConsistency: (clientId: string) =>
    api.get(`/calendar/client/${clientId}/consistency`).then((r) => r.data.data),
};

// ---- Content ----
export const contentApi = {
  getItems: (clientId: string, params?: any) =>
    api.get(`/content/client/${clientId}`, { params }).then((r) => r.data.data),
  create: (data: any) => api.post('/content', data).then((r) => r.data.data),
  delete: (id: string) => api.delete(`/content/${id}`).then((r) => r.data),
  getIdeas: (clientId: string) =>
    api.get(`/content/ideas/${clientId}`).then((r) => r.data.data),
  saveIdea: (id: string, saved: boolean) =>
    api.patch(`/content/ideas/${id}/save`, { isSaved: saved }).then((r) => r.data.data),
  getCompetitors: (clientId: string) =>
    api.get(`/content/competitors/${clientId}`).then((r) => r.data.data),
};

// ---- AI ----
export const aiApi = {
  reviewScreenshot: (formData: FormData) =>
    api.post('/ai/review-screenshot', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data.data),
  chat: (data: { message: string; clientId?: string; history?: any[] }) =>
    api.post('/ai/chat', data).then((r) => r.data.data),
  generateIdeas: (data: any) =>
    api.post('/ai/content-ideas', data).then((r) => r.data.data),
  generateReportSummary: (data: any) =>
    api.post('/ai/report-summary', data).then((r) => r.data.data),
  analyzeCompetitor: (data: any) =>
    api.post('/ai/competitor-analysis', data).then((r) => r.data.data),
  getReviews: (clientId: string) =>
    api.get(`/ai/reviews/${clientId}`).then((r) => r.data.data),
};

// ---- Reports ----
export const reportsApi = {
  getForClient: (clientId: string) =>
    api.get(`/reports/client/${clientId}`).then((r) => r.data.data),
  create: (data: any) => api.post('/reports', data).then((r) => r.data.data),
  downloadPdf: (id: string) => `/api/reports/${id}/pdf`,
  delete: (id: string) => api.delete(`/reports/${id}`).then((r) => r.data),
};

// ---- Notifications ----
export const notificationsApi = {
  getAll: () => api.get('/notifications').then((r) => r.data.data),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => api.patch('/notifications/read-all').then((r) => r.data),
  checkConsistency: () => api.post('/notifications/check-consistency').then((r) => r.data.data),
};

// ---- Settings ----
export const settingsApi = {
  getAll: () => api.get('/settings').then((r) => r.data.data),
  set: (key: string, value: string) => api.put(`/settings/${key}`, { value }).then((r) => r.data.data),
};

export default api;
