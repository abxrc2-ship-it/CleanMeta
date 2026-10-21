import React from 'react';
import {
  Home,
  Image as ImageIcon,
  FileText,
  FolderArchive,
  LayoutGrid,
  Video,
  FolderLock,
  History,
  Star,
  Settings,
  ShieldCheck,
  Lock,
  X,
} from 'lucide-react';
import { NavigationTab } from '../types';

interface SidebarProps {
  activeTab: NavigationTab;
  onNavigate: (tab: NavigationTab) => void;
  favoritesCount?: number;
  isOpen?: boolean;
  onClose?: () => void;
  storageMode?: 'local' | 'cloud';
  onToggleStorageMode?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onNavigate,
  favoritesCount = 0,
  isOpen = false,
  onClose,
  storageMode = 'local',
  onToggleStorageMode,
}) => {
  const isImageTab =
    activeTab === 'image-tools' ||
    [
      'metadata-remover',
      'metadata-editor',
      'metadata-viewer',
      'converter',
      'compressor',
      'image-compare',
      'image-resizer',
    ].includes(activeTab);

  const isPdfTab =
    activeTab === 'pdf-tools' || activeTab.startsWith('pdf-') || activeTab === 'images-to-pdf';

  const isFileTab = activeTab === 'file-tools' || activeTab.startsWith('file-');

  interface NavItem {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    isSoon?: boolean;
    active?: boolean;
  }

  const navItems: { group: string; items: NavItem[] }[] = [
    {
      group: 'WORKSPACE',
      items: [
        { id: 'home', label: 'Home', icon: Home, active: activeTab === 'home' },
        { id: 'image-tools', label: 'Image Tools', icon: ImageIcon, badge: '6', active: isImageTab },
        { id: 'pdf-tools', label: 'PDF Tools', icon: FileText, badge: '14', active: isPdfTab },
        { id: 'file-tools', label: 'File Tools', icon: FolderArchive, badge: '2', active: isFileTab },
        { id: 'all-tools', label: 'All Tools', icon: LayoutGrid, active: activeTab === 'all-tools' },
        { id: 'video-tools', label: 'Video Tools', icon: Video, badge: 'Soon', isSoon: true, active: activeTab === 'video-tools' },
      ],
    },
    {
      group: 'ACCOUNT',
      items: [
        { id: 'my-files', label: 'My Files', icon: FolderLock, active: activeTab === 'my-files' },
        { id: 'history', label: 'Processing History', icon: History, active: activeTab === 'history' },
        {
          id: 'favorites',
          label: 'Favorites',
          icon: Star,
          badge: favoritesCount > 0 ? String(favoritesCount) : undefined,
          active: activeTab === 'favorites',
        },
        {
          id: 'settings',
          label: 'Account / Settings',
          icon: Settings,
          badge: storageMode === 'local' ? 'Local' : '1 GB Cloud',
          active: activeTab === 'settings' || (activeTab as string) === 'account',
        },
        {
          id: 'admin',
          label: 'Admin Portal',
          icon: Lock,
          badge: 'Owner',
          active: activeTab === 'admin',
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Panel (240px wide) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-60 bg-white dark:bg-black border-r border-slate-200 dark:border-neutral-800 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Logo Header */}
          <div className="h-16 px-5 border-b border-slate-100 dark:border-neutral-800 flex items-center justify-between select-none">
            <div
              onClick={() => {
                onNavigate('home');
                if (onClose) onClose();
              }}
              className="flex items-center gap-2.5 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                  CleanMeta
                </span>
              </div>
            </div>

            {/* Close button on mobile */}
            {onClose && (
              <button
                onClick={onClose}
                className="lg:hidden w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Navigation Groups */}
          <div className="px-3 py-4 space-y-6 text-left">
            {navItems.map((group) => (
              <div key={group.group}>
                <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2">
                  {group.group}
                </span>
                <nav className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.active;

                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onNavigate(item.id as NavigationTab);
                          if (onClose) onClose();
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-xs font-bold'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon
                            className={`w-4 h-4 ${
                              isActive
                                ? 'text-white'
                                : 'text-slate-400 dark:text-slate-500'
                            }`}
                          />
                          <span>{item.label}</span>
                        </div>

                        {item.badge && (
                          <span
                            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : item.isSoon
                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Persistent Interactive Engine Status Card */}
        <div className="p-3 border-t border-slate-100 dark:border-neutral-800">
          <div
            onClick={onToggleStorageMode}
            className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col gap-1 text-left ${
              storageMode === 'local'
                ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 hover:border-emerald-400'
                : 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 hover:border-rose-400'
            }`}
            title="Click to toggle between Local Sandbox (Offline) and Web Server (1 GB Cloud Vault)"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <span className="relative flex h-2 w-2">
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
                <span
                  className={
                    storageMode === 'local'
                      ? 'text-emerald-900 dark:text-emerald-300'
                      : 'text-rose-900 dark:text-rose-300'
                  }
                >
                  {storageMode === 'local' ? 'Local Sandbox' : 'Web Server'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Switch ⇄</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-neutral-400 leading-relaxed">
              {storageMode === 'local'
                ? 'RAM only, 100% private offline.'
                : '1 GB Cloud Vault & Auto-Purge active.'}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
