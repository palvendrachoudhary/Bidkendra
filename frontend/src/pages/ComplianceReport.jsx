import React from 'react';
import Button from '../components/common/Button';
import { showToast } from '../utils/toast';
import { PrinterIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../context/LanguageContext';

export default function ComplianceReport() {
  const { t, currentLang } = useLanguage();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('Compliance Reports')}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('Generate and download detailed verification reports.')}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" className="gap-2" onClick={() => showToast(t('Printing report...'))}>
            <PrinterIcon className="w-4 h-4" /> {t('Print')}
          </Button>
          <Button variant="primary" className="gap-2" onClick={() => showToast(t('Exporting PDF...'))}>
            <ArrowDownTrayIcon className="w-4 h-4" /> {t('Export PDF')}
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-8 max-w-4xl mx-auto transition-colors">
        <div className="text-center mb-8 border-b border-slate-200 dark:border-slate-700 pb-6">
          <h2 className="text-xl font-bold uppercase tracking-wider text-slate-800 dark:text-white">{t('Government of India')}</h2>
          <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300 mt-1">
            <span className="notranslate" translate="no">Bidकेन्द्र</span> {t('Verification Report')}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            {t('Generated on:')} {new Date().toLocaleDateString(currentLang === 'hi' ? 'hi-IN' : 'en-IN')}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <h4 className="font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2 mb-3">{t('Bidder Details')}</h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <li><span className="font-medium text-slate-800 dark:text-white">{t('Name:')}</span> {t('PetroTech India Pvt Ltd')}</li>
              <li><span className="font-medium text-slate-800 dark:text-white">{t('ID:')}</span> {t('BID101')}</li>
              <li><span className="font-medium text-slate-800 dark:text-white">{t('Category:')}</span> {t('IT Hardware')}</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2 mb-3">{t('Tender Details')}</h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <li><span className="font-medium text-slate-800 dark:text-white">{t('Tender ID:')}</span> {t('CPCL-2026-T1001')}</li>
              <li><span className="font-medium text-slate-800 dark:text-white">{t('Department:')}</span> {t('Ministry of Petroleum & Natural Gas / CPCL')}</li>
              <li><span className="font-medium text-slate-800 dark:text-white">{t('Value:')}</span> ₹45,00,000</li>
            </ul>
          </div>
        </div>

        <h4 className="font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">{t('Detailed Assessment')}</h4>
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200">
            <tr>
              <th className="px-4 py-2">{t('Parameter')}</th>
              <th className="px-4 py-2">{t('Status')}</th>
              <th className="px-4 py-2">{t('AI Confidence')}</th>
              <th className="px-4 py-2">{t('Remarks')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-800 dark:text-slate-200">
            <tr>
              <td className="px-4 py-3 font-medium">{t('MSME Udyam')}</td>
              <td className="px-4 py-3 text-success font-medium">{t('Verified')}</td>
              <td className="px-4 py-3">100%</td>
              <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{t('Valid certificate match found.')}</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium">{t('GST Records')}</td>
              <td className="px-4 py-3 text-success font-medium">{t('Verified')}</td>
              <td className="px-4 py-3">98%</td>
              <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{t('Regular filings verified.')}</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium">{t('Financial Turnover')}</td>
              <td className="px-4 py-3 text-danger font-medium">{t('Failed')}</td>
              <td className="px-4 py-3">30%</td>
              <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{t('Does not meet 3yr avg criteria.')}</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-12 flex justify-between items-end">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            <p>{t('System Generated Report')}</p>
            <p className="mt-1 font-mono text-xs">{t('Hash:')} a7x9...42f1</p>
          </div>
          <div className="text-center border-t border-slate-300 dark:border-slate-600 pt-4 w-48">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t('Authorized Signatory')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}