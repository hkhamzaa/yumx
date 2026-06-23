import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { MyOrdersClient } from './MyOrdersClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'My Orders — YUM X',
}

export default async function MyOrdersPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/my-orders')
  }

  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { customerId: session.user.id },
        ...(session.user.email ? [{ guestEmail: session.user.email }] : []),
      ],
    },
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        select: { itemNameSnapshot: true, quantity: true, unitPrice: true, lineTotal: true },
      },
    },
  })

  // Serialise Decimals for the client
  const serialised = orders.map(o => ({
    ...o,
    subtotal: o.subtotal.toString(),
    deliveryFee: o.deliveryFee.toString(),
    total: o.total.toString(),
    readyAt: o.readyAt?.toISOString() ?? null,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
    items: o.items.map(i => ({
      ...i,
      unitPrice: i.unitPrice.toString(),
      lineTotal: i.lineTotal.toString(),
    })),
  }))

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-brand-bg pt-16 md:pt-20 pb-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto pt-10">
          <p className="font-body text-xs tracking-[0.3em] text-brand-accent uppercase font-semibold mb-2">
            Account
          </p>
          <h1 className="font-display font-black text-[clamp(2rem,6vw,3.5rem)] text-brand-text uppercase leading-[0.9] tracking-tight mb-10">
            My <span className="text-brand-accent">Orders</span>
          </h1>
          <MyOrdersClient orders={serialised} />
        </div>
      </main>
      <Footer content={{}} />
    </>
  )
}
