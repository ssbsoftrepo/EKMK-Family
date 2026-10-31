import React from 'react';
import { ToastProvider } from './context/ToastContext';
import { AdminProvider, useAdmin } from './context/AdminContext';
import { SetupShell } from './components/Setup/SetupShell';

/** Shows a friendly message while loading or when the server can't be reached; otherwise the admin steps. */
const AppShell: React.FC = () => {
  const { isLoading, isBackendConnected, error } = useAdmin();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-album-paper text-album-leaf font-album flex flex-col items-center justify-center gap-2 p-6 text-center">
        <span className="font-hand text-3xl text-album-terracotta">just a moment…</span>
        <span className="text-xl font-bold">Opening the family admin</span>
      </div>
    );
  }

  if (!isBackendConnected || error) {
    return (
      <div className="min-h-screen bg-album-paper text-album-leaf font-album flex flex-col items-center justify-center gap-3 p-6 text-center">
        <span className="font-hand text-3xl text-album-terracotta">oops</span>
        <h1 className="m-0 font-album text-2xl font-extrabold" style={{ letterSpacing: 0 }}>The family server isn't answering</h1>
        <p className="m-0 text-lg max-w-[460px]">Please check that the backend is running, then try again.</p>
        {error && <p className="m-0 text-[15px] bg-white rounded-2xl px-4 py-2.5 max-w-[460px] break-words">{error}</p>}
        <button type="button" onClick={() => window.location.reload()}
          className="min-h-[56px] px-6 rounded-2xl bg-album-terracotta text-white font-extrabold text-lg">
          Try again
        </button>
      </div>
    );
  }

  return <SetupShell />;
};

export function App() {
  return (
    <ToastProvider>
      <AdminProvider>
        <div className="min-h-screen flex flex-col">
          <AppShell />
        </div>
      </AdminProvider>
    </ToastProvider>
  );
}

export default App;
