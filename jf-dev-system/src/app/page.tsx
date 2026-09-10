import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { Hero } from '@/components/sections/hero';
import { Solution } from '@/components/sections/solution';
import { Problems } from '@/components/sections/problems';
import { ProductDemo } from '@/components/sections/product-demo';
import { Features } from '@/components/sections/features';
import { BookingPreview } from '@/components/sections/booking-preview';
import { AdminPreview } from '@/components/sections/admin-preview';
import { Responsiveness, Security } from '@/components/sections/responsiveness-security';
import { Benefits } from '@/components/sections/benefits';
import { FinalCta } from '@/components/sections/final-cta';
import { Contact } from '@/components/sections/contact';

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <Solution />
        <Problems />
        <ProductDemo />
        <Features />
        <BookingPreview />
        <AdminPreview />
        <Responsiveness />
        <Security />
        <Benefits />
        <FinalCta />
        <Contact />
      </main>
      <SiteFooter />
    </>
  );
}
