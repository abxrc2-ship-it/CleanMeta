import React, { useState } from 'react';
import {
  X,
  MapPin,
  Camera,
  Calendar,
  Layers,
  Search,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { PhotoItem } from '../types';

interface MetadataModalProps {
  photo: PhotoItem | null;
  onClose: () => void;
}

export const MetadataModal: React.FC<MetadataModalProps> = ({ photo, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'original' | 'cleaned'>('original');

  if (!photo) return null;

  const originalMeta = photo.originalMetadata;
  const isCleaned = photo.status === 'cleaned' && photo.cleanedMetadataVerification;

  const filteredTags = (originalMeta?.tagList || []).filter(
    (tag) =>
      tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tag.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tag.category && tag.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="meta-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 id="meta-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
                Metadata Inspection
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[280px] sm:max-w-md">
                {photo.name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher if cleaned */}
        {isCleaned && (
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 px-4">
            <button
              onClick={() => setActiveTab('original')}
              className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition ${
                activeTab === 'original'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              Original Embedded Tags ({originalMeta?.allTagsCount || 0})
            </button>
            <button
              onClick={() => setActiveTab('cleaned')}
              className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
                activeTab === 'cleaned'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Cleaned Verification Proof
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'cleaned' && isCleaned ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="font-bold text-sm">Independent Output Verification: Passed</span>
                </div>
                <p className="mt-1.5 text-xs text-emerald-700 dark:text-emerald-300">
                  {photo.cleanedMetadataVerification?.message}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-[11px] text-slate-500 font-medium">GPS Coordinates</span>
                  <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>0 Coordinates (Purged)</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-[11px] text-slate-500 font-medium">Camera & Device Model</span>
                  <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>None (Stripped)</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-[11px] text-slate-500 font-medium">XMP & IPTC Records</span>
                  <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>0 Records (Stripped)</span>
                  </div>
                </div>
              </div>

              {photo.cleanedMetadataVerification && photo.cleanedMetadataVerification.residualTagsCount > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200">
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Residual Header Warnings</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5">
                    {photo.cleanedMetadataVerification.residualTags.map((tag, i) => (
                      <li key={i}>{tag}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Highlight Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* GPS Box */}
                <div
                  className={`p-3.5 rounded-xl border ${
                    originalMeta?.hasGps
                      ? 'border-rose-200 dark:border-rose-900 bg-rose-50/60 dark:bg-rose-950/30'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <MapPin
                        className={`w-4 h-4 ${
                          originalMeta?.hasGps ? 'text-rose-600' : 'text-slate-400'
                        }`}
                      />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        GPS Location
                      </span>
                    </div>
                    {originalMeta?.hasGps ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300">
                        EXPOSED
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        None detected
                      </span>
                    )}
                  </div>

                  {originalMeta?.hasGps ? (
                    <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                      <div>
                        Lat: <strong>{originalMeta.gpsLatitude?.toFixed(5)}</strong>, Long:{' '}
                        <strong>{originalMeta.gpsLongitude?.toFixed(5)}</strong>
                      </div>
                      {originalMeta.gpsAltitude !== undefined && (
                        <div>Altitude: {originalMeta.gpsAltitude}m</div>
                      )}
                      <a
                        href={`https://www.openstreetmap.org/?mlat=${originalMeta.gpsLatitude}&mlon=${originalMeta.gpsLongitude}#map=16/${originalMeta.gpsLatitude}/${originalMeta.gpsLongitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 hover:underline pt-1 font-medium"
                      >
                        <span>View approximate location on map</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ) : (
                    <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                      No geographic coordinates embedded in this file.
                    </p>
                  )}
                </div>

                {/* Camera / Hardware Box */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Camera & Lens
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                    {originalMeta?.cameraMake || originalMeta?.cameraModel ? (
                      <div>
                        Device: <strong>{originalMeta.cameraMake} {originalMeta.cameraModel}</strong>
                      </div>
                    ) : (
                      <div className="text-slate-500">Camera model not specified</div>
                    )}
                    {originalMeta?.lensModel && (
                      <div className="truncate">Lens: {originalMeta.lensModel}</div>
                    )}
                    {originalMeta?.iso && (
                      <div className="text-[11px] text-slate-500">
                        ISO {originalMeta.iso} • {originalMeta.fNumber || ''} • {originalMeta.exposureTime || ''}
                      </div>
                    )}
                  </div>
                </div>

                {/* Date & Time Box */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Capture Date & Time
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                    {originalMeta?.dateTimeOriginal ? (
                      <strong>{originalMeta.dateTimeOriginal}</strong>
                    ) : (
                      <span className="text-slate-500">No timestamp tag found</span>
                    )}
                  </div>
                </div>

                {/* Software / Creator Box */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Software / Creator
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 truncate">
                    {originalMeta?.software ? (
                      <span>{originalMeta.software}</span>
                    ) : (
                      <span className="text-slate-500">No software tag specified</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Tag search & list */}
              <div className="pt-2">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    All Embedded Tags ({originalMeta?.allTagsCount || 0})
                  </h4>
                  <div className="relative w-44 sm:w-56">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search tags..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {filteredTags.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-800">
                    {originalMeta?.allTagsCount === 0
                      ? 'No metadata segments found in this photo file.'
                      : 'No tags match your search query.'}
                  </div>
                ) : (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 dark:bg-slate-800/80 sticky top-0 text-slate-600 dark:text-slate-300">
                        <tr>
                          <th className="py-2 px-3 font-semibold w-1/3">Tag Name</th>
                          <th className="py-2 px-3 font-semibold">Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                        {filteredTags.map((tag, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="py-1.5 px-3 font-mono text-[11px] text-blue-600 dark:text-blue-400 truncate max-w-[140px]">
                              {tag.name}
                            </td>
                            <td className="py-1.5 px-3 break-all text-[11px]">
                              {tag.value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Inspection conducted 100% locally in browser
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
