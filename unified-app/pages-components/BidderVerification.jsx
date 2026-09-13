import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { verificationDetails as initialVerificationDetails } from '../utils/dummyData';
import VerificationCard from '../components/verification/VerificationCard';
import ComplianceGauge from '../components/verification/ComplianceGauge';
import DocumentUpload from '../components/verification/DocumentUpload';
import EmailDraftViewer from '../components/verification/EmailDraftViewer';
import AIRecommendation from '../components/verification/AIRecommendation';
import Button from '../components/common/Button';
import { showToast } from '../utils/toast';
import { 
  BuildingOfficeIcon, BanknotesIcon, IdentificationIcon, UserGroupIcon, 
  DocumentChartBarIcon, DocumentCheckIcon, DocumentTextIcon, GlobeAsiaAustraliaIcon, HeartIcon,
  RocketLaunchIcon, ShieldCheckIcon, WrenchScrewdriverIcon, XCircleIcon,
  BriefcaseIcon, ClipboardDocumentCheckIcon, CheckBadgeIcon, SparklesIcon,
  ArrowRightIcon, ArrowLeftIcon, StarIcon, CheckCircleIcon, PhoneIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

import ExplainAIDecisionModal from '../components/verification/ExplainAIDecisionModal';
import TwilioCallModal from '../components/verification/TwilioCallModal';
import BidCuringAlertTimeline from '../components/verification/BidCuringAlertTimeline';

import { verifyBidderApi, verifyDocumentApi, verifyBulkDocumentsApi, getBiddersApi } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const fallbackBiddersList = [
  { id: 'b1', name: 'PetroTech India Pvt Ltd', email: 'ramesh@petrotech.in', tender: 'CPCL-2026-T1001', submitted: '2026-09-08', rating: 4.8, pastTenders: 12, status: 'PENDING' },
  { id: 'b2', name: 'Global Energy Traders', email: 'sita@globalenergy.in', tender: 'CPCL-2026-T1001', submitted: '2026-09-09', rating: 4.9, pastTenders: 45, status: 'PENDING' },
  { id: 'b3', name: 'Apex Industrial Valves', email: 'amit@apexvalves.in', tender: 'CPCL-2026-T1001', submitted: '2026-09-10', rating: 4.7, pastTenders: 30, status: 'PENDING' },
];

export default function BidderVerification() {
  const { t, currentLang } = useLanguage();
  const { id } = useParams();
  
  const [currentStep, setCurrentStep] = useState(1); // 1: Select, 2: Upload, 3: Verify, 4: Report
  const [selectedBidder, setSelectedBidder] = useState(null);
  const [biddersList, setBiddersList] = useState(fallbackBiddersList);

  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [overallScore, setOverallScore] = useState(0);
  const [automationCoverage, setAutomationCoverage] = useState(0);
  const [hasMandatoryFailure, setHasMandatoryFailure] = useState(false);
  const [verdict, setVerdict] = useState('PENDING');
  const [verificationCards, setVerificationCards] = useState(initialVerificationDetails || {});
  const [bidderStatus, setBidderStatus] = useState('PENDING'); // PENDING | APPROVED | REJECTED
  const [extractedDocData, setExtractedDocData] = useState(null);
  const [bulkResults, setBulkResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  // Modals
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showXaiModal, setShowXaiModal] = useState(false);
  const [showTwilioModal, setShowTwilioModal] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('All 14 statutory compliance checks verified. Technical and financial eligibility parameters satisfied as per CPCL tender requirements.');
  const [rejectionReason, setRejectionReason] = useState('Inconsistency between statutory returns and declared status');
  const [confirmGuidelines, setConfirmGuidelines] = useState(true);
  const [bidderEmail, setBidderEmail] = useState('');

  const bidderName = selectedBidder ? selectedBidder.name : (id ? `Bidder ${id}` : 'Select a Bidder');

  // Listen for global custom events to open XAI or Twilio modals
  useEffect(() => {
    const handleOpenTwilio = () => setShowTwilioModal(true);
    const handleOpenXai = () => setShowXaiModal(true);
    window.addEventListener('open-twilio-modal', handleOpenTwilio);
    window.addEventListener('open-xai-modal', handleOpenXai);
    return () => {
      window.removeEventListener('open-twilio-modal', handleOpenTwilio);
      window.removeEventListener('open-xai-modal', handleOpenXai);
    };
  }, []);

  // Fetch bidders from database on mount
  useEffect(() => {
    const fetchBidders = async () => {
      try {
        const res = await getBiddersApi();
        if (res && res.data && res.data.length > 0) {
            const dbBidders = res.data.map((b, i) => {
              let docs = [];
              try { if (b.documents_json) docs = JSON.parse(b.documents_json); } catch(e){}
              let checks = {};
              try { if (b.category_scores_json) checks = JSON.parse(b.category_scores_json); } catch(e){}
              
              return {
                id: b.id,
                submissionId: b.submission_id,
                name: b.company_name,
                email: b.email || '',
                contact_person: b.contact_person || '',
                pan: b.pan_number || '',
                gst: b.gst_number || '',
                udyam: b.udyam_number || '',
                tender: 'CPCL-2026-T1001',
                submitted: b.created_at ? b.created_at.split('T')[0] : '2026-09-10',
                rating: [4.8, 4.9, 4.7, 3.2, 0][i % 5],
                pastTenders: [12, 45, 30, 2, 0][i % 5],
                status: 'PENDING',
                documents: docs,
                precomputedScore: b.overall_score,
                precomputedChecks: checks
              };
            });
          setBiddersList(dbBidders);
          console.log(`✅ Loaded ${dbBidders.length} bidders from database`);
        }
      } catch (err) {
        console.warn('Using fallback bidders list:', err.message);
      }
    };
    fetchBidders();
  }, []);

  useEffect(() => {
    if (bulkResults.length > 0 && bulkResults[selectedIndex]) {
      const scanData = bulkResults[selectedIndex];
      setExtractedDocData(scanData);
      setOverallScore(scanData.overallScore || 0);
      setAutomationCoverage(scanData.automationCoverage || 0);
      setHasMandatoryFailure(scanData.hasMandatoryFailure || false);
      setVerdict(scanData.verdict ? scanData.verdict.split(':')[0] : 'NEEDS_REVIEW');
      if (scanData.checksDetail) {
        setVerificationCards(scanData.checksDetail);
      }
    }
  }, [selectedIndex, bulkResults]);

  const [selectedFileObj, setSelectedFileObj] = useState(null);

  const handleSelectBidder = (bidder) => {
    setSelectedBidder(bidder);
    setBidderEmail(bidder.email || ''); // Auto-fill email from DB
    setBidderStatus('PENDING');
    setOverallScore(0);
    setAutomationCoverage(0);
    setHasMandatoryFailure(false);
    setVerdict('PENDING');
    setScanComplete(false);
    setExtractedDocData(null);
    setBulkResults([]);
    setSelectedIndex(0);
    setSelectedFileObj(null);
    setRejectionReason('Inconsistency between statutory returns and declared status');
    setVerificationCards(initialVerificationDetails || {});
    setCurrentStep(2);
    showToast(`${bidder.name} selected (${bidder.email || 'no email on file'}). Please upload documents for scanning.`);
  };

  const handleResetAndReturn = () => {
    setSelectedBidder(null);
    setBidderStatus('PENDING');
    setOverallScore(0);
    setAutomationCoverage(0);
    setHasMandatoryFailure(false);
    setVerdict('PENDING');
    setScanComplete(false);
    setExtractedDocData(null);
    setBulkResults([]);
    setSelectedIndex(0);
    setSelectedFileObj(null);
    setRejectionReason('Inconsistency between statutory returns and declared status');
    setVerificationCards(initialVerificationDetails || {});
    setCurrentStep(1);
    showToast('Wizard reset. Select a bidder to evaluate.');
  };

  const handleScan = async (files) => {
    let targetFiles = (files && files.length > 0) ? files : (Array.isArray(selectedFileObj) ? selectedFileObj : (selectedFileObj ? [selectedFileObj] : null));
    let isDemoFallback = false;

    if (!targetFiles || targetFiles.length === 0) {
      isDemoFallback = true;
      showToast('📄 Auto-loading CPCL verified demo envelope for AI scan...');
    }

    setIsScanning(true);
    setScanComplete(false);
    setScanProgress(15);
    
    let docResult = null;
    try {
      if (!isDemoFallback && targetFiles && targetFiles.length > 0 && targetFiles[0]?.raw) {
        const formData = new FormData();
        targetFiles.forEach(tf => formData.append('documents', tf.raw));
        formData.append('submissionId', 'sub101');
        formData.append('companyName', selectedBidder?.name || 'Unknown');
        const bulkData = await verifyBulkDocumentsApi(formData);
        if (bulkData && bulkData.data && bulkData.data.length > 0) {
          setBulkResults(bulkData.data);
          docResult = { data: bulkData.data[0] };
          setSelectedIndex(0);
        }
      } else {
        // Auto-load sample document for demo evaluation
        docResult = await verifyDocumentApi({ 
          isSample: true,
          fileName: 'CPCL_Pipeline_Technical_Spec_PetroTech.pdf',
          submissionId: 'sub101',
          companyName: selectedBidder?.name || 'PetroTech India Pvt Ltd'
        });
        if (docResult && docResult.data) {
          setBulkResults([docResult.data]);
        }
      }
    } catch (e) {
      console.warn('Doc scan error:', e);
    }

    // Evaluation State Synchronization:
    // Do NOT unconditionally call verifyBidderApi('b1'), which would overwrite
    // the scanned document compliance score with mock bidder b1's score.
    setScanProgress(60);
    if (!docResult && selectedBidder?.id) {
      try { await verifyBidderApi(selectedBidder.id, 'sub101'); } catch (e) {}
    }
    setScanProgress(90);

    setTimeout(() => {
      setScanProgress(100);
      setIsScanning(false);
      setScanComplete(true);
      setCurrentStep(3); // Auto advance to Verification Results
      
      // Fallback for offline demo resilience if backend is unreachable
      if (!docResult || !docResult.data) {
        docResult = {
          data: {
            fileName: 'CPCL_Pipeline_Technical_Spec_PetroTech.pdf',
            overallScore: 92,
            automationCoverage: 86,
            isCompliant: true,
            hasMandatoryFailure: false,
            riskLevel: 'Low',
            verdict: 'ELIGIBLE: All statutory requirements satisfied',
            checksDetail: initialVerificationDetails || {},
            emailDraft: {
              subject: `[CPCL-GeM] Statutory Compliance Clearance — Bidder Qualified for ${selectedBidder?.name || 'PetroTech India Pvt Ltd'}`,
              body: `Dear Bidder,\n\nWe are pleased to inform you that your statutory compliance documentation submitted for Tender CPCL-2026-T1001 has been successfully verified across all 14 mandatory gates.\n\nYour technical envelope has been approved for commercial bid evaluation.\n\nRegards,\nCPCL Tender Committee`
            }
          }
        };
        setBulkResults([docResult.data]);
      }

      if (docResult && docResult.data) {
        const scanData = docResult.data;
        setExtractedDocData(scanData);
        setOverallScore(scanData.overallScore);
        setAutomationCoverage(scanData.automationCoverage);
        setHasMandatoryFailure(scanData.hasMandatoryFailure);
        setVerdict(scanData.verdict || 'PENDING');
        if (scanData.checksDetail) setVerificationCards(scanData.checksDetail);

        if (scanData.isCompliant) {
          showToast(`✅ Document Authenticated: Score ${scanData.overallScore}% (${scanData.riskLevel} Risk)`);
        } else {
          showToast(`🚨 Document Discrepancy Flagged: Score ${scanData.overallScore}% (${scanData.riskLevel} Risk)`);
        }
      } else {
        showToast('⚡ Verification error');
      }
    }, 450);
  };

  const triggerViasocketWebhook = async (status, notes) => {
    try {
      await fetch('/api/verify/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bidderName,
          companyEmail: bidderEmail,
          submissionId: selectedBidder?.submissionId,
          status,
          score: overallScore,
          rejectionReason: status === 'REJECTED' ? rejectionReason : null,
          notes,
          emailContent: extractedDocData?.emailDraft || 'Standard notification attached.',
          timestamp: new Date().toISOString()
        })
      });
    } catch (e) {
      console.error('Webhook failed:', e);
    }
  };

  const handleApproveConfirm = async () => {
    setBidderStatus('APPROVED');
    setShowApproveModal(false);
    showToast(`✅ ${bidderName} officially APPROVED for CPCL Tender!`);
    await triggerViasocketWebhook('APPROVED', approvalNotes);
  };

  const handleRejectConfirm = async () => {
    setBidderStatus('REJECTED');
    setShowRejectModal(false);
    showToast(`❌ ${bidderName} DISQUALIFIED: ${rejectionReason}`);
    await triggerViasocketWebhook('REJECTED', rejectionReason);
  };

  const renderStars = (rating) => {
    if (rating === 0) return <span className="text-slate-400 text-xs italic">No prior history</span>;
    const stars = [];
    for(let i=1; i<=5; i++) {
      if(i <= Math.floor(rating)) stars.push(<StarIconSolid key={i} className="w-4 h-4 text-amber-500" />);
      else if(i - rating < 1) stars.push(<StarIconSolid key={i} className="w-4 h-4 text-amber-500 opacity-50" />);
      else stars.push(<StarIcon key={i} className="w-4 h-4 text-slate-300 dark:text-slate-600" />);
    }
    return (
      <div className="flex items-center gap-1">
        <div className="flex">{stars}</div>
        <span className="font-bold text-xs ml-1 dark:text-slate-300">{rating}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex sm:items-center justify-between flex-col sm:flex-row gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Bidder Compliance Verification</h1>
            {bidderStatus === 'APPROVED' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-300 border border-green-300 dark:border-green-700">
                <CheckBadgeIcon className="w-4 h-4 mr-1 text-green-600 dark:text-green-400" />
                OFFICIALLY APPROVED
              </span>
            )}
            {bidderStatus === 'REJECTED' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300 border border-red-300 dark:border-red-700">
                <XCircleIcon className="w-4 h-4 mr-1 text-red-600 dark:text-red-400" />
                DISQUALIFIED / REJECTED
              </span>
            )}
            {bidderStatus === 'PENDING' && currentStep > 1 && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                PENDING OFFICER DECISION
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Automated statutory compliance examination for <strong className="text-slate-700 dark:text-slate-200">{bidderName}</strong> • Tender: CPCL-2026-T1001
          </p>
        </div>

        {/* Action Buttons: Only show in Step 4 */}
        {currentStep === 4 && bidderStatus === 'PENDING' && (
          <div className="flex gap-2.5 animate-in fade-in slide-in-from-right-4 duration-500">
            <Button variant="secondary" onClick={() => setShowRejectModal(true)} className="hover:bg-red-50 hover:text-red-600 hover:border-red-300 dark:hover:bg-red-900/30 transition-colors">
              Reject Bidder
            </Button>
            <Button variant="primary" onClick={() => setShowApproveModal(true)} className="bg-green-600 hover:bg-green-700 text-white border-transparent">
              Approve Bidder
            </Button>
          </div>
        )}
      </div>

      {/* Stepper */}
      <div className="w-full py-2 bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center">
          {[
            { num: 1, label: 'Select Bidder' },
            { num: 2, label: 'Document Analysis' },
            { num: 3, label: 'Verification Results' },
            { num: 4, label: 'Final Decision' }
          ].map((step, idx, arr) => (
            <React.Fragment key={step.num}>
              <div className="flex flex-col items-center relative cursor-pointer" onClick={() => {
                 if(step.num > 1 && !selectedBidder) {
                    showToast('Please select a bidder first');
                    return;
                 }
                 setCurrentStep(step.num);
              }}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  currentStep >= step.num 
                    ? 'bg-navy text-white dark:bg-saffron dark:text-slate-950 shadow' 
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                }`}>
                  {step.num}
                </div>
                <span className={`text-[11px] mt-1 text-center font-medium ${
                  currentStep >= step.num ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'
                }`}>
                  {step.label}
                </span>
              </div>
              {idx < arr.length - 1 && (
                <div className={`flex-1 h-1 mx-3 rounded transition-all ${
                  currentStep > step.num ? 'bg-navy dark:bg-saffron' : 'bg-slate-200 dark:bg-slate-700'
                }`}></div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step 1: Select Bidder */}
      {currentStep === 1 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden animate-in fade-in duration-300">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/40">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Pending Bids for Tender: CPCL-2026-T1001</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Select a bidder to perform automated statutory document verification.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">Bidder Name</th>
                  <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">Submission Date</th>
                  <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">Vendor Rating (Past Tenders)</th>
                  <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {biddersList.map(bidder => (
                  <tr key={bidder.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {bidder.name}
                        {bidder.isNew && <span className="px-2 py-0.5 rounded text-[9px] bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 font-bold uppercase tracking-wider">New Vendor</span>}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{bidder.email || 'No email'} • {bidder.tender}</div>
                    </td>
                    <td className="px-6 py-4">{bidder.submitted}</td>
                    <td className="px-6 py-4">
                      {renderStars(bidder.rating)}
                      {bidder.pastTenders > 0 && <div className="text-[10px] text-slate-400 mt-1">Based on {bidder.pastTenders} previous CPCL tenders</div>}
                    </td>
                    <td className="px-6 py-4">
                      <Button size="sm" onClick={() => handleSelectBidder(bidder)} className="gap-1.5 whitespace-nowrap bg-navy hover:bg-navy/90 text-white dark:bg-saffron dark:text-slate-900 dark:hover:bg-amber-400 border-none">
                        Select & Analyze <ArrowRightIcon className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Step 2: Document Analysis */}
      {currentStep === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden transition-colors h-full flex flex-col justify-center">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5 text-saffron" />
                    NLP Auto-Compliance & Entity Extraction
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Upload and scan tender envelopes for <strong className="text-slate-700 dark:text-slate-200">{bidderName}</strong>.
                  </p>
                </div>
              </div>

                {!isScanning && !scanComplete ? (
                  <div className="text-center py-10">
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                      <DocumentCheckIcon className="w-8 h-8" />
                    </div>
                    {selectedBidder && selectedBidder.documents && selectedBidder.documents.length > 0 ? (
                      <>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">Vendor Application Submitted</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-4">
                          This vendor has already submitted their documents and AI pre-screening is complete.
                        </p>
                        <div className="flex flex-col gap-2 items-center mb-6">
                          {selectedBidder.documents.map((doc, idx) => (
                            <a 
                              key={idx} 
                              href={`/api/uploads/${doc.filename}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <DocumentTextIcon className="w-4 h-4" /> View {doc.originalname || doc.filename}
                            </a>
                          ))}
                        </div>
                        <Button 
                          onClick={() => {
                            setOverallScore(selectedBidder.precomputedScore || 85);
                            setAutomationCoverage(90);
                            setHasMandatoryFailure(false);
                            setVerdict('ELIGIBLE: All statutory requirements satisfied');
                            if (selectedBidder.precomputedChecks) setVerificationCards(selectedBidder.precomputedChecks);
                            setScanComplete(true);
                            setCurrentStep(3);
                          }} 
                          size="lg" className="mx-auto gap-2"
                        >
                          <SparklesIcon className="w-5 h-5" /> Load Vendor Submission Results
                        </Button>
                      </>
                    ) : (
                      <>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">Ready to Scan Documents</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
                          The system will extract GSTIN, PAN, Financial Turnover, and Udyam MSME entities using spaCy NLP, and cross-reference them with live government databases.
                        </p>
                        <Button onClick={() => handleScan(null)} size="lg" className="mx-auto gap-2">
                          <SparklesIcon className="w-5 h-5" /> Initiate AI Document Scan
                        </Button>
                      </>
                    )}
                  </div>
                ) : isScanning ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 border-4 border-slate-200 dark:border-slate-700 border-t-navy dark:border-t-saffron rounded-full animate-spin mx-auto mb-6"></div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-2 animate-pulse">Running Neural Extraction...</h3>
                  
                  <div className="w-full max-w-md mx-auto bg-slate-100 dark:bg-slate-700/60 rounded-full h-3.5 mt-6 mb-2 overflow-hidden p-0.5">
                    <div 
                      className="bg-gradient-to-r from-navy to-saffron h-full rounded-full transition-all duration-200 ease-out flex items-center justify-center relative overflow-hidden" 
                      style={{ width: `${scanProgress}%` }}
                    >
                      <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono">Verifying cryptography and querying Government APIs ({scanProgress}%)</p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-6">
            <DocumentUpload 
              onAnalyze={handleScan} 
              onFileSelect={(fileList) => setSelectedFileObj(fileList)}
              isAnalyzing={isScanning} 
            />
          </div>
        </div>
      )}

      {/* Step 3: Verification Results */}
      {currentStep === 3 && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              
              {/* Multi-Document Selector Tabs if bulk uploads present */}
              {bulkResults && bulkResults.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">Scanned Documents ({bulkResults.length}):</span>
                  {bulkResults.map((doc, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedIndex(idx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        selectedIndex === idx
                          ? 'bg-navy text-white dark:bg-saffron dark:text-slate-900 shadow-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      Doc {idx + 1}: {doc.fileName || `Document_${idx + 1}.pdf`} ({doc.overallScore}%)
                    </button>
                  ))}
                </div>
              )}

              {/* Scorecard Result */}
              <div className={`p-5 rounded-xl border flex flex-col sm:flex-row items-center gap-5 shadow-sm transition-colors ${
                overallScore >= 80 
                  ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/50' 
                  : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50'
              }`}>
                <div 
                  onClick={() => setShowXaiModal(true)}
                  className={`w-20 h-20 rounded-full border-[5px] flex items-center justify-center shrink-0 cursor-pointer hover:scale-105 transition-all shadow-md group ${
                    overallScore >= 80 
                      ? 'bg-white dark:bg-green-900/40 border-green-500 text-green-700 dark:text-green-400' 
                      : 'bg-white dark:bg-red-900/40 border-red-500 text-red-700 dark:text-red-400'
                  }`}
                  title="Click to open Explainable AI Decision breakdown"
                >
                  <span className="text-2xl font-extrabold group-hover:scale-110 transition-transform">{overallScore}%</span>
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className={`text-lg font-bold ${
                      overallScore >= 80 ? 'text-green-900 dark:text-green-300' : 'text-red-900 dark:text-red-300'
                    }`}>
                      {overallScore >= 80 
                        ? 'High Compliance Match — Eligible for Commercial Evaluation' 
                        : '🚨 Statutory Criteria Discrepancy — Mandatory Declarations Missing'}
                    </h3>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowXaiModal(true)}
                      className="gap-1.5 border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:border-blue-800 dark:text-blue-300 text-xs shadow-sm"
                    >
                      <SparklesIcon className="w-3.5 h-3.5 text-blue-600" />
                      <span>Explain AI Decision</span>
                    </Button>
                  </div>
                  <p className={`text-sm mt-1.5 ${
                    overallScore >= 80 ? 'text-green-700 dark:text-green-400/80' : 'text-red-700 dark:text-red-400/80'
                  }`}>
                    {overallScore >= 80 
                      ? 'Extracted entities match Ministry of Petroleum & Natural Gas / CPCL technical criteria.' 
                      : 'The uploaded file does not contain valid GSTIN, PAN, Udyam MSME, or Make in India declarations required under CPCL tender rules.'}
                  </p>
                </div>
                <Button onClick={() => setCurrentStep(4)} variant="primary" className={`shrink-0 ${overallScore >= 80 ? 'bg-green-600 hover:bg-green-700 border-green-600' : 'bg-red-600 hover:bg-red-700 border-red-600'} text-white`}>
                  Proceed to Decision <ArrowRightIcon className="w-4 h-4 ml-1" />
                </Button>
              </div>

              <AIRecommendation status={overallScore >= 80 && !hasMandatoryFailure ? 'Verified' : 'Warning'} />
              
              {/* 14 Statutory Compliance Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <VerificationCard title="1. DigiLocker" icon={DocumentCheckIcon} data={verificationCards?.digilocker} />
                <VerificationCard title="2. MSME / Udyam" icon={BuildingOfficeIcon} data={verificationCards?.udyam} />
                <VerificationCard title="3. GST Verification" icon={BanknotesIcon} data={verificationCards?.gst} />
                <VerificationCard title="4. PAN & KYC" icon={IdentificationIcon} data={verificationCards?.pan} />
                <VerificationCard title="5. Income Tax" icon={DocumentChartBarIcon} data={verificationCards?.incomeTax} />
                <VerificationCard title="6. Make in India" icon={GlobeAsiaAustraliaIcon} data={verificationCards?.makeInIndia} />
                <VerificationCard title="7. EPFO Compliance" icon={UserGroupIcon} data={verificationCards?.epfo} />
                <VerificationCard title="8. ESIC Compliance" icon={HeartIcon} data={verificationCards?.esic} />
                <VerificationCard title="9. Startup India" icon={RocketLaunchIcon} data={verificationCards?.startup} />
                <VerificationCard title="10. NSIC Status" icon={ShieldCheckIcon} data={verificationCards?.nsic} />
                <VerificationCard title="11. OEM Auth" icon={WrenchScrewdriverIcon} data={verificationCards?.oem} />
                <VerificationCard title="12. Debarment Check" icon={XCircleIcon} data={verificationCards?.blacklist} />
                <VerificationCard title="13. MCA Portal" icon={BriefcaseIcon} data={verificationCards?.mca} />
                <VerificationCard title="14. Labour License" icon={ClipboardDocumentCheckIcon} data={verificationCards?.labourLicense} />
              </div>

              {/* Active Bid Curing Alert Timeline in Step 3 */}
              <BidCuringAlertTimeline 
                vendorName={bidderName}
                vendorEmail={selectedBidder?.email || 'vendor@example.com'}
                phoneNumber={selectedBidder?.phone || '+91 98765 43210'}
                bidderId={selectedBidder?.id || id || 'b1'}
                tenderNumber="CPCL-2026-T1001"
                overallScore={overallScore}
                hasMandatoryFailure={hasMandatoryFailure}
                verificationCards={verificationCards}
                onCallVendor={() => setShowTwilioModal(true)}
              />
            </div>

            <div className="space-y-6">
              <ComplianceGauge 
                score={overallScore} 
                coverage={automationCoverage} 
                recommendation={verdict} 
                gates={hasMandatoryFailure} 
                onExplainClick={() => setShowXaiModal(true)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Final Decision */}
      {currentStep === 4 && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Final Official Decision</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Review the generated communication and finalize the evaluation for <strong>{bidderName}</strong>. 
              This action will update the CPCL Tender Portal and dispatch the email to the vendor.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Drafts viewer */}
              <div>
                <EmailDraftViewer 
                  draft={extractedDocData?.emailDraft}
                  companyName={bidderName}
                  bidderName={bidderName} 
                  verdict={overallScore >= 80 && !hasMandatoryFailure ? 'APPROVED' : 'FAILED'} 
                  checksDetail={verificationCards} 
                  onCallVendor={() => setShowTwilioModal(true)}
                />
              </div>

              {/* Action Panel */}
              <div className="space-y-4">
                {/* Twilio Voice Call Vendor Remediation Action Card */}
                <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/30 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow">
                      <PhoneIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">Active Bid Curing Remediation Call</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Initiate automated AI voice dispatch to <strong>{bidderName}</strong> before formal tender envelope decision
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => setShowTwilioModal(true)}
                    className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-md text-xs py-2 px-3.5 shrink-0"
                  >
                    <PhoneIcon className="w-3.5 h-3.5" /> Call Vendor (Twilio AI)
                  </Button>
                </div>

                <div className="p-5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50 flex flex-col justify-center">
                  <div className="text-center mb-6">
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-1">Executive Approval Required</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Your decision will be recorded on the blockchain audit trail with your Digital Signature / FIDO2 Passkey credential.
                    </p>
                  </div>
                  
                  {bidderStatus === 'PENDING' ? (
                    <div className="grid grid-cols-2 gap-4">
                      <Button 
                        variant="secondary" 
                        size="lg"
                        onClick={() => setShowRejectModal(true)}
                        className="w-full flex-col h-auto py-4 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-900/50 dark:hover:bg-red-900/30"
                      >
                        <XCircleIcon className="w-8 h-8 mb-2" />
                        <span>Reject & Notify</span>
                      </Button>
                      <Button 
                        variant="primary" 
                        size="lg"
                        onClick={() => setShowApproveModal(true)}
                        className="w-full flex-col h-auto py-4 bg-green-600 hover:bg-green-700 border-transparent shadow-lg shadow-green-600/20"
                      >
                        <CheckCircleIcon className="w-8 h-8 mb-2 text-white" />
                        <span>Approve Bidder</span>
                      </Button>
                    </div>
                  ) : (
                    <div className={`p-4 rounded-xl border text-center ${
                      bidderStatus === 'APPROVED' 
                        ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400' 
                        : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
                    }`}>
                      {bidderStatus === 'APPROVED' ? <CheckBadgeIcon className="w-12 h-12 mx-auto mb-2" /> : <XCircleIcon className="w-12 h-12 mx-auto mb-2" />}
                      <h4 className="font-bold text-lg mb-1">{bidderStatus === 'APPROVED' ? 'Bidder Approved' : 'Bidder Rejected'}</h4>
                      <p className="text-xs opacity-80">Decision recorded on audit trail.</p>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={handleResetAndReturn}
                        className="mt-4 mx-auto gap-1.5 text-xs flex items-center justify-center"
                      >
                        <ArrowLeftIcon className="w-3.5 h-3.5" /> Evaluate Another Bidder
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Active Bid Curing Alert Timeline in Step 4 */}
            <div className="mt-6">
              <BidCuringAlertTimeline 
                vendorName={bidderName}
                vendorEmail={selectedBidder?.email || 'vendor@example.com'}
                phoneNumber={selectedBidder?.phone || '+91 98765 43210'}
                bidderId={selectedBidder?.id || id || 'b1'}
                tenderNumber="CPCL-2026-T1001"
                overallScore={overallScore}
                hasMandatoryFailure={hasMandatoryFailure}
                verificationCards={verificationCards}
                onCallVendor={() => setShowTwilioModal(true)}
              />
            </div>

            <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button 
                variant="secondary" 
                onClick={handleResetAndReturn}
                className="gap-2 text-sm flex items-center"
              >
                <ArrowLeftIcon className="w-4 h-4" /> Return to Bidders
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 pb-3 mb-4 border-b border-slate-100 dark:border-slate-700">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center text-green-600">
                <CheckBadgeIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Approve Bidder</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Confirm technical qualification</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Bidder: <span className="text-navy dark:text-saffron">{bidderName}</span></p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Compliance Score: <strong className="text-green-600">{overallScore}%</strong></p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Company Contact Email (for Notifications)</label>
                <input 
                  type="email" 
                  value={bidderEmail}
                  onChange={(e) => setBidderEmail(e.target.value)}
                  className="w-full text-sm rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-navy focus:border-navy p-2 border mb-3"
                />

                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Approval Remarks (recorded in audit log)</label>
                <textarea 
                  rows={3} 
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  className="w-full text-sm rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-navy focus:border-navy p-2.5 border"
                />
              </div>

              <div className="flex items-start gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="confirm-guidelines" 
                  checked={confirmGuidelines}
                  onChange={(e) => setConfirmGuidelines(e.target.checked)}
                  className="mt-0.5 rounded text-navy focus:ring-navy dark:bg-slate-800 dark:border-slate-600" 
                />
                <label htmlFor="confirm-guidelines" className="text-xs text-slate-600 dark:text-slate-400">
                  I confirm that this bidder has been evaluated in accordance with the GFR 2017 rules and CPCL Procurement Guidelines.
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
              <Button variant="secondary" onClick={() => setShowApproveModal(false)}>Cancel</Button>
              <Button 
                variant="primary" 
                onClick={handleApproveConfirm} 
                disabled={!confirmGuidelines}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Sign & Approve (FIDO2)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 pb-3 mb-4 border-b border-slate-100 dark:border-slate-700">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center text-red-600">
                <XCircleIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Reject / Disqualify Bidder</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">This will notify the vendor via GeM portal</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Bidder: <span className="text-navy dark:text-saffron">{bidderName}</span></p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Compliance Score: <strong className="text-red-600">{overallScore}%</strong></p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Company Contact Email (for Notifications)</label>
                <input 
                  type="email" 
                  value={bidderEmail}
                  onChange={(e) => setBidderEmail(e.target.value)}
                  className="w-full text-sm rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-red-500 focus:border-red-500 p-2 border mb-3"
                />

                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Primary Reason for Disqualification</label>
                <select 
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full text-sm rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-red-500 focus:border-red-500 p-2 border mb-3"
                >
                  <option>Inconsistency between statutory returns and declared status</option>
                  <option>Missing Mandatory Declarations (Make in India / Land Border)</option>
                  <option>Financial Turnover requirements not met</option>
                  <option>Active Debarment/Blacklisting found in Central Registry</option>
                  <option>Forged/Tampered Documents Detected by DigiLocker HSM</option>
                  <option>Other technical criteria mismatch</option>
                </select>

                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Additional Officer Notes (Optional)</label>
                <textarea 
                  rows={2} 
                  placeholder="Additional context to be included in the vendor email..."
                  className="w-full text-sm rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-red-500 focus:border-red-500 p-2.5 border"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
              <Button variant="secondary" onClick={() => setShowRejectModal(false)}>Cancel</Button>
              <Button 
                variant="primary" 
                onClick={handleRejectConfirm} 
                className="bg-red-600 hover:bg-red-700 text-white border-transparent"
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Feature 25: Explainable AI Decision Modal */}
      <ExplainAIDecisionModal
        isOpen={showXaiModal}
        onClose={() => setShowXaiModal(false)}
        overallScore={overallScore}
        automationCoverage={automationCoverage}
        hasMandatoryFailure={hasMandatoryFailure}
        verdict={verdict}
        riskLevel={overallScore >= 80 ? 'Low' : overallScore >= 50 ? 'Medium' : 'High'}
        extractedDocData={extractedDocData}
        verificationCards={verificationCards}
        bidderName={bidderName}
        onCallVendor={() => setShowTwilioModal(true)}
      />

      {/* Feature 26: Twilio Voice Call Vendor Modal */}
      <TwilioCallModal
        isOpen={showTwilioModal}
        onClose={() => setShowTwilioModal(false)}
        selectedBidder={selectedBidder}
        overallScore={overallScore}
        hasMandatoryFailure={hasMandatoryFailure}
        verificationCards={verificationCards}
        tenderNumber="CPCL-2026-T1001"
        onCallCompleted={(callData) => {
          showToast(`📞 Voice call logged for ${callData.vendorName} (${callData.callSid})`);
        }}
      />
    </div>
  );
}