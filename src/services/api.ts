import axios from 'axios';
import { Location } from '../types/location';
import { getInstanceToken, getCompId } from '../wix-integration';

const API_URL = import.meta.env.VITE_API_URL || 'https://mapsy-api.nextechspires.com/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include Wix instance token
api.interceptors.request.use(
  (config) => {
    const instanceToken = getInstanceToken();
    const compId = getCompId();

    if (instanceToken) {
      // Add Authorization header with Bearer token
      config.headers.Authorization = `Bearer ${instanceToken}`;
      console.log('[API] Added Wix instance token to request');
    }

    if (compId) {
      // Add compId as a custom header
      config.headers['X-Wix-Comp-Id'] = compId;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const locationService = {
  getAll: async (): Promise<Location[]> => {
    const response = await api.get('/locations');
    return response.data;
  },

  getOne: async (id: string | number): Promise<Location> => {
    const response = await api.get(`/locations/${id}`);
    return response.data;
  },

  create: async (location: FormData): Promise<Location> => {
    const response = await api.post('/locations', location, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  update: async (id: string | number, location: FormData): Promise<Location> => {
    const response = await api.post(`/locations/${id}`, location, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  delete: async (id: string | number): Promise<void> => {
    await api.delete(`/locations/${id}`);
  },
};

export const widgetConfigService = {
  getConfig: async () => {
    const response = await api.get('/widget-config');
    return response.data;
  },

  updateConfig: async (config: Record<string, any>) => {
    const response = await api.put('/widget-config', config);
    return response.data;
  },
};
