import { useLanguage } from '../../context/LanguageContext';
import React from 'react';
import { NavLink } from 'react-router-dom';
import { HomeIcon, DocumentTextIcon, CheckBadgeIcon, ChartBarIcon, ClockIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { showToast } from '../../utils/toast';

export default function Sidebar() {
  const { t } = useLanguage();
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: HomeIcon },
    { name: 'Tenders', path: '/tenders', icon: DocumentTextIcon },
    { name: 'Verification', path: '/verification', icon: CheckBadgeIcon },
    { name: 'Reports', path: '/reports', icon: ChartBarIcon },
    { name: 'Audit Trail', path: '/audit', icon: ClockIcon },
    { name: 'Settings', path: '/settings', icon: Cog6ToothIcon },
  ];

  return (
    <div className="w-64 bg-navy dark:bg-slate-950 text-white flex flex-col h-full border-r border-navy-light dark:border-slate-800 shadow-xl z-10 hidden md:flex">
      <div className="h-16 flex items-center justify-center border-b border-navy-light/50 dark:border-slate-800 px-4">
        <div className="flex items-center gap-3">
          <img
            src="/bidkendra-logo.jpg"
            alt="Bidकेन्द्र Logo"
            className="w-10 h-10 rounded-xl object-cover shadow-md border border-white/10 shrink-0"
          />
          <div>
            <div className="notranslate" translate="no">
              <span className="font-bold font-serif text-xl tracking-wide">
                <span className="text-white">Bid</span>
                <span style={{ color: '#E07B39' }}>केन्द्र</span>
              </span>
            </div>
            <p className="text-[9px] italic text-slate-400 leading-tight -mt-0.5">{t('from finding to filing')}</p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto py-6">
        <nav className="space-y-1 px-3">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-navy-light text-white'
                      : 'text-slate-300 hover:bg-navy-light/50 hover:text-white'
                  }`
                }
              >
                <item.icon className="flex-shrink-0 -ml-1 mr-3 h-5 w-5 text-slate-400 group-hover:text-white" aria-hidden="true" />
                {t(item.name)}
              </NavLink>
            ))}
        </nav>
      </div>

      <div className="p-4 border-t border-navy-light/50 bg-navy-dark text-xs text-slate-400">
        <div className="flex items-center gap-2 mb-2">
          <CheckBadgeIcon className="w-4 h-4 text-success" />
          <span>{t('System Status: Online')}</span>
        </div>
        <p>{t('Govt. of India Enterprise')}</p>
      </div>
    </div>
  );
}