import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code || !state) {
    return NextResponse.redirect('/');
  }

  return NextResponse.redirect('/dashboard');
} 