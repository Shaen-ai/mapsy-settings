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

function generateCompId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'comp-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
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

    // Try to get compId from widget props
    if (wixClient.widget && wixClient.widget.getProp) {
      try {
        const existingCompId = await wixClient.widget.getProp('compId');
        if (existingCompId) {
          compId = existingCompId as string;
        }
      } catch {}
    }

    // Try to get compId from URL if not already set
    if (!compId && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlCompId = urlParams.get('compId');
      if (urlCompId) {
        compId = urlCompId;
      }
    }

    // If still no compId, generate a new one and set it on the widget
    if (!compId) {
      compId = generateCompId();
      if (wixClient.widget && wixClient.widget.setProp) {
        try {
          await wixClient.widget.setProp('compId', compId);
        } catch {}
      }
    }

    // Try to get the instance token from URL
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlInstance = urlParams.get('instance');
      if (urlInstance) {
        instanceToken = urlInstance;
      }
    }

    isInitialized = true;
    return true;
  } catch (error) {
    // Fallback: still generate compId even if Wix SDK fails
    if (!compId) {
      compId = generateCompId();
    }

    // Fallback: try to get instance token from URL
    if (!instanceToken && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlInstance = urlParams.get('instance');
      if (urlInstance) {
        instanceToken = urlInstance;
      }
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

  // Use Wix authenticated fetch if available
  if (wixClient && wixClient.fetchWithAuth) {
    try {
      return await wixClient.fetchWithAuth(url, fetchOptions);
    } catch {}
  }

  // Fallback to regular fetch with manual token
  if (instanceToken) {
    headers['Authorization'] = `Bearer ${instanceToken}`;
  }

  return fetch(url, { ...options, headers });
}

async function updateWidgetProperty(property: string, value: any): Promise<boolean> {
  if (!wixClient || !wixClient.widget || !wixClient.widget.setProp) {
    return false;
  }

  try {
    await wixClient.widget.setProp(property, String(value));
    return true;
  } catch {
    return false;
  }
}

export async function updateWidgetConfig(config: Record<string, any>): Promise<boolean> {
  let success = true;

  for (const [key, value] of Object.entries(config)) {
    const result = await updateWidgetProperty(key, value);
    if (!result) {
      success = false;
    }
  }

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
