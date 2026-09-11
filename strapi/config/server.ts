export default ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  app: {
    keys: env.array('APP_KEYS') || (env('NODE_ENV', 'development') === 'production'
      ? (() => { throw new Error('APP_KEYS is required in production'); })()
      : ["tobemodified1", "tobemodified2"]),
  },
});
