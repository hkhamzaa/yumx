import { prisma } from '@/lib/prisma'

// Always render server-side (fetches live data from DB on each request)
export const dynamic = 'force-dynamic'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { PageLoader } from '@/components/loader/PageLoader'
import { HeroSection } from '@/components/hero/HeroSection'
import { FeaturedItems } from '@/components/sections/FeaturedItems'
import { ComboDeals } from '@/components/sections/ComboDeals'
import { BrandStory } from '@/components/sections/BrandStory'
import { GallerySection } from '@/components/sections/GallerySection'
import { Testimonials } from '@/components/sections/Testimonials'
import { LocationSection } from '@/components/sections/LocationSection'

async function getPageData() {
  const [categories, rawCombos, gallery, testimonials, schedule, siteContentRows] =
    await Promise.all([
      prisma.menuCategory.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
        include: {
          items: {
            where: { isAvailable: true, isFeatured: true },
            orderBy: { name: 'asc' },
            include: {
              variants: { orderBy: { price: 'asc' } },
            },
          },
        },
      }),
      prisma.comboDeal.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
      }),
      prisma.galleryImage.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
      }),
      prisma.testimonial.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
      }),
      prisma.restaurantSchedule.findMany({ orderBy: { dayOfWeek: 'asc' } }),
      prisma.siteContent.findMany(),
    ])

  // Serialize Decimal → string so it crosses the Server→Client component boundary safely
  const featuredItems = categories.flatMap(c =>
    c.items.map(item => ({
      ...item,
      category: { name: c.name },
      variants: item.variants.map(v => ({ ...v, price: v.price.toString() })),
    }))
  )

  const combos = rawCombos.map(d => ({ ...d, price: d.price.toString() }))

  const siteContent = Object.fromEntries(siteContentRows.map(r => [r.key, r.value]))

  return { featuredItems, combos, gallery, testimonials, schedule, siteContent }
}

export default async function HomePage() {
  const { featuredItems, combos, gallery, testimonials, schedule, siteContent } =
    await getPageData()

  return (
    <>
      <PageLoader />
      <Navbar />
      <main>
        <HeroSection />
        <FeaturedItems items={featuredItems} />
        <ComboDeals deals={combos} />
        <BrandStory />
        <GallerySection images={gallery} />
        <Testimonials testimonials={testimonials} />
        <LocationSection schedule={schedule} content={siteContent} />
      </main>
      <Footer content={siteContent} />
    </>
  )
}
