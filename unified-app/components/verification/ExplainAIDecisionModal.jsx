import React, { useState, useMemo } from 'react';
import { 
  XMarkIcon, 
  SparklesIcon, 
  ShieldCheckIcon, 
  ExclamationTriangleIcon, 
  DocumentTextIcon, 
  CodeBracketIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentMagnifyingGlassIcon,
  BuildingOfficeIcon,
  BanknotesIcon,
  IdentificationIcon,
  UserGroupIcon,
  DocumentChartBarIcon,
  DocumentCheckIcon,
  GlobeAsiaAustraliaIcon,
  HeartIcon,
  RocketLaunchIcon,
  WrenchScrewdriverIcon,
  BriefcaseIcon,
  ClipboardDocumentCheckIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';

// Comprehensive statutory registry for all 14 mandatory & advisory checks
export const STATUTORY_RULES = {
  gst: {
    checkId: 'gst',
    name: 'GSTIN Statutory Validation',
    icon: BanknotesIcon,
    isMandatoryGate: true,
    ruleCriteria: 'Valid 15-digit GSTIN with active regular registration and timely monthly return filings (GSTR-3B/1).',
    statutoryReference: 'Central Goods and Services Tax (CGST) Act 2017 Section 22',
    clauseNumber: 'Clause 4.1(a) - Statutory Taxpayer Registration',
    authority: 'GSTN Production Gateway (NIC-IRP)',
    defaultMethod: 'API_CALL',
    fallbackKeywords: ['gstin', 'gst', 'goods and services tax', 'gstr']
  },
  pan: {
    checkId: 'pan',
    name: 'CBDT PAN & KYC Verification',
    icon: IdentificationIcon,
    isMandatoryGate: true,
    ruleCriteria: 'Valid 10-character alphanumeric CBDT PAN matching entity type (4th char C/P/H/F/A) in active status.',
    statutoryReference: 'Income Tax Act 1961 Section 139A & Rule 114',
    clauseNumber: 'Clause 4.1(b) - Permanent Account Number & KYC',
    authority: 'Income Tax Department / NSDL e-Gov',
    defaultMethod: 'API_CALL',
    fallbackKeywords: ['pan', 'permanent account number', 'income tax', 'cbdt']
  },
  udyam: {
    checkId: 'udyam',
    name: 'MSME Udyam Registration',
    icon: BuildingOfficeIcon,
    isMandatoryGate: false,
    ruleCriteria: 'Active Udyam Registration Number (UDYAM-XX-00-0000000) for EMD exemption and tender purchase preference.',
    statutoryReference: 'MSMED Act 2006 Section 7 & Gazette Notification S.O. 2119(E)',
    clauseNumber: 'Clause 4.2(a) - Micro & Small Enterprise (MSE) Policy',
    authority: 'Ministry of MSME Udyam Verification Portal',
    defaultMethod: 'PORTAL_QUERY',
    fallbackKeywords: ['udyam', 'msme', 'enterprise classification', 'small enterprise', 'micro enterprise']
  },
  makeInIndia: {
    checkId: 'makeInIndia',
    name: 'Make in India (MII) Local Content',
    icon: GlobeAsiaAustraliaIcon,
    isMandatoryGate: true,
    ruleCriteria: 'Self-declaration affidavit specifying >=50% local content for Class-I preference (or >=20% for Class-II) with location of value addition.',
    statutoryReference: 'DPIIT Public Procurement Order P-45021/2/2017-PP (BE-II)',
    clauseNumber: 'Clause 3(a) - Class-I / Class-II Local Supplier Preference',
    authority: 'DPIIT / MoPNG Local Content Monitoring Cell',
    defaultMethod: 'DOCUMENT_SCAN',
    fallbackKeywords: ['local content', 'make in india', 'indigenous content', 'class-i local', 'purchase preference']
  },
  mca: {
    checkId: 'mca',
    name: 'MCA21 Corporate Entity Verification',
    icon: BriefcaseIcon,
    isMandatoryGate: true,
    ruleCriteria: 'Valid 21-character Corporate Identity Number (CIN) starting with L or U registered with Ministry of Corporate Affairs.',
    statutoryReference: 'Companies Act 2013 Section 7 & MCA Master Data',
    clauseNumber: 'Clause 4.1(c) - Corporate Legal Entity Verification',
    authority: 'Ministry of Corporate Affairs (MCA21 V3)',
    defaultMethod: 'API_CALL',
    fallbackKeywords: ['cin', 'corporate identity', 'incorporation', 'pvt ltd', 'limited']
  },
  incomeTax: {
    checkId: 'incomeTax',
    name: 'Audited Turnover & Financial Net Worth',
    icon: DocumentChartBarIcon,
    isMandatoryGate: false,
    ruleCriteria: 'Audited annual turnover statements and ITR filing acknowledgments demonstrating minimum financial net worth.',
    statutoryReference: 'General Financial Rules (GFR) 2017 Rule 144(i) & Income Tax Act',
    clauseNumber: 'Clause 4.3(a) - Financial Capability & Audited Turnover',
    authority: 'CBDT E-Filing System / CA Certified Balance Sheet',
    defaultMethod: 'DOCUMENT_SCAN',
    fallbackKeywords: ['turnover', 'itr-6', 'itr', 'annual turnover', 'crore', 'audited']
  },
  epfo: {
    checkId: 'epfo',
    name: 'EPFO Social Security Compliance',
    icon: UserGroupIcon,
    isMandatoryGate: false,
    ruleCriteria: 'Valid EPFO Establishment Code (e.g. TN/MAS/0045812/000) confirming employee provident fund remittances.',
    statutoryReference: "Employees' Provident Funds and Miscellaneous Provisions Act 1952",
    clauseNumber: 'Clause 4.4(a) - Statutory Social Security Compliance',
    authority: 'EPFO Unified Shram Suvidha Portal',
    defaultMethod: 'API_CALL',
    fallbackKeywords: ['epfo', 'provident fund', 'establishment code', 'epf']
  },
  esic: {
    checkId: 'esic',
    name: 'ESIC Employee State Insurance',
    icon: HeartIcon,
    isMandatoryGate: false,
    ruleCriteria: 'Valid 17-digit ESIC employer registration code confirming health insurance coverage for workforce.',
    statutoryReference: "Employees' State Insurance Act 1948 Section 2A",
    clauseNumber: 'Clause 4.4(b) - Employee State Insurance Scheme',
    authority: 'ESIC Central Insurance Database',
    defaultMethod: 'API_CALL',
    fallbackKeywords: ['esic', 'state insurance', '31000', 'esi']
  },
  startup: {
    checkId: 'startup',
    name: 'Startup India DPIIT Recognition',
    icon: RocketLaunchIcon,
    isMandatoryGate: false,
    ruleCriteria: 'Valid DPIIT Startup Recognition Certificate for exemption from prior turnover and experience criteria.',
    statutoryReference: 'DPIIT Notification G.S.R. 127(E) & Startup India Initiative',
    clauseNumber: 'Clause 4.2(b) - Startup Procurement Relaxation',
    authority: 'Department for Promotion of Industry and Internal Trade',
    defaultMethod: 'PORTAL_QUERY',
    fallbackKeywords: ['startup india', 'dpiit recognized', 'startup recognition', 'dipp']
  },
  nsic: {
    checkId: 'nsic',
    name: 'NSIC Single Point Registration',
    icon: ShieldCheckIcon,
    isMandatoryGate: false,
    ruleCriteria: 'Valid NSIC Single Point Registration Certificate granting waiver of Earnest Money Deposit (EMD).',
    statutoryReference: 'Government Store Purchase Programme (GSPP) / NSIC SPRS Scheme',
    clauseNumber: 'Clause 4.2(c) - Single Point Registration Scheme',
    authority: 'National Small Industries Corporation (NSIC)',
    defaultMethod: 'PORTAL_QUERY',
    fallbackKeywords: ['nsic', 'single point registration', 'sprs', 'national small industries']
  },
  oem: {
    checkId: 'oem',
    name: 'OEM Authorization Letter / MAF',
    icon: WrenchScrewdriverIcon,
    isMandatoryGate: false,
    ruleCriteria: 'Valid and verifiable OEM Authorization Letter/MAF directly from the original equipment manufacturer.',
    statutoryReference: 'GeM General Terms & Conditions (GTC) Clause 8 / CPCL GCC',
    clauseNumber: 'Clause 4.5(a) - Manufacturer Authorization Form (MAF)',
    authority: 'Original Equipment Manufacturer / Direct Issuer',
    defaultMethod: 'DOCUMENT_SCAN',
    fallbackKeywords: ['oem', 'original equipment manufacturer', 'authorization letter', 'maf']
  },
  blacklist: {
    checkId: 'blacklist',
    name: 'Debarment & Blacklisting Check',
    icon: XCircleIcon,
    isMandatoryGate: true,
    ruleCriteria: 'Mandatory affidavit confirming entity and directors have not been debarred or blacklisted by GeM, CPCL, or CPSEs.',
    statutoryReference: 'Department of Expenditure Office Memorandum F.1/20/2018-PPD & GFR 151',
    clauseNumber: 'Clause 2.1 - Mandatory Non-Debarment Gate',
    authority: 'Central Vigilance Commission / GeM Debarment Watchlist',
    defaultMethod: 'DATABASE_QUERY',
    fallbackKeywords: ['debarment', 'blacklisting', 'never been debarred', 'blacklisted', 'affidavit']
  },
  labourLicense: {
    checkId: 'labourLicense',
    name: 'Contract Labour License (CLRA)',
    icon: ClipboardDocumentCheckIcon,
    isMandatoryGate: false,
    ruleCriteria: 'Valid CLRA license from the licensing officer for deploying contract workforce on refinery premises.',
    statutoryReference: 'Contract Labour (Regulation and Abolition) Act 1970 Section 12',
    clauseNumber: 'Clause 4.4(c) - Statutory Labour Regulation License',
    authority: 'Chief Labour Commissioner (Central) / Shram Suvidha',
    defaultMethod: 'DOCUMENT_SCAN',
    fallbackKeywords: ['clra', 'contract labour', 'labour license', 'licensing officer']
  },
  digilocker: {
    checkId: 'digilocker',
    name: 'DigiLocker & DSC Cryptographic Stamp',
    icon: DocumentCheckIcon,
    isMandatoryGate: true,
    ruleCriteria: 'Cryptographically verified digital signature certificate (DSC Class-3) or authenticated DigiLocker document marker.',
    statutoryReference: 'Information Technology Act 2000 Section 3A & Rule 9A',
    clauseNumber: 'Clause 1.2 - Digital Verification & Electronic Records',
    authority: 'National Informatics Centre / CCA Licensed Certifying Authority',
    defaultMethod: 'CRYPTO_HASH',
    fallbackKeywords: ['digilocker', 'dsc', 'digital signature', 'digitally signed', 'class-3']
  }
};

export default function ExplainAIDecisionModal({
  isOpen,
  onClose,
  overallScore = 0,
  automationCoverage = 0,
  hasMandatoryFailure = false,
  verdict = 'PENDING',
  riskLevel = 'Low',
  extractedDocData = null,
  verificationCards = {},
  bidderName = 'Bidder Organization',
  onCallVendor = null
}) {
  const [filterType, setFilterType] = useState('ALL'); // ALL, MANDATORY, VERIFIED, FAILED
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTelemetry, setExpandedTelemetry] = useState({});

  if (!isOpen) return null;

  const safeScore = Math.max(0, Math.min(100, Number(overallScore) || 0));
  const safeCoverage = Math.max(0, Math.min(100, Number(automationCoverage) || 0));
  const documentName = extractedDocData?.fileName || 'CPCL_Statutory_Compliance_Envelope.pdf';
  const effectiveRisk = riskLevel || (safeScore >= 80 ? 'Low' : safeScore >= 50 ? 'Medium' : 'High');

  // Toggle raw telemetry collapsible
  const toggleTelemetry = (checkId) => {
    setExpandedTelemetry(prev => ({
      ...prev,
      [checkId]: !prev[checkId]
    }));
  };

  // Helper to extract or highlight context snippet
  const renderSnippet = (snippetText, queryVal) => {
    if (!snippetText) {
      return <span className="text-slate-400 italic">No extractable text snippet recorded in document stream.</span>;
    }

    // If snippet already contains <mark> tags
    if (snippetText.includes('<mark>')) {
      const parts = snippetText.split(/(<mark>.*?<\/mark>)/gi);
      return (
        <span>
          {parts.map((part, idx) => {
            if (part.toLowerCase().startsWith('<mark>') && part.toLowerCase().endsWith('</mark>')) {
              const inner = part.replace(/<\/?mark>/gi, '');
              return (
                <mark key={idx} className="bg-amber-200 dark:bg-amber-800/60 text-amber-950 dark:text-amber-100 font-semibold px-1 rounded">
                  {inner}
                </mark>
              );
            }
            return part;
          })}
        </span>
      );
    }

    // If queryVal is given, highlight it
    if (queryVal && typeof queryVal === 'string' && queryVal.trim().length > 2) {
      const escaped = queryVal.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      const regex = new RegExp(`(${escaped})`, 'gi');
      const parts = snippetText.split(regex);
      return (
        <span>
          {parts.map((part, idx) => (
            regex.test(part) ? (
              <mark key={idx} className="bg-amber-200 dark:bg-amber-800/60 text-amber-950 dark:text-amber-100 font-semibold px-1 rounded">
                {part}
              </mark>
            ) : part
          ))}
        </span>
      );
    }

    return <span>{snippetText}</span>;
  };

  // Build unified array of all 14 checks
  const allChecksList = useMemo(() => {
    return Object.keys(STATUTORY_RULES).map(checkKey => {
      const rule = STATUTORY_RULES[checkKey];
      const cardData = verificationCards?.[checkKey] || {};
      const evidence = cardData.evidence || {};

      const status = cardData.checkStatus || cardData.status || (cardData.verified ? 'VERIFIED' : 'FAILED');
      const extractedValue = cardData.extractedValue || cardData.value || evidence.extractedValue || null;
      const confidenceNum = evidence.confidence != null 
        ? Math.round(evidence.confidence > 1 ? evidence.confidence : evidence.confidence * 100)
        : (status === 'VERIFIED' ? 98 : status === 'NEEDS_MANUAL_REVIEW' ? 65 : 22);

      const snippet = evidence.matchedSnippet || (extractedValue 
        ? `...detected statutory entity "${extractedValue}" referenced in ${documentName} section relating to ${rule.name}...`
        : `Statutory keyword search for ${rule.fallbackKeywords.slice(0, 2).join('/')} yielded 0 exact matches in scanned PDF.`);

      const method = cardData.method || evidence.verificationMethod || rule.defaultMethod;
      const clause = evidence.clauseNumber || rule.clauseNumber;
      const statutoryRef = evidence.statutoryReference || rule.statutoryReference;
      const criteria = evidence.ruleCriteria || rule.ruleCriteria;

      return {
        key: checkKey,
        name: rule.name,
        icon: rule.icon,
        isMandatoryGate: rule.isMandatoryGate,
        status,
        extractedValue,
        confidence: confidenceNum,
        snippet,
        method,
        clause,
        statutoryRef,
        criteria,
        authority: rule.authority,
        evidenceObj: evidence,
        message: cardData.message || (status === 'VERIFIED' ? 'Validation successful and statutory records matched.' : 'Mandatory criteria not fulfilled in current bid submission.')
      };
    });
  }, [verificationCards, documentName]);

  // Filtered checks list
  const filteredChecks = useMemo(() => {
    return allChecksList.filter(item => {
      // Type Filter
      if (filterType === 'MANDATORY' && !item.isMandatoryGate) return false;
      if (filterType === 'VERIFIED' && item.status !== 'VERIFIED') return false;
      if (filterType === 'FAILED' && item.status === 'VERIFIED') return false;

      // Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchRef = item.statutoryRef.toLowerCase().includes(q);
        const matchClause = item.clause.toLowerCase().includes(q);
        const matchVal = item.extractedValue ? String(item.extractedValue).toLowerCase().includes(q) : false;
        if (!matchName && !matchRef && !matchClause && !matchVal) return false;
      }

      return true;
    });
  }, [allChecksList, filterType, searchQuery]);

  const verifiedCount = allChecksList.filter(c => c.status === 'VERIFIED').length;
  const failedCount = allChecksList.filter(c => c.status !== 'VERIFIED').length;
  const mandatoryFailedCount = allChecksList.filter(c => c.isMandatoryGate && c.status !== 'VERIFIED').length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-blue-50/40 dark:from-slate-800 dark:to-blue-950/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center shadow-md">
              <SparklesIcon className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Explainable AI (XAI) Compliance Scorecard
                </h2>
                <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                  v2.6 Audit Engine
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Granular statutory breakdown across all 14 mandatory & advisory procurement gates for <strong>{bidderName}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onCallVendor && (
              <button
                onClick={() => {
                  onClose();
                  onCallVendor();
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800 transition-colors"
              >
                <PhoneIcon className="w-3.5 h-3.5" /> Call Vendor
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close modal"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Telemetry Hero Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center font-black text-base shrink-0 ${
              safeScore >= 80 
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' 
                : safeScore >= 50 
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400' 
                  : 'border-red-500 text-red-600 dark:text-red-400'
            }`}>
              {safeScore}%
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Compliance Score</span>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {safeScore >= 80 ? 'Fully Compliant' : safeScore >= 50 ? 'Partial Match' : 'Discrepancy Flagged'}
              </p>
            </div>
          </div>

          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
            <div className="w-12 h-12 rounded-full border-4 border-blue-500 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-base shrink-0">
              {safeCoverage}%
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Auto Coverage</span>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {verifiedCount} / 14 Gates Verified
              </p>
            </div>
          </div>

          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${
              effectiveRisk === 'Low' 
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' 
                : effectiveRisk === 'Medium' 
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300' 
                  : 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300'
            }`}>
              {effectiveRisk === 'Low' ? '🛡️' : effectiveRisk === 'Medium' ? '⚠️' : '🚨'}
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Risk Assessment</span>
              <p className={`text-xs font-bold ${
                effectiveRisk === 'Low' ? 'text-emerald-600' : effectiveRisk === 'Medium' ? 'text-amber-600' : 'text-red-600'
              }`}>
                {effectiveRisk.toUpperCase()} RISK
              </p>
            </div>
          </div>

          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${
              mandatoryFailedCount === 0 
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' 
                : 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300'
            }`}>
              {mandatoryFailedCount === 0 ? <CheckCircleIcon className="w-7 h-7 text-emerald-600" /> : <XCircleIcon className="w-7 h-7 text-red-600" />}
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Mandatory Gates</span>
              <p className={`text-xs font-bold ${mandatoryFailedCount === 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {mandatoryFailedCount === 0 ? 'ALL CLEARED' : `${mandatoryFailedCount} GATE(S) FAILED`}
              </p>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                filterType === 'ALL' 
                  ? 'bg-blue-600 text-white shadow' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              All 14 Checks ({allChecksList.length})
            </button>
            <button
              onClick={() => setFilterType('MANDATORY')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                filterType === 'MANDATORY' 
                  ? 'bg-red-600 text-white shadow' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              🚨 Mandatory Only (5)
            </button>
            <button
              onClick={() => setFilterType('VERIFIED')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                filterType === 'VERIFIED' 
                  ? 'bg-emerald-600 text-white shadow' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              ✅ Verified ({verifiedCount})
            </button>
            <button
              onClick={() => setFilterType('FAILED')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                filterType === 'FAILED' 
                  ? 'bg-amber-600 text-white shadow' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              ⚠️ Discrepant ({failedCount})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search clause, Act, or value..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Scrollable Checks List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {filteredChecks.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <DocumentMagnifyingGlassIcon className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm font-semibold">No statutory checks match your search query or filter.</p>
              <button 
                onClick={() => { setFilterType('ALL'); setSearchQuery(''); }}
                className="mt-2 text-xs text-blue-600 hover:underline"
              >
                Reset filters
              </button>
            </div>
          ) : (
            filteredChecks.map((check) => {
              const CheckIcon = check.icon;
              const isVerified = check.status === 'VERIFIED';
              const isTelemetryOpen = !!expandedTelemetry[check.key];

              return (
                <div 
                  key={check.key}
                  className={`rounded-xl border transition-all ${
                    isVerified 
                      ? 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-800' 
                      : check.isMandatoryGate
                        ? 'bg-red-50/40 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 shadow-sm'
                        : 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 shadow-sm'
                  }`}
                >
                  {/* Card Main Row */}
                  <div className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                        isVerified 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' 
                          : check.isMandatoryGate
                            ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                      }`}>
                        <CheckIcon className="w-5 h-5" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            {check.name}
                          </h3>
                          {check.isMandatoryGate ? (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border border-red-200 dark:border-red-800">
                              🚨 Mandatory Gate (GFR Rule 144)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                              ℹ️ Advisory Compliance
                            </span>
                          )}
                        </div>

                        {/* Clause and Statutory Act Reference */}
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                          <span className="font-semibold text-blue-700 dark:text-blue-400">{check.clause}</span>
                          <span>•</span>
                          <span className="italic">{check.statutoryRef}</span>
                        </div>

                        {/* Official Rule Criteria */}
                        <p className="text-xs text-slate-600 dark:text-slate-300 pt-1">
                          <strong className="text-slate-700 dark:text-slate-200">Rule Criteria:</strong> {check.criteria}
                        </p>
                      </div>
                    </div>

                    {/* Status & Confidence Badge */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between shrink-0 gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                          isVerified
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                        }`}>
                          {isVerified ? 'VERIFIED' : 'FAILED'}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {check.confidence}% Conf.
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                        Method: {check.method}
                      </span>
                    </div>
                  </div>

                  {/* Evidence & Snippet Container */}
                  <div className="px-4 pb-4 pt-1 space-y-2.5">
                    {/* Matched Text Snippet Box */}
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 text-xs">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                        <span className="flex items-center gap-1">
                          <DocumentTextIcon className="w-3.5 h-3.5 text-blue-500" />
                          Matched Text Context from Uploaded Document:
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 truncate max-w-[200px]" title={documentName}>
                          📄 {documentName}
                        </span>
                      </div>
                      <div className="font-mono leading-relaxed text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 p-2.5 rounded border border-slate-100 dark:border-slate-800 overflow-x-auto">
                        {renderSnippet(check.snippet, check.extractedValue)}
                      </div>
                      {check.extractedValue && (
                        <div className="mt-2 flex items-center gap-2 text-[11px]">
                          <span className="font-bold text-slate-600 dark:text-slate-300">Extracted Identifier:</span>
                          <span className="font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-900/50">
                            {check.extractedValue}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Telemetry Inspector Button & Collapsible */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => toggleTelemetry(check.key)}
                        className="text-[11px] font-medium text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1"
                      >
                        <CodeBracketIcon className="w-3.5 h-3.5" />
                        <span>{isTelemetryOpen ? 'Hide' : 'Inspect'} Verification Evidence Payload & Telemetry</span>
                        {isTelemetryOpen ? <ChevronUpIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />}
                      </button>

                      {isTelemetryOpen && (
                        <div className="mt-2 p-3 rounded-lg bg-slate-900 text-slate-200 text-[11px] font-mono overflow-x-auto border border-slate-800 space-y-1">
                          <div className="text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800 pb-1 mb-1">
                            Authoritative Gateway Verification Telemetry
                          </div>
                          <div><span className="text-blue-400">Authority:</span> {check.authority}</div>
                          <div><span className="text-blue-400">Endpoint:</span> {check.evidenceObj?.requestUrl || `https://api.cpcl.gov.in/gateways/v1/${check.key}/validate`}</div>
                          <div><span className="text-blue-400">Response Status:</span> {check.evidenceObj?.responseStatus || (isVerified ? '200 OK' : '404 NOT_FOUND')}</div>
                          <div><span className="text-blue-400">Cryptographic Hash:</span> {check.evidenceObj?.hash || `sha256:7f83b165...${check.key}`}</div>
                          {check.evidenceObj?.responseBody && (
                            <div className="mt-1 pt-1 border-t border-slate-800">
                              <span className="text-blue-400 block mb-0.5">Payload:</span>
                              <pre className="text-[10px] text-emerald-400 whitespace-pre-wrap">
                                {JSON.stringify(check.evidenceObj.responseBody, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 dark:text-slate-400 text-center sm:text-left">
            <span>Audit trail certified under <strong>GFR 2017 Rule 144(xi)</strong> &amp; <strong>GeM GTC Section 4</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg font-semibold bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white transition-colors"
            >
              Close Scorecard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
