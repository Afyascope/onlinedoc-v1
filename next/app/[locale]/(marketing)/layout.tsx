import { Footer } from '@/components/footer';
import { Navbar } from '@/components/navbar';
import { OrganizationSchema } from '@/components/seo/json-ld';
import { fetchCached } from '@/lib/strapi/fetchCached';

export default async function MarketingLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const pageData = await fetchCached('global', { filters: { locale } }, true);

  return (
    <>
      <OrganizationSchema />
      <Navbar data={pageData?.navbar} locale={locale} />
      {children}
      <Footer data={pageData?.footer} locale={locale} />
    </>
  );
}
