import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Deploy test successful',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
}