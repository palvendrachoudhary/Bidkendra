import React from 'react';
import { EnvelopeIcon, DocumentDuplicateIcon, CheckCircleIcon, PhoneIcon } from '@heroicons/react/24/outline';

const EmailDraftViewer = ({ draft, aiEmailDraft, companyName, bidderName, verdict, checksDetail, onCallVendor = null }) => {
  const [copied, setCopied] = React.useState(false);

  const effectiveCompany = companyName || bidderName || 'Bidder Organization';
  const isApprovedVerdict = verdict === 'APPROVED' || (!verdict?.includes('FAIL') && !verdict?.includes('REJECT') && !draft?.subject?.toLowerCase().includes('rejection'));

  const defaultDraft = {
    subject: isApprovedVerdict
      ? `[CPCL-GeM] Statutory Compliance Clearance — Technical Bid Accepted for ${effectiveCompany}`
      : `[CPCL-GeM] Statutory Discrepancy Notice — Tender Eligibility Update for ${effectiveCompany}`,
    body: isApprovedVerdict
      ? `Dear Vendor Management Team,\n\nWe are pleased to inform you that the statutory compliance documentation submitted by ${effectiveCompany} for Tender CPCL-2026-T1001 has been successfully verified across all mandatory gates (GSTN, CBDT PAN, MCA21, MSME Udyam, EPFO, ESIC, and Make-in-India declarations).\n\nYour technical envelope has been qualified for commercial bid evaluation under GFR 2017 rules.\n\nRegards,\nProcurement Tender Committee\nChennai Petroleum Corporation Limited (CPCL)\nMinistry of Petroleum & Natural Gas, Govt. of India`
      : `Dear Vendor Management Team,\n\nThis is an official notification regarding the bid submission by ${effectiveCompany} for Tender CPCL-2026-T1001. During automated statutory verification, one or more mandatory criteria failed compliance validation.\n\nPlease review your GeM portal bidder dashboard for detailed audit findings and corrective actions.\n\nRegards,\nProcurement Tender Committee\nChennai Petroleum Corporation Limited (CPCL)\nMinistry of Petroleum & Natural Gas, Govt. of India`
  };

  const activeDraft = draft || aiEmailDraft || defaultDraft;

  const handleCopy = () => {
    const textToCopy = `Subject: ${activeDraft.subject}\n\n${activeDraft.body}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isRejection = (activeDraft.subject || '').toLowerCase().includes('rejection') ||
                      (activeDraft.subject || '').toLowerCase().includes('discrepancy') ||
                      verdict === 'FAILED' || verdict === 'REJECTED';
  const badgeColor = isRejection ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden mt-6">
      <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-3">
          <EnvelopeIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-200">Auto-Generated Communication</h3>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${badgeColor}`}>
            {isRejection ? 'Rejection Draft' : 'Acceptance Draft'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onCallVendor && (
            <button
              type="button"
              onClick={onCallVendor}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-sm font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors shadow-sm"
              title="Call Vendor via Twilio Voice AI"
            >
              <PhoneIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Call Vendor</span>
            </button>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            {copied ? <CheckCircleIcon className="w-4 h-4 text-green-500" /> : <DocumentDuplicateIcon className="w-4 h-4" />}
            <span>{copied ? 'Copied' : 'Copy Text'}</span>
          </button>
        </div>
      </div>
      <div className="p-4 space-y-4">
        <div>
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Subject</span>
          <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">{activeDraft.subject}</p>
        </div>
        <div>
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Body</span>
          <div className="mt-1 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700">
            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
              {activeDraft.body}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailDraftViewer;
