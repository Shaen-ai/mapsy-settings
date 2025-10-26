/**
 * Wix Integration Helper
 * This module handles communication between the settings panel and widget using Wix SDK
 */

// Import Wix SDK modules (these will only work in Wix environment)
let editor: any = null;
let widget: any = null;
let createClient: any = null;
let wixClient: any = null;
let instanceToken: string | null = null;
let compId: string | null = null;

// Try to import Wix modules
try {
  // In Wix environment, these modules are available
  const wixEditor = require('@wix/editor');
  editor = wixEditor.editor;
  widget = wixEditor.widget;

  const wixSdk = require('@wix/sdk');
  createClient = wixSdk.createClient;

  console.log('[WixIntegration] Wix SDK modules loaded');
} catch (e) {
  console.log('[WixIntegration] Running outside Wix environment');
}

/**
 * Initialize the Wix client
 */
export async function initializeWixClient() {
  if (!createClient) {
    console.log('[WixIntegration] Wix SDK not available');
    return null;
  }

  try {
    // Initialize Wix client for settings panel
    if (editor && widget) {
      wixClient = createClient({
        host: editor.host(),
        modules: { widget },
      });

      // Try to get compId from widget
      try {
        const widgetCompId = await widget.getCompId?.();
        if (widgetCompId) {
          compId = widgetCompId;
          console.log('[WixIntegration] Component ID retrieved from widget:', compId);
        }
      } catch (err) {
        console.log('[WixIntegration] Could not get compId from widget:', err);
      }
    } else {
      // Fallback for simpler client initialization
      wixClient = await createClient({
        auth: { anonymous: true },
      });
    }

    // Get instance token for API authentication
    if (wixClient && wixClient.auth && wixClient.auth.getInstanceToken) {
      instanceToken = wixClient.auth.getInstanceToken();
      console.log('[WixIntegration] Instance token retrieved');
    }

    // Try to get compId from URL if not already set
    if (!compId && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlCompId = urlParams.get('compId');
      if (urlCompId) {
        compId = urlCompId;
        console.log('[WixIntegration] Component ID retrieved from URL:', compId);
      }
    }

    console.log('[WixIntegration] Wix client initialized successfully');
    console.log('[WixIntegration] Final state - Instance token:', instanceToken ? 'Available' : 'Not available');
    console.log('[WixIntegration] Final state - Comp ID:', compId ? compId : 'Not available');
    return wixClient;
  } catch (error) {
    console.error('[WixIntegration] Failed to initialize Wix client:', error);
    return null;
  }
}

/**
 * Update a widget property using Wix SDK
 * This is equivalent to updating an attribute on the custom element
 */
export function updateWidgetProperty(property: string, value: any) {
  if (!wixClient || !wixClient.widget) {
    console.warn('[WixIntegration] Wix client not available');
    return false;
  }

  try {
    // Use Wix SDK to update the property
    // This will trigger attributeChangedCallback on the custom element
    wixClient.widget.setProp(property, value);
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
export function updateWidgetConfig(config: Record<string, any>) {
  let success = true;

  // Update each property individually
  for (const [key, value] of Object.entries(config)) {
    if (!updateWidgetProperty(key, value)) {
      success = false;
    }
  }

  // Also send the full config as a JSON string
  updateWidgetProperty('config', JSON.stringify(config));

  return success;
}

/**
 * Get the current Wix client instance
 */
export function getWixClient() {
  return wixClient;
}

/**
 * Check if running in Wix environment
 */
export function isWixEnvironment() {
  return wixClient !== null;
}

/**
 * Get the instance token for API authentication
 */
export function getInstanceToken() {
  return instanceToken;
}

/**
 * Set the component ID (if needed for tracking)
 */
export function setCompId(id: string) {
  compId = id;
  console.log('[WixIntegration] Component ID set:', id);
}

/**
 * Get the component ID
 */
export function getCompId() {
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