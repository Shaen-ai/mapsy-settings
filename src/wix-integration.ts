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

function generateCompId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const timestamp = Date.now(); // milliseconds
  let randomPart = '';
  for (let i = 0; i < 8; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `comp-${timestamp}-${randomPart}`;
}

export async function initializeWixClient(): Promise<boolean> {
  if (isInitialized && wixClient) {
    return true;
  }

  try {
    // For settings panel in editor context, use editor.host() without auth
    // This is the correct way per Wix documentation
    wixClient = createClient({
      host: editor.host(),
      modules: { widget },
    });

    // Try to get compId from widget props (persisted site data)
    if (wixClient.widget && wixClient.widget.getProp) {
      try {
        const existingCompId = await wixClient.widget.getProp('compId');
        if (existingCompId) {
          compId = existingCompId as string;
          console.log('[Settings] ✅ Got existing compId from site data:', compId);
        }
      } catch (e) {
        console.log('[Settings] ⚠️ Could not read compId from site data:', e);
      }
    }

    // If no compId exists, generate one and save it to widget props (site data)
    if (!compId) {
      compId = generateCompId();
      console.log('[Settings] 🆕 Generated new compId with timestamp:', compId);

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

export async function fetchWithAuth(url: string, options?: RequestInit): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  if (compId) {
    headers['X-Wix-Comp-Id'] = compId;
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
  };

  // Use Wix SDK fetchWithAuth for proper authentication
  if (wixClient && wixClient.fetchWithAuth) {
    try {
      return await wixClient.fetchWithAuth(url, fetchOptions);
    } catch (e) {
      console.log('[Settings] wixClient.fetchWithAuth failed, falling back:', e);
    }
  }

  // Fallback to regular fetch with manual token
  if (instanceToken) {
    headers['Authorization'] = instanceToken.startsWith('Bearer ') ? instanceToken : `Bearer ${instanceToken}`;
  }

  return fetch(url, { ...options, headers });
}

async function updateWidgetProperty(property: string, value: any): Promise<boolean> {
  console.log(`[Settings] 📤 Calling wixClient.widget.setProp('${property}', value)`);
  console.log('[Settings] Wix client exists:', !!wixClient);
  console.log('[Settings] widget module exists:', !!wixClient?.widget);
  console.log('[Settings] setProp method exists:', !!wixClient?.widget?.setProp);

  if (!wixClient || !wixClient.widget || !wixClient.widget.setProp) {
    console.error('[Settings] ❌ Wix client or widget.setProp not available');
    console.error('[Settings] This means the Wix SDK is not initialized correctly');
    return false;
  }

  try {
    console.log(`[Settings] Executing: wixClient.widget.setProp('${property}', <value>)`);
    await wixClient.widget.setProp(property, String(value));
    console.log(`[Settings] ✅ widget.setProp('${property}') completed successfully`);
    return true;
  } catch (error: any) {
    console.error(`[Settings] ❌ widget.setProp('${property}') threw error:`, error);
    console.error('[Settings] Error message:', error?.message);
    console.error('[Settings] Error stack:', error?.stack);
    return false;
  }
}

export async function updateWidgetConfig(config: Record<string, any>): Promise<boolean> {
  console.log('[Settings] 📤 Updating widget with config:', config);

  // Method 1: Try to update via Wix SDK (may not work for self-hosted widgets)
  const wixResult = await updateWidgetProperty('config', JSON.stringify(config));

  // Method 2: Use postMessage to communicate directly with widget (more reliable)
  try {
    // Find the widget iframe or window
    const message = {
      type: 'MAPSY_CONFIG_UPDATE',
      config: config,
      source: 'settings-panel',
      timestamp: Date.now()
    };

    // Post message to all frames (widget will filter by type)
    if (window.parent) {
      window.parent.postMessage(message, '*');
      console.log('[Settings] 📤 Posted config update via postMessage');
    }

    // Also broadcast to all iframes
    const frames = window.parent?.frames || [];
    for (let i = 0; i < frames.length; i++) {
      try {
        frames[i].postMessage(message, '*');
      } catch (e) {
        // Ignore cross-origin errors
      }
    }

    console.log('[Settings] ✅ Widget config update sent via postMessage');
    return true;
  } catch (error) {
    console.error('[Settings] ❌ Failed to send config via postMessage:', error);
    return wixResult;
  }
}

export function setInstanceToken(token: string): void {
  instanceToken = token;
}

export function setCompId(id: string): void {
  compId = id;
}

export function getCompId(): string | null {
  return compId;
}

export function getDashboardUrl(baseUrl: string = 'https://mapsy-dashboard.nextechspires.com/'): string {
  const url = new URL(baseUrl);
  if (instanceToken) {
    url.searchParams.set('instance', instanceToken);
  }
  if (compId) {
    url.searchParams.set('compId', compId);
  }
  return url.toString();
}

// Auto-initialize on module load
if (typeof window !== 'undefined') {
  initializeWixClient();
}
