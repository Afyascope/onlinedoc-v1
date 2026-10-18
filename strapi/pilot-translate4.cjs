const { createStrapi } = require('@strapi/strapi');
const fs = require('fs');
async function run() {
  process.env.NODE_ENV = 'development';
  try {
    const strapi = await createStrapi({ appDir: __dirname, distDir: './dist' }).load();
    const uid = 'api::health-guide.health-guide';
    const docId = 'tkqs5rsyjj4kbgksuwa4l9gu';
    const svc = strapi.plugin('ai-translator').service('translation');
    const res = await svc.translateEntry(uid, docId, 'sw-KE', { fields: ['instructions'], incremental: false });
    console.log(res.status, res.charsUsed, res.remainingBalance, res.reason||'');
    if (res.translations) {
      fs.writeFileSync('/tmp/opencode/pilot-translations.json', JSON.stringify(res.translations,null,2));
    }
    await strapi.destroy();
  } catch (e) {
    console.error('err', e.message);
  }
}
run();
