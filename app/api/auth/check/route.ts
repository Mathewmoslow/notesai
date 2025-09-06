import { NextResponse } from 'next/server';

export async function GET() {
  const hasGoogleId = !!process.env.GOOGLE_CLIENT_ID;
  const hasGoogleSecret = !!process.env.GOOGLE_CLIENT_SECRET;
  const hasNextAuthSecret = !!process.env.NEXTAUTH_SECRET;
  const hasNextAuthUrl = !!process.env.NEXTAUTH_URL;
  
  return NextResponse.json({
    configured: {
      GOOGLE_CLIENT_ID: hasGoogleId,
      GOOGLE_CLIENT_SECRET: hasGoogleSecret,
      NEXTAUTH_SECRET: hasNextAuthSecret,
      NEXTAUTH_URL: hasNextAuthUrl,
    },
    url: process.env.NEXTAUTH_URL || 'not set',
    clientIdLength: process.env.GOOGLE_CLIENT_ID?.length || 0,
    environment: process.env.NODE_ENV
  });
}