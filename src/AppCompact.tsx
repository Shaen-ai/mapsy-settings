import { Toaster } from 'react-hot-toast';
import WidgetSettingsCompact from './components/WidgetSettingsCompact';

function AppCompact() {
  return (
    <div className="w-full h-full bg-white" style={{ width: '300px', height: '400px', overflow: 'hidden' }}>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            fontSize: '12px',
            padding: '6px 10px',
          },
        }}
      />
      <WidgetSettingsCompact />
    </div>
  );
}

export default AppCompact;