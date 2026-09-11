import { Footer } from '@/components/footer';
import { Navbar } from '@/components/navbar';
import { OrganizationSchema } from '@/components/seo/json-ld';
import { fetchCached } from '@/lib/strapi/fetchCached';

const VALID_LOCALES = ["en", "fr", "es", "de", "sw", "ha", "yo", "ig"];

export default async function MarketingLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const isValidLocale = VALID_LOCALES.includes(locale);
  const pageData = isValidLocale ? await fetchCached('global', { filters: { locale } }, true) : null;

  return (
    <>
      <OrganizationSchema />
      <Navbar data={pageData?.navbar} locale={locale} />
      {children}
      <Footer data={pageData?.footer} locale={locale} />
    </>
  );
}
