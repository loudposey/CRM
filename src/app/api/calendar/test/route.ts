import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET() {
  try {
    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/auth/callback/google`
    );

    // Test if credentials are configured
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return NextResponse.json({
        success: false,
        error: 'Google API credentials not configured'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Google Calendar API credentials configured successfully',
      clientId: process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...',
      hasSecret: !!process.env.GOOGLE_CLIENT_SECRET
    });

  } catch (error) {
    console.error('Google Calendar API test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}