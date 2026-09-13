import { NextResponse } from 'next/server';
const db = require('@/lib/db');

export async function GET(req) {
  try {
    await db.init();
    const { searchParams } = new URL(req.url);
    const vendorName = searchParams.get('vendorName') || searchParams.get('vendor_name');

    const result = await db.query(
      'SELECT * FROM alert_timeline ORDER BY created_at DESC LIMIT 20'
    );

    return NextResponse.json({ success: true, alerts: result.rows });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
