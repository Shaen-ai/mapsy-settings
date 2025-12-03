/**
 * Wix Integration Helper
 * This module handles communication between the settings panel and widget using Wix SDK
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
 */
export async function initializeWixClient(): Promise<boolean> {
  if (isInitialized && wixClient) {
    console.log('[WixIntegration] Already initialized');
    return true;
  }

  try {
    console.log('[WixIntegration] Initializing with Wix SDK...');

    // Create the Wix client with editor host - this establishes the context
    wixClient = createClient({
      host: editor.host(),
      modules: { widget },
    });

    console.log('[WixIntegration] Wix client created successfully');

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

    // Try to get instance token from auth
    if (wixClient.auth) {
      try {
        // For editor extensions, we can get the app instance
        const tokens = await wixClient.auth.getTokens();
        if (tokens && tokens.accessToken) {
          instanceToken = tokens.accessToken.value;
          console.log('[WixIntegration] Got access token from auth');
        }
      } catch (err) {
        console.log('[WixIntegration] Could not get tokens from auth:', err);
      }
    }

    isInitialized = true;
    console.log('[WixIntegration] Initialization complete');
    console.log('[WixIntegration] Final state - Instance token:', instanceToken ? 'Available' : 'Not available');
    console.log('[WixIntegration] Final state - Comp ID:', compId || 'Not available');
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
