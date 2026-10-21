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
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

          {/* Desktop Left Context (No duplicate logo!) */}
          <div className="hidden lg:flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 pl-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-300 font-bold">
              Local Sandbox Active
            </span>
          </div>
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

        {/* Right Side: Security Pill, Theme Toggle, Avatar */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* 100% Private - In Browser Processing Pill (Matches screenshots!) */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 text-cyan-800 dark:text-cyan-300 text-xs font-semibold shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-cyan-600" />
            <span>100% Private – In Browser Processing</span>
          </div>

          {/* Theme toggle */}
          <button
            onClick={onToggleDarkMode}
            className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
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
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                {user.displayName?.[0] || 'U'}
              </div>
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
    </header>
  );
};
