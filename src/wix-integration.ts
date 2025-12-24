/**
 * Wix Integration Helper
 * Handles communication between the settings panel and widget using Wix SDK
 */

import { createClient } from '@wix/sdk';
import { widget, editor } from '@wix/editor';

let wixClient: ReturnType<typeof createClient> | null = null;
let instanceToken: string | null = null;
let compId: string | null = null;
let isInitialized = false;

// Extract instance token from URL on module load
if (typeof window !== 'undefined') {
  const urlParams = new URLSearchParams(window.location.search);
  const urlInstance = urlParams.get('instance');
  if (urlInstance) {
    instanceToken = urlInstance;
    console.log('[Settings] 🔑 Instance token extracted from URL');
  } else {
    console.warn('[Settings] ⚠️ No instance token in URL - will rely on wixClient.fetchWithAuth');
  }
}

// ----------------------
// Utility to generate a unique component ID
// ----------------------
function generateCompId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const timestamp = Date.now();
  let randomPart = '';
  for (let i = 0; i < 8; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `comp-${timestamp}-${randomPart}`;
}

// ----------------------
// Exports (for external modules)
// ----------------------
export function setInstanceToken(token: string): void {
  instanceToken = token;
}

export function setCompId(id: string): void {
  compId = id;
}

export function getCompId(): string | null {
  return compId;
}

// ----------------------
// Authenticated fetch
// ----------------------
export async function fetchWithAuth(url: string, options?: RequestInit): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  // Add compId header if available
  if (compId) {
    headers['X-Wix-Comp-Id'] = compId;
    console.log('[Settings] 🔑 Adding X-Wix-Comp-Id header:', compId);
  }

  // Add instance token for authentication
  if (instanceToken) {
    headers['Authorization'] = instanceToken.startsWith('Bearer ')
      ? instanceToken
      : `Bearer ${instanceToken}`;
    console.log('[Settings] 🔑 Adding Authorization header');
  } else {
    console.warn('[Settings] ⚠️ No instanceToken available for authentication');
  }

  const fetchOptions: RequestInit = { ...options, headers };

  // Try Wix SDK's fetchWithAuth first (it handles auth automatically)
  if (wixClient?.fetchWithAuth) {
    try {
      console.log('[Settings] 📤 Using wixClient.fetchWithAuth for:', url);
      return await wixClient.fetchWithAuth(url, fetchOptions);
    } catch (e) {
      console.warn('[Settings] ⚠️ wixClient.fetchWithAuth failed, falling back to regular fetch', e);
    }
  }

  // Fallback to regular fetch with manual auth headers
  console.log('[Settings] 📤 Using regular fetch with auth headers for:', url);
  return fetch(url, fetchOptions);
}

// ----------------------
// Initialize Wix clients
// ----------------------
export async function initializeWixClient(): Promise<boolean> {
  if (isInitialized) return true;

  try {
    console.log('[Settings] 🔄 Initializing Wix client...');

    // Create Wix client with editor.host() and widget module
    wixClient = createClient({
      host: editor.host(),
      modules: { widget }
    });

    console.log('[Settings] ✅ Wix client created');

    // Try to get existing compId from widget props (persisted site data)
    if (wixClient.widget && wixClient.widget.getProp) {
      try {
        const existingCompId = await wixClient.widget.getProp('compId');
        if (existingCompId) {
          compId = existingCompId as string;
          console.log('[Settings] ✅ Got existing compId from site data:', compId);
        }
      } catch (e) {
        console.warn('[Settings] ⚠️ Could not read compId from site data:', e);
      }
    }

    // If no compId exists, generate one and save it to widget props (site data)
    if (!compId) {
      compId = generateCompId();
      console.log('[Settings] 🆕 Generated new compId:', compId);

      if (wixClient.widget && wixClient.widget.setProp) {
        try {
          await wixClient.widget.setProp('compId', compId);
          console.log('[Settings] ✅ Saved compId to site data');
        } catch (e) {
          console.error('[Settings] ❌ Could not save compId to site data:', e);
        }
      }
    }

    // Log authentication status
    console.log('[Settings] 🔑 Authentication status:', {
      hasInstanceToken: !!instanceToken,
      hasCompId: !!compId,
      hasWixClient: !!wixClient,
      hasWixFetchWithAuth: !!(wixClient?.fetchWithAuth)
    });

    isInitialized = true;
    return true;
  } catch (error) {
    console.error('[Settings] ❌ Wix SDK init failed:', error);

    // Fallback: generate compId even if Wix SDK fails
    if (!compId) {
      compId = generateCompId();
      console.log('[Settings] 🔄 Fallback: Generated compId:', compId);
    }

    isInitialized = true;
    return false;
  }
}

// ----------------------
// Update widget configuration
// ----------------------
export async function updateWidgetConfig(config: Record<string, any>, onlyChanged = false): Promise<boolean> {
  if (!wixClient || !wixClient.widget || !wixClient.widget.setProp) {
    console.error('[Settings] ❌ Wix client or widget.setProp not available');
    return false;
  }

  // If onlyChanged is true, only update the properties that are actually in the config object
  // Otherwise, normalize all properties with defaults
  const props = onlyChanged ? config : {
    defaultView: config.defaultView ?? 'map',
    showHeader: !!config.showHeader,
    headerTitle: config.headerTitle ?? 'Our Locations',
    mapZoomLevel: Number(config.mapZoomLevel ?? 12),
    primaryColor: config.primaryColor ?? '#3B82F6',
    showWidgetName: !!config.showWidgetName,
    widgetName: config.widgetName ?? '',
  };

  try {
    console.log('[Settings] 📤 Calling widget.setProp for properties:', props);

    // Set each property individually using setProp (singular)
    // HTML will convert camelCase to lowercase automatically
    for (const [key, value] of Object.entries(props)) {
      await wixClient.widget.setProp(key, value);
    }

    console.log('[Settings] ✅ widget.setProp completed successfully for', Object.keys(props).length, 'properties');
    return true;
  } catch (error) {
    console.error('[Settings] ❌ Failed to update widget config:', error);
    return false;
  }
}

// ----------------------
// Generate dashboard URL
// ----------------------
export function getDashboardUrl(baseUrl: string = 'https://mapsy-dashboard.nextechspires.com/'): string {
  const url = new URL(baseUrl);
  if (instanceToken) url.searchParams.set('instance', instanceToken);
  if (compId) url.searchParams.set('compId', compId);
  return url.toString();
}

// ----------------------
// Auto-initialize on module load
// ----------------------
if (typeof window !== 'undefined') {
  initializeWixClient();
}