import { NextResponse } from 'next/server';
const { scanAndVerifyDocument } = require('@/lib/services/realOcrService');
const aiService = require('@/lib/services/aiService');
const cloudStorage = require('@/lib/services/cloudStorageService');
const axios = require('axios');

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    let fileName = 'Scanned_Bid_Doc.pdf';
    let mimeType = 'application/pdf';
    let fileBuffer = null;

    if (file && typeof file === 'object') {
      fileName = file.name || 'Scanned_Bid_Doc.pdf';
      mimeType = file.type || 'application/pdf';
      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
      cloudStorage.uploadBlob(fileBuffer, fileName, mimeType);
    } else {
      fileBuffer = Buffer.from('GOVERNMENT PROCUREMENT CPCL TENDER COMPLIANCE ENVELOPE', 'utf8');
      mimeType = 'text/plain';
    }

    const scanResult = await scanAndVerifyDocument(fileBuffer, fileName, mimeType);
    const summary = await aiService.generateSummary(scanResult.extractedText || '');
    const translation = await aiService.translateDocument(scanResult.extractedText || '', 'hi');
    const emailDraft = await aiService.generateEmailDraft({
      verdict: scanResult.verdict.split(':')[0],
      checksDetail: scanResult.checksDetail
    }, 'Vendor');

    scanResult.aiSummary = summary;
    scanResult.aiTranslation = translation;
    scanResult.emailDraft = emailDraft;
    delete scanResult.extractedText;

    // Auto-trigger bid curing webhook if critical/failed
    if (scanResult.hasMandatoryFailure || scanResult.riskLevel === 'Critical') {
      const webhookUrl = process.env.VIASOCKET_WEBHOOK_URL || 'https://flow.sokt.io/func/scrioLbZ4rJB';
      try {
        await axios.post(webhookUrl, {
          company_name: 'Vendor Submission',
          title: 'Active Bid Curing Auto-Notice',
          score: scanResult.overallScore,
          risk_level: scanResult.riskLevel,
          timestamp: new Date().toISOString()
        }, { timeout: 4000 }).catch(() => {});
      } catch (e) {}
    }

    return NextResponse.json({ success: true, result: scanResult });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
