import { Footer } from '@/components/footer';
import { Navbar } from '@/components/navbar';
import { OrganizationSchema } from '@/components/seo/json-ld';
import { fetchCached } from '@/lib/strapi/fetchCached';
import { isValidLocale } from '@/lib/i18n/locale';

export default async function MarketingLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const validLocale = isValidLocale(locale);
  const pageData = validLocale ? await fetchCached('global', { filters: { locale } }, true) : null;

  return (
    <>
      <OrganizationSchema />
      <Navbar data={pageData?.navbar} locale={locale} />
      {children}
      <Footer data={pageData?.footer} locale={locale} />
    </>
  );
}
