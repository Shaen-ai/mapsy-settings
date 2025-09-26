import { useState, useEffect } from 'react';
import { FiSave, FiRefreshCw, FiMap, FiList, FiExternalLink } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface WidgetConfig {
  defaultView: 'map' | 'list';
  showHeader: boolean;
  headerTitle: string;
  mapZoomLevel: number;
  primaryColor: string;
}

const colorOptions = [
  { value: '#3B82F6', label: 'Blue', class: 'bg-blue-500' },
  { value: '#10B981', label: 'Green', class: 'bg-green-500' },
  { value: '#8B5CF6', label: 'Purple', class: 'bg-purple-500' },
  { value: '#EF4444', label: 'Red', class: 'bg-red-500' },
  { value: '#F59E0B', label: 'Amber', class: 'bg-amber-500' },
];

function WidgetSettingsCompact() {
  const [config, setConfig] = useState<WidgetConfig>({
    defaultView: 'map',
    showHeader: false,
    headerTitle: 'Our Locations',
    mapZoomLevel: 12,
    primaryColor: '#3B82F6',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || 'https://mapsy-api.nextechspires.com/api';
      const response = await fetch(`${API_URL}/widget-config`);
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      console.error('Error fetching config:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  // Broadcast config changes for real-time updates
  const broadcastConfigChange = (updatedConfig: WidgetConfig) => {
    console.log('[Settings] Broadcasting config change:', updatedConfig);

    // Store in localStorage for persistence
    localStorage.setItem('mapsy-widget-config', JSON.stringify(updatedConfig));
    console.log('[Settings] Saved to localStorage:', localStorage.getItem('mapsy-widget-config'));

    // Create a global config updater if it doesn't exist
    if (!(window as any).__mapsyConfigListeners) {
      (window as any).__mapsyConfigListeners = [];
    }

    // Call all registered listeners
    const listeners = (window as any).__mapsyConfigListeners;
    console.log(`[Settings] Calling ${listeners.length} registered listeners`);
    listeners.forEach((listener: (config: WidgetConfig) => void) => {
      try {
        listener(updatedConfig);
      } catch (error) {
        console.error('[Settings] Error calling listener:', error);
      }
    });

    // Also try parent window's listeners
    if (window.parent && window.parent !== window && (window.parent as any).__mapsyConfigListeners) {
      const parentListeners = (window.parent as any).__mapsyConfigListeners;
      console.log(`[Settings] Calling ${parentListeners.length} parent window listeners`);
      parentListeners.forEach((listener: (config: WidgetConfig) => void) => {
        try {
          listener(updatedConfig);
        } catch (error) {
          console.error('[Settings] Error calling parent listener:', error);
        }
      });
    }

    // Also try top window's listeners
    if (window.top && window.top !== window && (window.top as any).__mapsyConfigListeners) {
      const topListeners = (window.top as any).__mapsyConfigListeners;
      console.log(`[Settings] Calling ${topListeners.length} top window listeners`);
      topListeners.forEach((listener: (config: WidgetConfig) => void) => {
        try {
          listener(updatedConfig);
        } catch (error) {
          console.error('[Settings] Error calling top listener:', error);
        }
      });
    }

    // Dispatch custom event on window for same-window communication
    const event = new CustomEvent('mapsy-config-update', {
      detail: updatedConfig,
      bubbles: true,
      composed: true
    });
    window.dispatchEvent(event);
    console.log('[Settings] Dispatched CustomEvent on window');
  };

  // Update config and broadcast changes
  const updateConfigWithBroadcast = (newConfig: WidgetConfig) => {
    console.log('[Settings] updateConfigWithBroadcast called with:', newConfig);
    setConfig(newConfig);
    broadcastConfigChange(newConfig);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const API_URL = import.meta.env.VITE_API_URL || 'https://mapsy-api.nextechspires.com/api';
      const response = await fetch(`${API_URL}/widget-config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        toast.success('Settings saved!');
        // Broadcast the saved config
        broadcastConfigChange(config);
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <FiRefreshCw className="animate-spin h-6 w-6 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-3 bg-gradient-to-br from-gray-50 to-white">
      {/* Header with Dashboard Button */}
      <div className="mb-3 pb-2 border-b border-gray-100 flex items-center justify-end">
        <a
          href="https://mapsy-dashboard.nextechspires.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-2 py-1 text-xs bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md hover:from-blue-700 hover:to-purple-700 transition-all"
        >
          <FiExternalLink className="mr-1 h-3 w-3" />
          Dashboard
        </a>
      </div>

      {/* Settings Form - Scrollable */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3" style={{ maxHeight: '310px' }}>
        {/* Default View */}
        <div className="bg-white/70 rounded-lg p-2.5 border border-gray-100">
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Default View
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => updateConfigWithBroadcast({ ...config, defaultView: 'map' })}
              className={`flex items-center justify-center px-2 py-1.5 text-xs rounded-md border transition-all ${
                config.defaultView === 'map'
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-400 text-blue-700 font-medium shadow-sm'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <FiMap className="mr-1 h-3 w-3" />
              Map
            </button>
            <button
              onClick={() => updateConfigWithBroadcast({ ...config, defaultView: 'list' })}
              className={`flex items-center justify-center px-2 py-1.5 text-xs rounded-md border transition-all ${
                config.defaultView === 'list'
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-400 text-blue-700 font-medium shadow-sm'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <FiList className="mr-1 h-3 w-3" />
              List
            </button>
          </div>
        </div>

        {/* Show Header */}
        <div className="bg-white/70 rounded-lg p-2.5 border border-gray-100">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-600">
              Show Widget Header
            </label>
            <button
              onClick={() => updateConfigWithBroadcast({ ...config, showHeader: !config.showHeader })}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all ${
                config.showHeader ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                  config.showHeader ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Header Title */}
        {config.showHeader && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-2.5 border border-blue-100 animate-fadeIn">
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Header Title
            </label>
            <input
              type="text"
              value={config.headerTitle}
              onChange={(e) => updateConfigWithBroadcast({ ...config, headerTitle: e.target.value })}
              className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white/80"
              placeholder="Enter title"
            />
          </div>
        )}

        {/* Map Zoom Level */}
        <div className="bg-white/70 rounded-lg p-2.5 border border-gray-100">
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Zoom Level
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="8"
              max="18"
              value={config.mapZoomLevel}
              onChange={(e) => updateConfigWithBroadcast({ ...config, mapZoomLevel: parseInt(e.target.value) })}
              className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, rgb(59 130 246) 0%, rgb(59 130 246) ${((config.mapZoomLevel - 8) * 10)}%, rgb(229 231 235) ${((config.mapZoomLevel - 8) * 10)}%, rgb(229 231 235) 100%)`
              }}
            />
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
              {config.mapZoomLevel}
            </span>
          </div>
        </div>

        {/* Primary Color */}
        <div className="bg-white/70 rounded-lg p-2.5 border border-gray-100">
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Theme Color
          </label>
          <div className="flex gap-1.5">
            {colorOptions.map((color) => (
              <button
                key={color.value}
                onClick={() => updateConfigWithBroadcast({ ...config, primaryColor: color.value })}
                className={`relative w-7 h-7 rounded-md ${color.class} transition-all hover:scale-110 ${
                  config.primaryColor === color.value ? 'ring-2 ring-offset-1 ring-blue-400 scale-110' : ''
                }`}
                title={color.label}
              >
                {config.primaryColor === color.value && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Save Button - Fixed at bottom */}
      <div className="mt-auto pt-2 border-t border-gray-100">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
        >
          {saving ? (
            <>
              <FiRefreshCw className="animate-spin mr-1.5 h-3.5 w-3.5" />
              Saving...
            </>
          ) : (
            <>
              <FiSave className="mr-1.5 h-3.5 w-3.5" />
              Save Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default WidgetSettingsCompact;