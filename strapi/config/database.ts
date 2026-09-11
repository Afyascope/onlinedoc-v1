import path from 'path';

export default ({ env }: { env: any }) => {
  const isProduction = env('NODE_ENV', 'development') === 'production';
  const configuredClient = env('DATABASE_CLIENT', isProduction ? 'postgres' : 'sqlite');
  if (isProduction && configuredClient !== 'postgres') {
    throw new Error('Production Strapi requires DATABASE_CLIENT=postgres');
  }
  if (isProduction && !env('DATABASE_URL')) {
    throw new Error('DATABASE_URL is required for production Strapi');
  }
  const client = configuredClient;

  const connections = {
    postgres: {
      connection: {
        // This pulls the entire connection string from Railway
        connectionString: env('DATABASE_URL'),
        ssl: env.bool('DATABASE_SSL', false) && {
          rejectUnauthorized: false, // Allows connection to Railway's managed DB
        },
      },
      pool: { min: env.int('DATABASE_POOL_MIN', 2), max: env.int('DATABASE_POOL_MAX', 10) },
    },
    sqlite: {
      connection: {
        filename: path.join(__dirname, '..', '..', env('DATABASE_FILENAME', '.tmp/data.db')),
      },
      useNullAsDefault: true,
    },
  };

  return {
    connection: {
      client,
      ...connections[client as keyof typeof connections],
      acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 60000),
    },
  };
};
