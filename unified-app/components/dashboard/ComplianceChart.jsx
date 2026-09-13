import { useLanguage } from '../../context/LanguageContext';
import React from 'react';
import { complianceDistribution } from '../../utils/dummyData';

export default function ComplianceChart() {
  const { t } = useLanguage();
  // Simple CSS-based segmented donut chart
  const total = complianceDistribution.reduce((acc, curr) => acc + curr.value, 0);
  let currentAngle = 0;

  const segments = complianceDistribution.map(segment => {
    const percentage = (segment.value / total) * 100;
    const strokeDasharray = `${percentage} ${100 - percentage}`;
    const strokeDashoffset = -currentAngle;
    currentAngle += percentage;

    return {
      ...segment,
      strokeDasharray,
      strokeDashoffset
    };
  });

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col h-full transition-colors">
      <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">{t('Compliance Distribution')}</h3>
      
      <div className="flex-1 flex items-center justify-center">
        <div className="relative w-48 h-48">
          <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
            {segments.map((segment, index) => (
              <circle
                key={index}
                cx="18" cy="18" r="15.91549430918954"
                fill="transparent"
                stroke={segment.color}
                strokeWidth="4"
                strokeDasharray={segment.strokeDasharray}
                strokeDashoffset={segment.strokeDashoffset}
                className="transition-all duration-1000 ease-out hover:opacity-80 cursor-pointer"
              />
            ))}
            <circle cx="18" cy="18" r="12" className="fill-white dark:fill-slate-800 transition-colors" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-navy dark:text-saffron">87%</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 text-center">{t('Avg Score')}</span>
          </div>
        </div>
      </div>
      
      <div className="mt-6 space-y-3">
        {complianceDistribution.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
              <span className="text-slate-600 dark:text-slate-300">{t(item.label)}</span>
            </div>
            <span className="font-semibold text-slate-900 dark:text-white">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}