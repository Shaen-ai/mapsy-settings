import { fetchWithAuth } from '../wix-integration';

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

// apiFormDataRequest removed - not needed for widget config management

// Location service removed - location management now handled by dashboard
// Keeping apiRequest and apiFormDataRequest for future use if needed

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

