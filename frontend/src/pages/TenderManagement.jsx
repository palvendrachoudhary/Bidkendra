import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tenders as initialTenders } from '../utils/dummyData';
import { formatDate } from '../utils/helpers';
import StatusBadge from '../components/common/StatusBadge';
import Button from '../components/common/Button';
import { showToast } from '../utils/toast';
import { useLanguage } from '../context/LanguageContext';
import { 
  FunnelIcon, 
  PlusIcon, 
  XMarkIcon, 
  CheckCircleIcon, 
  DocumentMagnifyingGlassIcon,
  BuildingOffice2Icon
} from '@heroicons/react/24/outline';

export default function TenderManagement() {
  const { t, currentLang } = useLanguage();
  const navigate = useNavigate();
  const [tenderList, setTenderList] = useState(initialTenders);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTenderDetails, setSelectedTenderDetails] = useState(null);

  // Filters State
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // New Tender Form State
  const [newTender, setNewTender] = useState({
    title: '',
    dept: 'Ministry of Petroleum & Natural Gas / CPCL',
    value: '₹1,25,00,000',
    closingDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    category: 'Mechanical',
    localContentMin: '50%'
  });

  const handleCreateTender = (e) => {
    e.preventDefault();
    if (!newTender.title.trim()) {
      showToast('⚠️ Please provide a tender title');
      return;
    }

    const created = {
      id: `CPCL-2026-T${1000 + tenderList.length + 1}`,
      title: newTender.title,
      dept: newTender.dept,
      value: newTender.value,
      closingDate: newTender.closingDate,
      status: 'OPEN',
      bids: 0
    };

    setTenderList([created, ...tenderList]);
    setShowCreateModal(false);
    setNewTender({
      title: '',
      dept: 'Ministry of Petroleum & Natural Gas / CPCL',
      value: '₹1,25,00,000',
      closingDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      category: 'Mechanical',
      localContentMin: '50%'
    });
    showToast(`✅ Tender ${created.id} published to GeM Portal`);
  };

  const filteredTenders = tenderList.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === 'ALL' || t.dept.includes(selectedDept);
    const matchesStatus = selectedStatus === 'ALL' || t.status === selectedStatus;
    return matchesSearch && matchesDept && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex sm:items-center justify-between flex-col sm:flex-row gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('Tender Management')}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t('Publish, monitor, and verify compliance for active GeM tenders under CPCL.')}
          </p>
        </div>
        <Button className="gap-2 shrink-0 bg-navy hover:bg-navy-light text-white" onClick={() => setShowCreateModal(true)}>
          <PlusIcon className="w-5 h-5" />
          {t('Create New Tender')}
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <div className="space-y-3">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-4 justify-between items-center transition-colors">
          <div className="w-full sm:max-w-md relative">
            <input
              type="text"
              placeholder={t('Search by Tender ID (e.g. CPCL-1001) or Title...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 shadow-sm focus:border-navy focus:ring-navy sm:text-sm py-2 pl-3 pr-10 border text-slate-800 dark:text-slate-200"
            />
          </div>
          <Button 
            variant="secondary" 
            className={`gap-2 w-full sm:w-auto ${showFilters ? 'bg-slate-200 dark:bg-slate-700' : ''}`} 
            onClick={() => setShowFilters(!showFilters)}
          >
            <FunnelIcon className="w-4 h-4" />
            {t('Filters')} {showFilters ? '(Active)' : ''}
          </Button>
        </div>

        {/* Real Filter Drawer */}
        {showFilters && (
          <div className="bg-slate-50 dark:bg-slate-900/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap gap-4 items-center text-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300">{t('Status:')}</span>
              <select 
                value={selectedStatus} 
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-1.5 text-slate-700 dark:text-slate-200"
              >
                <option value="ALL">{t('All Statuses')}</option>
                <option value="OPEN">{t('OPEN')}</option>
                <option value="EVALUATION">{t('EVALUATION')}</option>
                <option value="CLOSED">{t('CLOSED')}</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300">{t('Department:')}</span>
              <select 
                value={selectedDept} 
                onChange={(e) => setSelectedDept(e.target.value)}
                className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-1.5 text-slate-700 dark:text-slate-200"
              >
                <option value="ALL">{t('All Departments')}</option>
                <option value="CPCL">{t('CPCL / Ministry of Petroleum')}</option>
                <option value="Education">{t('Ministry of Education')}</option>
                <option value="Health">{t('Ministry of Health')}</option>
              </select>
            </div>

            {(selectedStatus !== 'ALL' || selectedDept !== 'ALL') && (
              <button 
                onClick={() => { setSelectedStatus('ALL'); setSelectedDept('ALL'); }}
                className="text-red-500 hover:underline font-semibold ml-auto"
              >
                {t('Reset Filters')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tenders Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-900/60">
              <tr>
                <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">{t('Tender Details')}</th>
                <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">{t('Department')}</th>
                <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">{t('Est. Value')}</th>
                <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">{t('Closing Date')}</th>
                <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">{t('Status')}</th>
                <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">{t('Actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {filteredTenders.map((tender, idx) => (
                <tr key={tender.id} className={idx % 2 === 0 ? 'hover:bg-slate-50 dark:hover:bg-slate-750' : 'bg-slate-50/40 dark:bg-slate-900/20 hover:bg-slate-50 dark:hover:bg-slate-750'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-navy dark:text-saffron">{t(tender.id)}</span>
                      <span className="text-sm text-slate-700 dark:text-slate-300 truncate max-w-xs">{t(tender.title)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{t(tender.dept)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800 dark:text-slate-100">{tender.value}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{formatDate(tender.closingDate, currentLang)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={tender.status} />
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{tender.bids} {t('Bids Received')}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                    <button 
                      onClick={() => setSelectedTenderDetails(tender)} 
                      className="text-navy dark:text-saffron hover:underline font-semibold"
                    >
                      {t('View Specs')}
                    </button>
                    <button 
                      onClick={() => navigate('/verification')} 
                      className="text-green-600 dark:text-green-400 hover:underline font-semibold inline-flex items-center gap-1"
                    >
                      <DocumentMagnifyingGlassIcon className="w-4 h-4" />
                      {t('Verify Bids')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredTenders.length === 0 && (
            <div className="p-8 text-center text-slate-500">{t('No tenders found matching your search.')}</div>
          )}
        </div>
      </div>

      {/* Create New Tender Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 mb-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <BuildingOffice2Icon className="w-6 h-6 text-navy dark:text-saffron" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('Publish New GeM Tender')}</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateTender} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('Tender Title & Scope')}</label>
                <input 
                  type="text" 
                  placeholder={t('e.g. Procurement of High-Pressure Seamless Steel Pipes')} 
                  value={newTender.title}
                  onChange={(e) => setNewTender({ ...newTender, title: e.target.value })}
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-600 p-2.5 dark:bg-slate-900 text-slate-800 dark:text-white" 
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('Procurement Category')}</label>
                  <select 
                    value={newTender.category}
                    onChange={(e) => setNewTender({ ...newTender, category: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-600 p-2.5 dark:bg-slate-900 text-slate-800 dark:text-white"
                  >
                    <option value="Mechanical Equipment">{t('Mechanical Equipment')}</option>
                    <option value="Refinery Pipeline Expansion">{t('Refinery Pipeline Expansion')}</option>
                    <option value="Electrical & Instrumentation">{t('Electrical & Instrumentation')}</option>
                    <option value="IT & Digital Infrastructure">{t('IT & Digital Infrastructure')}</option>
                    <option value="Civil Works">{t('Civil Works')}</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('Estimated Tender Value')}</label>
                  <input 
                    type="text" 
                    value={newTender.value}
                    onChange={(e) => setNewTender({ ...newTender, value: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-600 p-2.5 dark:bg-slate-900 text-slate-800 dark:text-white font-mono" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('Closing Date')}</label>
                  <input 
                    type="date" 
                    value={newTender.closingDate}
                    onChange={(e) => setNewTender({ ...newTender, closingDate: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-600 p-2.5 dark:bg-slate-900 text-slate-800 dark:text-white" 
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('Min. Local Content (%)')}</label>
                  <input 
                    type="text" 
                    value={newTender.localContentMin}
                    onChange={(e) => setNewTender({ ...newTender, localContentMin: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-600 p-2.5 dark:bg-slate-900 text-slate-800 dark:text-white" 
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('Procuring Department')}</label>
                <input 
                  type="text" 
                  value={t(newTender.dept)}
                  readOnly
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-600 p-2.5 bg-slate-100 dark:bg-slate-900 text-slate-500" 
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                >
                  {t('Cancel')}
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 font-bold rounded-lg bg-navy hover:bg-navy-light text-white shadow"
                >
                  {t('Publish Tender')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Tender Specs Modal */}
      {selectedTenderDetails && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 mb-4 border-b border-slate-100 dark:border-slate-700">
              <div>
                <span className="text-xs font-mono font-bold text-navy dark:text-saffron">{t(selectedTenderDetails.id)}</span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{t(selectedTenderDetails.title)}</h3>
              </div>
              <button onClick={() => setSelectedTenderDetails(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <div>
                  <span className="text-slate-400 block">{t('Department:')}</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{t(selectedTenderDetails.dept)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">{t('Estimated Budget:')}</span>
                  <span className="font-bold text-green-600">{selectedTenderDetails.value}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">{t('Status:')}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{t(selectedTenderDetails.status)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">{t('Total Submissions:')}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedTenderDetails.bids} {t('Bids')}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1">{t('Mandatory Statutory Requirements')}</h4>
                <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-400">
                  <li>{t('Active GSTIN with 100% GSTR-3B filing compliance')}</li>
                  <li>{t('MSME / Udyam registration or Startup India DPIIT recognition')}</li>
                  <li>{t('Make in India Class-I supplier local content > 50%')}</li>
                  <li>{t('Valid EPFO/ESIC registrations with no active debarment flag')}</li>
                </ul>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button 
                onClick={() => setSelectedTenderDetails(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
              >
                {t('Close')}
              </button>
              <button 
                onClick={() => { setSelectedTenderDetails(null); navigate('/verification'); }}
                className="px-4 py-2 font-bold rounded-lg bg-navy text-white hover:bg-navy-light inline-flex items-center gap-1.5"
              >
                <DocumentMagnifyingGlassIcon className="w-4 h-4" />
                {t('Go to Verification')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}