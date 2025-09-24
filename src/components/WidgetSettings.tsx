import { useState, useEffect } from 'react';
import { FiSave, FiEye, FiEyeOff, FiMap, FiList } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface WidgetConfig {
  defaultView: 'map' | 'list';
  showHeader: boolean;
  headerTitle: string;
  mapZoomLevel: number;
  primaryColor: string;
}

interface WidgetSettingsProps {
  onClose?: () => void;
}

const WidgetSettings: React.FC<WidgetSettingsProps> = ({ onClose }) => {
  const [config, setConfig] = useState<WidgetConfig>({
    defaultView: 'map',
    showHeader: true,
    headerTitle: 'Our Locations',
    mapZoomLevel: 12,
    primaryColor: '#3B82F6',
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/widget-config');
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      console.error('Error fetching widget config:', error);
    }
  };

  const saveConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/widget-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        toast.success('Widget settings saved successfully');
        if (onClose) onClose();
      } else {
        toast.error('Failed to save widget settings');
      }
    } catch (error) {
      toast.error('Error saving widget settings');
      console.error('Error saving widget config:', error);
    } finally {
      setLoading(false);
    }
  };

  const previewUrl = `http://localhost:5174?preview=true`;

  return (
    <div className="bg-white rounded-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Widget Settings</h2>

      <div className="space-y-6">
        {/* Default View */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default View
          </label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setConfig({ ...config, defaultView: 'map' })}
              className={`flex-1 px-4 py-2 rounded-lg border-2 flex items-center justify-center gap-2 transition ${
                config.defaultView === 'map'
                  ? 'border-blue-600 bg-blue-50 text-blue-600'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <FiMap size={20} />
              <span>Map View</span>
            </button>
            <button
              type="button"
              onClick={() => setConfig({ ...config, defaultView: 'list' })}
              className={`flex-1 px-4 py-2 rounded-lg border-2 flex items-center justify-center gap-2 transition ${
                config.defaultView === 'list'
                  ? 'border-blue-600 bg-blue-50 text-blue-600'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <FiList size={20} />
              <span>List View</span>
            </button>
          </div>
        </div>

        {/* Header Settings */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.showHeader}
              onChange={(e) => setConfig({ ...config, showHeader: e.target.checked })}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Show Widget Header
            </span>
            {config.showHeader ? (
              <FiEye size={18} className="text-gray-500" />
            ) : (
              <FiEyeOff size={18} className="text-gray-500" />
            )}
          </label>
        </div>

        {/* Header Title */}
        {config.showHeader && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Header Title
            </label>
            <input
              type="text"
              value={config.headerTitle}
              onChange={(e) => setConfig({ ...config, headerTitle: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter header title"
            />
          </div>
        )}

        {/* Map Zoom Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default Map Zoom Level
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="20"
              value={config.mapZoomLevel}
              onChange={(e) =>
                setConfig({ ...config, mapZoomLevel: parseInt(e.target.value) })
              }
              className="flex-1"
            />
            <span className="w-12 text-center font-medium">{config.mapZoomLevel}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>World</span>
            <span>City</span>
            <span>Street</span>
          </div>
        </div>

        {/* Primary Color */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Primary Color
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={config.primaryColor}
              onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
              className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
            />
            <input
              type="text"
              value={config.primaryColor}
              onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="#3B82F6"
            />
          </div>
        </div>

        {/* Preview Section */}
        <div className="pt-4 border-t">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium text-gray-700">Widget Preview</h3>
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              Open in new tab
            </a>
          </div>
          <div className="border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
            <iframe
              src={previewUrl}
              className="w-full h-96"
              title="Widget Preview"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          )}
          <button
            onClick={saveConfig}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
          >
            <FiSave size={18} />
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WidgetSettings;