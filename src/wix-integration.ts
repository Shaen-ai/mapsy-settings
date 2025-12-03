/**
 * Wix Integration Helper
 * This module handles communication between the settings panel and widget using Wix SDK
 */

import { widget } from '@wix/editor';

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
 * Initialize the Wix integration
 */
export async function initializeWixClient(): Promise<boolean> {
  if (isInitialized) {
    console.log('[WixIntegration] Already initialized');
    return true;
  }

  try {
    console.log('[WixIntegration] Initializing...');
    console.log('[WixIntegration] widget module available:', !!widget);

    // Try to get compId from widget props
    if (widget && widget.getProp) {
      try {
        const existingCompId = await widget.getProp('compId');
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
    if (!compId && widget && widget.setProp) {
      compId = generateCompId();
      console.log('[WixIntegration] Generated new compId:', compId);

      // Set the compId on the widget using setProp
      try {
        await widget.setProp('compId', compId);
        console.log('[WixIntegration] Set compId prop on widget:', compId);
      } catch (err) {
        console.error('[WixIntegration] Failed to set compId prop:', err);
      }
    }

    isInitialized = true;
    console.log('[WixIntegration] Initialization complete');
    console.log('[WixIntegration] Final state - Comp ID:', compId || 'Not available');
    return true;
  } catch (error) {
    console.error('[WixIntegration] Failed to initialize:', error);
    return false;
  }
}

/**
 * Update a widget property using Wix SDK
 * This is equivalent to updating an attribute on the custom element
 */
export async function updateWidgetProperty(property: string, value: any): Promise<boolean> {
  if (!widget || !widget.setProp) {
    console.warn('[WixIntegration] Widget SDK not available');
    return false;
  }

  try {
    // Use Wix SDK to update the property
    // This will trigger attributeChangedCallback on the custom element
    await widget.setProp(property, String(value));
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
  return !!(widget && widget.setProp);
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
