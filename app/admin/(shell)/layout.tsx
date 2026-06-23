import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { jwtVerify } from 'jose'
import { prisma } from '@/lib/prisma'
import { AdminShell } from '@/components/admin/AdminShell'

export default async function AdminShellLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value

  if (!token) redirect('/admin/login')

  let adminId: string
  try {
    const secret = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET ?? '')
    const { payload } = await jwtVerify(token, secret)
    adminId = payload.id as string
  } catch {
    redirect('/admin/login')
  }

  const admin = await prisma.adminUser.findUnique({
    where: { id: adminId },
    select: { email: true },
  })

  if (!admin) redirect('/admin/login')

  return (
    <AdminShell adminEmail={admin.email}>
      {children}
    </AdminShell>
  )
}
