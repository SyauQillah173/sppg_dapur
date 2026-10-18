'use client';

import React, { useRef, useState, useEffect } from 'react';
import { PenTool, Eraser, RotateCcw, Check } from 'lucide-react';

export interface TouchSignaturePadProps {
  value?: string;
  onChange: (dataUrl: string) => void;
  signerName: string;
}

export function TouchSignaturePad({ value, onChange, signerName }: TouchSignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(Boolean(value));

  // Inisialisasi canvas saat load
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = value;
      setHasSignature(true);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasSignature(false);
    }
  }, [value]);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX = 0;
    let clientY = 0;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if ('cancelable' in e && e.cancelable) e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1e1b4b'; // warna tinta hitam pekat kebiruan
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    if ('cancelable' in e && e.cancelable) e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onChange(canvas.toDataURL('image/png'));
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onChange('');
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
          <PenTool className="w-3.5 h-3.5 text-indigo-600" />
          <span>Goreskan Tanda Tangan Guru di Layar HP Ini:</span>
        </label>
        <button
          type="button"
          onClick={handleClear}
          className="text-[11px] text-slate-500 hover:text-rose-600 font-semibold flex items-center gap-1 transition"
        >
          <RotateCcw className="w-3 h-3" />
          Hapus Ulang
        </button>
      </div>

      <div className="relative border-2 border-dashed border-indigo-200 bg-indigo-50/20 rounded-2xl overflow-hidden touch-none select-none">
        <canvas
          ref={canvasRef}
          width={500}
          height={180}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-36 sm:h-44 bg-white/80 cursor-crosshair block"
        />

        {!hasSignature && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400">
            <PenTool className="w-6 h-6 mb-1 opacity-40 text-indigo-500 animate-pulse" />
            <p className="text-xs font-semibold text-slate-500">
              Sentuh & Tanda Tangani di Kotak Ini dengan Jari
            </p>
            <p className="text-[10px] text-slate-400">
              (Diserahkan ke {signerName || 'Bapak/Ibu Guru Piket'})
            </p>
          </div>
        )}

        <div className="absolute bottom-2 left-3 pointer-events-none">
          <span className="text-[10px] font-mono text-slate-400">
            Penandatangan: {signerName || 'Pihak Sekolah'}
          </span>
        </div>

        {hasSignature && (
          <div className="absolute bottom-2 right-3 pointer-events-none bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
            <Check className="w-3 h-3" />
            Tersimpan
          </div>
        )}
      </div>
    </div>
  );
}
