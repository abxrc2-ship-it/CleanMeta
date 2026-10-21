import React, { useState } from 'react';
import {
  Search,
  Star,
  ShieldCheck,
  FileEdit,
  Eye,
  RefreshCw,
  Minimize2,
  SplitSquareVertical,
  Maximize,
  LayoutGrid,
  BookOpen,
  Scissors,
  FileImage,
  Edit3,
  Layers,
  Percent,
  Images,
  PenTool,
  FileText,
  Lock,
  Binary,
  ShieldAlert,
  GitCompare,
  FolderArchive,
  FileCheck2,
  Video,
  Film,
  Share2,
  SlidersHorizontal,
} from 'lucide-react';
import { ALL_TOOLS } from '../lib/toolsRegistry';
import { ToolType, ToolDefinition } from '../types';

interface AllToolsDirectoryProps {
  onSelectTool: (tool: ToolType) => void;
  favorites: string[];
  onToggleFavorite: (toolId: string) => void;
  initialCategory?: string;
}

export const AllToolsDirectory: React.FC<AllToolsDirectoryProps> = ({
  onSelectTool,
  favorites,
  onToggleFavorite,
  initialCategory = 'all',
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);

  const getToolIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShieldCheck': return ShieldCheck;
      case 'FileEdit': return FileEdit;
      case 'Eye': return Eye;
      case 'RefreshCw': return RefreshCw;
      case 'Minimize2': return Minimize2;
      case 'SplitSquareVertical': return SplitSquareVertical;
      case 'Maximize': return Maximize;
      case 'LayoutGrid': return LayoutGrid;
      case 'BookOpen': return BookOpen;
      case 'Scissors': return Scissors;
      case 'FileImage': return FileImage;
      case 'Edit3': return Edit3;
      case 'Layers': return Layers;
      case 'Percent': return Percent;
      case 'Images': return Images;
      case 'PenTool': return PenTool;
      case 'FileText': return FileText;
      case 'Lock': return Lock;
      case 'Binary': return Binary;
      case 'ShieldAlert': return ShieldAlert;
      case 'GitCompare': return GitCompare;
      case 'FolderArchive': return FolderArchive;
      case 'FileCheck2': return FileCheck2;
      case 'Video': return Video;
      case 'Film': return Film;
      case 'Share2': return Share2;
      default: return ShieldCheck;
    }
  };

  const filteredTools = ALL_TOOLS.filter((t) => {
    const matchesCategory =
      selectedCategory === 'all' || t.category === selectedCategory;
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Search & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            CleanMeta Tools Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browse all 26 client-side privacy tools for images, PDFs, files, and upcoming video processors.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search tools (e.g. compress, EXIF, PDF)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-xs"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 border-b border-slate-200 dark:border-slate-800">
        {[
          { id: 'all', label: `All Tools (${ALL_TOOLS.length})` },
          { id: 'image', label: 'Image Tools (7)' },
          { id: 'pdf', label: 'PDF Tools (14)' },
          { id: 'file', label: 'File Tools (2)' },
          { id: 'video', label: 'Video (Coming Soon)' },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTools.map((tool) => {
          const Icon = getToolIcon(tool.icon);
          const isFav = favorites.includes(tool.id);

          return (
            <div
              key={tool.id}
              onClick={() => onSelectTool(tool.id)}
              className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/80 dark:hover:border-blue-500/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer relative"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex items-center gap-1.5">
                    {tool.badge && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        tool.badge === 'New'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : tool.badge === 'Coming Soon'
                          ? 'bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300'
                          : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                      }`}>
                        {tool.badge}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(tool.id);
                      }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-amber-400 transition"
                      title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Star className={`w-4 h-4 ${isFav ? 'text-amber-400 fill-amber-400' : ''}`} />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                  {tool.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {tool.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-semibold text-slate-400">
                <span className="capitalize">{tool.category} Tool</span>
                <span className="text-blue-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                  Launch →
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
