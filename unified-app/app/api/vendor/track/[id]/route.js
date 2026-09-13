import { NextResponse } from 'next/server';
const db = require('@/lib/db');

export async function GET(req, { params }) {
  try {
    await db.init();
    const trackingId = params.id;
    const result = await db.query(
      `SELECT bs.id as trackingId, bs.status, bs.submitted_at, b.company_name, cs.overall_score, cs.risk_level, cs.ai_recommendation
       FROM bid_submissions bs
       JOIN bidders b ON bs.bidder_id = b.id
       LEFT JOIN compliance_scores cs ON bs.id = cs.bid_submission_id
       WHERE bs.id = $1`,
      [trackingId]
    );

    const submission = result.rows[0];
    if (!submission) {
      return NextResponse.json({ success: false, message: 'Submission not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, submission });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
