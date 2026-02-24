import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const auth = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data)
};

export const documents = {
  upload: (formData) => api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getAll: () => api.get('/documents'),
  getById: (id) => api.get(`/documents/${id}`),
  addSigners: (id, signers) => api.post(`/documents/${id}/signers`, { signers })
};

export const signatures = {
  getDocument: (token) => api.get(`/signatures/document/${token}`),
  sign: (token, data) => api.post(`/signatures/sign/${token}`, data)
};

export default api;
