const production = process.env.NODE_ENV === 'production';
const corsOrigins = (process.env.CORS_ORIGINS || '').split(',').map((origin) => origin.trim()).filter(Boolean);
if (production && corsOrigins.length === 0) throw new Error('CORS_ORIGINS is required in production');
const r2Host = (() => {
  const endpoint = process.env.R2_ENDPOINT?.trim();
  const bucket = process.env.R2_BUCKET?.trim();
  if (!endpoint || !bucket) return null;
  try {
    return `${bucket}.${new URL(endpoint).hostname}`;
  } catch {
    return null;
  }
})();
const mediaHosts = ["'self'", 'data:', 'blob:', 'res.cloudinary.com', ...(r2Host ? [r2Host] : [])];

export default [
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          'img-src': mediaHosts,
          'media-src': mediaHosts,
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::cors',
    config: {
      origin: corsOrigins.length > 0 ? corsOrigins : ['http://localhost:3000'],
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
  'global::deepPopulate'
];
