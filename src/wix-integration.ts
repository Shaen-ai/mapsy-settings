/**
 * Wix Integration Helper
 * Handles communication between the settings panel and widget using Wix SDK
 */

import { createClient } from '@wix/sdk';
import { widget as editorWidget, editor } from '@wix/editor';
import wixClientSDK from '@wix/widget-sdk'; // ✅ Add this

let wixClient: ReturnType<typeof createClient> | null = null;
let wixSettingsClient = wixClientSDK; // ✅ Official settings panel SDK
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
    // Editor client (for fetchWithAuth, dashboard, etc.)
    wixClient = createClient({
      host: editor.host(),
      modules: { widget: editorWidget },
    });

    // Settings panel client (official widget SDK)
    await wixSettingsClient.ready(); // ✅ wait for SDK ready

    // Try to get compId from widget props (persisted site data)
    try {
      const existingCompId = await wixSettingsClient.widget.getProp('compId');
      if (existingCompId) {
        compId = existingCompId as string;
        console.log('[Settings] ✅ Got existing compId from site data:', compId);
      }
    } catch (e) {
      console.log('[Settings] ⚠️ Could not read compId from site data:', e);
    }

    // If no compId exists, generate one and save it to widget props (site data)
    if (!compId) {
      compId = generateCompId();
      console.log('[Settings] 🆕 Generated new compId with timestamp:', compId);

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

    // Fallback: generate compId even if Wix SDK fails
    if (!compId) {
      compId = generateCompId();
      console.log('[Settings] 🔄 Fallback: Generated compId:', compId);
    }

    isInitialized = true;
    return false;
  }
}

export async function updateWidgetConfig(config: Record<string, any>): Promise<boolean> {
  console.log('[Settings] 📤 Updating widget with config:', config);

  if (!wixSettingsClient?.widget?.setProps) {
    console.error('[Settings] ❌ Wix settings SDK or widget.setProps not available');
    return false;
  }

  try {
    // ✅ Use proper types (no stringifying booleans/numbers)
    const props = {
      defaultView: config.defaultView ?? 'map',
      showHeader: !!config.showHeader,
      headerTitle: config.headerTitle ?? 'Our Locations',
      mapZoomLevel: Number(config.mapZoomLevel ?? 12),
      primaryColor: config.primaryColor ?? '#3B82F6',
      showWidgetName: !!config.showWidgetName,
      widgetName: config.widgetName ?? '',
    };

    console.log('[Settings] 📤 Calling widget.setProps with:', props);
    await wixSettingsClient.widget.setProps(props);
    console.log('[Settings] ✅ widget.setProps completed successfully');

    return true;
  } catch (error) {
    console.error('[Settings] ❌ Failed to update widget config:', error);
    return false;
  }
}

// fetchWithAuth and other helpers remain unchanged
