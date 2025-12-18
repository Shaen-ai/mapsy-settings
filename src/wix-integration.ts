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
    wixClient = createClient({
      auth: editor.auth(),
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
  console.log(`[Settings] 📤 Calling widget.setProp('${property}', '${value}')`);

  if (!wixClient || !wixClient.widget || !wixClient.widget.setProp) {
    console.log('[Settings] ❌ Wix client or widget.setProp not available');
    return false;
  }

  try {
    await wixClient.widget.setProp(property, String(value));
    console.log(`[Settings] ✅ widget.setProp('${property}') succeeded`);
    return true;
  } catch (error) {
    console.error(`[Settings] ❌ widget.setProp('${property}') failed:`, error);
    return false;
  }
}

export async function updateWidgetConfig(config: Record<string, any>): Promise<boolean> {
  let success = true;

  // Update widget properties via Wix SDK
  // Each property change will trigger attributeChangedCallback in the widget's custom element
  for (const [key, value] of Object.entries(config)) {
    const result = await updateWidgetProperty(key, value);
    if (!result) {
      success = false;
    }
  }

  // Also update the full config as a JSON string
  await updateWidgetProperty('config', JSON.stringify(config));

  return success;
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
