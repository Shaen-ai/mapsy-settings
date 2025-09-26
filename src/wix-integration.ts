/**
 * Wix Integration Helper
 * This module handles communication between the settings panel and widget using Wix SDK
 */

// Import Wix SDK modules (these will only work in Wix environment)
let editor: any = null;
let widget: any = null;
let createClient: any = null;
let wixClient: any = null;

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
export function initializeWixClient() {
  if (!createClient || !editor || !widget) {
    console.log('[WixIntegration] Wix SDK not available');
    return null;
  }

  try {
    wixClient = createClient({
      host: editor.host(),
      modules: { widget },
    });
    console.log('[WixIntegration] Wix client initialized successfully');
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

// Auto-initialize on module load
if (typeof window !== 'undefined') {
  initializeWixClient();
}