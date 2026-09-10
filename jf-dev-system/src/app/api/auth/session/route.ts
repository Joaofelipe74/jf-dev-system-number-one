import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
  return NextResponse.json({
    user: { id: session.sub, name: session.name, email: session.email, role: session.role },
  });
}
