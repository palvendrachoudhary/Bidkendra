import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
          <div className="absolute inset-0 bg-slate-900 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white dark:bg-slate-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-slate-200 dark:border-slate-700">
          <div className="bg-white dark:bg-slate-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-slate-900 dark:text-white">{title}</h3>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-200">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
          <div className="px-4 py-5 sm:p-6 text-slate-800 dark:text-slate-200">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}