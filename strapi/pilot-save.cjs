const { createStrapi } = require('@strapi/strapi');
const fs = require('fs');
async function run() {
  process.env.NODE_ENV = 'development';
  try {
    const strapi = await createStrapi({ appDir: __dirname, distDir: './dist' }).load();
    const uid = 'api::health-guide.health-guide';
    const docId = 'tkqs5rsyjj4kbgksuwa4l9gu';
    const svc = strapi.plugin('ai-translator').service('translation');
    const tr = JSON.parse(fs.readFileSync('/tmp/opencode/pilot-translations.json','utf8'));
    const res = await svc.saveTranslation(uid, docId, 'sw-KE', tr);
    console.log('saved', res?.id, res?.documentId, res?.locale);
    await strapi.destroy();
  } catch (e) {
    console.error('err', e.message);
  }
}
run();
