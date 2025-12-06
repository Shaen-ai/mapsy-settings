import { Location } from '../types/location';
import { fetchWithAuth, getCompId } from '../wix-integration';

const API_URL = import.meta.env.VITE_API_URL || 'https://mapsy-api.nextechspires.com/api';

/**
 * Make an authenticated API request using Wix fetchWithAuth
 */
async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const response = await fetchWithAuth(url, options);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error (${response.status}): ${errorText}`);
  }

  return response.json();
}

/**
 * Make a FormData request (for file uploads)
 * Note: fetchWithAuth handles auth, but we need special handling for FormData
 */
async function apiFormDataRequest<T>(
  endpoint: string,
  formData: FormData,
  method: 'POST' | 'PUT' = 'POST'
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const compId = getCompId();

  // For FormData, we let the browser set Content-Type (with boundary)
  const headers: Record<string, string> = {};
  if (compId) {
    headers['X-Wix-Comp-Id'] = compId;
  }

  const response = await fetchWithAuth(url, {
    method,
    body: formData,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error (${response.status}): ${errorText}`);
  }

  return response.json();
}

export const locationService = {
  getAll: async (): Promise<Location[]> => {
    return apiRequest<Location[]>('/locations', { method: 'GET' });
  },

  getOne: async (id: string | number): Promise<Location> => {
    return apiRequest<Location>(`/locations/${id}`, { method: 'GET' });
  },

  create: async (formData: FormData): Promise<Location> => {
    return apiFormDataRequest<Location>('/locations', formData, 'POST');
  },

  update: async (id: string | number, formData: FormData): Promise<Location> => {
    return apiFormDataRequest<Location>(`/locations/${id}`, formData, 'POST');
  },

  delete: async (id: string | number): Promise<void> => {
    await apiRequest<void>(`/locations/${id}`, { method: 'DELETE' });
  },
};

export interface AuthInfo {
  instanceId: string | null;
  compId: string | null;
  instanceToken: string | null;
  isAuthenticated: boolean;
}

export interface WidgetConfig {
  defaultView: 'map' | 'list';
  showHeader: boolean;
  headerTitle: string;
  mapZoomLevel: number;
  primaryColor: string;
  showWidgetName: boolean;
  widgetName: string;
  auth?: AuthInfo;
}

export const widgetConfigService = {
  getConfig: async (): Promise<WidgetConfig> => {
    return apiRequest<WidgetConfig>('/widget-config', { method: 'GET' });
  },

  updateConfig: async (config: WidgetConfig): Promise<WidgetConfig> => {
    return apiRequest<WidgetConfig>('/widget-config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  },
};

