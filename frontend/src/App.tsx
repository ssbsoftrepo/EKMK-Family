import React from 'react';
import { FamilyProvider, useFamily } from './context/FamilyContext';
import { Navbar } from './components/Common/Navbar';
import { HomePage } from './components/Home/HomePage';
import { FamilyTreeView } from './components/Tree/FamilyTreeView';
import { PersonProfileModal } from './components/Profile/PersonProfileModal';

const MainAppContent: React.FC = () => {
  const { activeTab, selectedMember, setSelectedMember } = useFamily();

  return (
    <div className="min-h-screen flex flex-col bg-heritage-ivory text-heritage-charcoal selection:bg-heritage-gold/30 selection:text-heritage-maroon">
      {/* Top Heritage Navigation Bar */}
      <Navbar />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col">
        {activeTab === 'home' && <HomePage />}
        {activeTab === 'tree' && <FamilyTreeView />}
      </main>

      {/* Slide-over / Modal Detailed Person Profile */}
      {selectedMember && (
        <PersonProfileModal
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </div>
  );
};

export function App() {
  return (
    <FamilyProvider>
      <MainAppContent />
    </FamilyProvider>
  );
}

export default App;
