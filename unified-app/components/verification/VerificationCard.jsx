import React from 'react';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon, 
  WrenchIcon,
  ShieldCheckIcon,
  CircleStackIcon
} from '@heroicons/react/24/outline';

export default function VerificationCard({ title = 'Check', icon: Icon, data }) {
  const rawStatus = String(data?.checkStatus || 'NOT_CONFIGURED').toUpperCase();
  const rawMethod = data?.method || 'NONE';
  const method = typeof rawMethod === 'string' ? rawMethod : 'NONE';
  const source = data?.source || 'CPCL Statutory Database';
  const message = data?.message || 'Verification check not performed.';
  const extractedValue = data?.extractedValue;

  // Categorize status with high contrast theme styles
  let cardBorderClass = 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600';
  let badgeClass = 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600';
  let iconBgClass = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300';
  let StatusIcon = WrenchIcon;
  let statusText = 'Not Configured';

  if (
    rawStatus === 'VERIFIED' || 
    rawStatus === 'COMPLIANT' || 
    rawStatus === 'ELIGIBLE' || 
    rawStatus === 'PASSED'
  ) {
    cardBorderClass = 'border-emerald-400/80 dark:border-emerald-500/60 shadow-emerald-500/5';
    badgeClass = 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-400 dark:border-emerald-600 font-extrabold shadow-xs';
    iconBgClass = 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
    StatusIcon = CheckCircleIcon;
    statusText = 'Compliant / Verified';
  } else if (
    rawStatus === 'FAILED' || 
    rawStatus === 'CRITICAL' || 
    rawStatus === 'NON_COMPLIANT' || 
    rawStatus === 'NON-COMPLIANT' || 
    rawStatus === 'REJECTED'
  ) {
    cardBorderClass = 'border-rose-400/80 dark:border-rose-500/60 shadow-rose-500/5';
    badgeClass = 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200 border border-rose-400 dark:border-rose-600 font-extrabold shadow-xs';
    iconBgClass = 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800';
    StatusIcon = XCircleIcon;
    statusText = 'Non-Compliant / Critical';
  } else if (
    rawStatus === 'NEEDS_MANUAL_REVIEW' || 
    rawStatus === 'REVIEW_NEEDED' || 
    rawStatus === 'WARNING' || 
    rawStatus === 'MANUAL_REVIEW' ||
    rawStatus === 'ATTENTION'
  ) {
    cardBorderClass = 'border-amber-400/80 dark:border-amber-500/60 shadow-amber-500/5';
    badgeClass = 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-400 dark:border-amber-600 font-extrabold shadow-xs';
    iconBgClass = 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800';
    StatusIcon = ExclamationTriangleIcon;
    statusText = 'Review Needed';
  }

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl border-2 p-4 shadow-sm hover:shadow-md transition-all duration-200 ${cardBorderClass} flex flex-col justify-between`}>
      <div>
        {/* Card Header: Title, Method & Prominent Verdict Badge */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`p-2 rounded-lg border shadow-xs shrink-0 ${iconBgClass}`}>
              {Icon ? <Icon className="w-5 h-5" /> : <ShieldCheckIcon className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                {title}
              </h4>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] uppercase font-mono font-semibold text-slate-500 dark:text-slate-400 tracking-wider bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                  {String(method).replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          </div>

          {/* Prominent High-Contrast Verdict Badge */}
          <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] tracking-wide shrink-0 ${badgeClass}`}>
            <StatusIcon className="w-3.5 h-3.5 shrink-0" />
            <span>{statusText}</span>
          </div>
        </div>
        
        {/* Extracted Entity & Data Source Information Panel */}
        <div className="bg-slate-50 dark:bg-slate-800/70 rounded-lg p-2.5 mb-2.5 border border-slate-200/80 dark:border-slate-700/80 text-xs flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
              <CircleStackIcon className="w-3.5 h-3.5 text-slate-400" />
              Source:
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {source}
            </span>
          </div>

          {extractedValue && (
            <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Extracted Data:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-amber-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 shadow-xs">
                {extractedValue}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Descriptive Statutory Finding Message */}
      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
        {message}
      </p>
    </div>
  );
}
