import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { verifyAdminSession } from '@/app/api/_lib/admin-auth'
import { testimonialController } from '@/app/api/_lib/controllers/testimonialController'

/** PUT /api/admin/testimonials/[id] — Admin. Update testimonial fields. */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => null)
  const result = await testimonialController.update(params.id, body)
  return NextResponse.json(result.data, { status: result.status })
}

/** DELETE /api/admin/testimonials/[id] — Admin. Permanently delete testimonial. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const result = await testimonialController.delete(params.id)
  return NextResponse.json(result.data, { status: result.status })
}
