'use client';

import React, { useEffect } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, Sparkles, X, ArrowRight } from 'lucide-react';

export type AlertModalType = 'info' | 'warning' | 'error' | 'success';

interface AlertModalProps {
  isOpen: boolean;
  type?: AlertModalType;
  title: string;
  message: string;
  highlightNote?: string;
  actionText?: string;
  onAction?: () => void;
  closeText?: string;
  onClose: () => void;
}

export function AlertModal({
  isOpen,
  type = 'info',
  title,
  message,
  highlightNote,
  actionText,
  onAction,
  closeText = 'Tutup',
  onClose,
}: AlertModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const styleConfig = {
    info: {
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
      icon: Info,
      badge: 'bg-blue-100 text-blue-800 border-blue-200',
      button: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20',
    },
    warning: {
      iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
      icon: AlertTriangle,
      badge: 'bg-amber-100 text-amber-800 border-amber-200',
      button: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20',
    },
    error: {
      iconBg: 'bg-rose-50 text-rose-600 border-rose-100',
      icon: AlertCircle,
      badge: 'bg-rose-100 text-rose-800 border-rose-200',
      button: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20',
    },
    success: {
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      icon: CheckCircle2,
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      button: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20',
    },
  }[type];

  const IconComponent = styleConfig.icon;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200/90 animate-in zoom-in-95 duration-150"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          aria-label="Tutup"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Icon & Title */}
        <div className="flex items-start gap-3.5">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${styleConfig.iconBg} shadow-xs`}>
            <IconComponent className="h-5 w-5" />
          </div>
          <div className="space-y-1 pr-6">
            <h3 className="text-base font-bold text-slate-900 leading-tight">
              {title}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
              {message}
            </p>
          </div>
        </div>

        {/* Highlight Note (opsional callout) */}
        {highlightNote && (
          <div className="mt-4 rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 text-[11px] text-slate-700 leading-relaxed flex items-start gap-2">
            <Sparkles className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
            <span>{highlightNote}</span>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition active:scale-98"
          >
            {closeText}
          </button>
          {actionText && onAction && (
            <button
              type="button"
              onClick={() => {
                onAction();
                onClose();
              }}
              className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition shadow-sm active:scale-98 ${styleConfig.button}`}
            >
              <span>{actionText}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
