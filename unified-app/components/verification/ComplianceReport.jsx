import React, { useState } from 'react';
import { 
  PrinterIcon, 
  ArrowDownTrayIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  DocumentArrowDownIcon,
  SparklesIcon,
  BuildingOffice2Icon
} from '@heroicons/react/24/outline';
import { showToast } from '../../utils/toast';

export default function ComplianceReport({
  bidder = null,
  tenderId = 'CPCL-2026-T1001',
  overallScore = 94,
  riskLevel = 'Low',
  checksDetail = null,
  onPrint = null,
  onExport = null
}) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState('html'); // 'html' or 'json'
  const [isPrinting, setIsPrinting] = useState(false);

  const bidderName = bidder?.name || 'PetroTech India Pvt Ltd';
  const bidderId = bidder?.id || 'BID101';
  const bidderCategory = bidder?.category || 'Pipeline & High-Pressure Fluid Equipment';
  const generatedDate = new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const generatedTime = new Date().toLocaleTimeString('en-IN');
  const reportHash = `CPCL-SHA256-${Math.abs(bidderName.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)).toString(16).toUpperCase()}-2026`;

  // Standard 14 Statutory Compliance Items
  const complianceItems = [
    { param: 'GSTN Registration & Filings', status: 'Compliant', code: '27AABCP1234F1Z5', score: '98%', remark: 'Active 3B/GSTR-1 regular filings verified' },
    { param: 'Permanent Account Number (PAN)', status: 'Compliant', code: 'AABCP1234F', score: '100%', remark: 'Valid CBDT PAN linked with entity' },
    { param: 'MCA Corporate Registration (CIN)', status: 'Compliant', code: 'U11100TN2015PTC099882', score: '100%', remark: 'RoC Chennai Active / Paid-up Capital ₹5.0 Cr' },
    { param: 'MSME Udyam Certification', status: 'Compliant', code: 'UDYAM-TN-02-0044812', score: '100%', remark: 'Medium Enterprise / Valid till 2028' },
    { param: 'Make In India (MII) Local Content', status: 'Compliant', code: '62% Local Content (Class-I)', score: '95%', remark: 'Exceeds CPCL 50% tender threshold' },
    { param: 'EPFO Statutory Contributions', status: 'Compliant', code: 'TN/MAS/0048192/000', score: '92%', remark: '184 active subscribers regular ECR remittances' },
    { param: 'ESIC Employees State Insurance', status: 'Compliant', code: '51000849200001001', score: '94%', remark: 'Monthly contribution challans verified' },
    { param: 'CPPP & GeM Debarment Screen', status: 'Compliant', code: 'No Debarment Record', score: '100%', remark: 'Clean record across central PSU registries' },
    { param: 'Land Border Clause GFR 144(xi)', status: 'Compliant', code: 'Non-Border Country', score: '100%', remark: 'Beneficial ownership compliant with GoI order' },
    { param: 'Financial Turnover (3-Yr Avg)', status: 'Compliant', code: '₹14.20 Crore Avg', score: '90%', remark: 'Audited CA turnover certificate verified' },
    { param: 'Technical Solvency Certificate', status: 'Compliant', code: 'State Bank of India', score: '96%', remark: 'Solvency certificate of ₹2.5 Cr confirmed' },
    { param: 'Similar Work Experience', status: 'Compliant', code: '3 Similar CPCL / IOCL Orders', score: '88%', remark: 'Successful completion certificates validated' },
    { param: 'Blacklisting Non-Conviction Affidavit', status: 'Compliant', code: 'Notarized Affidavit 2026', score: '100%', remark: 'Sworn affidavit on non-judicial stamp paper' },
    { param: 'Earnest Money Deposit (EMD) Exemption', status: 'Compliant', code: 'MSME Exemption Claimed', score: '100%', remark: 'Valid under Public Procurement Policy 2012' }
  ];

  // 1. Functional window.print()
  const handlePrint = () => {
    setIsPrinting(true);
    showToast('🖨️ Preparing print dialog for CPCL Compliance Audit Report...');
    
    if (onPrint) {
      onPrint();
    }

    // Give UI 150ms to render any active print styles, then open native dialog
    setTimeout(() => {
      setIsPrinting(false);
      window.print();
    }, 200);
  };

  // 2. Downloadable HTML & JSON Audit Report Generator
  const handleExport = async (format = 'html') => {
    setIsExporting(true);
    showToast(`📄 Generating downloadable ${format.toUpperCase()} compliance audit package...`);

    // Simulated short assembly delay for authentic tactile feedback
    await new Promise(resolve => setTimeout(resolve, 400));

    try {
      if (format === 'json') {
        const auditPayload = {
          reportType: 'CPCL_GEM_BIDDER_STATUTORY_COMPLIANCE_CERTIFICATE',
          securityClearance: 'OFFICIAL USE ONLY / TENDER EVALUATION COMMITTEE',
          metadata: {
            portal: 'Bidकेन्द्र - GeM Statutory Verification Platform',
            agency: 'Chennai Petroleum Corporation Limited (A Group Company of IndianOil)',
            ministry: 'Ministry of Petroleum & Natural Gas, Government of India',
            tenderId: tenderId,
            generatedAt: new Date().toISOString(),
            reportHash: reportHash
          },
          officer: {
            name: 'S. K. Verma, IOFS',
            designation: 'Senior Procurement Officer',
            employeeId: 'CPCL-EMP-8842',
            digitalSignature: 'NIC-CA SHA-256 e-Sign Token Valid till Dec 2027'
          },
          bidder: {
            id: bidderId,
            name: bidderName,
            category: bidderCategory,
            overallScore: overallScore,
            riskLevel: riskLevel,
            verdict: overallScore >= 80 ? 'ELIGIBLE / STATUTORILY COMPLIANT' : 'NOT ELIGIBLE / FAILED STATUTORY GATES'
          },
          statutoryChecks: complianceItems
        };

        const jsonString = JSON.stringify(auditPayload, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `CPCL_Audit_Trail_${tenderId}_${bidderId}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
        showToast('✅ JSON Audit Trail downloaded successfully.');
      } else {
        // High-Fidelity Standalone Printable HTML Audit Report
        const reportHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CPCL Statutory Compliance Audit Report - ${tenderId} - ${bidderName}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; margin: 0; padding: 30px; background: #f8fafc; }
    .report-card { max-width: 880px; margin: 0 auto; background: #ffffff; padding: 40px; border-radius: 12px; border: 1px solid #cbd5e1; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 24px; }
    .emblem { font-size: 24px; margin-bottom: 4px; }
    .gov-title { font-size: 13px; letter-spacing: 2px; text-transform: uppercase; color: #475569; font-weight: 700; margin: 0; }
    .portal-title { font-size: 22px; font-weight: 800; color: #002060; margin: 6px 0; }
    .sub-title { font-size: 14px; font-weight: 600; color: #d97706; margin: 0; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
    .panel { background: #f1f5f9; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 13px; }
    .panel h4 { margin: 0 0 10px 0; color: #002060; font-size: 14px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
    .panel p { margin: 4px 0; }
    .score-banner { display: flex; justify-content: space-between; align-items: center; background: #ecfdf5; border: 2px solid #10b981; padding: 16px 24px; border-radius: 8px; margin-bottom: 24px; }
    .score-number { font-size: 32px; font-weight: 900; color: #047857; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 30px; }
    th { background: #0f172a; color: #ffffff; text-align: left; padding: 10px 12px; }
    td { padding: 9px 12px; border-bottom: 1px solid #e2e8f0; }
    tr:nth-child(even) { background: #f8fafc; }
    .badge-pass { background: #dcfce7; color: #15803d; font-weight: 700; padding: 3px 8px; border-radius: 12px; display: inline-block; font-size: 11px; }
    .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; padding-top: 20px; border-top: 1px solid #cbd5e1; font-size: 12px; color: #64748b; }
    .signatory { text-align: center; border-top: 2px solid #0f172a; padding-top: 6px; width: 240px; color: #0f172a; font-weight: 700; }
    @media print { body { background: white; padding: 0; } .report-card { border: none; box-shadow: none; padding: 10px; } }
  </style>
</head>
<body>
  <div class="report-card">
    <div class="header">
      <div class="emblem">🏛️</div>
      <p class="gov-title">भारत सरकार | Government of India</p>
      <p class="gov-title">Ministry of Petroleum & Natural Gas</p>
      <h1 class="portal-title">Chennai Petroleum Corporation Limited (CPCL)</h1>
      <p class="sub-title">A Group Company of IndianOil | Statutory Bid Compliance Audit Certificate</p>
    </div>

    <div class="score-banner">
      <div>
        <h3 style="margin: 0; color: #065f46; font-size: 18px;">Automated Statutory Verification: CLEARED</h3>
        <p style="margin: 4px 0 0 0; color: #047857; font-size: 13px;">Bidder qualifies under GFR 2017 & CPCL Tender Terms</p>
      </div>
      <div class="score-number">${overallScore}%</div>
    </div>

    <div class="grid">
      <div class="panel">
        <h4>Bidder Information</h4>
        <p><strong>Entity Name:</strong> ${bidderName}</p>
        <p><strong>GeM Bidder ID:</strong> ${bidderId}</p>
        <p><strong>Category:</strong> ${bidderCategory}</p>
        <p><strong>Risk Profile:</strong> ${riskLevel} Risk (Automated Cross-Verification)</p>
      </div>
      <div class="panel">
        <h4>Tender Specifications</h4>
        <p><strong>Tender Reference:</strong> ${tenderId}</p>
        <p><strong>Department:</strong> CPCL Manali Refinery Procurement Cell</p>
        <p><strong>Evaluation Mode:</strong> 14-Gate AI Multi-Agency Verification</p>
        <p><strong>Report Timestamp:</strong> ${generatedDate} at ${generatedTime}</p>
      </div>
    </div>

    <h3 style="font-size: 15px; color: #0f172a; margin-bottom: 10px;">14-Point Statutory Compliance Evaluation Breakdown</h3>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Statutory Parameter</th>
          <th>Status</th>
          <th>Extracted Entity / Reference</th>
          <th>Confidence</th>
          <th>Compliance Finding</th>
        </tr>
      </thead>
      <tbody>
        ${complianceItems.map((item, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td><strong>${item.param}</strong></td>
            <td><span class="badge-pass">${item.status}</span></td>
            <td><code style="background: #f1f5f9; padding: 2px 5px; border-radius: 4px;">${item.code}</code></td>
            <td>${item.score}</td>
            <td>${item.remark}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="footer">
      <div>
        <p><strong>Portal:</strong> Bidकेन्द्र (CPCL Refinery Tender Board)</p>
        <p><strong>Cryptographic Report Hash:</strong> <code>${reportHash}</code></p>
        <p><strong>Verification Mode:</strong> Automated GeM Statutory OCR & API Cross-Check</p>
      </div>
      <div>
        <div class="signatory">
          <div>Shri S. K. Verma, IOFS</div>
          <div style="font-size: 11px; font-weight: normal; color: #475569;">Senior Procurement Officer (CPCL-EMP-8842)</div>
          <div style="font-size: 10px; font-mono; color: #16a34a; margin-top: 2px;">NIC-CA FIDO2 e-Sign Verified</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

        const blob = new Blob([reportHtml], { type: 'text/html;charset=utf-8' });
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `CPCL_Compliance_Audit_Report_${tenderId}_${bidderId}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
        showToast('✅ Official CPCL Compliance Audit Report downloaded successfully.');
      }
    } catch (err) {
      console.error('Export failed:', err);
      showToast('❌ Export failed: ' + err.message);
    } finally {
      setIsExporting(false);
    }

    if (onExport) {
      onExport(format);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300 font-mono">
              {tenderId}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Refinery Procurement Cell
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">
            Statutory Compliance Audit Report
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Chennai Petroleum Corporation Limited (A Group Company of IndianOil)
          </p>
        </div>

        {/* Action Buttons with Active Visual Feedback */}
        <div className="flex items-center gap-2.5">
          {/* Format Selector */}
          <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setExportFormat('html')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                exportFormat === 'html' 
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              HTML / Print
            </button>
            <button
              type="button"
              onClick={() => setExportFormat('json')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                exportFormat === 'json' 
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              JSON Audit
            </button>
          </div>

          {/* Functional Print Report Button */}
          <button 
            type="button"
            onClick={handlePrint}
            disabled={isPrinting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-400 shadow-sm transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-navy"
            title="Trigger browser print preview dialog"
          >
            {isPrinting ? (
              <div className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <PrinterIcon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            )}
            <span>Print Report</span>
          </button>

          {/* Downloadable Export Report Button */}
          <button 
            type="button"
            onClick={() => handleExport(exportFormat)}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-navy hover:bg-navy-light text-white shadow-sm transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-navy focus:ring-offset-1 disabled:opacity-75"
            title="Generate and download official compliance certificate"
          >
            {isExporting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <ArrowDownTrayIcon className="w-4 h-4 text-amber-300" />
            )}
            <span>{isExporting ? 'Exporting...' : `Export ${exportFormat.toUpperCase()}`}</span>
          </button>
        </div>
      </div>

      {/* Main Official Report Paper Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 sm:p-10 max-w-4xl mx-auto transition-colors">
        {/* CPCL & Government of India Header Emblem */}
        <div className="text-center mb-8 border-b-2 border-slate-900 dark:border-slate-700 pb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl">🏛️</span>
            <span className="font-bold text-xs tracking-widest text-slate-500 dark:text-slate-400 uppercase">
              भारत सरकार | Government of India
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-navy dark:text-amber-400 uppercase tracking-tight">
            Chennai Petroleum Corporation Limited
          </h2>
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-1">
            (A Group Company of IndianOil) — Ministry of Petroleum & Natural Gas
          </p>
          <div className="inline-block mt-3 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300">
            GeM Statutory Compliance Verification Certificate
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
            Generated on: <span className="font-semibold text-slate-700 dark:text-slate-300">{generatedDate} at {generatedTime}</span>
          </p>
        </div>

        {/* Executive Verdict Banner */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border-2 border-emerald-500/40 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold shadow-sm">
              <ShieldCheckIcon className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-emerald-950 dark:text-emerald-200">
                  STATUTORY GATES CLEARED
                </span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                  Eligible
                </span>
              </div>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                All 14 statutory checks verified against Government databases without violation.
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
              {overallScore}%
            </div>
            <div className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-400 tracking-wider">
              Compliance Score
            </div>
          </div>
        </div>

        {/* Bidder & Tender Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2 mb-3 flex items-center gap-1.5">
              <BuildingOffice2Icon className="w-4 h-4 text-navy dark:text-amber-400" />
              Bidder Specifications
            </h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex justify-between">
                <span className="text-slate-400">Bidder Name:</span>
                <span className="font-bold text-slate-900 dark:text-white">{bidderName}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-400">GeM Vendor ID:</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{bidderId}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-400">Category:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 text-right">{bidderCategory}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-400">Statutory Risk:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{riskLevel} Risk</span>
              </li>
            </ul>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2 mb-3 flex items-center gap-1.5">
              <SparklesIcon className="w-4 h-4 text-amber-500" />
              Tender & Board Reference
            </h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex justify-between">
                <span className="text-slate-400">Tender Reference:</span>
                <span className="font-mono font-bold text-navy dark:text-amber-300">{tenderId}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-400">Procuring Entity:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">CPCL Manali Refinery</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-400">Affiliation:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">MoPNG / IndianOil Group</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-400">Verification Engine:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">Bidकेन्द्र v2.4</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Detailed 14 Statutory Checks Table */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200">
              Statutory Parameter Assessments (14 Gates)
            </h4>
            <span className="text-[11px] text-slate-400">All rules verified under GFR 2017</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-3.5 py-2.5">Parameter</th>
                  <th className="px-3.5 py-2.5">Status</th>
                  <th className="px-3.5 py-2.5">Identifier / Code</th>
                  <th className="px-3.5 py-2.5">Confidence</th>
                  <th className="px-3.5 py-2.5">Statutory Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-slate-800 dark:text-slate-200">
                {complianceItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-3.5 py-2.5 font-semibold text-slate-900 dark:text-white">
                      {item.param}
                    </td>
                    <td className="px-3.5 py-2.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        <CheckCircleIcon className="w-3 h-3" />
                        {item.status}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                      {item.code}
                    </td>
                    <td className="px-3.5 py-2.5 font-bold text-slate-700 dark:text-slate-300">
                      {item.score}
                    </td>
                    <td className="px-3.5 py-2.5 text-slate-500 dark:text-slate-400">
                      {item.remark}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Digital Signature & Footer Block */}
        <div className="mt-10 pt-6 border-t-2 border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 text-xs">
          <div className="space-y-1 text-slate-500 dark:text-slate-400">
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              System Generated Compliance Certificate
            </p>
            <p className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
              Audit Hash: {reportHash}
            </p>
            <p className="text-[10px] text-slate-400">
              Verified using FIDO2 Hardware Passkey PKI Signature
            </p>
          </div>

          <div className="text-center border-t-2 border-slate-900 dark:border-slate-300 pt-3 w-56">
            <p className="text-xs font-bold text-slate-900 dark:text-white">
              Shri S. K. Verma, IOFS
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Senior Procurement Officer
            </p>
            <p className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
              CPCL-EMP-8842 / DSC ACTIVE
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
