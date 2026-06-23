import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { verifyAdminSession } from '@/app/api/_lib/admin-auth'
import { siteContentController } from '@/app/api/_lib/controllers/siteContentController'

/** PUT /api/admin/site-content/[id] — Admin. Update content value by record id. Body: { value }. */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => null)
  const result = await siteContentController.update(params.id, body)
  return NextResponse.json(result.data, { status: result.status })
}

/** DELETE /api/admin/site-content/[id] — Admin. Remove content entry. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const result = await siteContentController.delete(params.id)
  return NextResponse.json(result.data, { status: result.status })
}
