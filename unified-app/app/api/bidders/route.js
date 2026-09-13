import { NextResponse } from 'next/server';
const db = require('@/lib/db');

export async function GET() {
  try {
    await db.init();
    const result = await db.query('SELECT * FROM bidders ORDER BY created_at DESC');
    return NextResponse.json({
      success: true,
      count: result.rows.length,
      bidders: result.rows
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
