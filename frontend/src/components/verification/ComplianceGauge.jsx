import React from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';

export default function ComplianceGauge({ 
  score = 0, 
  coverage = 0, 
  recommendation = 'PENDING', 
  gates = false,
  onExplainClick = null
}) {
  const safeScore = Math.max(0, Math.min(100, Number(score) || 0));
  const safeCoverage = Math.max(0, Math.min(100, Number(coverage) || 0));
  const recStr = typeof recommendation === 'string' ? recommendation : String(recommendation || 'PENDING');
  
  const getScoreColor = (s) => {
    if (s >= 80) return '#10b981';
    if (s >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const getCoverageColor = (c) => {
    if (c >= 80) return '#3b82f6';
    if (c >= 40) return '#8b5cf6';
    return '#64748b';
  };

  const scoreDash = `${safeScore} ${100 - safeScore}`;
  const coverDash = `${safeCoverage} ${100 - safeCoverage}`;

  const isNotEligible = recStr.includes('NOT_ELIGIBLE');
  const isEligible = recStr.includes('ELIGIBLE') && !isNotEligible;

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
      <div className="w-full flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white tracking-wide">VERIFICATION TELEMETRY</h3>
        {onExplainClick && (
          <button
            type="button"
            onClick={onExplainClick}
            className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 hover:underline cursor-pointer"
            title="Open Explainable AI Decision breakdown"
          >
            <SparklesIcon className="w-3.5 h-3.5" />
            <span>Explain</span>
          </button>
        )}
      </div>

      <div className="flex gap-8 mb-6">
        <div 
          onClick={onExplainClick}
          className={`flex flex-col items-center group ${onExplainClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
          title={onExplainClick ? "Click to view full Explainable AI evidence" : undefined}
        >
          <div className="relative w-28 h-28">
            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
              <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="currentColor" className="text-slate-100 dark:text-slate-700" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.915" fill="transparent" stroke={getScoreColor(safeScore)} strokeWidth="3" strokeDasharray={scoreDash} strokeDashoffset="0" strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold group-hover:scale-110 transition-transform" style={{ color: getScoreColor(safeScore) }}>{safeScore}%</span>
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-500 mt-2 uppercase tracking-wider flex items-center gap-1">
            Compliance {onExplainClick && <span className="text-[10px] text-blue-500">🔍</span>}
          </span>
        </div>

        <div 
          onClick={onExplainClick}
          className={`flex flex-col items-center group ${onExplainClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
          title={onExplainClick ? "Click to view gate coverage breakdown" : undefined}
        >
          <div className="relative w-28 h-28">
            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
              <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="currentColor" className="text-slate-100 dark:text-slate-700" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.915" fill="transparent" stroke={getCoverageColor(safeCoverage)} strokeWidth="3" strokeDasharray={coverDash} strokeDashoffset="0" strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold group-hover:scale-110 transition-transform" style={{ color: getCoverageColor(safeCoverage) }}>{safeCoverage}%</span>
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-500 mt-2 uppercase tracking-wider">Coverage</span>
        </div>
      </div>
      
      <div className="w-full bg-slate-50 dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700 p-3 mb-4">
        <div className="text-[10px] uppercase text-slate-400 font-bold mb-2 flex justify-between">
          <span>Mandatory Gates</span>
          <span className={gates ? "text-red-500" : "text-emerald-500"}>{gates ? 'FAILED' : 'CLEARED'}</span>
        </div>
        <div className="flex justify-between gap-1">
          <div className={`h-1.5 flex-1 rounded ${gates ? 'bg-red-400' : 'bg-emerald-400'}`}></div>
          <div className={`h-1.5 flex-1 rounded ${gates ? 'bg-red-400' : 'bg-emerald-400'}`}></div>
          <div className={`h-1.5 flex-1 rounded ${gates ? 'bg-red-400' : 'bg-emerald-400'}`}></div>
          <div className={`h-1.5 flex-1 rounded ${gates ? 'bg-red-400' : 'bg-emerald-400'}`}></div>
        </div>
      </div>

      <div className={`w-full py-2 px-4 rounded-md text-center font-bold text-sm border mb-3 ${
        isNotEligible 
          ? 'bg-red-100 text-red-700 border-red-200' 
          : isEligible 
            ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
            : 'bg-amber-100 text-amber-700 border-amber-200'
      }`}>
        {isNotEligible ? 'NOT ELIGIBLE' : isEligible ? 'ELIGIBLE' : 'NEEDS REVIEW'}
      </div>

      {onExplainClick && (
        <button
          type="button"
          onClick={onExplainClick}
          className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <SparklesIcon className="w-4 h-4 text-blue-500" />
          <span>Explain AI Score &amp; Evidence</span>
        </button>
      )}
    </div>
  );
}
