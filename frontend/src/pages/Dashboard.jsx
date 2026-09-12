import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { showToast } from '../utils/toast';
import { DocumentTextIcon, CheckBadgeIcon, ChartBarIcon, UsersIcon } from '@heroicons/react/24/outline';
import StatsCard from '../components/common/StatsCard';
import ComplianceChart from '../components/dashboard/ComplianceChart';
import RecentActivity from '../components/dashboard/RecentActivity';
import RiskHeatMap from '../components/dashboard/RiskHeatMap';
import { stats } from '../utils/dummyData';

export default function Dashboard() {
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('Executive Dashboard')}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('Overview of tender verification metrics and system status.')}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500 dark:text-slate-400">{t('Last updated: Just now')}</span>
          <button className="text-navy dark:text-saffron hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-full transition-colors" onClick={() => showToast(t('Dashboard refreshed'))}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Total Tenders" value={stats.totalTenders} icon={DocumentTextIcon} trend="12%" trendUp={true} />
        <StatsCard title="Pending Verifications" value={stats.pendingVerifications} icon={ClockIconPlaceholder} trend="5%" trendUp={false} />
        <StatsCard title="Avg Compliance Rate" value={`${stats.complianceRate}%`} icon={ChartBarIcon} trend="2%" trendUp={true} />
        <StatsCard title="Active Bidders" value={stats.activeBidders} icon={UsersIcon} trend="8%" trendUp={true} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-96">
          <RecentActivity />
        </div>
        <div className="h-96">
          <ComplianceChart />
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <RiskHeatMap />
      </div>
    </div>
  );
}

// Dummy clock icon for the stats card
function ClockIconPlaceholder(props) {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}