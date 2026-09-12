const fs = require('fs');

const bidderPath = 'frontend/src/pages/BidderVerification.jsx';
let content = fs.readFileSync(bidderPath, 'utf8');

// 1. Add new imports
if (!content.includes('EmailDraftViewer')) {
  content = content.replace(
    "import DocumentUpload from '../components/verification/DocumentUpload';",
    "import DocumentUpload from '../components/verification/DocumentUpload';\nimport EmailDraftViewer from '../components/verification/EmailDraftViewer';"
  );
}

if (!content.includes('verifyBulkDocumentsApi')) {
  content = content.replace(
    "import { verifyBidderApi, verifyDocumentApi } from '../services/api';",
    "import { verifyBidderApi, verifyDocumentApi, verifyBulkDocumentsApi } from '../services/api';"
  );
}

// 2. Add new state variables
if (!content.includes('const [bulkResults, setBulkResults]')) {
  content = content.replace(
    "const [extractedDocData, setExtractedDocData] = useState(null);",
    "const [extractedDocData, setExtractedDocData] = useState(null);\n  const [bulkResults, setBulkResults] = useState([]);\n  const [selectedIndex, setSelectedIndex] = useState(0);\n  const [activeTab, setActiveTab] = useState('compliance'); // compliance | summary | email"
  );
}

// 3. Update handleScan to use verifyBulkDocumentsApi
if (!content.includes('verifyBulkDocumentsApi(formData)')) {
  const oldScanStr = `    // 1. Call real document verification endpoint
    let docResult = null;
    try {
      if (targetFiles && targetFiles[0] && targetFiles[0].raw) {
        const formData = new FormData();
        formData.append('document', targetFiles[0].raw);
        formData.append('submissionId', 'sub101');
        docResult = await verifyDocumentApi(formData);
      } else {
        docResult = await verifyDocumentApi({ 
          isSample: true,
          fileName: 'CPCL_Pipeline_Technical_Spec_PetroTech.pdf',
          submissionId: 'sub101'
        });
      }
    } catch (e) {
      console.warn('Doc scan error:', e);
    }`;

  const newScanStr = `    // 1. Call real document verification endpoint
    let docResult = null;
    try {
      if (targetFiles && targetFiles.length > 0 && targetFiles[0].raw) {
        const formData = new FormData();
        targetFiles.forEach(tf => formData.append('documents', tf.raw));
        formData.append('submissionId', 'sub101');
        const bulkData = await verifyBulkDocumentsApi(formData);
        if (bulkData && bulkData.data && bulkData.data.length > 0) {
            setBulkResults(bulkData.data);
            docResult = { data: bulkData.data[0] }; // Use first as primary for now
            setSelectedIndex(0);
        }
      } else {
        docResult = await verifyDocumentApi({ 
          isSample: true,
          fileName: 'CPCL_Pipeline_Technical_Spec_PetroTech.pdf',
          submissionId: 'sub101'
        });
        if (docResult && docResult.data) {
          setBulkResults([docResult.data]);
        }
      }
    } catch (e) {
      console.warn('Doc scan error:', e);
    }`;

  content = content.replace(oldScanStr, newScanStr);
}

// 4. Update the select effect hook
if (!content.includes('useEffect(() => {')) {
  const effectStr = `
  // Switch selected document logic
  React.useEffect(() => {
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
`;
  content = content.replace("const bidderName = id ? `Bidder ${id}` : 'PetroTech India Pvt Ltd';", "const bidderName = id ? `Bidder ${id}` : 'PetroTech India Pvt Ltd';\n" + effectStr);
}

// 5. Inject multi-file tabs / UI.
// We'll replace the existing "14 Verification Checks" header area with a tabbed interface.
if (!content.includes('bulkResults.length > 1')) {
  const headerBlock = `<h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">14 Statutory Verification Checks</h3>`;
  const newHeaderBlock = `
        {bulkResults.length > 1 && (
            <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
              {bulkResults.map((res, idx) => (
                <button 
                  key={idx}
                  onClick={() => setSelectedIndex(idx)}
                  className={\`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap \${selectedIndex === idx ? 'bg-navy text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}\`}
                >
                  {res.fileName || \`Document \${idx + 1}\`}
                </button>
              ))}
            </div>
        )}

        <div className="flex gap-4 border-b border-slate-200 mb-6 pb-2">
            <button onClick={() => setActiveTab('compliance')} className={\`font-medium pb-2 -mb-2 border-b-2 \${activeTab === 'compliance' ? 'text-navy border-navy' : 'text-slate-500 border-transparent hover:text-slate-700'}\`}>14 Statutory Checks</button>
            <button onClick={() => setActiveTab('summary')} className={\`font-medium pb-2 -mb-2 border-b-2 \${activeTab === 'summary' ? 'text-navy border-navy' : 'text-slate-500 border-transparent hover:text-slate-700'}\`}>AI Summary & Translation</button>
            <button onClick={() => setActiveTab('email')} className={\`font-medium pb-2 -mb-2 border-b-2 \${activeTab === 'email' ? 'text-navy border-navy' : 'text-slate-500 border-transparent hover:text-slate-700'}\`}>Email Drafts</button>
        </div>

        {activeTab === 'compliance' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
`;
  content = content.replace(headerBlock, newHeaderBlock);
}

// Ensure grid closes properly. The original ends with closing the grid grid-cols-2.
// Let's replace the single end div with closing the condition.
if (!content.includes("{activeTab === 'summary'")) {
    content = content.replace(
`            </div>
          </div>

          {/* Right Sidebar: Gauge & Upload Widget */}`,
`            </div>
          )}

          {activeTab === 'summary' && extractedDocData && (
            <div className="space-y-6">
               <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <h4 className="font-semibold text-slate-800 flex items-center gap-2 mb-2"><SparklesIcon className="w-5 h-5 text-purple-500"/> AI Document Summary</h4>
                  <p className="text-slate-700 text-sm">{extractedDocData.aiSummary || 'Summary not available.'}</p>
               </div>
               <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mt-4">
                  <h4 className="font-semibold text-slate-800 flex items-center gap-2 mb-2"><GlobeAsiaAustraliaIcon className="w-5 h-5 text-blue-500"/> Document Translation</h4>
                  <p className="text-slate-700 text-sm whitespace-pre-wrap">{extractedDocData.aiTranslation || 'Translation not available.'}</p>
               </div>
            </div>
          )}

          {activeTab === 'email' && extractedDocData && (
            <div className="space-y-6">
                <EmailDraftViewer draft={extractedDocData.emailDraft} companyName={extractedDocData.extractedEntities?.companyName || "PetroTech India Pvt Ltd"} />
            </div>
          )}
          </div>

          {/* Right Sidebar: Gauge & Upload Widget */}`
    );
}

// Pass array of files from handleFileSelect instead of just one
if (!content.includes('setSelectedFileObj(fileList)')) {
    content = content.replace(
        `onFileSelect={(fileList) => setSelectedFileObj(fileList && fileList[0])}`,
        `onFileSelect={(fileList) => setSelectedFileObj(fileList)}`
    );
}

fs.writeFileSync(bidderPath, content, 'utf8');
console.log('BidderVerification.jsx patched!');
