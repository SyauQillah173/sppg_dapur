import { NextRequest, NextResponse } from 'next/server';
import { revokeCurrentSession } from '@/lib/session-manager';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('giziflow_session')?.value;
    if (token) {
      // Ubah status sesi perangkat menjadi riwayat (isActive: false, revokedBy: 'USER_SELF')
      await revokeCurrentSession(token);
    }
  } catch (e) {
    console.error('Logout session revocation error:', e);
  }

  const response = NextResponse.json({
    success: true,
    message: 'Logout berhasil! Sesi perangkat telah disimpan ke riwayat.',
  });

  response.cookies.delete('giziflow_session');

  return response;
}
