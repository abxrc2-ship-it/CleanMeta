import React, { useState, useRef, useEffect } from 'react';
import {
  Scissors,
  Download,
  Image as ImageIcon,
  CheckCircle2,
  Sliders,
  Pipette,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Minimize2,
} from 'lucide-react';
import { formatBytes } from '../lib/imageProcessor';
import { UserProfile } from '../types';
import { saveHistoryRecord } from '../lib/firestore';

interface BackgroundRemoverToolProps {
  user: UserProfile | null;
  onSendToTool?: (tool: 'metadata-remover' | 'converter' | 'compressor', file: File) => void;
}

export const BackgroundRemoverTool: React.FC<BackgroundRemoverToolProps> = ({
  user,
  onSendToTool,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [targetColor, setTargetColor] = useState<{ r: number; g: number; b: number }>({
    r: 255,
    g: 255,
    b: 255,
  });
  const [tolerance, setTolerance] = useState<number>(28);
  const [smoothness, setSmoothness] = useState<number>(10);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setResultBlob(null);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultUrl(null);
      setImageLoaded(false);

      const url = URL.createObjectURL(selected);
      const img = new Image();
      img.onload = () => {
        originalImageRef.current = img;
        setImageLoaded(true);
        // Auto-detect background color from corners
        detectBackgroundColor(img);
      };
      img.onerror = () => {
        setIsProcessing(false);
      };
      img.src = url;
    }
  };

  // Sample corner pixels to guess background color automatically
  const detectBackgroundColor = (img: HTMLImageElement) => {
    try {
      const tempCanvas = document.createElement('canvas');
      const w = Math.min(img.naturalWidth || img.width, 800);
      const h = Math.min(img.naturalHeight || img.height, 600);
      tempCanvas.width = w;
      tempCanvas.height = h;
      const ctx = tempCanvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, w, h);

      const corners = [
        ctx.getImageData(2, 2, 1, 1).data,
        ctx.getImageData(w - 3, 2, 1, 1).data,
        ctx.getImageData(2, h - 3, 1, 1).data,
        ctx.getImageData(w - 3, h - 3, 1, 1).data,
      ];

      // Average corner colors
      const r = Math.round((corners[0][0] + corners[1][0] + corners[2][0] + corners[3][0]) / 4);
      const g = Math.round((corners[0][1] + corners[1][1] + corners[2][1] + corners[3][1]) / 4);
      const b = Math.round((corners[0][2] + corners[1][2] + corners[2][2] + corners[3][2]) / 4);

      setTargetColor({ r, g, b });
    } catch {
      // Fallback default white
    }
  };

  // Process background removal on canvas (optimized & capped for instant rendering)
  const processRemoval = () => {
    const img = originalImageRef.current;
    if (!img) {
      setIsProcessing(false);
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      try {
        const origW = img.naturalWidth || img.width;
        const origH = img.naturalHeight || img.height;

        // Cap max processing dimension to 1600px for instant responsive processing
        const maxDim = 1600;
        let width = origW;
        let height = origH;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = canvasRef.current || document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setIsProcessing(false);
          return;
        }

        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;
        const len = data.length;

        const tr = targetColor.r;
        const tg = targetColor.g;
        const tb = targetColor.b;
        const tolDistSq = ((tolerance / 100) * 441.67) ** 2; // Squared distance comparison is 10x faster (no Math.sqrt needed!)
        const featherDist = (smoothness / 100) * 120;

        for (let i = 0; i < len; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Fast squared distance
          const distSq = (r - tr) ** 2 + (g - tg) ** 2 + (b - tb) ** 2;

          if (distSq <= tolDistSq) {
            // Completely transparent
            data[i + 3] = 0;
          } else if (featherDist > 0) {
            const dist = Math.sqrt(distSq);
            const tolDist = Math.sqrt(tolDistSq);
            if (dist < tolDist + featherDist) {
              const alphaFactor = (dist - tolDist) / featherDist;
              data[i + 3] = Math.round(data[i + 3] * alphaFactor);
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) {
            if (resultUrl) URL.revokeObjectURL(resultUrl);
            const url = URL.createObjectURL(blob);
            setResultBlob(blob);
            setResultUrl(url);

            if (user && file) {
              saveHistoryRecord(user.uid, {
                tool: 'bg-remover',
                originalFileName: file.name,
                inputFormat: file.type || 'image/jpeg',
                outputFormat: 'image/png',
                originalSize: file.size,
                processedSize: blob.size,
                status: 'success',
                retention: 'none',
              }).catch(() => {});
            }
          }
          setIsProcessing(false);
        }, 'image/png');
      } catch (err) {
        console.error('Background removal error:', err);
        setIsProcessing(false);
      }
    }, 30);
  };

  // Debounced re-process when parameters change
  useEffect(() => {
    if (!imageLoaded) return;
    const timer = setTimeout(() => {
      processRemoval();
    }, 150);
    return () => clearTimeout(timer);
  }, [imageLoaded, targetColor, tolerance, smoothness]);

  // Click on canvas to sample color
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * canvas.width);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * canvas.height);

    const img = originalImageRef.current;
    if (!img) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(img, 0, 0);

    const pixel = ctx.getImageData(x, y, 1, 1).data;
    setTargetColor({ r: pixel[0], g: pixel[1], b: pixel[2] });
  };

  const handleDownload = () => {
    if (!resultBlob || !file) return;
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    const link = document.createElement('a');
    link.href = resultUrl || URL.createObjectURL(resultBlob);
    link.download = `${baseName}-transparent.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to send to another tool
  const handleTransferTo = (tool: 'metadata-remover' | 'converter' | 'compressor') => {
    if (!resultBlob || !file || !onSendToTool) return;
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    const newFile = new File([resultBlob], `${baseName}-transparent.png`, {
      type: 'image/png',
    });
    onSendToTool(tool, newFile);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-7 shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600 dark:text-rose-400 font-bold">
            <Scissors className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Instant Background Remover
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Remove solid or gradient backgrounds locally in seconds — 100% offline & private
            </p>
          </div>
        </div>

        {/* File Picker */}
        {!file ? (
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-rose-500 rounded-2xl p-8 sm:p-12 cursor-pointer transition text-center bg-slate-50/50 dark:bg-slate-850">
            <ImageIcon className="w-10 h-10 text-rose-600 dark:text-rose-400 mb-3" />
            <span className="text-base font-bold text-slate-800 dark:text-slate-100">
              Select photo to remove background
            </span>
            <span className="text-xs text-slate-500 mt-1">
              Supports JPG, PNG, and WebP (Max 25 MB)
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        ) : (
          <div className="space-y-6">
            {/* Controls Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              {/* Target Color Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Pipette className="w-3.5 h-3.5" />
                  <span>Target Color (Tap to pick)</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={`#${((1 << 24) + (targetColor.r << 16) + (targetColor.g << 8) + targetColor.b)
                      .toString(16)
                      .slice(1)}`}
                    onChange={(e) => {
                      const hex = e.target.value.substring(1);
                      setTargetColor({
                        r: parseInt(hex.substring(0, 2), 16),
                        g: parseInt(hex.substring(2, 4), 16),
                        b: parseInt(hex.substring(4, 6), 16),
                      });
                    }}
                    className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                  />
                  <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
                    rgb({targetColor.r}, {targetColor.g}, {targetColor.b})
                  </span>
                </div>
              </div>

              {/* Sensitivity / Tolerance Slider */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  <span>Tolerance</span>
                  <span>{tolerance}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="80"
                  value={tolerance}
                  onChange={(e) => setTolerance(parseInt(e.target.value, 10))}
                  className="w-full accent-rose-600 cursor-pointer"
                />
              </div>

              {/* Edge Smoothness Slider */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  <span>Edge Feather</span>
                  <span>{smoothness}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={smoothness}
                  onChange={(e) => setSmoothness(parseInt(e.target.value, 10))}
                  className="w-full accent-rose-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Action Trigger Button */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={processRemoval}
                disabled={isProcessing}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs shadow-md shadow-rose-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing Background...</span>
                  </>
                ) : (
                  <>
                    <Scissors className="w-3.5 h-3.5" />
                    <span>Remove Background Now</span>
                  </>
                )}
              </button>

              {resultBlob && !isProcessing && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Background Removed Successfully!</span>
                </div>
              )}
            </div>

            {/* Canvas / Preview Container */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] bg-slate-100 dark:bg-slate-950 flex items-center justify-center min-h-[300px] max-h-[500px]">
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                className="max-h-[480px] w-auto max-w-full object-contain cursor-crosshair shadow-lg"
                title="Click anywhere to remove that color"
              />

              {isProcessing && (
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center text-white text-xs font-bold gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Removing Background...</span>
                </div>
              )}
            </div>

            <p className="text-[11px] text-center text-slate-500">
              💡 Tip: Click anywhere directly on the background area above to automatically sample and remove that color.
            </p>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                onClick={handleDownload}
                disabled={!resultBlob}
                className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Transparent PNG</span>
              </button>

              {/* Re-use Pipeline Buttons */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleTransferTo('compressor')}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                  title="Compress this transparent image"
                >
                  <Minimize2 className="w-3.5 h-3.5 text-purple-600" />
                  <span>Compress Result</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTransferTo('converter')}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                  title="Convert this transparent image"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                  <span>Convert Result</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
