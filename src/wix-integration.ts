/**
 * Wix Integration Helper
 * Handles communication between the settings panel and widget using Wix SDK
 */

import { createClient } from '@wix/sdk';
import { widget, editor } from '@wix/editor';

let wixClient: ReturnType<typeof createClient> | null = null;
let instanceToken: string | null = null;
let compId: string | null = null;
let instanceId: string | null = null;
let isInitialized = false;

// Extract instance token and instanceId from URL on module load
if (typeof window !== 'undefined') {
  const urlParams = new URLSearchParams(window.location.search);
  const urlInstance = urlParams.get('instance');
  const urlInstanceId = urlParams.get('instanceId');

  if (urlInstance) {
    instanceToken = urlInstance;
    console.log('[Settings] 🔑 Instance token extracted from URL');
  } else {
    console.warn('[Settings] ⚠️ No instance token in URL - will rely on wixClient.fetchWithAuth');
  }

  if (urlInstanceId) {
    instanceId = urlInstanceId;
    console.log('[Settings] 🔑 Instance ID extracted from URL:', instanceId);
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
  if (token) {
    instanceToken = token;
  }
}

export function getInstanceToken(): string | null {
  if (instanceToken) return instanceToken;
  if (typeof window !== 'undefined') {
    const urlInstance = new URLSearchParams(window.location.search).get('instance');
    if (urlInstance) {
      instanceToken = urlInstance;
      return instanceToken;
    }
  }
  return null;
}

export function setCompId(id: string): void {
  if (id) {
    compId = id;
  }
}

export function getCompId(): string | null {
  return compId;
}

export function setInstanceId(id: string): void {
  if (id) {
    instanceId = id;
  }
}

export function getInstanceId(): string | null {
  if (instanceId) return instanceId;
  if (typeof window !== 'undefined') {
    const urlInstanceId = new URLSearchParams(window.location.search).get('instanceId');
    if (urlInstanceId) {
      instanceId = urlInstanceId;
      return instanceId;
    }
  }
  return null;
}

/**
 * Decode instanceId from an OauthNG.JWS Authorization token (client-side, no verify).
 */
function extractInstanceIdFromOauthNgToken(token: string): string | null {
  try {
    const prefix = 'OauthNG.JWS.';
    if (!token.startsWith(prefix)) return null;

    const jwtPart = token.slice(prefix.length);
    const parts = jwtPart.split('.');
    if (parts.length < 2) return null;

    const payloadSegment = parts[1];
    const normalized = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
    const padding = (4 - (normalized.length % 4)) % 4;
    const payloadJson = atob(normalized + '='.repeat(padding));
    const payload = JSON.parse(payloadJson);

    let data: any = payload;
    if (typeof payload.data === 'string') {
      data = JSON.parse(payload.data);
    } else if (payload.data && typeof payload.data === 'object') {
      data = payload.data;
    }

    return data?.instance?.instanceId || data?.instanceId || null;
  } catch {
    return null;
  }
}

/**
 * Pull the editor Authorization token into module state so dashboard links include ?instance=.
 */
export async function captureAuthFromEditor(): Promise<void> {
  if (!wixClient?.auth?.getAuthHeaders) {
    return;
  }

  try {
    const authResult = await wixClient.auth.getAuthHeaders();
    const authHeader =
      authResult?.headers?.Authorization ||
      (authResult?.headers as Record<string, string> | undefined)?.authorization;

    if (authHeader) {
      instanceToken = authHeader;
      console.log('[Settings] ✅ Captured instance token from editor.auth');

      if (!instanceId) {
        const decodedId = extractInstanceIdFromOauthNgToken(authHeader);
        if (decodedId) {
          instanceId = decodedId;
          console.log('[Settings] ✅ Decoded instanceId from token:', instanceId);
        }
      }
    }
  } catch (e) {
    console.warn('[Settings] ⚠️ Could not capture auth from editor:', e);
  }
}

// ----------------------
// Authenticated fetch
// ----------------------
export async function fetchWithAuth(url: string, options?: RequestInit): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  // Add compId header only
  if (compId) {
    headers['X-Wix-Comp-Id'] = compId;
  }

  const fetchOptions: RequestInit = { ...options, headers };

  // Use wixClient.fetchWithAuth - it handles authentication
  if (wixClient?.fetchWithAuth) {
    console.log('[Settings] 📤 wixClient.fetchWithAuth:', url);
    return await wixClient.fetchWithAuth(url, fetchOptions);
  }

  // Fallback
  console.warn('[Settings] ⚠️ No Wix client');
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
      auth: editor.auth(),
      modules: { widget }
    });

    console.log('[Settings] ✅ Wix client created');

    // Try to get existing compId and instance from widget props (persisted site data)
    if (wixClient.widget && wixClient.widget.getProp) {
      try {
        const existingCompId = await wixClient.widget.getProp('compId');
        if (existingCompId) {
          compId = existingCompId as string;
          console.log('[Settings] ✅ Got existing compId from site data:', compId);
        }

        // Try to get instance token from widget props
        const existingInstance = await wixClient.widget.getProp('instance');
        if (existingInstance && !instanceToken) {
          instanceToken = existingInstance as string;
          console.log('[Settings] ✅ Got instance token from widget props');
        }
      } catch (e) {
        console.warn('[Settings] ⚠️ Could not read props from site data:', e);
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

    // Capture editor Authorization token for dashboard links
    await captureAuthFromEditor();

    // Log authentication status
    console.log('[Settings] 🔑 Authentication status:', {
      hasInstanceToken: !!instanceToken,
      hasCompId: !!compId,
      hasInstanceId: !!instanceId,
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
// Always rebuilds from the latest known auth sources at call time:
// module state, iframe ?instance=, editor.auth, and tokens saved from /widget-config.
// ----------------------
export async function getDashboardUrl(
  baseUrl: string = 'https://mapsy-dashboard.nextechspires.com/'
): Promise<string> {
  // Refresh token from editor right before opening (tokens expire)
  await captureAuthFromEditor();

  const url = new URL(baseUrl);

  const token = getInstanceToken();
  const currentCompId = getCompId();
  const currentInstanceId = getInstanceId();

  if (token) {
    url.searchParams.set('instance', token);
  } else {
    console.warn('[Settings] ⚠️ Opening dashboard without instance token — auth may fail');
  }

  if (currentCompId) {
    url.searchParams.set('compId', currentCompId);
  }

  if (currentInstanceId) {
    url.searchParams.set('instanceId', currentInstanceId);
  }

  return url.toString();
}

// ----------------------
// Auto-initialize on module load
// ----------------------
if (typeof window !== 'undefined') {
  initializeWixClient();
}