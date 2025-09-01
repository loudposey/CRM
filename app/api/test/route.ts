import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET() {
  try {
    const result = await sql`SELECT NOW()`;
    return NextResponse.json({ 
      success: true, 
      time: result.rows[0], 
      message: 'Database connection successful' 
    });
  } catch (error) {
    console.error('Database connection failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Database connection failed' 
    }, { status: 500 });
  }
}