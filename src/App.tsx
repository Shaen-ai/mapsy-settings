import { Toaster } from 'react-hot-toast';
import WidgetSettings from './components/WidgetSettings';
import { FiSettings, FiLayout, FiCode } from 'react-icons/fi';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <FiSettings className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Mapsy Widget Settings
                </h1>
                <p className="text-xs text-gray-500">Configure your map widget appearance</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="https://mapsy-widget.nextechspires.com/demo.html"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FiLayout className="mr-1.5 h-3.5 w-3.5" />
                Preview
              </a>
              <a
                href="https://mapsy-dashboard.nextechspires.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1.5 text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-sm"
              >
                <FiCode className="mr-1.5 h-3.5 w-3.5" />
                Dashboard
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-6">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100">
          <WidgetSettings />
        </div>
      </main>
    </div>
  );
}

export default App;