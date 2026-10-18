const { createStrapi } = require('@strapi/strapi');
const fs = require('fs');
async function run() {
  const strapi = createStrapi({ appDir: __dirname, distDir: './dist' });
  try {
    await strapi.load();
    const uid = 'api::health-guide.health-guide';
    const docId = 'tkqs5rsyjj4kbgksuwa4l9gu';
    const ts = strapi.plugin('ai-translator').service('translation');
    console.log('calling translateEntry');
    const res = await ts.translateEntry(uid, docId, 'sw-KE', { fields: ['instructions'], incremental: false });
    console.log('status=', res.status, 'chars=', res.charsUsed, 'bal=', res.remainingBalance, res.reason||'');
    if (res.translations) {
      fs.writeFileSync('/tmp/opencode/pilot-translations.json', JSON.stringify(res.translations, null, 2));
      console.log('wrote /tmp/opencode/pilot-translations.json');
    }
  } catch (e) {
    console.error('ERR');
    console.error(e);
  } finally {
    await strapi.destroy();
  }
}
run();
