const https = require('https');
const { neon } = require('@neondatabase/serverless');
const { put } = require('@vercel/blob');

const SITE = 'automotoflux';
const API_KEY = process.env.DASHSCOPE_API_KEY || 'sk-b11580cc1fec4c2a814a8a97e3dfd7d1';
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN || 'vercel_blob_rw_9bWbXubcYU3vBaiQ_kQ1HfhFlMppx53jz72yf2tDUdAtcqU';
const DB_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_HKw8qxGg5cfj@ep-fancy-leaf-a4zukau9-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require';
const BATCH = parseInt(process.env.BATCH || '30');
const CONCURRENCY = 5;

const categoryPrompts = {
  'engine-parts': 'engine components, automotive parts, pistons, valves, timing belt, professional product photography, dark studio',
  'exterior-accessories': 'car exterior accessories, body kit, LED lights, front grille, automotive product photography',
  'interior-upgrades': 'luxury car interior, leather seats, dashboard, ambient lighting, automotive photography',
  'wheels-tires': 'alloy wheels, performance tires, automotive product photography, dramatic studio lighting',
  'electrical-systems': 'car electrical components, battery, alternator, wiring, automotive product photography',
  'maintenance-tools': 'automotive mechanic tools, torque wrench, socket set, organized garage, product photography',
};

function apiCall(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'qwen-image-plus',
      input: { messages: [{ role: 'user', content: [{ text: prompt }] }] },
      parameters: { size: '1024*576' }
    });
    const req = https.request({
      hostname: 'dashscope.aliyuncs.com',
      path: '/api/v1/services/aigc/multimodal-generation/generation',
      method: 'POST',
      headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        try {
          const data = JSON.parse(Buffer.concat(chunks).toString());
          const url = data.output?.choices?.[0]?.message?.content?.[0]?.image;
          url ? resolve(url) : reject(new Error('No image in response'));
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.setTimeout(120000, () => { req.destroy(); reject(new Error('timeout')); });
    req.write(body);
    req.end();
  });
}

function downloadAndUpload(url, blobPath) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', async () => {
        try {
          const result = await put(blobPath, Buffer.concat(chunks), { access: 'public', token: BLOB_TOKEN });
          resolve(result.url);
        } catch (e) { reject(e); }
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function processArticle(sql, article) {
  const basePrompt = categoryPrompts[article.type] || 'automotive parts and accessories, professional product photography';
  const titleWords = article.title.split(' ').slice(0, 6).join(' ');
  const prompt = `${titleWords}, ${basePrompt}, ultra-realistic, high quality`;

  try {
    const imgUrl = await apiCall(prompt);
    const blobUrl = await downloadAndUpload(imgUrl, `covers/${SITE}/${article.short_title}.png`);
    await sql('UPDATE articles SET img = $1 WHERE site = $2 AND id = $3', [blobUrl, SITE, article.id]);
    return { success: true, id: article.id };
  } catch (e) {
    return { success: false, id: article.id, error: e.message };
  }
}

async function main() {
  const sql = neon(DB_URL);
  const articles = await sql(
    `SELECT id, title, short_title, type FROM articles WHERE site = $1 AND (img IS NULL OR img = '') AND is_online = 'Y' ORDER BY published_time DESC LIMIT $2`,
    [SITE, BATCH]
  );

  if (articles.length === 0) {
    console.log('All articles have images. Nothing to do.');
    return;
  }

  console.log(`Processing ${articles.length} articles...`);
  let success = 0, fail = 0;

  for (let i = 0; i < articles.length; i += CONCURRENCY) {
    const batch = articles.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(a => processArticle(sql, a)));
    for (const r of results) {
      if (r.success) { success++; } else { fail++; console.error(`  FAIL #${r.id}: ${r.error}`); }
    }
    console.log(`  Progress: ${success + fail}/${articles.length} (${success} ok, ${fail} fail)`);
  }

  const remaining = await sql(
    `SELECT COUNT(*) as c FROM articles WHERE site = $1 AND (img IS NULL OR img = '') AND is_online = 'Y'`,
    [SITE]
  );
  console.log(`\nDone! ${success} generated, ${fail} failed, ${remaining[0].c} remaining.`);
}

main().catch(e => { console.error(e); process.exit(1); });
