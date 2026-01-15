import axios from 'axios';
import { getRole } from '@/utils/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add role header to all requests
api.interceptors.request.use((config) => {
  const role = getRole();
  if (role) {
    config.headers['x-user-role'] = role;
  }
  return config;
});

export const incidentsAPI = {
  create: (data) => api.post('/incidents', data),
  getAll: () => api.get('/incidents'),
  getById: (id) => api.get(`/incidents/${id}`),
  update: (id, data) => api.patch(`/incidents/${id}`, data),
  assignResource: (incidentId, resourceId) => api.post(`/incidents/${incidentId}/assign-resource`, { resourceId }),
  assignVolunteer: (incidentId, volunteerId) => api.patch(`/incidents/${incidentId}/assign-volunteer`, { volunteerId }),
  resolve: (incidentId) => api.post(`/incidents/${incidentId}/resolve`),
};

export const resourcesAPI = {
  getAll: () => api.get('/resources'),
  create: (data) => api.post('/resources', data),
  update: (id, data) => api.patch(`/resources/${id}`, data),
};

export const usersAPI = {
  getAll: () => api.get('/users'),
  getByRole: (role) => api.get(`/users/role/${role}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.patch(`/users/${id}`, data),
  updateVolunteerAvailability: (userId, isAvailable) =>
    api.patch('/users/volunteer/availability', { userId, isAvailable }),
};

export const getResourceRecommendations = (incidentId) =>
  api.post(`/incidents/${incidentId}/recommend-resources`);

