import { NextRequest, NextResponse } from 'next/server';

export function verifyAdminRequest(req: NextRequest): {
  authorized: boolean;
  role: string | null;
  message?: string;
} {
  const roleCookie = req.cookies.get('cnu_chacha_role')?.value || null;
  const headerRole = req.headers.get('x-admin-role') || null;
  const effectiveRole = roleCookie || headerRole;

  if (effectiveRole !== 'admin') {
    return {
      authorized: false,
      role: effectiveRole,
      message: '관리자 권한이 없는 요청입니다. (403 Forbidden)',
    };
  }

  return {
    authorized: true,
    role: 'admin',
  };
}

export async function GET(req: NextRequest) {
  const check = verifyAdminRequest(req);
  if (!check.authorized) {
    return NextResponse.json(
      { authorized: false, message: check.message },
      { status: 403 }
    );
  }
  return NextResponse.json({
    authorized: true,
    role: 'admin',
    verifiedAt: new Date().toISOString(),
  });
}
