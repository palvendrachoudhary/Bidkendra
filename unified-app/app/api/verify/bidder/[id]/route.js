import { NextResponse } from 'next/server';
const { runStatutoryVerifications } = require('@/lib/services/complianceEngine');
const aiService = require('@/lib/services/aiService');

export async function POST(req, { params }) {
  try {
    const bidderId = params.id;
    const body = await req.json().catch(() => ({}));
    const sampleBidder = {
      id: bidderId,
      company_name: body.companyName || 'PetroTech India Pvt Ltd',
      pan_number: body.pan || 'AABCP1234F',
      gst_number: body.gstin || '33AABCP1234F1Z5',
      udyam_number: body.udyam || 'UDYAM-TN-02-0045812',
      email: body.email || 'vendor@example.com',
      phone: body.phone || '9840123456'
    };

    const verificationResult = await runStatutoryVerifications(sampleBidder, {});
    const emailDraft = await aiService.generateEmailDraft({
      verdict: verificationResult.verdict ? verificationResult.verdict.split(':')[0] : 'COMPLIANT',
      checksDetail: verificationResult.checksDetail
    }, sampleBidder.company_name);

    return NextResponse.json({
      success: true,
      bidder: sampleBidder,
      result: {
        ...verificationResult,
        emailDraft
      }
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
