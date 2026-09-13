import { useLanguage } from '../../context/LanguageContext';
import React from 'react';
import { recentActivity } from '../../utils/dummyData';
import { formatDate } from '../../utils/helpers';
import StatusBadge from '../common/StatusBadge';
import { showToast } from '../../utils/toast';

export default function RecentActivity() {
  const { t, currentLang } = useLanguage();
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden h-full flex flex-col transition-colors">
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/40">
        <h3 className="text-lg font-medium text-slate-900 dark:text-white">{t('Recent Activity Logs')}</h3>
        <button className="text-sm text-navy dark:text-saffron hover:text-navy-light dark:hover:opacity-80 font-medium" onClick={() => showToast(t('Viewing all recent activity'))}>{t('View All')}</button>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-900/60">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('Action')}</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('Entity')}</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('Time')}</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('Status')}</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
            {recentActivity.map((log, idx) => (
              <tr key={log.id} className={idx % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/50 dark:bg-slate-900/30'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">{t(log.action)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{t(log.entity)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{formatDate(log.time, currentLang)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={log.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}