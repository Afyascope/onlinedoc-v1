import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { toPublicLocale } from '@/lib/i18n/locale'

export const GET = async (request: Request) => {

  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  const slug = searchParams.get('slug')
  const locale = searchParams.get('locale')
  const uid = searchParams.get('uid')
  const status = searchParams.get('status');

  if (!process.env.PREVIEW_SECRET || !secret || secret !== process.env.PREVIEW_SECRET) {
    return new Response('Invalid token', { status: 401 })
  }

  const publicLocale = locale ? toPublicLocale(locale) : null;
  if (!publicLocale) {
    return new Response('Invalid locale', { status: 400 })
  }

  const contentType = uid?.split(".").pop();

  // Health Library structured content types → /health/[section] routes
  // (routes come from healthSections[*].route in lib/health/content.ts)
  const healthSectionRoutes: Record<string, string> = {
    'api::condition.condition': 'conditions',
    'api::treatment.treatment': 'medicines',
    'api::medical-test.medical-test': 'tests',
    'api::health-guide.health-guide': 'guides',
    'api::nutrition-guide.nutrition-guide': 'nutrition',
  };

  // Specific for the application
  let slugToReturn = `/${publicLocale}/${contentType}`;

  if (contentType === 'page' || contentType === 'global') {
    if (slug && slug !== 'homepage') {
      slugToReturn = `/${publicLocale}/${slug}`;
    } else {
      slugToReturn = `/${publicLocale}`;
    }
  } else if (contentType === 'article' || contentType?.includes('blog')) {
    slugToReturn = `/${publicLocale}/blog${slug ? `/${slug}` : ''}`;
  } else if (contentType?.includes('product')) {
    slugToReturn = `/${publicLocale}/products${slug ? `/${slug}` : ''}`;
  } else if (uid && healthSectionRoutes[uid]) {
    const sectionRoute = healthSectionRoutes[uid];
    slugToReturn = `/${publicLocale}/health/${sectionRoute}${slug ? `/${slug}` : ''}`;
  }

  const draft = await draftMode()
  if (status === 'draft') {
    draft.enable()
  } else {
    draft.disable()
  }
  redirect(slugToReturn)
};
