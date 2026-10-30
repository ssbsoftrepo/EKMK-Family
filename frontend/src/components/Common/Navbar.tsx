import React, { useState, useEffect } from 'react';
import { useFamily } from '../../context/FamilyContext';
import { 
  TreePine, 
  Users, 
  Home, 
  Search, 
  Menu, 
  X, 
  Sparkles,
  Flame
} from 'lucide-react';
import { ViewTab } from '../../types/family';

export const Navbar: React.FC = () => {
  const { activeTab, setActiveTab, stats, members, locateInTree } = useFamily();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navItems: { id: ViewTab; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Home', icon: <Home className="w-4 h-4" /> },
    { id: 'tree', label: 'Family Tree', icon: <TreePine className="w-4 h-4" /> },
  ];

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const searchResults = searchQuery.trim() === '' ? [] : members.filter(
    (m) =>
      m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.profession && m.profession.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.currentCity && m.currentCity.toLowerCase().includes(searchQuery.toLowerCase()))
  ).slice(0, 6);

  return (
    <header className="sticky top-0 z-50 bg-[#FFFEFB]/95 backdrop-blur-md border-b border-heritage-border shadow-heritage-sm">
      {/* Top ornamental cultural ribbon */}
      <div className="h-1 w-full bg-gradient-to-r from-heritage-maroon via-heritage-gold to-heritage-maroon" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-2.5">
          
          {/* Brand Logo & Title (English Only & Perfectly Aligned) */}
          <button 
            onClick={() => setActiveTab('home')}
            className="flex items-center space-x-2.5 sm:space-x-3 text-left group focus:outline-none flex-shrink-0"
          >
            <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-heritage-maroon-700 via-heritage-maroon-900 to-heritage-maroon p-0.5 shadow-sm group-hover:scale-105 transition-transform flex-shrink-0">
              <div className="w-full h-full rounded-full border border-heritage-gold/60 flex items-center justify-center bg-heritage-maroon-950">
                <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-heritage-gold-300" />
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <span className="font-serif text-lg sm:text-2xl font-bold tracking-tight text-heritage-maroon whitespace-nowrap">
                Erode KMK Family
              </span>
              <p className="text-[10px] sm:text-xs text-heritage-muted font-sans font-medium whitespace-nowrap">
                Heritage & Genealogy Platform
              </p>
            </div>
          </button>

          {/* Desktop Navigation Links (English Only, Centered & Clean) */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2 flex-nowrap">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? 'bg-heritage-maroon text-[#FAF7EE] shadow-sm font-bold'
                      : 'text-heritage-charcoal hover:text-heritage-maroon hover:bg-heritage-cream/60'
                  }`}
                >
                  <span className={isActive ? 'text-heritage-gold-300' : 'text-heritage-muted'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Tools: Search & Member Count Badge */}
          <div className="hidden lg:flex items-center space-x-2.5 flex-shrink-0">
            {/* Quick Search Button */}
            <div className="relative">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="flex items-center space-x-2 px-3 py-1.5 bg-heritage-ivory rounded-xl border border-heritage-border hover:border-heritage-gold text-xs text-heritage-muted hover:text-heritage-charcoal transition-all whitespace-nowrap"
              >
                <Search className="w-3.5 h-3.5 text-heritage-gold-600" />
                <span>Search relative...</span>
              </button>

              {/* Quick Search Popover with Backdrop */}
              {searchOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40 bg-transparent" 
                    onClick={() => setSearchOpen(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-80 bg-[#FFFEFB] border border-heritage-border rounded-xl shadow-heritage-lg p-3 z-50">
                    <div className="relative">
                      <input
                        type="text"
                        autoFocus
                        placeholder="Search by name, profession, city..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-heritage-ivory border border-heritage-border rounded-lg focus:outline-none focus:border-heritage-maroon"
                      />
                      <Search className="w-3.5 h-3.5 text-heritage-muted absolute left-2.5 top-2.5" />
                    </div>

                    {searchResults.length > 0 && (
                      <div className="mt-2 divide-y divide-heritage-border/50 max-h-60 overflow-y-auto">
                        {searchResults.map((m) => (
                          <button
                            key={m.id}
                            onClick={() => {
                              locateInTree(m.id);
                              setSearchOpen(false);
                              setSearchQuery('');
                            }}
                            className="w-full text-left py-2 px-2 hover:bg-heritage-cream/50 rounded-lg flex items-center space-x-2.5 group"
                          >
                            <div className="w-7 h-7 rounded-full overflow-hidden bg-heritage-gold-100 border border-heritage-border flex-shrink-0">
                              {m.photoUrl ? (
                                <img src={m.photoUrl} alt={m.fullName} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-heritage-maroon">
                                  {m.firstName[0]}
                                </div>
                              )}
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-semibold text-heritage-charcoal group-hover:text-heritage-maroon truncate">
                                {m.fullName}
                              </p>
                              <p className="text-[10px] text-heritage-muted truncate">
                                Gen {m.generation} • {m.currentCity || m.birthPlace}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {searchQuery && searchResults.length === 0 && (
                      <p className="text-[11px] text-heritage-muted text-center py-3">
                        No matching family member found
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Total member badge */}
            <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-heritage-gold-50 border border-heritage-gold-200 rounded-xl text-xs font-bold text-heritage-gold-900 whitespace-nowrap">
              <Sparkles className="w-3.5 h-3.5 text-heritage-gold-600" />
              <span>{stats.totalMembers} Members</span>
            </div>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-heritage-charcoal hover:bg-heritage-cream/80 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu with Integrated Search */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-heritage-border bg-[#FFFEFB] px-4 pt-3 pb-5 space-y-3 shadow-heritage-lg">
          
          {/* Mobile Quick Relative Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search relative by name or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-heritage-ivory border border-heritage-border rounded-xl focus:outline-none focus:border-heritage-maroon text-heritage-charcoal"
            />
            <Search className="w-4 h-4 text-heritage-muted absolute left-3 top-3" />

            {/* Mobile Search Instant Results */}
            {searchQuery && searchResults.length > 0 && (
              <div className="mt-2 bg-[#FFFEFB] border border-heritage-border rounded-xl shadow-heritage-sm divide-y divide-heritage-border/50 max-h-52 overflow-y-auto">
                {searchResults.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      locateInTree(m.id);
                      setMobileMenuOpen(false);
                      setSearchQuery('');
                    }}
                    className="w-full text-left p-2.5 hover:bg-heritage-cream/60 flex items-center space-x-3 group"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-heritage-gold-100 flex-shrink-0">
                      {m.photoUrl ? (
                        <img src={m.photoUrl} alt={m.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-heritage-maroon">
                          {m.firstName[0]}
                        </div>
                      )}
                    </div>
                    <div className="truncate flex-1">
                      <p className="text-xs font-semibold text-heritage-charcoal truncate">
                        {m.fullName}
                      </p>
                      <p className="text-[10px] text-heritage-muted truncate">
                        {m.profession || m.currentCity || m.branchName} • Gen {m.generation}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Navigation Links with accessible touch heights */}
          <div className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold min-h-[44px] transition-colors ${
                  activeTab === item.id
                    ? 'bg-heritage-maroon text-[#FAF7EE]'
                    : 'text-heritage-charcoal hover:bg-heritage-cream/60'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-heritage-border flex items-center justify-between text-xs text-heritage-muted">
            <span>Generations: {stats.totalGenerations}</span>
            <span className="font-semibold text-heritage-maroon">{stats.totalMembers} Registered Relatives</span>
          </div>
        </div>
      )}
    </header>
  );
};
