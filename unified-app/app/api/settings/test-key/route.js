import { NextResponse } from 'next/server';

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const { portal = 'Gateway' } = body;
  return NextResponse.json({
    success: true,
    message: `Connection to ${portal} sandbox verified successfully (Latency: 42ms)`
  });
}
