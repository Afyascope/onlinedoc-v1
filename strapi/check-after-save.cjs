const Database = require('better-sqlite3');
const db = new Database('.tmp/data.db', { readonly: true });
const en = db.prepare(`SELECT document_id, locale, title FROM health_guides WHERE document_id='tkqs5rsyjj4kbgksuwa4l9gu' AND locale='en' LIMIT 1`).get();
const sw = db.prepare(`SELECT document_id, locale, title, instructions, published_at, created_at, updated_at FROM health_guides WHERE document_id='tkqs5rsyjj4kbgksuwa4l9gu' AND locale='sw-KE' LIMIT 1`).get();
db.close();
console.log('en', en);
console.log('sw', sw ? {docId:sw.document_id, locale:sw.locale, title:sw.title, pub:sw.published_at, insLen:sw.instructions.length} : 'none');
