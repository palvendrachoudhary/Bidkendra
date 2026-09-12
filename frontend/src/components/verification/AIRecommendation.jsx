import React from 'react';
import { 
  SparklesIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  XCircleIcon,
  ShieldCheckIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/solid';

export default function AIRecommendation({ 
  status = 'Warning',
  score = null,
  verdict = null,
  hasMandatoryFailure = false,
  riskLevel = null,
  bidderName = null
}) {
  // Normalize verdict category
  const rawStatus = String(status || '').toUpperCase();
  const numericScore = typeof score === 'number' ? score : null;

  let category = 'REVIEW'; // 'COMPLIANT' | 'CRITICAL' | 'REVIEW'

  if (
    hasMandatoryFailure || 
    rawStatus === 'FAILED' || 
    rawStatus === 'CRITICAL' || 
    rawStatus === 'NON_COMPLIANT' || 
    rawStatus === 'NON-COMPLIANT' || 
    (numericScore !== null && numericScore < 50)
  ) {
    category = 'CRITICAL';
  } else if (
    rawStatus === 'VERIFIED' || 
    rawStatus === 'COMPLIANT' || 
    rawStatus === 'ELIGIBLE' || 
    (numericScore !== null && numericScore >= 80 && !hasMandatoryFailure)
  ) {
    category = 'COMPLIANT';
  } else {
    category = 'REVIEW';
  }

  // Visual Theme mapping based on category
  const config = {
    COMPLIANT: {
      containerClass: 'bg-emerald-50/70 dark:bg-slate-900 border-2 border-emerald-500/40 dark:border-emerald-500/50 shadow-sm',
      badgeClass: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-400 dark:border-emerald-600',
      badgeLabel: 'COMPLIANT / ELIGIBLE (≥ 80%)',
      titleColor: 'text-emerald-950 dark:text-emerald-300',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      BadgeIcon: CheckCircleIcon,
      leadText: bidderName 
        ? `Comprehensive AI audit completed for ${bidderName}. The entity clears all CPCL mandatory statutory gates with strong financial and legal compliance.`
        : 'Based on automated cross-verification across GSTN, EPFO, MCA, and MSME databases, this bidder demonstrates sound statutory compliance and clean integrity records.',
      points: [
        'Statutory compliance score exceeds the mandatory 80% qualification threshold.',
        'No debarment, blacklisting, or GFR 144(xi) land border restrictions detected.',
        'Recommended for formal commercial bid evaluation and tender participation.'
      ]
    },
    CRITICAL: {
      containerClass: 'bg-rose-50/70 dark:bg-slate-900 border-2 border-rose-500/40 dark:border-rose-500/50 shadow-sm',
      badgeClass: 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200 border border-rose-400 dark:border-rose-600',
      badgeLabel: 'NON-COMPLIANT / CRITICAL',
      titleColor: 'text-rose-950 dark:text-rose-300',
      iconColor: 'text-rose-600 dark:text-rose-400',
      BadgeIcon: XCircleIcon,
      leadText: bidderName
        ? `Critical compliance failure flagged for ${bidderName}. One or more mandatory statutory verification gates failed validation.`
        : 'The system detected critical non-compliance with CPCL mandatory tender conditions. Failure in statutory identification or debarment registries detected.',
      points: [
        'Mandatory statutory gate failed (invalid registration, missing credentials, or debarred status).',
        'Compliance score is below the minimum acceptable threshold for public procurement.',
        'Automatic disqualification recommended under CPCL tender rules & GFR 2017.'
      ]
    },
    REVIEW: {
      containerClass: 'bg-amber-50/70 dark:bg-slate-900 border-2 border-amber-500/40 dark:border-amber-500/50 shadow-sm',
      badgeClass: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-400 dark:border-amber-600',
      badgeLabel: 'REVIEW NEEDED / ATTENTION',
      titleColor: 'text-amber-950 dark:text-amber-300',
      iconColor: 'text-amber-600 dark:text-amber-400',
      BadgeIcon: ExclamationTriangleIcon,
      leadText: bidderName
        ? `Potential statutory discrepancies identified for ${bidderName}. Further verification by the CPCL Tender Committee is advised.`
        : 'The AI engine identified minor data discrepancies between uploaded documents and live database records (e.g. MSME format confidence or turnover declaration).',
      points: [
        'Statutory credentials require secondary manual inspection before final award.',
        'Verify MSME Udyam registration physically or cross-reference GST filings.',
        'Request clarification from bidder regarding technical solvency documents.'
      ]
    }
  };

  const currentConfig = config[category];
  const BadgeIcon = currentConfig.BadgeIcon;

  return (
    <div className={`rounded-xl p-5 ${currentConfig.containerClass} transition-all`}>
      {/* Header with Title and Prominent Verdict Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-200/70 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 shadow-sm border border-slate-200/80 dark:border-slate-700">
            <SparklesIcon className={`h-5 w-5 ${currentConfig.iconColor}`} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              AI Recommendation Engine
              <span className="bg-navy/10 dark:bg-amber-400/10 text-navy dark:text-amber-300 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                GFR 2017 AI Gate
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Chennai Petroleum Corporation Limited (CPCL) Tender Board
            </p>
          </div>
        </div>

        {/* Prominent High-Contrast Compliance Verdict Badge */}
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wide shadow-sm ${currentConfig.badgeClass}`}>
          <BadgeIcon className="h-4 w-4 shrink-0" />
          <span>{currentConfig.badgeLabel}</span>
        </div>
      </div>
      
      {/* Descriptive Lead Text */}
      <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 mb-4 leading-relaxed font-normal">
        {currentConfig.leadText}
      </p>

      {/* Actionable Recommendations Bullet Points */}
      <div className="space-y-2 bg-white/70 dark:bg-slate-800/60 p-3.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
        {currentConfig.points.map((point, idx) => (
          <div key={idx} className="flex items-start gap-2.5">
            <BadgeIcon className={`h-4 w-4 ${currentConfig.iconColor} shrink-0 mt-0.5`} />
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-snug">
              {point}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}