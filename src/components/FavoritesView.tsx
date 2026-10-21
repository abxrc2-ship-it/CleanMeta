import React from 'react';
import { Star, ShieldCheck, ArrowRight } from 'lucide-react';
import { ALL_TOOLS } from '../lib/toolsRegistry';
import { ToolType } from '../types';

interface FavoritesViewProps {
  favorites: string[];
  onSelectTool: (tool: ToolType) => void;
  onToggleFavorite: (toolId: string) => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  favorites,
  onSelectTool,
  onToggleFavorite,
}) => {
  const favoriteTools = ALL_TOOLS.filter((t) => favorites.includes(t.id));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6 flex items-center gap-2">
        <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
          <Star className="w-5 h-5 fill-white" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Favorite Tools
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Your starred quick-access utilities for daily workflow.
          </p>
        </div>
      </div>

      {favoriteTools.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-xs">
          <Star className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">No favorite tools yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Click the star icon on any tool in the All Tools directory to pin it here for instant access.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {favoriteTools.map((tool) => (
            <div
              key={tool.id}
              onClick={() => onSelectTool(tool.id)}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {tool.category} Tool
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(tool.id);
                    }}
                    className="text-amber-400 hover:text-slate-300 transition"
                  >
                    <Star className="w-4 h-4 fill-amber-400" />
                  </button>
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">{tool.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {tool.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-blue-600">
                <span>Launch Tool</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
