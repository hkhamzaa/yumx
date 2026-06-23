import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { verifyAdminSession } from '@/app/api/_lib/admin-auth'
import { orderController } from '@/app/api/_lib/controllers/orderController'

/** GET /api/admin/orders/[id] — Admin. Full order detail with items and customer info. */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const result = await orderController.adminGetOrder(params.id)
  return NextResponse.json(result.data, { status: result.status })
}
