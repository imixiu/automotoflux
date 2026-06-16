const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

const TYPE_MAP = {
  'engine_parts': 'engine-parts',
  'tools': 'maintenance-tools',
  'wheels_tires': 'wheels-tires',
  'electrical': 'electrical-systems',
  'exterior': 'exterior-accessories',
  'interior': 'interior-upgrades',
};

async function main() {
  const lines = fs.readFileSync('/tmp/auto_success.jsonl', 'utf8')
    .split('\n')
    .filter(l => l.trim());

  console.log(`Total lines: ${lines.length}`);

  // Parse all records first
  const records = [];
  const skipSet = new Set();
  for (const line of lines) {
    try {
      const obj = JSON.parse(line);
      const c = JSON.parse(obj.response.body.choices[0].message.content);
      const rawType = c.type || '';
      if (!rawType) { skipSet.add(obj.custom_id); continue; }
      const dbType = TYPE_MAP[rawType] || rawType;
      const slug = obj.custom_id.startsWith(rawType + '_')
        ? obj.custom_id.slice(rawType.length + 1)
        : obj.custom_id;
      records.push({
        type: dbType,
        slug: slug,
        title: c.title || '',
        description: c.description || '',
        body: c.htmlbody || '',
      });
    } catch (e) {
      // skip malformed
    }
  }
  console.log(`Parsed: ${records.length} records, skipped ${skipSet.size} (empty type)`);

  // Get existing short_titles to avoid duplicates
  const existing = await pool.query(
    `SELECT short_title FROM articles WHERE site = 'automotoflux' AND short_title != ''`
  );
  const existingSet = new Set(existing.rows.map(r => r.short_title));
  console.log(`Existing in DB: ${existingSet.size}`);

  const toInsert = records.filter(r => !existingSet.has(r.slug));
  console.log(`To insert (after dedup): ${toInsert.length}`);

  // Batch insert
  const BATCH = 100;
  let inserted = 0;
  let errors = 0;
  const startTime = Date.now();

  for (let i = 0; i < toInsert.length; i += BATCH) {
    const batch = toInsert.slice(i, i + BATCH);
    const values = [];
    const params = [];
    let paramIdx = 1;

    for (const r of batch) {
      values.push(`($${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, NOW(), NOW())`);
      params.push('automotoflux', r.type, r.slug, r.title, r.description, r.body, 'published', 'Y', 'en', 'Auto Editorial Team');
    }

    const sql = `INSERT INTO articles (site, type, short_title, title, description, body, status, is_online, language, author, published_time, modified_time) VALUES ${values.join(', ')}`;

    try {
      const result = await pool.query(sql, params);
      inserted += result.rowCount;
    } catch (e) {
      errors++;
      console.error(`Batch ${Math.floor(i/BATCH)+1} error: ${e.message.slice(0, 200)}`);
    }

    if ((Math.floor(i/BATCH) + 1) % 10 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`  Batch ${Math.floor(i/BATCH)+1}/${Math.ceil(toInsert.length/BATCH)} | inserted: ${inserted} | errors: ${errors} | ${elapsed}s`);
    }
  }

  const total = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n=== DONE ===`);
  console.log(`Inserted: ${inserted}`);
  console.log(`Errors: ${errors}`);
  console.log(`Time: ${total}s`);

  await pool.end();
}

main().catch(e => { console.error(e); pool.end(); process.exit(1); });
