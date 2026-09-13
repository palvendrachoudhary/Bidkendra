import { NextResponse } from 'next/server';

export async function GET() {
  const accountSid = (process.env.TWILIO_ACCOUNT_SID || '').trim();
  const configured = Boolean(accountSid);
  return NextResponse.json({
    success: true,
    configured,
    mode: configured ? 'live' : 'simulated_fallback',
    verifiedNumbers: ['+919840123456', '+919820554433']
  });
}
