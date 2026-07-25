import path from 'path';

export default ({ env }: { env: any }) => {
  const client = env('DATABASE_CLIENT', 'sqlite');

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