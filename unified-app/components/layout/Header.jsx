import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, BellIcon, UserCircleIcon, LanguageIcon, SunIcon, MoonIcon, CheckIcon, MicrophoneIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { showToast } from '../../utils/toast';

export default function Header() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { currentLang, setLanguage, activeLanguageObj, languages, t } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchToast, setShowSearchToast] = useState(false);
  const [showTranslate, setShowTranslate] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const translateRef = useRef(null);
  const notificationsRef = useRef(null);

  useEffect(() => {
    // Close dropdowns on outside click
    const handleClickOutside = (event) => {
      if (translateRef.current && !translateRef.current.contains(event.target)) {
        setShowTranslate(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setShowSearchToast(true);
      setTimeout(() => setShowSearchToast(false), 3000);
    }
  };

  const handleSelectLanguage = (lang) => {
    setLanguage(lang.code);
    setShowTranslate(false);
    showToast(`🌐 भाषा बदलकर ${lang.native} (${lang.name}) कर दी गई है`);
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-sm z-20 sticky top-0 transition-colors">
      <div className="flex flex-1">
        <form onSubmit={handleSearch} className="w-full max-w-lg lg:max-w-xs relative">
          <label htmlFor="search" className="sr-only">Search</label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
            </div>
            <input
              id="search"
              name="search"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowSearchToast(false);
              }}
              className="block w-full rounded-md border-0 bg-slate-50 dark:bg-slate-800 py-1.5 pl-10 pr-3 text-slate-900 dark:text-slate-100 ring-1 ring-inset ring-slate-300 dark:ring-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-navy dark:focus:ring-slate-400 sm:text-sm sm:leading-6 transition-colors"
              placeholder={t('Search tenders, bidders, reports...')}
              type="search"
              autoComplete="off"
            />
          </div>
          {searchTerm.length > 0 && !showSearchToast && (
            <div className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-slate-800 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-50 border border-slate-200 dark:border-slate-700">
              <button type="button" onClick={() => { setShowSearchToast(true); setTimeout(() => setShowSearchToast(false), 3000); }} className="block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700">
                {t('Search for')} "{searchTerm}" {t('in Tenders')}
              </button>
              <button type="button" onClick={() => { setShowSearchToast(true); setTimeout(() => setShowSearchToast(false), 3000); }} className="block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700">
                {t('Search for')} "{searchTerm}" {t('in Reports')}
              </button>
            </div>
          )}
          {showSearchToast && (
            <div className="absolute top-full left-0 mt-2 w-full p-2 bg-slate-800 dark:bg-slate-700 text-white text-sm rounded shadow-lg z-50 border border-slate-700">
              {t('Searching for')} "{searchTerm}"...
            </div>
          )}
        </form>
      </div>
      
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Vendor Suvidha Portal Cross-Link */}
        <button
          type="button"
          onClick={() => navigate('/vendor')}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 transition-all shadow-sm"
          title={t('Open CPCL Vendor Suvidha Self-Service Portal')}
        >
          <BuildingOffice2Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{t('Vendor Portal')}</span>
        </button>

        {/* Vernacular Voice Assistant Trigger */}
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new CustomEvent('open-voice-assistant', { detail: { open: true, autoListen: true } }));
            showToast('🎙️ Voice Assistant Activated (English / हिन्दी)');
          }}
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-200 hover:text-navy dark:hover:text-white bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm transition-all flex items-center gap-1"
          title={t('Vernacular Voice Assistant (English / हिन्दी)')}
          aria-label="Vernacular Voice Assistant"
        >
          <MicrophoneIcon className="h-4 w-4 sm:h-5 sm:w-5 text-saffron" />
          <span className="text-xs font-semibold hidden md:inline">{t('Voice')}</span>
        </button>

        {/* Dark Mode Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 p-1.5 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
          title={t('Toggle Dark Theme')}
          aria-label="Toggle Dark Theme"
        >
          {isDark ? <SunIcon className="h-5 w-5 text-yellow-400" /> : <MoonIcon className="h-5 w-5" />}
        </button>

        {/* Translation Language Selector */}
        <div className="relative flex items-center" ref={translateRef}>
          <button 
            type="button"
            onClick={() => setShowTranslate(!showTranslate)}
            className="text-slate-600 dark:text-slate-200 hover:text-navy dark:hover:text-white flex items-center gap-1.5 text-xs sm:text-sm font-medium px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm transition-all"
            title={t('Change Portal Language')}
          >
            <LanguageIcon className="h-4 w-4 sm:h-5 sm:w-5 text-saffron" />
            <span className="font-semibold">{activeLanguageObj.native}</span>
            <span className="text-[10px] uppercase font-mono px-1 py-0.2 rounded bg-navy text-white dark:bg-saffron dark:text-slate-900">
              {activeLanguageObj.code}
            </span>
          </button>

          {/* Language Selection Dropdown Modal */}
          {showTranslate && (
            <div className="absolute right-0 top-12 mt-1 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-xl shadow-2xl py-3 px-3 ring-1 ring-black ring-opacity-10 z-50 border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">🌐</span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white">भाषा चुनें / Select Language</h3>
                    <p className="text-[11px] text-slate-400">{t('Portal translates instantly to your choice')}</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowTranslate(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-700"
                >
                  ✕
                </button>
              </div>

              {/* Languages Grid */}
              <div className="grid grid-cols-2 gap-1.5 max-h-72 overflow-y-auto pr-1">
                {languages.map((lang) => {
                  const isSelected = currentLang === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleSelectLanguage(lang)}
                      className={`flex items-center justify-between p-2 rounded-lg text-left transition-all text-xs ${
                        isSelected 
                          ? 'bg-navy text-white dark:bg-saffron dark:text-slate-950 font-bold shadow-sm' 
                          : 'hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{lang.flag}</span>
                        <div>
                          <p className="font-semibold text-xs leading-tight">{lang.native}</p>
                          <p className={`text-[10px] ${isSelected ? 'opacity-90' : 'text-slate-400'}`}>{lang.name}</p>
                        </div>
                      </div>
                      {isSelected && <CheckIcon className="h-4 w-4 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700 text-center">
                <p className="text-[10px] text-slate-400">{t('🇮🇳 Digital India Multi-Lingual GeM Procurement')}</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button
            className="relative text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 p-1"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-danger text-[10px] font-bold text-white flex items-center justify-center border border-white dark:border-slate-900 transition-colors">3</span>
            <BellIcon className="h-6 w-6" aria-hidden="true" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-10 mt-2 w-72 bg-white dark:bg-slate-800 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-50 border border-slate-200 dark:border-slate-700">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t('Notifications')}</h3>
                <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs">{t('Close')}</button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <button type="button" onClick={() => { setShowNotifications(false); showToast(t('Viewing tender CPCL-1001')); }} className="block w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{t('Tender CPCL-1001 deadline approaching')}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('Due in 2 days')}</p>
                </button>
                <button type="button" onClick={() => { setShowNotifications(false); showToast(t('Viewing tender CPCL-1005 bids')); }} className="block w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{t('New bid submitted for CPCL-1005')}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('By Vendor ABC')}</p>
                </button>
                <button type="button" onClick={() => { setShowNotifications(false); showToast(t('Viewing evaluation CPCL-0998')); }} className="block w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{t('Technical evaluation completed')}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('For tender CPCL-0998')}</p>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1 sm:mx-2 transition-colors"></div>

        <div className="flex items-center gap-3 relative group cursor-pointer">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('Nodal Officer')}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('Ministry of Petroleum & Natural Gas / CPCL')}</p>
          </div>
          <UserCircleIcon className="h-8 w-8 text-navy dark:text-slate-300" />
          
          {/* Dropdown */}
          <div className="absolute right-0 top-10 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 hidden group-hover:block z-50 border border-slate-200 dark:border-slate-700">
            <button type="button" onClick={() => setShowProfileModal(true)} className="block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700">{t('Officer Profile')}</button>
            <button type="button" onClick={() => navigate('/settings')} className="block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700">{t('Settings')}</button>
            <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm text-danger hover:bg-slate-100 dark:hover:bg-slate-700">{t('Sign out')}</button>
          </div>
        </div>
      </div>

      {/* Officer Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('Procurement Officer Credentials')}</h3>
              <button onClick={() => setShowProfileModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm">✕</button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <div className="w-12 h-12 rounded-full bg-navy text-white flex items-center justify-center font-bold text-lg">
                  RS
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">{t('Rajesh Sharma')}</h4>
                  <p className="text-xs text-slate-500">{t('Chief Nodal Procurement Officer')}</p>
                  <p className="text-xs text-saffron font-semibold">{t('CPCL Refinery Tender Board')}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded">
                  <span className="text-slate-400 block">{t('Employee Code:')}</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{t('CPCL-EMP-8842')}</span>
                </div>
                <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded">
                  <span className="text-slate-400 block">{t('Clearance Level:')}</span>
                  <span className="font-bold text-green-600">{t('Level 3 (Restricted)')}</span>
                </div>
                <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded col-span-2">
                  <span className="text-slate-400 block">{t('Digital Signature (DSC):')}</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{t('SHA-256 Valid till Dec 2027')}</span>
                </div>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => { setShowProfileModal(false); navigate('/settings'); }} className="px-3 py-1.5 text-xs font-semibold rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                {t('Edit Settings')}
              </button>
              <button onClick={() => setShowProfileModal(false)} className="px-4 py-1.5 text-xs font-semibold rounded bg-navy text-white hover:bg-navy-light">
                {t('Close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}