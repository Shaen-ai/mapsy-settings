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
  if (compId) headers['X-Wix-Comp-Id'] = compId;

  const fetchOptions: RequestInit = { ...options, headers };

  if (wixClient?.fetchWithAuth) {
    try {
      return await wixClient.fetchWithAuth(url, fetchOptions);
    } catch (e) {
      console.warn('[Settings] fetchWithAuth failed, falling back', e);
    }
  }

  if (instanceToken) {
    headers['Authorization'] = instanceToken.startsWith('Bearer ')
      ? instanceToken
      : `Bearer ${instanceToken}`;
  }

  return fetch(url, fetchOptions);
}

// ----------------------
// Initialize Wix clients
// ----------------------
export async function initializeWixClient(): Promise<boolean> {
  if (isInitialized) return true;

  try {
    // Create Wix client with editor.host() and widget module
    wixClient = createClient({
      host: editor.host(),
      modules: { widget }
    });

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