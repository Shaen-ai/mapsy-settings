import { Toaster } from 'react-hot-toast';
import WidgetSettings from './components/WidgetSettings';
import { FiSettings, FiExternalLink } from 'react-icons/fi';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <FiSettings className="h-8 w-8 text-blue-600" />
              <h1 className="ml-3 text-2xl font-bold text-gray-900">
                Mapsy Settings
              </h1>
            </div>
            <div>
              <a
                href="https://mapsy-dashboard.nextechspires.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                Open Dashboard
                <FiExternalLink className="ml-2 h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Widget Configuration
            </h2>
            <WidgetSettings />
          </div>
        </div>

        <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-900">
                Location Management
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Location management features have been moved to the dedicated{' '}
                  <a
                    href="https://mapsy-dashboard.nextechspires.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium underline hover:text-blue-900 inline-flex items-center"
                  >
                    Mapsy Dashboard
                    <FiExternalLink className="ml-1 h-3 w-3" />
                  </a>{' '}
                  for better organization and enhanced functionality.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;