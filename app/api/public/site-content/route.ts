import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { siteContentController } from '@/app/api/_lib/controllers/siteContentController'

/** GET /api/public/site-content — Public. All SiteContent as key→value map. */
export async function GET(_req: NextRequest) {
  const result = await siteContentController.getAllPublicContent()
  return NextResponse.json(result.data, { status: result.status })
}
