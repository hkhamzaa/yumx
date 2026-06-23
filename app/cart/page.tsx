import { auth } from '@/auth'
import { CartPageClient } from './CartPageClient'

export default async function CartPage() {
  const session = await auth()
  return (
    <CartPageClient
      sessionUser={
        session?.user
          ? {
              id: session.user.id,
              name: session.user.name ?? '',
              email: session.user.email ?? '',
              phone: session.user.phone ?? '',
            }
          : null
      }
    />
  )
}
