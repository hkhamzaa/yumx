import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { verifyAdminSession } from '@/app/api/_lib/admin-auth'
import { galleryController } from '@/app/api/_lib/controllers/galleryController'

/** PUT /api/admin/gallery/[id] — Admin. Update gallery image metadata. */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => null)
  const result = await galleryController.updateImage(params.id, body)
  return NextResponse.json(result.data, { status: result.status })
}

/** DELETE /api/admin/gallery/[id] — Admin. Permanently remove gallery image record. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const result = await galleryController.deleteImage(params.id)
  return NextResponse.json(result.data, { status: result.status })
}
