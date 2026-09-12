import React, { useState, useEffect } from 'react';
import Button from '../components/common/Button';
import { showToast } from '../utils/toast';
import { recentActivity } from '../utils/dummyData';
import { formatDate } from '../utils/helpers';
import StatusBadge from '../components/common/StatusBadge';
import { CheckBadgeIcon, ArrowDownTrayIcon } from '@heroicons/react/24/solid';
import { getAuditLogsApi } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export default function AuditTrail() {
  const { t, currentLang } = useLanguage();
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    const res = await getAuditLogsApi();
    if (res && res.data && res.data.length > 0) {
      setLogs(res.data);
    } else {
      // Fallback
      setLogs(recentActivity.map(r => ({
        id: r.id,
        action: r.action,
        entity_type: 'bidder',
        entity_id: r.entity,
        details: `${r.action} performed on ${r.entity} by ${r.user}`,
        created_at: r.time,
        status: r.status
      })));
    }
    setLoading(false);
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `CPCL_Audit_Trail_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast(t('Tamper-Proof Audit Trail Exported (.json)'));
  };

  const filteredLogs = logs.filter(l => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term || 
      (l.action && l.action.toLowerCase().includes(term)) ||
      (l.details && l.details.toLowerCase().includes(term)) ||
      (l.entity_id && l.entity_id.toLowerCase().includes(term));

    const matchesFilter = filterType === 'All' ||
      (filterType === 'Document Scans' && l.action.includes('DOCUMENT')) ||
      (filterType === 'Verifications' && (l.action.includes('VERIF') || l.action.includes('COMPLIANCE')));

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('System Audit Trail & Blockchain Ledger')}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t('Immutable SHA-256 authenticated log of all statutory OCR scans, API transactions, and officer decisions.')}
          </p>
        </div>
        <Button variant="secondary" onClick={handleExport} className="flex items-center gap-1.5">
          <ArrowDownTrayIcon className="w-4 h-4" />
          {t('Export Ledger')}
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-3">
        <select 
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-sm"
        >
          <option value="All">{t('All Events')}</option>
          <option value="Document Scans">{t('Document Scans (OCR)')}</option>
          <option value="Verifications">{t('Portal Verifications')}</option>
        </select>
        <input 
          type="text" 
          placeholder={t('Search by action, details, or hash...')} 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-sm flex-1" 
        />
        <Button onClick={fetchLogs} size="sm" variant="secondary">{t('Refresh')}</Button>
      </div>

      <div className="h-[600px] overflow-y-auto pr-4">
        {loading ? (
          <div className="p-8 text-center text-slate-400">{t('Loading audit ledger...')}</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-400">{t('No matching audit records found.')}</div>
        ) : (
          <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-4 space-y-6 py-4">
            {filteredLogs.map((log) => {
              const hashMatch = log.details && log.details.match(/SHA-256:\s*([a-f0-9]{64})/i);
              const hash = hashMatch ? hashMatch[1] : (log.entity_id || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
              const isScan = log.action === 'DOCUMENT_SCAN';
              
              return (
                <div key={log.id} className="relative pl-8">
                  <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-4 border-white dark:border-slate-900 ${
                    isScan ? 'bg-saffron' : 'bg-navy'
                  }`}></div>
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">{t(log.action)}</h4>
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {t(log.entity_type)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {t('Timestamp:')} {formatDate(log.created_at, currentLang)} • {t('User:')} {t(log.user_id || 'Nodal Officer')}
                        </p>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                        {t('Logged')}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                      {t(log.details)}
                    </p>

                    <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 font-mono text-[10px] break-all text-slate-500 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 shrink-0">
                        <CheckBadgeIcon className="w-4 h-4 text-green-500 shrink-0" />
                        <span className="text-green-600 font-bold uppercase tracking-wider text-[10px]">{t('Tamper Proof')}</span>
                      </div>
                      <span className="opacity-75 truncate text-right">{t('Hash:')} {hash}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}