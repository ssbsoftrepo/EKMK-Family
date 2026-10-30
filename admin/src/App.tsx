import React from 'react';
import { ToastProvider } from './context/ToastContext';
import { AdminProvider } from './context/AdminContext';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { Gen1SetupWizard } from './components/Admin/Gen1SetupWizard';
import { useAdmin } from './context/AdminContext';
import { Loader2, TreePine } from 'lucide-react';

/** Inner shell — reads AdminContext to decide which screen to render */
const AppShell: React.FC = () => {
  const { members, isLoading, isBackendConnected, error } = useAdmin();

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-heritage-ivory flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-14 h-14 rounded-2xl bg-heritage-maroon/10 flex items-center justify-center">
              <TreePine className="w-7 h-7 text-heritage-maroon" />
            </div>
          </div>
          <Loader2 className="w-6 h-6 animate-spin text-heritage-gold-600 mx-auto" />
          <p className="text-sm text-heritage-muted font-medium">Loading Family Archive…</p>
        </div>
      </div>
    );
  }

  // Backend connection error
  if (!isBackendConnected || error) {
    return (
      <div className="min-h-screen bg-heritage-ivory flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center mx-auto">
            <TreePine className="w-7 h-7 text-rose-600" />
          </div>
          <h2 className="font-serif text-xl font-bold text-heritage-charcoal">Cannot Connect to Server</h2>
          <p className="text-sm text-heritage-muted">
            The Spring Boot backend is not reachable. Please start the backend server and refresh the page.
          </p>
          {error && (
            <p className="text-xs text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200">{error}</p>
          )}
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-xl bg-heritage-maroon text-[#FAF7EE] text-sm font-semibold hover:bg-heritage-maroon-800 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // No members yet → show Gen 1 Setup Wizard
  if (members.length === 0) {
    return <Gen1SetupWizard />;
  }

  // Normal admin dashboard
  return <AdminDashboard />;
};

export function App() {
  return (
    <ToastProvider>
      <AdminProvider>
        <div className="min-h-screen bg-heritage-ivory text-heritage-charcoal selection:bg-heritage-gold/30 selection:text-heritage-maroon flex flex-col">
          {/* Top Royal Accent Line */}
          <div className="h-1 w-full bg-gradient-to-r from-heritage-maroon via-heritage-gold to-heritage-maroon flex-shrink-0" />
          <AppShell />
        </div>
      </AdminProvider>
    </ToastProvider>
  );
}

export default App;
