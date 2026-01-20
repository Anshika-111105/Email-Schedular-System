import axios from 'axios';
import type { Email, ScheduleEmailRequest } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  googleLogin: async (credential: string) => {
    const { data } = await api.post('/auth/google', { credential });
    return data;
  },
};

export const emailApi = {
  scheduleEmails: async (payload: ScheduleEmailRequest) => {
    const { data } = await api.post('/emails/schedule', payload);
    return data;
  },
  getScheduledEmails: async (): Promise<Email[]> => {
    const { data } = await api.get('/emails/scheduled');
    return data;
  },
  getSentEmails: async (): Promise<Email[]> => {
    const { data } = await api.get('/emails/sent');
    return data;
  },
};

export default api;