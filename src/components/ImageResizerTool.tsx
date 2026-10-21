import React, { useState, useEffect, useRef } from 'react';
import {
  Maximize,
  Lock,
  Unlock,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sliders,
  Palette,
  Image as ImageIcon,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';
import { getCleanMetaFilename } from '../lib/naming';
import { formatBytes } from '../lib/imageProcessor';

interface ResizerPreset {
  id: string;
  name: string;
  width: number;
  height: number;
  ratio: string;
  category: string;
}

const PRESETS: ResizerPreset[] = [
  { id: 'square', name: 'Square (1:1)', width: 1080, height: 1080, ratio: '1:1', category: 'Social' },
  { id: 'portrait', name: 'Portrait (4:5)', width: 1080, height: 1350, ratio: '4:5', category: 'Social' },
  { id: 'story', name: 'Story / Reel (9:16)', width: 1080, height: 1920, ratio: '9:16', category: 'Social' },
  { id: 'landscape', name: 'Landscape (16:9)', width: 1920, height: 1080, ratio: '16:9', category: 'Web' },
  { id: 'banner', name: 'HD Banner (1200×630)', width: 1200, height: 630, ratio: '1.91:1', category: 'SEO' },
  { id: 'avatar', name: 'Profile Avatar', width: 500, height: 500, ratio: '1:1', category: 'Identity' },
  { id: 'thumbnail', name: 'Thumbnail (300×300)', width: 300, height: 300, ratio: '1:1', category: 'Compact' },
];

export const ImageResizerTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [originalWidth, setOriginalWidth] = useState<number>(0);
  const [originalHeight, setOriginalHeight] = useState<number>(0);

  // Resize Settings
  const [width, setWidth] = useState<number>(1080);
  const [height, setHeight] = useState<number>(1080);
  const [aspectRatioLocked, setAspectRatioLocked] = useState<boolean>(true);
  const [fitMode, setFitMode] = useState<'contain' | 'cover' | 'fill'>('contain');
  const [format, setFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/png');
  const [quality, setQuality] = useState<number>(92);
  const [backgroundColor, setBackgroundColor] = useState<string>('#ffffff');

  // Processing & Output
  const [isProcessing, setIsProcessing] = useState(false);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [outputWidth, setOutputWidth] = useState<number>(0);
  const [outputHeight, setOutputHeight] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (outputUrl) URL.revokeObjectURL(outputUrl);
    };
  }, [previewUrl, outputUrl]);

  // Load selected file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      loadFile(e.target.files[0]);
    }
  };

  const loadFile = (inputFile: File) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setOutputBlob(null);
    if (outputUrl) URL.revokeObjectURL(outputUrl);
    setOutputUrl(null);

    if (!inputFile.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }

    setFile(inputFile);
    const url = URL.createObjectURL(inputFile);
    setPreviewUrl(url);

    const img = new Image();
    img.src = url;
    img.onload = () => {
      const origW = img.naturalWidth || 800;
      const origH = img.naturalHeight || 800;
      setOriginalWidth(origW);
      setOriginalHeight(origH);
      setWidth(origW);
      setHeight(origH);

      // Default format matching original
      if (inputFile.type === 'image/jpeg') setFormat('image/jpeg');
      else if (inputFile.type === 'image/webp') setFormat('image/webp');
      else setFormat('image/png');
    };
  };

  // Adjust width with aspect ratio lock
  const handleWidthChange = (val: number) => {
    const newW = Math.max(1, Math.min(val, 8000));
    setWidth(newW);
    if (aspectRatioLocked && originalWidth > 0 && originalHeight > 0) {
      const ratio = originalHeight / originalWidth;
      setHeight(Math.max(1, Math.round(newW * ratio)));
    }
  };

  // Adjust height with aspect ratio lock
  const handleHeightChange = (val: number) => {
    const newH = Math.max(1, Math.min(val, 8000));
    setHeight(newH);
    if (aspectRatioLocked && originalWidth > 0 && originalHeight > 0) {
      const ratio = originalWidth / originalHeight;
      setWidth(Math.max(1, Math.round(newH * ratio)));
    }
  };

  // Apply preset
  const applyPreset = (preset: ResizerPreset) => {
    setWidth(preset.width);
    setHeight(preset.height);
  };

  // Process resize on HTML5 Canvas
  const handleProcessResize = async () => {
    if (!file || !previewUrl) return;

    if (width <= 0 || height <= 0 || width > 8000 || height > 8000) {
      setErrorMessage('Width and Height must be between 1 and 8000 pixels.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const img = new Image();
      img.src = previewUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error('Failed to load image for resizing.'));
      });

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not access canvas context.');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Background fill if JPEG or user choice
      if (format === 'image/jpeg' || backgroundColor !== 'transparent') {
        ctx.fillStyle = backgroundColor || '#ffffff';
        ctx.fillRect(0, 0, width, height);
      } else {
        ctx.clearRect(0, 0, width, height);
      }

      // Draw based on fitMode
      if (fitMode === 'fill') {
        // Stretch to exact dimensions
        ctx.drawImage(img, 0, 0, width, height);
      } else if (fitMode === 'cover') {
        // Crop centered to fill entire canvas
        const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
        const scaledW = img.naturalWidth * scale;
        const scaledH = img.naturalHeight * scale;
        const offsetX = (width - scaledW) / 2;
        const offsetY = (height - scaledH) / 2;
        ctx.drawImage(img, offsetX, offsetY, scaledW, scaledH);
      } else {
        // 'contain': letterbox inside canvas keeping full subject
        const scale = Math.min(width / img.naturalWidth, height / img.naturalHeight);
        const scaledW = img.naturalWidth * scale;
        const scaledH = img.naturalHeight * scale;
        const offsetX = (width - scaledW) / 2;
        const offsetY = (height - scaledH) / 2;
        ctx.drawImage(img, offsetX, offsetY, scaledW, scaledH);
      }

      const q = format === 'image/png' ? undefined : quality / 100;
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error('Canvas export failed.'));
          },
          format,
          q
        );
      });

      if (outputUrl) URL.revokeObjectURL(outputUrl);
      const newUrl = URL.createObjectURL(blob);
      setOutputBlob(blob);
      setOutputUrl(newUrl);
      setOutputWidth(width);
      setOutputHeight(height);
      setSuccessMessage(`Successfully resized to ${width} × ${height} px!`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Image resizing failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Download resized image with CleanMeta naming
  const handleDownload = () => {
    if (!outputBlob || !file) return;
    const filename = getCleanMetaFilename({
      mimeType: format,
      originalName: file.name,
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(outputBlob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Title Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Maximize className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Image Resizer
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Resize dimensions in exact pixels with aspect-ratio locking and zero blur.
              </p>
            </div>
          </div>
        </div>

        {/* Engine Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>WASM High-DPI Engine • 100% In-Browser</span>
        </div>
      </div>

      {!file ? (
        /* Upload Area */
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl p-10 text-center cursor-pointer bg-white dark:bg-slate-900 transition-all shadow-sm hover:shadow-md"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
            Choose an image to resize
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-4">
            Drag and drop or click to upload. Supports JPG, PNG, and WebP up to 25MB.
          </p>
          <button className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition">
            Select Photo
          </button>
        </div>
      ) : (
        /* Resizer Workspace */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Column */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            {/* Dimension Inputs Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm sm:text-base">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  <span>Target Dimensions</span>
                </h3>
                <button
                  onClick={() => setAspectRatioLocked(!aspectRatioLocked)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                    aspectRatioLocked
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 border-blue-200 dark:border-blue-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {aspectRatioLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  <span>{aspectRatioLocked ? 'Ratio Locked' : 'Unlocked'}</span>
                </button>
              </div>

              {/* Width & Height Inputs */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Width (px)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="8000"
                      value={width}
                      onChange={(e) => handleWidthChange(parseInt(e.target.value, 10) || 1)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-400">px</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Height (px)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="8000"
                      value={height}
                      onChange={(e) => handleHeightChange(parseInt(e.target.value, 10) || 1)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-400">px</span>
                  </div>
                </div>
              </div>

              {/* Presets Grid */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  Common Presets
                </label>
                <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {PRESETS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => applyPreset(p)}
                      className={`px-2.5 py-1.5 rounded-lg text-left text-xs transition border flex flex-col ${
                        width === p.width && height === p.height
                          ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-bold'
                          : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-400'
                      }`}
                    >
                      <span className="truncate">{p.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {p.width}×{p.height}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Fit Mode & Color Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  Fitting Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['contain', 'cover', 'fill'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setFitMode(mode)}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-semibold uppercase tracking-wider transition border ${
                        fitMode === mode
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Output Format & Quality */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Output Format
                  </label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold"
                  >
                    <option value="image/png">PNG (Lossless)</option>
                    <option value="image/jpeg">JPEG (Compressed)</option>
                    <option value="image/webp">WebP (Modern)</option>
                  </select>
                </div>

                {format !== 'image/png' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Quality: {quality}%
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="100"
                      value={quality}
                      onChange={(e) => setQuality(parseInt(e.target.value, 10))}
                      className="w-full accent-blue-600"
                    />
                  </div>
                )}
              </div>

              {/* Background Color for Transparency */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center justify-between">
                  <span>Background (Canvas Fill)</span>
                  <span className="font-mono text-[11px] text-slate-400">{backgroundColor}</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={backgroundColor === 'transparent' ? '#ffffff' : backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-9 h-9 rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer"
                  />
                  <div className="flex items-center gap-1.5">
                    {['#ffffff', '#000000', '#f8fafc', '#0f172a'].map((c) => (
                      <button
                        key={c}
                        onClick={() => setBackgroundColor(c)}
                        className="w-7 h-7 rounded-lg border border-slate-300 dark:border-slate-700 shadow-xs"
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                    {format === 'image/png' && (
                      <button
                        onClick={() => setBackgroundColor('transparent')}
                        className={`px-2 py-1 rounded-lg text-xs font-semibold border ${
                          backgroundColor === 'transparent'
                            ? 'bg-blue-50 text-blue-600 border-blue-400'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        Transparent
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Execute Resize Button */}
              <button
                onClick={handleProcessResize}
                disabled={isProcessing}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Resizing in Memory...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Apply Resize ({width} × {height} px)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Preview & Output Column */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            {/* Feedback messages */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Live Preview Comparison Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-blue-600" />
                  <span>Preview & Output Comparison</span>
                </h4>
                <button
                  onClick={() => {
                    setFile(null);
                    setOutputBlob(null);
                  }}
                  className="text-xs text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                >
                  Change Image
                </button>
              </div>

              {/* Image Previews */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Original Preview */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Original
                  </span>
                  <div className="relative aspect-square rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden p-2">
                    {previewUrl && (
                      <img
                        src={previewUrl}
                        alt="Original"
                        className="max-h-full max-w-full object-contain rounded-lg"
                      />
                    )}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 font-mono flex justify-between">
                    <span>{originalWidth} × {originalHeight} px</span>
                    <span>{formatBytes(file.size)}</span>
                  </div>
                </div>

                {/* Resized Result Preview */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Resized Result</span>
                    {outputBlob && (
                      <span className="px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-[10px]">
                        READY
                      </span>
                    )}
                  </span>
                  <div className="relative aspect-square rounded-xl bg-slate-100 dark:bg-slate-800 border border-blue-200 dark:border-blue-900 flex items-center justify-center overflow-hidden p-2 shadow-inner">
                    {outputUrl ? (
                      <img
                        src={outputUrl}
                        alt="Resized"
                        className="max-h-full max-w-full object-contain rounded-lg"
                      />
                    ) : (
                      <div className="text-center p-4">
                        <Sparkles className="w-8 h-8 text-blue-400 mx-auto mb-2 opacity-50" />
                        <p className="text-xs text-slate-400">
                          Click "Apply Resize" to render the high-res canvas output
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 font-mono flex justify-between">
                    <span>{outputWidth ? `${outputWidth} × ${outputHeight} px` : '—'}</span>
                    <span>{outputBlob ? formatBytes(outputBlob.size) : '—'}</span>
                  </div>
                </div>
              </div>

              {/* Download Action */}
              {outputBlob && (
                <div className="mt-2 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-emerald-500" />
                      <span>CleanMeta standard filename generated</span>
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate max-w-xs">
                      cleanmeta-{new Date().toISOString().slice(0, 10)}-...
                    </p>
                  </div>
                  <button
                    onClick={handleDownload}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-500/20 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Resized Image</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
