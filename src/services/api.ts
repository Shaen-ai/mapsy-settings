import axios from 'axios';
import { Location } from '../types/location';

const API_URL = import.meta.env.VITE_API_URL || 'https://mapsy-api.nextechspires.com/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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