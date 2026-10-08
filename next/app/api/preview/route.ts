import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

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
  let slugToReturn = `/${locale}/${contentType}`;

  if (contentType === 'page' || contentType === 'global') {
    if (slug && slug !== 'homepage') {
      slugToReturn = `/${locale}/${slug}`;
    } else {
      slugToReturn = `/${locale}`;
    }
  } else if (contentType === 'article' || contentType?.includes('blog')) {
    slugToReturn = `/${locale}/blog${slug ? `/${slug}` : ''}`;
  } else if (contentType?.includes('product')) {
    slugToReturn = `/en/products${slug ? `/${slug}` : ''}`;
  } else if (uid && healthSectionRoutes[uid]) {
    const sectionRoute = healthSectionRoutes[uid];
    slugToReturn = `/${locale}/health/${sectionRoute}${slug ? `/${slug}` : ''}`;
  }

  const draft = await draftMode()
  if (status === 'draft') {
    draft.enable()
  } else {
    draft.disable()
  }
  redirect(slugToReturn)
};
