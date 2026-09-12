import React, { useState, useRef } from 'react';
import { ArrowUpTrayIcon, DocumentIcon, XMarkIcon, SparklesIcon, DocumentCheckIcon } from '@heroicons/react/24/outline';
import Button from '../common/Button';
import { showToast } from '../../utils/toast';

export default function DocumentUpload({ onAnalyze, onFileSelect, isAnalyzing = false }) {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (newFilesList) => {
    const formatted = newFilesList.map(f => ({
      name: f.name,
      size: (f.size / (1024 * 1024)).toFixed(2) + ' MB',
      raw: f
    }));
    setFiles(prev => [...prev, ...formatted]);
    if (onFileSelect) onFileSelect(formatted);
    showToast(`📎 ${newFilesList.length} file(s) attached successfully`);
  };

  const removeFile = (index) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    if (onFileSelect) onFileSelect(updated);
  };

  const loadSampleDocuments = () => {
    const sampleText = `
GOVERNMENT OF INDIA - MINISTRY OF PETROLEUM & NATURAL GAS
CHENNAI PETROLEUM CORPORATION LIMITED (CPCL)
BIDDER COMPLIANCE ENVELOPE

Bidder Name: PetroTech India Pvt Ltd
CIN: U23201TN2018PTC123456
GSTIN: 33AABCP1234F1Z5 (State Code: 33 - Tamil Nadu)
PAN: AABCP1234F (Entity Type: C - Company)
Udyam Registration Number: UDYAM-TN-02-0045812
Enterprise Category: Small Enterprise (Manufacturing of Mechanical Valves)

MAKE IN INDIA LOCAL CONTENT DECLARATION:
In accordance with Public Procurement (Preference to Make in India) Order 2017:
Local Content percentage for offered goods in CPCL-2026-T1001 is 72.4%.
Classification: Class-I Local Supplier entitled to 20% margin of purchase preference.

STATUTORY COMPLIANCE DECLARATIONS:
Audited Annual Turnover (FY2023-24): INR 14.80 Crore. Income Tax Return (ITR-6) filed consistently.
EPFO Establishment Code: TN/MAS/0045812/000
ESIC Registration Code: 31000458120000101
Quality Management: ISO 9001:2015 Certified
OEM Manufacturer Authorization: Valid and authenticated
Startup India DPIIT Recognized
NSIC Single Point Registration Valid
CLRA Contract Labour License Attached
Debarment & Blacklisting: NIL. Not debarred or blacklisted by any PSU or Ministry.

Digitally Signed by: Rajesh Sharma, Director
DigiLocker Certified Document ID: DL-CPCL-2026-9812

    `;
    const blob = new Blob([sampleText], { type: 'text/plain' });
    const sampleFile = new File([blob], 'CPCL_Pipeline_Technical_Spec_PetroTech.pdf', { type: 'application/pdf' });
    const sampleEntry = { name: 'CPCL_Pipeline_Technical_Spec_PetroTech.pdf', size: '2.45 MB', raw: sampleFile, isSample: true };
    setFiles([sampleEntry]);
    if (onFileSelect) onFileSelect([sampleEntry]);
    showToast('📄 CPCL Verified Bidder Envelope Loaded (Ready for live scan)');
  };


  const handleStartAnalysis = () => {
    if (files.length === 0) {
      showToast('⚠️ Please upload or load at least one document to analyze');
      return;
    }
    if (onAnalyze) {
      onAnalyze(files);
    } else {
      showToast('⚡ AI Document Analysis Initiated');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Upload Documents for AI Analysis</h3>
        <button
          type="button"
          onClick={loadSampleDocuments}
          className="text-xs font-semibold text-navy dark:text-saffron hover:underline flex items-center gap-1"
        >
          <SparklesIcon className="w-3.5 h-3.5" />
          Load Demo Sample
        </button>
      </div>
      
      {/* Hidden native input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        multiple 
        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" 
        className="hidden" 
        onChange={handleFileChange} 
      />

      <div 
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
          dragActive 
            ? 'border-navy dark:border-saffron bg-navy/5 dark:bg-slate-900' 
            : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 bg-slate-50/50 dark:bg-slate-900/40'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current && fileInputRef.current.click()}
      >
        <ArrowUpTrayIcon className="mx-auto h-10 w-10 text-slate-400 dark:text-slate-500 mb-2" />
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Drag & drop your PDF or Certificate files here
        </p>
        <p className="text-xs text-slate-400 mb-3">Supports PDF, DOCX, PNG, JPG (Max: 25MB)</p>
        
        <Button 
          type="button"
          variant="secondary" 
          size="sm" 
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current && fileInputRef.current.click();
          }}
        >
          Browse Files
        </Button>
      </div>

      {files.length > 0 && (
        <div className="mt-5 space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Attached Documents ({files.length})
            </h4>
            <button
              type="button"
              onClick={() => setFiles([])}
              className="text-[11px] text-red-500 hover:underline"
            >
              Clear all
            </button>
          </div>

          <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {files.map((f, i) => (
              <li key={i} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs">
                <div className="flex items-center gap-2.5 truncate">
                  <DocumentIcon className="h-4 w-4 text-navy dark:text-saffron shrink-0" />
                  <span className="font-medium text-slate-700 dark:text-slate-200 truncate">{f.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-slate-400 text-[10px] font-mono">{f.size}</span>
                  <button 
                    type="button" 
                    onClick={() => removeFile(i)}
                    className="text-slate-400 hover:text-red-500 p-0.5 rounded"
                  >
                    <XMarkIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="pt-2">
            <Button 
              type="button"
              variant="primary" 
              className="w-full gap-2 justify-center py-2.5" 
              onClick={handleStartAnalysis}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Extracting OCR & NLP Entities...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-4 h-4 text-saffron" />
                  Analyze Documents & Verify Compliance
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}