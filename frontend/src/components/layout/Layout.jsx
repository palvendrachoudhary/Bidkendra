import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import VernacularVoiceAssistant from '../common/VernacularVoiceAssistant';

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900 relative">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative">
          {/* Clearly Readable Bidकेन्द्र Brand Watermark in Background using exact Logo image */}
          <div 
            className="pointer-events-none fixed inset-0 flex items-center justify-center z-0 select-none overflow-hidden"
            aria-hidden="true"
          >
            <div className="flex flex-col items-center justify-center transform -rotate-6 scale-100 sm:scale-110 opacity-20 dark:opacity-30 transition-opacity">
              <img
                src="/bidkendra-logo.jpg"
                alt="Bidकेन्द्र Watermark"
                className="w-80 h-80 sm:w-96 sm:h-96 rounded-3xl object-cover shadow-2xl"
              />
            </div>
          </div>

          <div className="max-w-7xl mx-auto relative z-10">
            <Outlet />
          </div>
        </main>
      </div>
      
      {/* Feature 28: Vernacular Voice Assistant Component */}
      <VernacularVoiceAssistant />
    </div>
  );
}