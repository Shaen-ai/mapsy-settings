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
      const API_URL = import.meta.env.VITE_API_URL || 'https://mapsy-api.nextechspires.com/api';
      const response = await fetch(`${API_URL}/widget-config`);
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      console.error('Error fetching widget config:', error);
    }
  };

  const saveConfig = async () => {
    try {
      setLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || 'https://mapsy-api.nextechspires.com/api';
      const response = await fetch(`${API_URL}/widget-config`, {
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

  const previewUrl = `https://mapsy-widget.nextechspires.com/demo.html?preview=true`;

  return (
    <div className="p-8">
      <div className="space-y-5">
        {/* Default View */}
        <div className="bg-gray-50 rounded-xl p-4">
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">
            Default View
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setConfig({ ...config, defaultView: 'map' })}
              className={`relative px-4 py-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-all ${
                config.defaultView === 'map'
                  ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-md scale-105'
                  : 'border-gray-200 bg-white hover:border-gray-300 text-gray-600'
              }`}
            >
              <FiMap size={18} />
              <span className="font-medium">Map View</span>
              {config.defaultView === 'map' && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setConfig({ ...config, defaultView: 'list' })}
              className={`relative px-4 py-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-all ${
                config.defaultView === 'list'
                  ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-md scale-105'
                  : 'border-gray-200 bg-white hover:border-gray-300 text-gray-600'
              }`}
            >
              <FiList size={18} />
              <span className="font-medium">List View</span>
              {config.defaultView === 'list' && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {/* Header Settings */}
        <div className="bg-gray-50 rounded-xl p-4">
          <label className="flex items-center justify-between cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={config.showHeader}
                  onChange={(e) => setConfig({ ...config, showHeader: e.target.checked })}
                  className="sr-only peer"
                />
                <div className={`w-11 h-6 rounded-full transition-colors ${
                  config.showHeader ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-gray-300'
                }`}>
                  <div className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform shadow-md ${
                    config.showHeader ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Widget Header
                </span>
                <p className="text-xs text-gray-500">Show title bar on widget</p>
              </div>
            </div>
            <div className="text-gray-400 group-hover:text-gray-600 transition-colors">
              {config.showHeader ? (
                <FiEye size={18} />
              ) : (
                <FiEyeOff size={18} />
              )}
            </div>
          </label>
        </div>

        {/* Header Title */}
        {config.showHeader && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100 animate-fadeIn">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">
              Header Title
            </label>
            <input
              type="text"
              value={config.headerTitle}
              onChange={(e) => setConfig({ ...config, headerTitle: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
              placeholder="Enter widget title"
            />
          </div>
        )}

        {/* Map Zoom Level */}
        <div className="bg-gray-50 rounded-xl p-4">
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">
            Map Zoom Level
          </label>
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <input
                type="range"
                min="1"
                max="20"
                value={config.mapZoomLevel}
                onChange={(e) =>
                  setConfig({ ...config, mapZoomLevel: parseInt(e.target.value) })
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, rgb(59 130 246) 0%, rgb(59 130 246) ${(config.mapZoomLevel - 1) * 5.26}%, rgb(229 231 235) ${(config.mapZoomLevel - 1) * 5.26}%, rgb(229 231 235) 100%)`
                }}
              />
            </div>
            <div className="px-3 py-1 bg-white rounded-lg border border-gray-200 min-w-[3rem] text-center">
              <span className="font-semibold text-blue-600">{config.mapZoomLevel}</span>
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>🌍 World</span>
            <span>🏙️ City</span>
            <span>🏘️ Street</span>
          </div>
        </div>

        {/* Primary Color */}
        <div className="bg-gray-50 rounded-xl p-4">
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">
            Theme Color
          </label>
          <div className="flex gap-3">
            <div className="relative">
              <input
                type="color"
                value={config.primaryColor}
                onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                className="h-12 w-12 border-2 border-gray-200 rounded-lg cursor-pointer appearance-none"
                style={{ backgroundColor: config.primaryColor }}
              />
              <div className="absolute inset-0 rounded-lg pointer-events-none"
                style={{
                  background: `linear-gradient(135deg, transparent 50%, ${config.primaryColor}80 50%)`,
                  opacity: 0.3
                }} />
            </div>
            <input
              type="text"
              value={config.primaryColor}
              onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm bg-white"
              placeholder="#3B82F6"
            />
          </div>
          <div className="flex gap-2 mt-3">
            {['#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#EF4444'].map(color => (
              <button
                key={color}
                onClick={() => setConfig({ ...config, primaryColor: color })}
                className="w-8 h-8 rounded-lg border-2 border-gray-200 hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>


        {/* Save Button */}
        <div className="flex justify-end gap-3 pt-6">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Cancel
            </button>
          )}
          <button
            onClick={saveConfig}
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-2 disabled:opacity-50 font-medium shadow-lg hover:shadow-xl"
          >
            <FiSave size={16} />
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WidgetSettings;