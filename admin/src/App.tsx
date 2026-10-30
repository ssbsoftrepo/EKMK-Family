import React from 'react';
import { AdminProvider } from './context/AdminContext';
import { AdminDashboard } from './components/Admin/AdminDashboard';

export function App() {
  return (
    <AdminProvider>
      <div className="min-h-screen bg-heritage-ivory text-heritage-charcoal selection:bg-heritage-gold/30 selection:text-heritage-maroon flex flex-col">
        {/* Top Royal Accent Line */}
        <div className="h-1 w-full bg-gradient-to-r from-heritage-maroon via-heritage-gold to-heritage-maroon" />
        <AdminDashboard />
      </div>
    </AdminProvider>
  );
}

export default App;
