FROM node:20-bookworm-slim AS build

WORKDIR /opt/app

COPY package.json package-lock.json ./
# The postinstall lifecycle hook (`node ./scripts/updateUuid.js`) runs during
# `npm ci`, so the scripts directory must exist in the image first.
COPY scripts ./scripts
RUN npm ci

COPY . .
ENV NODE_ENV=production
RUN npm run build
RUN npm prune --omit=dev

FROM node:20-bookworm-slim AS runtime

WORKDIR /opt/app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=1337

COPY --from=build /opt/app ./

EXPOSE 1337

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:1337',r=>process.exit(r.statusCode < 500 ? 0 : 1)).on('error',()=>process.exit(1))"

CMD ["sh", "-c", "if [ \"$DATABASE_CLIENT\" != \"postgres\" ] || [ -z \"$DATABASE_URL\" ]; then echo 'DATABASE_CLIENT=postgres and DATABASE_URL are required' >&2; exit 1; fi; npm run start"]
