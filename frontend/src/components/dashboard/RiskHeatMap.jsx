import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export default function RiskHeatMap() {
  const { t } = useLanguage();
  // Simple CSS grid representing risk areas
  const areas = [
    { name: 'Financial', risk: 'high', score: 85 },
    { name: 'Technical', risk: 'low', score: 20 },
    { name: 'Compliance', risk: 'medium', score: 55 },
    { name: 'Past Perf.', risk: 'low', score: 15 },
    { name: 'Legal', risk: 'high', score: 92 },
    { name: 'Cyber', risk: 'medium', score: 48 },
  ];

  const getRiskColor = (risk) => {
    if (risk === 'high') return 'bg-danger/10 dark:bg-red-950/40 border-danger dark:border-red-800 text-danger-dark dark:text-red-300';
    if (risk === 'medium') return 'bg-warning/10 dark:bg-amber-950/40 border-warning dark:border-amber-800 text-warning-dark dark:text-amber-300';
    return 'bg-success/10 dark:bg-emerald-950/40 border-success dark:border-emerald-800 text-success-dark dark:text-emerald-300';
  };

  const getRiskLabel = (risk) => {
    if (risk === 'high') return t('High Risk');
    if (risk === 'medium') return t('Medium Risk');
    return t('Low Risk');
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 transition-colors">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-slate-900 dark:text-white">{t('Risk Assessment Map')}</h3>
        <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-300">{t('AI Generated')}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {areas.map((area, idx) => (
          <div key={idx} className={`p-3 rounded-md border ${getRiskColor(area.risk)} flex flex-col justify-between h-24 transition-colors`}>
            <span className="text-sm font-medium">{t(area.name)}</span>
            <div className="flex justify-between items-end">
              <span className="text-2xl font-bold">{area.score}</span>
              <span className="text-xs opacity-80">{getRiskLabel(area.risk)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}