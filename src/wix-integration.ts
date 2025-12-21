/**
 * Wix Integration Helper
 * Handles communication between the settings panel and widget using Wix SDK
 */

import { createClient } from '@wix/sdk';
import { widget as editorWidget, editor } from '@wix/editor';
import * as wixSettingsClient from '@wix/widget-sdk'; // Internal SDK for settings panel only

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
    // Editor client (for fetchWithAuth and dashboard)
    wixClient = createClient({ host: editor.host(), modules: { widget: editorWidget } });

    // Settings panel client (official SDK)
    await wixSettingsClient.ready();

    // Try to get existing compId from site data
    try {
      const existingCompId = await wixSettingsClient.widget.getProp('compId');
      if (existingCompId) {
        compId = existingCompId as string;
        console.log('[Settings] ✅ Got existing compId from site data:', compId);
      }
    } catch (e) {
      console.warn('[Settings] ⚠️ Could not read compId from site data:', e);
    }

    // If no compId exists, generate one and save it to site data
    if (!compId) {
      compId = generateCompId();
      console.log('[Settings] 🆕 Generated new compId:', compId);
      try {
        await wixSettingsClient.widget.setProp('compId', compId);
        console.log('[Settings] ✅ Saved compId to site data');
      } catch (e) {
        console.error('[Settings] ❌ Could not save compId to site data:', e);
      }
    }

    isInitialized = true;
    return true;
  } catch (error) {
    console.error('[Settings] ❌ Wix SDK init failed:', error);

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
export async function updateWidgetConfig(config: Record<string, any>): Promise<boolean> {
  if (!wixSettingsClient?.widget?.setProps) {
    console.error('[Settings] ❌ Wix settings SDK or widget.setProps not available');
    return false;
  }

  const props = {
    defaultView: config.defaultView ?? 'map',
    showHeader: !!config.showHeader,
    headerTitle: config.headerTitle ?? 'Our Locations',
    mapZoomLevel: Number(config.mapZoomLevel ?? 12),
    primaryColor: config.primaryColor ?? '#3B82F6',
    showWidgetName: !!config.showWidgetName,
    widgetName: config.widgetName ?? '',
  };

  try {
    console.log('[Settings] 📤 Calling widget.setProps with:', props);
    await wixSettingsClient.widget.setProps(props);
    console.log('[Settings] ✅ widget.setProps completed successfully');
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