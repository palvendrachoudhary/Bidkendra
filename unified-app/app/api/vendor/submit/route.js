import { NextResponse } from 'next/server';
const db = require('@/lib/db');
const cloudStorage = require('@/lib/services/cloudStorageService');

export async function POST(req) {
  try {
    await db.init();
    const formData = await req.formData();
    const companyName = formData.get('companyName') || formData.get('company_name') || 'Vendor Entity';
    const email = formData.get('email') || '';
    const phone = formData.get('phone') || '';
    const gstin = formData.get('gstin') || '';
    const pan = formData.get('pan') || '';
    const udyam = formData.get('udyam') || '';
    const tenderId = formData.get('tenderId') || 't1';
    const file = formData.get('file');

    let fileInfo = null;
    if (file && typeof file === 'object') {
      const fileName = file.name || 'Vendor_Submission.pdf';
      const mimeType = file.type || 'application/pdf';
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const storedFilename = cloudStorage.uploadBlob(buffer, fileName, mimeType);
      fileInfo = {
        filename: storedFilename,
        originalname: fileName,
        path: `/api/uploads/${storedFilename}`,
        mimetype: mimeType,
        size: buffer.length
      };
    }

    const bidderId = 'b-' + Date.now();
    const trackingId = 'BK-CPCL-' + Math.floor(100000 + Math.random() * 900000);
    const submissionId = trackingId;

    await db.query(
      'INSERT INTO bidders (id, company_name, registration_number, email, phone, pan_number, gst_number, udyam_number, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)',
      [bidderId, companyName, 'REG-' + Date.now().toString().slice(-6), email, phone, pan, gstin, udyam]
    );

    const documentsJson = JSON.stringify(fileInfo ? [fileInfo] : []);
    await db.query(
      'INSERT INTO bid_submissions (id, tender_id, bidder_id, submitted_at, status, documents_json) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, $5)',
      [submissionId, tenderId, bidderId, 'SUBMITTED', documentsJson]
    );

    return NextResponse.json({
      success: true,
      trackingId,
      submissionId,
      bidderId,
      message: 'Application submitted successfully.'
    });
  } catch (err) {
    console.error('vendor submit error:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
