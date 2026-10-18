import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, requireSuperadmin, parseSessionToken } from '@/lib/api-auth';
import { UserRole } from '@prisma/client';
import { hashPassword } from '@/lib/password';
import { sanitizeText } from '@/lib/sanitize';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = req.cookies.get('giziflow_session')?.value;
    const session = token ? await parseSessionToken(token) : null;

    if (!session) {
      return NextResponse.json({ success: false, error: 'Silakan login terlebih dahulu.' }, { status: 401 });
    }

    const isSuperadmin = session.role === 'SUPERADMIN';
    const isSelf = session.id === id;
    // Superadmin boleh mengubah akun siapa pun; setiap admin boleh mengubah akunnya sendiri.
    if (!isSuperadmin && !isSelf) {
      return NextResponse.json(
        { success: false, error: 'Hanya Superadmin yang berhak mengubah akun admin lain!' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const updateData: any = {};

    if (body.username !== undefined && String(body.username).trim() !== '') {
      const cleanUsername = sanitizeText(body.username).toLowerCase();
      if (cleanUsername.length < 3 || cleanUsername.length > 64) {
        return NextResponse.json({ success: false, error: 'Username harus 3-64 karakter.' }, { status: 400 });
      }
      const taken = await prisma.adminUser.findFirst({
        where: { username: cleanUsername, NOT: { id } },
      });
      if (taken) {
        return NextResponse.json({ success: false, error: `Username "${cleanUsername}" sudah dipakai akun lain.` }, { status: 400 });
      }
      updateData.username = cleanUsername;
    }

    if (body.name) updateData.name = sanitizeText(body.name);

    // Peran hanya boleh diubah oleh superadmin — akun tidak bisa menaikkan haknya sendiri.
    if (body.role && isSuperadmin) {
      updateData.role =
        body.role === 'SUPERADMIN'
          ? UserRole.SUPERADMIN
          : body.role === 'DISTRIBUTION_DRIVER'
          ? UserRole.DISTRIBUTION_DRIVER
          : UserRole.EXECUTIVE_AUDITOR;
    }

    if (body.password && String(body.password).trim().length > 0) {
      if (String(body.password).length < 8) {
        return NextResponse.json({ success: false, error: 'Password minimal 8 karakter.' }, { status: 400 });
      }
      updateData.password = hashPassword(String(body.password));
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: false, error: 'Tidak ada perubahan yang dikirim.' }, { status: 400 });
    }

    const updated = await prisma.adminUser.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, data: updated, message: 'Data admin berhasil diperbarui!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = req.cookies.get('giziflow_session')?.value;
    const session = token ? await parseSessionToken(token) : null;

    if (!session || session.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { success: false, error: 'Hanya Superadmin yang berhak menghapus akun admin!' },
        { status: 403 }
      );
    }

    // Prevent deleting own logged in account
    if (session.id === id) {
      return NextResponse.json(
        { success: false, error: 'Anda tidak dapat menghapus akun yang sedang Anda gunakan untuk login!' },
        { status: 400 }
      );
    }

    // Check count of superadmins
    const targetUser = await prisma.adminUser.findUnique({ where: { id } });
    if (targetUser?.role === 'SUPERADMIN') {
      const superadminCount = await prisma.adminUser.count({
        where: { role: UserRole.SUPERADMIN },
      });
      if (superadminCount <= 1) {
        return NextResponse.json(
          { success: false, error: 'Tidak dapat menghapus satu-satunya akun Superadmin tersisa!' },
          { status: 400 }
        );
      }
    }

    await prisma.adminUser.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Akun admin berhasil dihapus!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
