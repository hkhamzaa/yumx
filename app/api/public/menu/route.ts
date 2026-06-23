import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { menuController } from '@/app/api/_lib/controllers/menuController'

/** GET /api/public/menu — Public. Full menu + active combo deals. */
export async function GET(_req: NextRequest) {
  const result = await menuController.getFullMenu()
  return NextResponse.json(result.data, { status: result.status })
}
