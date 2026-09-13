import { NextResponse } from 'next/server';

const defaultSettings = {
  notifications: { email: true, sms: true, voice: true },
  thresholds: { passingScore: 80, criticalScore: 50 },
  portals: {
    gst: { status: 'Connected', mode: 'API_SETU' },
    pan: { status: 'Connected', mode: 'INCOME_TAX_DEPT' },
    udyam: { status: 'Connected', mode: 'MSME_PORTAL' },
    digilocker: { status: 'Connected', mode: 'DIGILOCKER_GATEWAY' }
  }
};

export async function GET() {
  return NextResponse.json({ success: true, settings: defaultSettings });
}

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  return NextResponse.json({ success: true, message: 'Settings saved', settings: body });
}
