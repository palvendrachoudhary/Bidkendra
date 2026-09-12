const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
let pdfParse = null;

try {
  pdfParse = require('pdf-parse');
} catch (e) {
  console.warn('pdf-parse not loaded yet:', e.message);
}

const { CheckStatus } = require('./verification/checkStatus');
const digilockerVerifier = require('./verification/digilockerVerifier');
const udyamVerifier = require('./verification/udyamVerifier');
const gstVerifier = require('./verification/gstVerifier');
const panVerifier = require('./verification/panVerifier');
const incomeTaxVerifier = require('./verification/incomeTaxVerifier');
const makeInIndiaVerifier = require('./verification/makeInIndiaVerifier');
const epfoVerifier = require('./verification/epfoVerifier');
const esicVerifier = require('./verification/esicVerifier');
const startupIndiaVerifier = require('./verification/startupIndiaVerifier');
const nsicVerifier = require('./verification/nsicVerifier');
const oemVerifier = require('./verification/oemVerifier');
const debarmentVerifier = require('./verification/debarmentVerifier');
const mcaVerifier = require('./verification/mcaVerifier');
const labourLicenseVerifier = require('./verification/labourLicenseVerifier');
const { enrichChecksDetail } = require('./evidenceEnricher');

exports.scanAndVerifyDocument = async (fileBuffer, originalName = 'document.pdf', mimeType = 'application/pdf') => {
  if (!fileBuffer) {
    fileBuffer = Buffer.from('');
  } else if (!Buffer.isBuffer(fileBuffer)) {
    fileBuffer = Buffer.from(String(fileBuffer), 'utf8');
  }
  const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
  const fileSize = fileBuffer.length;
  const docName = originalName || 'document.pdf';
  const docMime = mimeType || 'application/pdf';
  let extractedText = '';

  if (docMime.toLowerCase().includes('pdf') || docName.toLowerCase().endsWith('.pdf')) {
    if (pdfParse) {
      try {
        if (typeof pdfParse === 'function') {
          const data = await pdfParse(fileBuffer);
          extractedText = data.text || '';
        } else if (pdfParse.PDFParse) {
          const parser = new pdfParse.PDFParse({ data: fileBuffer });
          const parsed = await parser.getText();
          extractedText = parsed.text || '';
          try { await parser.destroy(); } catch (e) {}
        } else {
          extractedText = fileBuffer.toString('utf8', 0, Math.min(fileBuffer.length, 50000));
        }
      } catch (err) {
        extractedText = fileBuffer.toString('utf8', 0, Math.min(fileBuffer.length, 50000));
      }
    } else {
      extractedText = fileBuffer.toString('utf8', 0, Math.min(fileBuffer.length, 50000));
    }
  } else {
    extractedText = fileBuffer.toString('utf8', 0, Math.min(fileBuffer.length, 50000));
  }

  let apiConfig = {};
  let aiSettings = {};
  try {
    const { getGlobalSettings } = require('../controllers/settingsController');
    const settings = getGlobalSettings();
    apiConfig = settings.apiConfig || {};
    aiSettings = settings.aiSettings || {};
  } catch (e) {
    console.warn('Could not load settings:', e.message);
  }

  const results = await Promise.all([
    digilockerVerifier.verify(extractedText, apiConfig, hash),
    udyamVerifier.verify(extractedText, apiConfig),
    gstVerifier.verify(extractedText, apiConfig),
    panVerifier.verify(extractedText, apiConfig),
    incomeTaxVerifier.verify(extractedText, apiConfig),
    makeInIndiaVerifier.verify(extractedText, apiConfig),
    epfoVerifier.verify(extractedText, apiConfig),
    esicVerifier.verify(extractedText, apiConfig),
    startupIndiaVerifier.verify(extractedText, apiConfig),
    nsicVerifier.verify(extractedText, apiConfig),
    oemVerifier.verify(extractedText, apiConfig),
    debarmentVerifier.verify(extractedText, apiConfig),
    mcaVerifier.verify(extractedText, apiConfig),
    labourLicenseVerifier.verify(extractedText, apiConfig)
  ]);

  const checksDetail = {};
  results.forEach(r => {
    checksDetail[r.checkId] = r;
  });

  // Enrich checks detail with Explainable AI statutory evidence snippets
  enrichChecksDetail(checksDetail, extractedText, docName);

  let verifiedCount = 0;
  let failedCount = 0;
  let applicableCount = 0;
  let hasMandatoryFailure = false;

  results.forEach(r => {
    applicableCount++;
    if (r.checkStatus === CheckStatus.VERIFIED) verifiedCount++;
    if (r.checkStatus === CheckStatus.FAILED) failedCount++;
    if (r.isMandatoryGate && r.checkStatus === CheckStatus.FAILED) {
      hasMandatoryFailure = true;
    }
  });

  const resolvedCount = verifiedCount + failedCount;
  let complianceScore = resolvedCount > 0 ? Math.round((verifiedCount / resolvedCount) * 100) : 0;
  const automationCoverage = applicableCount > 0 ? Math.round((resolvedCount / applicableCount) * 100) : 0;

  let riskLevel = 'High';
  let isCompliant = false;

  if (hasMandatoryFailure) {
    complianceScore = 0;
    riskLevel = 'Critical';
    isCompliant = false;
  } else if (complianceScore >= 80 && automationCoverage > 50) {
    riskLevel = 'Low';
    isCompliant = true;
  } else if (complianceScore >= 50) {
    riskLevel = 'Medium';
  } else {
    riskLevel = 'High';
  }

  const textPreview = extractedText.replace(/\s+/g, ' ').trim().substring(0, 350);

  return {
    documentHash: hash,
    fileName: docName,
    fileSize,
    mimeType: docMime,
    rawTextLength: extractedText.length,
    textPreview: textPreview || '[Binary or unreadable content. No raw text detected.]',
    extractedText: extractedText,
    overallScore: complianceScore,
    automationCoverage,
    riskLevel,
    isCompliant,
    hasMandatoryFailure,
    extractedEntities: {
      gstin: checksDetail.gst?.extractedValue,
      pan: checksDetail.pan?.extractedValue,
      udyam: checksDetail.udyam?.extractedValue,
      cin: checksDetail.mca?.extractedValue,
      localContentPct: checksDetail.makeInIndia?.extractedValue,
      epfo: checksDetail.epfo?.extractedValue
    },
    checksDetail,
    verdict: hasMandatoryFailure 
      ? 'NOT_ELIGIBLE: Failed mandatory statutory compliance gates.'
      : (isCompliant 
          ? 'ELIGIBLE: Statutory compliance documents authenticated as per GeM/CPCL guidelines.'
          : 'NEEDS_REVIEW: Manual review required. Automation coverage or compliance score too low.')
  };
};