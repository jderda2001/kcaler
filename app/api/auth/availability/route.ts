import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Tells the UI which OAuth providers are configured server-side
// (so we don't render an Apple button when the secret isn't set).
export async function GET() {
  return NextResponse.json({
    google: Boolean(process.env.GOOGLE_CLIENT_ID),
    apple: Boolean(process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET),
  });
}
