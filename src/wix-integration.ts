/**
 * Wix Integration Helper
 * This module handles communication between the settings panel and widget using Wix SDK
 *
 * Per Wix docs: For dashboard/settings pages, initialize WixClient with
 * editor.auth() and editor.host(), then use fetchWithAuth() for authenticated requests.
 */

import { createClient } from '@wix/sdk';
import { widget, editor } from '@wix/editor';

let wixClient: ReturnType<typeof createClient> | null = null;
let instanceToken: string | null = null;
let compId: string | null = null;
let isInitialized = false;

/**
 * Generate a unique compId in the format comp-xxxxxxxx
 * Uses random alphanumeric characters
 */
function generateCompId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'comp-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Initialize the Wix integration with proper context
 * Uses editor.auth() and editor.host() as per Wix documentation
 */
export async function initializeWixClient(): Promise<boolean> {
  if (isInitialized && wixClient) {
    console.log('[WixIntegration] Already initialized');
    return true;
  }

  try {
    console.log('[WixIntegration] Initializing with Wix SDK...');
    console.log('[WixIntegration] editor.auth available:', !!editor.auth);
    console.log('[WixIntegration] editor.host available:', !!editor.host);

    // Create the Wix client with editor.auth() and editor.host()
    // This is the recommended pattern for dashboard/settings pages
    wixClient = createClient({
      auth: editor.auth(),
      host: editor.host(),
      modules: { widget },
    });

    console.log('[WixIntegration] Wix client created successfully');
    console.log('[WixIntegration] fetchWithAuth available:', typeof wixClient.fetchWithAuth);

    // Try to get compId from widget props
    if (wixClient.widget && wixClient.widget.getProp) {
      try {
        const existingCompId = await wixClient.widget.getProp('compId');
        if (existingCompId) {
          compId = existingCompId as string;
          console.log('[WixIntegration] Found existing compId from widget:', compId);
        }
      } catch (err) {
        console.log('[WixIntegration] Could not get compId from widget props:', err);
      }
    }

    // Try to get compId from URL if not already set
    if (!compId && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlCompId = urlParams.get('compId');
      if (urlCompId) {
        compId = urlCompId;
        console.log('[WixIntegration] Found compId in URL:', compId);
      }
    }

    // If still no compId, generate a new one and set it on the widget
    if (!compId) {
      compId = generateCompId();
      console.log('[WixIntegration] Generated new compId:', compId);

      // Set the compId on the widget using setProp
      if (wixClient.widget && wixClient.widget.setProp) {
        try {
          await wixClient.widget.setProp('compId', compId);
          console.log('[WixIntegration] Set compId prop on widget:', compId);
        } catch (err) {
          console.error('[WixIntegration] Failed to set compId prop:', err);
        }
      }
    }

    isInitialized = true;
    console.log('[WixIntegration] Initialization complete');
    console.log('[WixIntegration] Final state - Comp ID:', compId || 'Not available');
    console.log('[WixIntegration] fetchWithAuth ready for authenticated API calls');
    return true;
  } catch (error) {
    console.error('[WixIntegration] Failed to initialize:', error);

    // Fallback: still generate compId even if Wix SDK fails
    if (!compId) {
      compId = generateCompId();
      console.log('[WixIntegration] Fallback - Generated compId:', compId);
    }

    isInitialized = true;
    return false;
  }
}

/**
 * Fetch with Wix authentication
 * Uses wixClient.fetchWithAuth() to automatically include access token
 * The backend can extract instanceId from the token via Wix API
 */
export async function fetchWithAuth(url: string, options?: RequestInit): Promise<Response> {
  console.log('[FetchWithAuth] Starting fetch to:', url);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  // Add compId header if available
  if (compId) {
    headers['X-Wix-Comp-Id'] = compId;
    console.log('[FetchWithAuth] Added X-Wix-Comp-Id header:', compId);
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
  };

  // Use Wix authenticated fetch if available (recommended per Wix docs)
  if (wixClient && wixClient.fetchWithAuth) {
    console.log('[FetchWithAuth] Using wixClient.fetchWithAuth...');
    try {
      const response = await wixClient.fetchWithAuth(url, fetchOptions);
      console.log('[FetchWithAuth] Response status:', response.status);
      return response;
    } catch (error: any) {
      console.error('[FetchWithAuth] wixClient.fetchWithAuth failed:', error?.message);
      console.log('[FetchWithAuth] Falling back to regular fetch...');
    }
  }

  // Fallback to regular fetch
  console.log('[FetchWithAuth] Using regular fetch (no auth)...');
  const response = await fetch(url, fetchOptions);
  console.log('[FetchWithAuth] Response status:', response.status);
  return response;
}

/**
 * Update a widget property using Wix SDK
 * This is equivalent to updating an attribute on the custom element
 */
export async function updateWidgetProperty(property: string, value: any): Promise<boolean> {
  if (!wixClient || !wixClient.widget || !wixClient.widget.setProp) {
    console.warn('[WixIntegration] Wix client not available for setProp');
    return false;
  }

  try {
    // Use Wix SDK to update the property
    // This will trigger attributeChangedCallback on the custom element
    await wixClient.widget.setProp(property, String(value));
    console.log(`[WixIntegration] Set property '${property}' to:`, value);
    return true;
  } catch (error) {
    console.error(`[WixIntegration] Failed to set property '${property}':`, error);
    return false;
  }
}

/**
 * Update multiple widget properties at once
 */
export async function updateWidgetConfig(config: Record<string, any>): Promise<boolean> {
  let success = true;

  // Update each property individually
  for (const [key, value] of Object.entries(config)) {
    const result = await updateWidgetProperty(key, value);
    if (!result) {
      success = false;
    }
  }

  // Also send the full config as a JSON string
  await updateWidgetProperty('config', JSON.stringify(config));

  return success;
}

/**
 * Check if running in Wix environment
 */
export function isWixEnvironment(): boolean {
  return !!(wixClient && wixClient.widget);
}

/**
 * Get the Wix client instance
 */
export function getWixClient() {
  return wixClient;
}

/**
 * Get the instance token for API authentication
 * Note: With fetchWithAuth, you don't need to manually handle tokens
 */
export function getInstanceToken(): string | null {
  return instanceToken;
}

/**
 * Set the instance token
 */
export function setInstanceToken(token: string): void {
  instanceToken = token;
  console.log('[WixIntegration] Instance token set');
}

/**
 * Set the component ID
 */
export function setCompId(id: string): void {
  compId = id;
  console.log('[WixIntegration] Component ID set:', id);
}

/**
 * Get the component ID
 */
export function getCompId(): string | null {
  return compId;
}

/**
 * Build dashboard URL with instance and compID parameters
 */
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
