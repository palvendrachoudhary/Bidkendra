import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export default function StatsCard({ title, value, icon: Icon, trend, trendUp }) {
  const { t } = useLanguage();
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-5 flex items-start justify-between transition-colors">
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">{t(title)}</p>
        <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
        {trend && (
          <p className={`mt-2 text-sm flex items-center gap-1 ${trendUp ? 'text-success' : 'text-danger'}`}>
            <span>{trendUp ? '↑' : '↓'}</span>
            <span>{trend}</span>
            <span className="text-slate-500 dark:text-slate-400 ml-1">{t('vs last month')}</span>
          </p>
        )}
      </div>
      <div className="p-3 bg-slate-50 dark:bg-slate-700/60 rounded-md">
        <Icon className="w-6 h-6 text-navy dark:text-saffron" />
      </div>
    </div>
  );
}
