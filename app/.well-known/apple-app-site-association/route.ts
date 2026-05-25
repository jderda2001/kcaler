import { NextResponse } from 'next/server';

// Required by Apple for Sign In with Apple on web and for Universal Links
// Replace TEAM_ID and BUNDLE_ID with real values once Apple Dev account is set up
export function GET() {
  const teamId = process.env.APPLE_TEAM_ID ?? 'TEAMID';
  const bundleId = 'com.kcal.tracker';

  return NextResponse.json(
    {
      applinks: {
        details: [
          {
            appIDs: [`${teamId}.${bundleId}`],
            components: [{ '/': '/*' }],
          },
        ],
      },
      webcredentials: {
        apps: [`${teamId}.${bundleId}`],
      },
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
      },
    },
  );
}
