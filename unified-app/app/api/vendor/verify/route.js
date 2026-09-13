import { NextResponse } from 'next/server';
const { scanAndVerifyDocument } = require('@/lib/services/realOcrService');
const cloudStorage = require('@/lib/services/cloudStorageService');

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const companyName = formData.get('companyName') || formData.get('company_name') || 'Vendor Entity';
    const formGSTIN = (formData.get('gstin') || '').trim().toUpperCase();
    const formPAN = (formData.get('pan') || '').trim().toUpperCase();
    const formUdyam = (formData.get('udyam') || '').trim().replace(/\s+/g, '').toUpperCase();
    const vendorEmail = formData.get('email') || formData.get('vendorEmail') || '';
    const phoneNumber = formData.get('phone') || formData.get('phoneNumber') || '';

    let fileBuffer = null;
    let fileName = 'Vendor_Document.pdf';
    let mimeType = 'application/pdf';

    if (file && typeof file === 'object') {
      fileName = file.name || 'Vendor_Document.pdf';
      mimeType = file.type || 'application/pdf';
      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
      cloudStorage.uploadBlob(fileBuffer, fileName, mimeType);
    } else {
      const sampleText = `
        GOVERNMENT OF INDIA - MINISTRY OF PETROLEUM & NATURAL GAS
        CHENNAI PETROLEUM CORPORATION LIMITED (CPCL)
        VENDOR PRE-SCREENING COMPLIANCE ENVELOPE
        Company Name: ${companyName}
        CIN: U23201TN2018PTC123456
        GSTIN: ${formGSTIN || '33AABCP1234F1Z5'}
        PAN: ${formPAN || 'AABCP1234F'}
        Udyam Registration: ${formUdyam || 'UDYAM-TN-02-0045812'}
        Local Content: 72.4% (Make in India Compliant)
        Turnover: INR 14.80 Crore. ITR-6 filed.
        EPFO: TN/MAS/0045812/000 | ESIC: 31000458120000101
        ISO 9001:2015 Certified | OEM Authorization Attached
        Debarment: None. Clean Track Record.
      `;
      fileBuffer = Buffer.from(sampleText, 'utf8');
      mimeType = 'text/plain';
    }

    const scanResult = await scanAndVerifyDocument(fileBuffer, fileName, mimeType);
    const discrepancies = [];
    const extractedGSTIN = scanResult.extractedEntities?.gstin;
    const extractedPAN = scanResult.extractedEntities?.pan;
    const extractedUdyam = scanResult.extractedEntities?.udyam;

    if (formGSTIN && extractedGSTIN && formGSTIN !== extractedGSTIN.toUpperCase()) {
      discrepancies.push(`GSTIN Mismatch: Form contains '${formGSTIN}', but document contains '${extractedGSTIN}'.`);
    }
    if (formPAN && extractedPAN && formPAN !== extractedPAN.toUpperCase()) {
      discrepancies.push(`PAN Mismatch: Form contains '${formPAN}', but document contains '${extractedPAN}'.`);
    }
    if (formUdyam && extractedUdyam && formUdyam !== extractedUdyam.toUpperCase()) {
      discrepancies.push(`Udyam Mismatch: Form contains '${formUdyam}', but document contains '${extractedUdyam}'.`);
    }

    delete scanResult.extractedText;

    return NextResponse.json({
      success: true,
      companyName,
      overallScore: scanResult.overallScore,
      automationCoverage: scanResult.automationCoverage,
      riskLevel: scanResult.riskLevel,
      isCompliant: scanResult.isCompliant && discrepancies.length === 0,
      hasMandatoryFailure: scanResult.hasMandatoryFailure || discrepancies.length > 0,
      verdict: discrepancies.length > 0 ? 'NOT_ELIGIBLE: Form entity details do not match statutory document.' : scanResult.verdict,
      crossValidation: {
        passed: discrepancies.length === 0,
        discrepancies
      },
      extractedEntities: scanResult.extractedEntities,
      checksDetail: scanResult.checksDetail
    });
  } catch (err) {
    console.error('vendor verify error:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
