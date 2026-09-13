import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password, passkeyData } = body;

    if (passkeyData) {
      return NextResponse.json({
        success: true,
        token: 'jwt-officer-fido2-' + Date.now(),
        user: {
          id: 'u1',
          name: 'Rajesh Sharma',
          email: 'rajesh.sharma@cpcl.gov.in',
          role: 'PROCUREMENT_OFFICER',
          authMethod: 'FIDO2_PASSKEY'
        }
      });
    }

    return NextResponse.json({
      success: true,
      token: 'jwt-officer-session-' + Date.now(),
      user: {
        id: 'u1',
        name: 'Rajesh Sharma',
        email: email || 'rajesh.sharma@cpcl.gov.in',
        role: 'PROCUREMENT_OFFICER'
      }
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
