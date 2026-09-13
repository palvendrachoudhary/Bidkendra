import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MagnifyingGlassIcon, 
  BellIcon, 
  UserCircleIcon, 
  LanguageIcon, 
  SunIcon, 
  MoonIcon, 
  CheckIcon,
  ShieldCheckIcon,
  BuildingOffice2Icon,
  IdentificationIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  XMarkIcon,
  MicrophoneIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { showToast } from '../../utils/toast';

export default function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { currentLang, setLanguage, activeLanguageObj, languages } = useLanguage();
  const { isDark, toggleTheme } = useTheme();

  const [showNotifications, setShowNotifications] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showTranslate, setShowTranslate] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState('credentials');

  const translateRef = useRef(null);
  const notificationsRef = useRef(null);
  const searchRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (translateRef.current && !translateRef.current.contains(event.target)) {
        setShowTranslate(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      showToast('⚠️ Please enter a search query.');
      return;
    }
    setIsSearching(true);
    setShowSearchDropdown(false);
    showToast(`🔍 Searching across CPCL tenders & vendors for: "${searchTerm}"`);
    setTimeout(() => {
      setIsSearching(false);
      navigate('/tenders');
    }, 450);
  };

  const handleQuickSearch = (target, label) => {
    setShowSearchDropdown(false);
    showToast(`🔍 Filtered ${label} for "${searchTerm}"`);
    navigate(target);
  };

  const handleSelectLanguage = (lang) => {
    setLanguage(lang.code);
    setShowTranslate(false);
    showToast(`🌐 भाषा बदलकर ${lang.native} (${lang.name}) कर दी गई है`);
  };

  const handleThemeToggle = () => {
    toggleTheme();
    showToast(!isDark ? '🌙 Dark mode enabled' : '☀️ Light mode enabled');
  };

  // Standardized Officer Persona
  const officerName = user?.name || 'S. K. Verma, IOFS';
  const officerEmail = user?.email || 'officer.verma@cpcl.gov.in';
  const officerRole = user?.role || 'Senior Procurement Officer';
  const officerEmpId = user?.employeeId || 'CPCL-EMP-8842';
  const officerDept = 'Ministry of Petroleum & Natural Gas / CPCL';
  const officerOrg = 'Chennai Petroleum Corporation Limited (CPCL)';

  return (
    <div className="flex flex-col w-full sticky top-0 z-30 shadow-md">
      {/* GoI National Tricolor Accent Strip */}
      <div className="h-1 w-full flex">
        <div className="h-full w-1/3 bg-[#FF9933]"></div>
        <div className="h-full w-1/3 bg-white"></div>
        <div className="h-full w-1/3 bg-[#138808]"></div>
      </div>

      {/* Official Government & CPCL Top Banner */}
      <div className="bg-slate-900 text-slate-100 px-4 py-1.5 text-xs border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-medium tracking-wide">
            {/* Ashoka Lion Emblem Placeholder Icon */}
            <span className="text-amber-400 font-serif font-bold text-sm select-none" title="Government of India">🏛️</span>
            <span>भारत सरकार | <span className="font-semibold text-white">Government of India</span></span>
          </div>
          <span className="text-slate-600 hidden md:inline">|</span>
          <div className="hidden md:flex items-center gap-1.5 text-slate-300">
            <span>पेट्रोलियम एवं प्राकृतिक गैस मंत्रालय</span>
            <span className="text-slate-500">|</span>
            <span className="text-amber-300/90 font-medium">Ministry of Petroleum & Natural Gas (MoPNG)</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-slate-300">
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
            {/* CPCL Emblem / IndianOil Group Badge */}
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-bold text-amber-300 tracking-wider">CPCL</span>
            <span className="text-slate-400 hidden sm:inline">— Chennai Petroleum Corporation Limited</span>
            <span className="text-slate-400 text-[10px] hidden lg:inline">(A Group Company of IndianOil)</span>
          </div>
          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-blue-950 text-blue-200 border border-blue-800 text-[10px] font-mono">
            GeM-CPCL-2026
          </span>
        </div>
      </div>

      {/* Main Interactive Header Bar */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 transition-colors">
        {/* Left Section: Branding & Search */}
        <div className="flex items-center gap-4 flex-1 max-w-2xl">
          {/* Authentic CPCL Logo Branding Pill */}
          <div className="flex items-center gap-2.5 shrink-0 pr-3 border-r border-slate-200 dark:border-slate-800">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-900 via-navy to-slate-900 flex items-center justify-center text-white font-black text-sm tracking-tighter shadow border border-amber-400/40 select-none">
              <span className="text-amber-300">CP</span><span className="text-white">CL</span>
            </div>
            <div className="hidden xl:block leading-tight">
              <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                Chennai Petroleum
              </div>
              <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                A Group Company of IndianOil
              </div>
            </div>
          </div>

          {/* Interactive Search Bar */}
          <form onSubmit={handleSearch} className="w-full max-w-md relative" ref={searchRef}>
            <label htmlFor="search-input" className="sr-only">Search tenders and bidders</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                {isSearching ? (
                  <div className="w-4 h-4 border-2 border-navy border-t-transparent dark:border-saffron rounded-full animate-spin"></div>
                ) : (
                  <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                )}
              </div>
              <input
                id="search-input"
                name="search"
                value={searchTerm}
                onFocus={() => { if (searchTerm.trim()) setShowSearchDropdown(true); }}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSearchDropdown(e.target.value.trim().length > 0);
                }}
                className="block w-full rounded-lg border-0 bg-slate-50 dark:bg-slate-800/90 py-1.5 pl-9 pr-8 text-slate-900 dark:text-slate-100 ring-1 ring-inset ring-slate-300 dark:ring-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-navy dark:focus:ring-saffron sm:text-xs sm:leading-6 transition-all shadow-inner"
                placeholder="Search CPCL tenders, vendor GSTIN, CIN, MSME..."
                type="search"
                autoComplete="off"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => { setSearchTerm(''); setShowSearchDropdown(false); }}
                  className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Search Suggestions Dropdown */}
            {showSearchDropdown && (
              <div className="absolute top-full left-0 mt-1.5 w-full bg-white dark:bg-slate-800 rounded-xl shadow-2xl py-2 ring-1 ring-black/10 z-50 border border-slate-200 dark:border-slate-700 text-xs">
                <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700">
                  Quick Actions for "{searchTerm}"
                </div>
                <button
                  type="button"
                  onClick={() => handleQuickSearch('/tenders', 'Tenders')}
                  className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center justify-between transition-colors"
                >
                  <span>Search in <strong>Active Tenders</strong></span>
                  <span className="text-[10px] text-slate-400 font-mono">CPCL-2026-T*</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSearch('/verification', 'Bidder Verification')}
                  className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center justify-between transition-colors"
                >
                  <span>Verify Bidder / GSTIN</span>
                  <span className="text-[10px] text-slate-400 font-mono">14 Statutory Checks</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSearch('/reports', 'Compliance Reports')}
                  className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center justify-between transition-colors"
                >
                  <span>Search in <strong>Audit Trail & Reports</strong></span>
                  <span className="text-[10px] text-slate-400 font-mono">PDF & Logs</span>
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Right Section: Controls & Persona */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Vernacular Voice Assistant Trigger Button */}
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('open-voice-assistant', { detail: { open: true, autoListen: true } }));
              showToast('🎙️ Voice Assistant Activated (English / हिन्दी)');
            }}
            className="text-slate-700 dark:text-slate-200 hover:text-navy dark:hover:text-white flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-navy dark:focus:ring-saffron"
            title="Vernacular Voice Assistant (English / हिन्दी)"
            aria-label="Vernacular Voice Assistant"
          >
            <MicrophoneIcon className="h-4 w-4 text-[#FF9933]" />
            <span className="hidden sm:inline font-semibold">Voice</span>
          </button>

          {/* Dark Mode Toggle Button */}
          <button
            type="button"
            onClick={handleThemeToggle}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-2 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-navy dark:focus:ring-saffron"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle Theme"
          >
            {isDark ? (
              <SunIcon className="h-5 w-5 text-amber-400 animate-in spin-in-180 duration-200" />
            ) : (
              <MoonIcon className="h-5 w-5 text-slate-600" />
            )}
          </button>

          {/* Translation Language Selector */}
          <div className="relative flex items-center" ref={translateRef}>
            <button 
              type="button"
              onClick={() => setShowTranslate(!showTranslate)}
              className="text-slate-700 dark:text-slate-200 hover:text-navy dark:hover:text-white flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-navy dark:focus:ring-saffron"
              title="Change Portal Language (12 Indian Languages)"
            >
              <LanguageIcon className="h-4 w-4 text-[#FF9933]" />
              <span className="hidden sm:inline">{activeLanguageObj?.native || 'English'}</span>
              <span className="text-[10px] uppercase font-mono px-1 py-0.5 rounded bg-slate-800 text-white dark:bg-amber-400 dark:text-slate-950 font-bold">
                {activeLanguageObj?.code || 'en'}
              </span>
            </button>

            {/* Language Selection Dropdown Modal */}
            {showTranslate && (
              <div className="absolute right-0 top-12 mt-1 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-xl shadow-2xl py-3 px-3 ring-1 ring-black/10 z-50 border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🌐</span>
                    <div>
                      <h3 className="text-xs font-bold text-slate-800 dark:text-white">भाषा चुनें / Select Portal Language</h3>
                      <p className="text-[10px] text-slate-400">Digital India multi-lingual accessibility</p>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setShowTranslate(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Languages Grid */}
                <div className="grid grid-cols-2 gap-1.5 max-h-72 overflow-y-auto pr-1">
                  {(languages || []).map((lang) => {
                    const isSelected = currentLang === lang.code;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => handleSelectLanguage(lang)}
                        className={`flex items-center justify-between p-2 rounded-lg text-left transition-all text-xs ${
                          isSelected 
                            ? 'bg-navy text-white dark:bg-amber-400 dark:text-slate-950 font-bold shadow-sm ring-1 ring-navy' 
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
                  <p className="text-[10px] text-slate-400">🇮🇳 Smart India Hackathon — CPCL Procurement System</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Notifications Dropdown */}
          <div className="relative" ref={notificationsRef}>
            <button
              type="button"
              className="relative text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-navy dark:focus:ring-saffron"
              onClick={() => setShowNotifications(!showNotifications)}
              title="Notifications"
            >
              <span className="absolute 1 top-1 right-1 h-4 w-4 rounded-full bg-rose-600 text-[10px] font-bold text-white flex items-center justify-center border-2 border-white dark:border-slate-900">
                3
              </span>
              <BellIcon className="h-5 w-5" aria-hidden="true" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-12 mt-1 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl py-2 ring-1 ring-black/10 z-50 border border-slate-200 dark:border-slate-700 animate-in fade-in duration-100">
                <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">CPCL Tender Alerts</span>
                    <span className="bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 text-[10px] font-bold px-1.5 py-0.5 rounded">3 New</span>
                  </div>
                  <button 
                    onClick={() => setShowNotifications(false)} 
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                  >
                    Close
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60">
                  <button 
                    type="button" 
                    onClick={() => { setShowNotifications(false); showToast('Viewing tender CPCL-2026-T1001'); navigate('/verification/b1'); }} 
                    className="w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-white">
                      <span>Tender CPCL-2026-T1001</span>
                      <span className="text-[10px] text-amber-500 font-medium">Due in 2 days</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">PetroTech India Pvt Ltd technical evaluation pending.</p>
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { setShowNotifications(false); showToast('Viewing tender CPCL-2026-T1005 bids'); navigate('/tenders'); }} 
                    className="w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-white">
                      <span>New Bid: CPCL-2026-T1005</span>
                      <span className="text-[10px] text-emerald-500 font-medium">Just now</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Global Energy Solutions submitted statutory certificates.</p>
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { setShowNotifications(false); showToast('Viewing audit log CPCL-0998'); navigate('/audit'); }} 
                    className="w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-white">
                      <span>FIDO2 Passkey Signed</span>
                      <span className="text-[10px] text-slate-400">1 hr ago</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Vendor rejection notification dispatched via Viasocket.</p>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="h-7 w-px bg-slate-200 dark:bg-slate-700 mx-1 transition-colors"></div>

          {/* Synchronized Officer Profile Persona Trigger */}
          <div 
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700 group"
            title="Click to view Officer Credentials & FIDO2 DSC"
          >
            {/* Officer Avatar with Initials */}
            <div className="w-8 h-8 rounded-lg bg-navy dark:bg-amber-400 text-white dark:text-slate-950 flex items-center justify-center font-bold text-xs shadow-sm ring-1 ring-navy/20 dark:ring-amber-400/20 group-hover:scale-105 transition-transform">
              SV
            </div>

            <div className="text-left hidden md:block leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {officerName}
                </span>
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
                  DSC
                </span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                {officerRole} (CPCL)
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Officer Credentials & Persona Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
            {/* Modal Header with Government Ribbon */}
            <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-slate-700 text-navy dark:text-amber-400">
                  <ShieldCheckIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Procurement Officer Credentials
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Chennai Petroleum Corporation Limited (CPCL)
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowProfileModal(false)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="Close modal"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Officer Persona Card */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-slate-50 to-blue-50/40 dark:from-slate-900 dark:to-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-900 to-navy text-white flex items-center justify-center font-black text-xl shadow-md border-2 border-amber-400/60 shrink-0">
                  SV
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-base text-slate-900 dark:text-white truncate">
                      {officerName}
                    </h4>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                      IOFS
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-navy dark:text-amber-400">
                    {officerRole}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    {officerEmail}
                  </p>
                </div>
              </div>

              {/* Persona Metadata Grid */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-100 dark:border-slate-700/60">
                  <span className="text-slate-400 block text-[11px]">Employee Code</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">{officerEmpId}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-100 dark:border-slate-700/60">
                  <span className="text-slate-400 block text-[11px]">Security Clearance</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckIcon className="w-3.5 h-3.5" /> Level 3 (Restricted)
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-100 dark:border-slate-700/60 col-span-2">
                  <span className="text-slate-400 block text-[11px]">Department / PSU Affiliation</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {officerOrg}
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    {officerDept} (Refinery Tender Board)
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-100 dark:border-slate-700/60 col-span-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-400 text-[11px]">Digital Signature Certificate (DSC)</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">ACTIVE</span>
                  </div>
                  <div className="font-mono text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 p-1.5 rounded border border-slate-200 dark:border-slate-700">
                    NIC-CA SHA-256 (e-Sign FIDO2 Valid till Dec 2027)
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <button 
                type="button"
                onClick={() => {
                  logout();
                  setShowProfileModal(false);
                  showToast('Signed out of CPCL Procurement Portal');
                  navigate('/login');
                }}
                className="px-3 py-2 text-xs font-semibold rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1.5"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                Sign Out
              </button>

              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => { setShowProfileModal(false); navigate('/settings'); }} 
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-all flex items-center gap-1.5"
                >
                  <Cog6ToothIcon className="w-4 h-4" />
                  Settings
                </button>
                <button 
                  type="button"
                  onClick={() => setShowProfileModal(false)} 
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-navy hover:bg-navy-light text-white transition-all shadow hover:shadow-md focus:ring-2 focus:ring-navy"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
