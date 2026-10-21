import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Sun,
  Moon,
  Menu,
  X,
  Search,
  Lock,
  User as UserIcon,
  Sliders,
  Check,
  ArrowRight,
} from 'lucide-react';
import { NavigationTab, UserProfile } from '../types';
import { ALL_TOOLS } from '../lib/toolsRegistry';

interface HeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  user: UserProfile | null;
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  onOpenSidebar?: () => void;
  favoritesCount?: number;
  storageMode?: 'local' | 'cloud';
  onToggleStorageMode?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  onToggleDarkMode,
  user,
  activeTab,
  onTabChange,
  onOpenSettings,
  onOpenAuth,
  onOpenSidebar,
  favoritesCount = 0,
  storageMode = 'local',
  onToggleStorageMode,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut Ctrl+K / Cmd+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredTools = searchQuery.trim()
    ? ALL_TOOLS.filter(
        (t) =>
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.category.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 8)
    : [];

  const handleSelectTool = (id: string) => {
    onTabChange(id as NavigationTab);
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/90 dark:border-neutral-800 bg-white/95 dark:bg-black/95 backdrop-blur-md transition-colors">
      <div className="w-full px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Left Side: Mobile Menu Button + Mobile Brand Logo */}
        <div className="flex items-center gap-3 shrink-0">
          {onOpenSidebar && (
            <button
              onClick={onOpenSidebar}
              className="lg:hidden w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              aria-label="Open navigation sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Logo is ONLY rendered on screens where Sidebar is hidden (lg:hidden). On desktop, Sidebar already renders the CleanMeta logo on the left! */}
          <div
            onClick={() => onTabChange('home')}
            className="flex lg:hidden items-center gap-2 cursor-pointer select-none"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
              CleanMeta
            </span>
          </div>

          {/* Interactive Server / Local Mode Indicator (Sleek Green / Red Dot) */}
          {onToggleStorageMode && (
            <button
              type="button"
              onClick={onToggleStorageMode}
              title={
                storageMode === 'local'
                  ? 'Local Sandbox (Green) • In-Browser RAM. Click to switch to Web Server.'
                  : 'Web Server (Red) • Cloud Server 1 GB. Click to switch to Local Sandbox.'
              }
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition cursor-pointer border hover:scale-105 ${
                storageMode === 'local'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
              }`}
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    storageMode === 'local' ? 'bg-emerald-400' : 'bg-rose-400'
                  }`}
                ></span>
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    storageMode === 'local' ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                ></span>
              </span>
              <span className="font-semibold text-[11px]">
                {storageMode === 'local' ? 'Local' : 'Web Server'}
              </span>
            </button>
          )}
        </div>

        {/* Center: Main Nav Links (Matches screenshots: Home, All Tools, Pricing, Help, About) */}
        <nav className="hidden xl:flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300">
          <button
            onClick={() => onTabChange('home')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'home'
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-extrabold'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Home
          </button>

          <button
            onClick={() => onTabChange('all-tools')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'all-tools'
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-extrabold'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Tools
          </button>

          <button
            onClick={() => onTabChange('pricing')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'pricing'
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-extrabold'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Pricing
          </button>

          <button
            onClick={() => onTabChange('help')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'help'
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-extrabold'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Help
          </button>

          <button
            onClick={() => onTabChange('about')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'about'
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-extrabold'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            About
          </button>
        </nav>

        {/* Center-Right: WIDE & COMFORTABLE Global Search with Ctrl+K shortcut */}
        <div ref={searchContainerRef} className="relative flex-1 max-w-md lg:max-w-lg xl:max-w-xl mx-2 hidden sm:block">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search tools (e.g. PDF Viewer, EXIF remover, Edit, Merge, Sign...)"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              className="w-full pl-10 pr-20 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchOpen(false);
                }}
                className="absolute right-14 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs px-1"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-mono text-[10px] text-slate-500 dark:text-slate-400 font-bold shadow-2xs pointer-events-none">
              Ctrl K
            </kbd>
          </div>

          {/* Search Dropdown Results */}
          {isSearchOpen && searchQuery.trim() && (
            <div className="absolute top-full left-0 right-0 mt-2 p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 max-h-96 overflow-y-auto">
              {filteredTools.length > 0 ? (
                <div className="space-y-1">
                  {filteredTools.map((tool) => (
                    <div
                      key={tool.id}
                      onClick={() => handleSelectTool(tool.id)}
                      className="p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition cursor-pointer flex items-center justify-between group"
                    >
                      <div className="flex-1 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {tool.title}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono font-semibold uppercase">
                            {tool.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                          {tool.description}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-500">
                  No tools found for "{searchQuery}". Try "PDF", "Metadata", "EXIF", or "Sign".
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Search Icon on Mobile, Theme Toggle, Avatar */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Mobile Search Toggle Button */}
          <button
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            className="sm:hidden w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Toggle search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Mobile compact storage status button */}
          {onToggleStorageMode && (
            <button
              type="button"
              onClick={onToggleStorageMode}
              className={`sm:hidden flex items-center justify-center w-8 h-8 rounded-xl border transition cursor-pointer ${
                storageMode === 'local'
                  ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600'
                  : 'border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 text-rose-600'
              }`}
              title={storageMode === 'local' ? 'Local Sandbox - Click to switch' : 'Web Server - Click to switch'}
            >
              <span className="relative flex h-2.5 w-2.5">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    storageMode === 'local' ? 'bg-emerald-400' : 'bg-rose-400'
                  }`}
                ></span>
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    storageMode === 'local' ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                ></span>
              </span>
            </button>
          )}

          {/* Desktop Right Mode Badge */}
          {onToggleStorageMode && (
            <button
              type="button"
              onClick={onToggleStorageMode}
              className={`hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold shadow-2xs hover:scale-105 transition cursor-pointer ${
                storageMode === 'local'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
              }`}
              title="Click to toggle Local Sandbox vs Web Server"
            >
              <ShieldCheck className={`w-4 h-4 ${storageMode === 'local' ? 'text-emerald-600' : 'text-rose-600'}`} />
              <span>{storageMode === 'local' ? '100% Private (Local RAM)' : 'Web Server Vault'}</span>
            </button>
          )}

          {/* Theme toggle */}
          <button
            onClick={onToggleDarkMode}
            className="w-8 sm:w-9 h-8 sm:h-9 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title={darkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Profile Avatar / Sign In */}
          {user ? (
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Profile'}
                  className="w-7 h-7 rounded-full object-cover border border-blue-500"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  {user.displayName?.[0] || 'U'}
                </div>
              )}
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 hidden sm:inline max-w-[90px] truncate">
                {user.displayName?.split(' ')[0] || 'Account'}
              </span>
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Sign in / Account"
            >
              <UserIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Expandable Mobile Search Drawer */}
      {isMobileSearchOpen && (
        <div className="sm:hidden px-4 pb-3 pt-1 border-t border-slate-100 dark:border-neutral-800 bg-white dark:bg-black animate-in slide-in-from-top-2">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              autoFocus
              placeholder="Search all 23 tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-9 py-2 rounded-xl bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {searchQuery.trim() && (
            <div className="mt-2 p-1.5 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 max-h-60 overflow-y-auto space-y-1">
              {filteredTools.length > 0 ? (
                filteredTools.map((tool) => (
                  <div
                    key={tool.id}
                    onClick={() => {
                      handleSelectTool(tool.id);
                      setIsMobileSearchOpen(false);
                    }}
                    className="p-2.5 rounded-lg hover:bg-white dark:hover:bg-neutral-800 transition flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <p className="font-bold text-xs text-slate-900 dark:text-white">
                        {tool.title}
                      </p>
                      <p className="text-[10px] text-slate-400 line-clamp-1">{tool.description}</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                ))
              ) : (
                <p className="p-3 text-center text-xs text-slate-400">No matching tools</p>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
};
