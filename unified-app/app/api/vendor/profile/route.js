import { NextResponse } from 'next/server';
const db = require('@/lib/db');

export async function POST(req) {
  try {
    await db.init();
    const body = await req.json().catch(() => ({}));
    const { companyName, gstin, pan, udyam, email, phone } = body;
    const name = companyName || 'Vendor Entity';

    const bidderId = 'b-' + Date.now();
    await db.query(
      'INSERT INTO bidders (id, company_name, email, phone, pan_number, gst_number, udyam_number, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)',
      [bidderId, name, email || '', phone || '', pan || '', gstin || '', udyam || '']
    );

    return NextResponse.json({
      success: true,
      message: 'Vendor profile saved successfully',
      vendor: { id: bidderId, companyName: name, gstin, pan, udyam, email, phone }
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
