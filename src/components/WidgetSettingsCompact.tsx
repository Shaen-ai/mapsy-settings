import { useState, useEffect } from 'react';
import { FiSave, FiRefreshCw, FiMap, FiList, FiEye, FiEyeOff } from 'react-icons/fi';
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/widget-config`);
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

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/widget-config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        toast.success('Settings saved!');
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
    <div className="h-full flex flex-col p-4">
      {/* Header */}
      <div className="mb-4 pb-3 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Widget Settings</h2>
      </div>

      {/* Settings Form - Scrollable */}
      <div className="flex-1 overflow-y-auto pr-2" style={{ maxHeight: '310px' }}>
        {/* Default View */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Default View
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setConfig({ ...config, defaultView: 'map' })}
              className={`flex-1 flex items-center justify-center px-3 py-2 text-xs rounded-md border transition-colors ${
                config.defaultView === 'map'
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FiMap className="mr-1.5 h-3 w-3" />
              Map
            </button>
            <button
              onClick={() => setConfig({ ...config, defaultView: 'list' })}
              className={`flex-1 flex items-center justify-center px-3 py-2 text-xs rounded-md border transition-colors ${
                config.defaultView === 'list'
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FiList className="mr-1.5 h-3 w-3" />
              List
            </button>
          </div>
        </div>

        {/* Show Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-700">
              Show Header
            </label>
            <button
              onClick={() => setConfig({ ...config, showHeader: !config.showHeader })}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                config.showHeader ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.showHeader ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Header Title */}
        {config.showHeader && (
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Header Title
            </label>
            <input
              type="text"
              value={config.headerTitle}
              onChange={(e) => setConfig({ ...config, headerTitle: e.target.value })}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter header title"
            />
          </div>
        )}

        {/* Map Zoom Level */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Map Zoom Level
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="8"
              max="18"
              value={config.mapZoomLevel}
              onChange={(e) => setConfig({ ...config, mapZoomLevel: parseInt(e.target.value) })}
              className="flex-1"
            />
            <span className="text-xs font-medium text-gray-600 w-6 text-center">
              {config.mapZoomLevel}
            </span>
          </div>
        </div>

        {/* Primary Color */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Primary Color
          </label>
          <div className="flex gap-2">
            {colorOptions.map((color) => (
              <button
                key={color.value}
                onClick={() => setConfig({ ...config, primaryColor: color.value })}
                className={`relative w-8 h-8 rounded-md ${color.class} transition-transform ${
                  config.primaryColor === color.value ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : ''
                }`}
                title={color.label}
              >
                {config.primaryColor === color.value && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
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

        {/* Preview Section */}
        <div className="mb-4 p-3 bg-gray-50 rounded-md border border-gray-200">
          <h3 className="text-xs font-medium text-gray-700 mb-2">Preview Settings</h3>
          <div className="space-y-1 text-xs text-gray-600">
            <div className="flex items-center">
              {config.defaultView === 'map' ? <FiMap className="mr-1.5 h-3 w-3" /> : <FiList className="mr-1.5 h-3 w-3" />}
              <span>Default: {config.defaultView === 'map' ? 'Map View' : 'List View'}</span>
            </div>
            <div className="flex items-center">
              {config.showHeader ? <FiEye className="mr-1.5 h-3 w-3" /> : <FiEyeOff className="mr-1.5 h-3 w-3" />}
              <span>Header: {config.showHeader ? `"${config.headerTitle}"` : 'Hidden'}</span>
            </div>
            <div>Zoom: Level {config.mapZoomLevel}</div>
            <div className="flex items-center">
              <span>Color:</span>
              <span
                className="ml-1.5 inline-block w-3 h-3 rounded"
                style={{ backgroundColor: config.primaryColor }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button - Fixed at bottom */}
      <div className="mt-auto pt-3 border-t border-gray-200">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? (
            <>
              <FiRefreshCw className="animate-spin mr-2 h-4 w-4" />
              Saving...
            </>
          ) : (
            <>
              <FiSave className="mr-2 h-4 w-4" />
              Save Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default WidgetSettingsCompact;