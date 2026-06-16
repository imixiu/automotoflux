const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

const AUTHORS = [
  'Lisa Park', 'Robert Fernandez', 'Nina Volkov', 'David Kowalski',
  'Rachel Torres', 'James Henderson', 'Marcus Chen', 'Sarah Mitchell'
];

function seededRandom(seed) {
  let s = seed;
  return function() {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

async function main() {
  const result = await pool.query(
    `SELECT id FROM articles 
     WHERE site = 'automotoflux' AND author = 'Auto Editorial Team'
     ORDER BY id ASC`
  );
  
  const articles = result.rows;
  console.log(`Articles to assign: ${articles.length}`);

  const rand = seededRandom(42);
  const endDate = new Date('2026-06-15T00:00:00');
  
  // Build slots: each day, each author gets 3-5 articles
  const slots = [];
  let currentDate = new Date(endDate);
  let articleIdx = 0;
  
  while (articleIdx < articles.length) {
    const shuffledAuthors = [...AUTHORS].sort(() => rand() - 0.5);
    
    for (const author of shuffledAuthors) {
      if (articleIdx >= articles.length) break;
      const count = 3 + Math.floor(rand() * 3); // 3, 4, or 5
      for (let j = 0; j < count && articleIdx < articles.length; j++) {
        const hourR = seededRandom(articles[articleIdx].id);
        const hour = 8 + Math.floor(hourR() * 10); // 8-17
        const minute = Math.floor(hourR() * 60);
        
        const pubDate = new Date(currentDate);
        pubDate.setHours(hour, minute, 0, 0);
        
        slots.push({
          id: articles[articleIdx].id,
          author: author,
          published_time: pubDate,
        });
        articleIdx++;
      }
    }
    
    currentDate.setDate(currentDate.getDate() - 1);
  }

  console.log(`Slots generated: ${slots.length}`);
  console.log(`Date range: ${slots[slots.length-1].published_time.toISOString().slice(0,10)} ~ ${slots[0].published_time.toISOString().slice(0,10)}`);

  // Stats
  const dateCounts = {};
  const authorCounts = {};
  for (const s of slots) {
    const d = s.published_time.toISOString().slice(0, 10);
    dateCounts[d] = (dateCounts[d] || 0) + 1;
    authorCounts[s.author] = (authorCounts[s.author] || 0) + 1;
  }
  const dates = Object.keys(dateCounts).sort();
  console.log(`Days: ${dates.length} (${dates[0]} ~ ${dates[dates.length-1]})`);
  console.log(`Per day: min=${Math.min(...Object.values(dateCounts))} max=${Math.max(...Object.values(dateCounts))} avg=${(slots.length/dates.length).toFixed(1)}`);
  console.log(`\nAuthor distribution:`);
  for (const [a, c] of Object.entries(authorCounts).sort()) {
    console.log(`  ${a}: ${c} (${(c/dates.length).toFixed(1)}/day)`);
  }

  // Batch update using VALUES-based UPDATE
  const BATCH = 200;
  let updated = 0;
  const startTime = Date.now();

  for (let i = 0; i < slots.length; i += BATCH) {
    const batch = slots.slice(i, i + BATCH);
    
    const valueParts = [];
    const params = [];
    let p = 1;
    
    for (const s of batch) {
      valueParts.push(`($${p}::int, $${p+1}::text, $${p+2}::timestamp)`);
      params.push(s.id, s.author, s.published_time.toISOString());
      p += 3;
    }

    const sql = `
      UPDATE articles a SET 
        author = v.author,
        published_time = v.published_time,
        modified_time = v.published_time
      FROM (VALUES ${valueParts.join(', ')}) AS v(id, author, published_time)
      WHERE a.id = v.id
    `;

    try {
      const r = await pool.query(sql, params);
      updated += r.rowCount;
    } catch (e) {
      console.error(`Batch ${Math.floor(i/BATCH)+1} error: ${e.message.slice(0, 300)}`);
    }

    if ((Math.floor(i/BATCH) + 1) % 10 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`  Batch ${Math.floor(i/BATCH)+1}/${Math.ceil(slots.length/BATCH)} | updated: ${updated} | ${elapsed}s`);
    }
  }

  const total = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n=== DONE ===`);
  console.log(`Updated: ${updated}`);
  console.log(`Time: ${total}s`);

  // Verify
  const check = await pool.query(
    `SELECT author, COUNT(*) as cnt FROM articles WHERE site='automotoflux' AND author != 'Auto Editorial Team' GROUP BY author ORDER BY cnt DESC`
  );
  console.log(`\nFinal author distribution:`);
  check.rows.forEach(r => console.log(`  ${r.author}: ${r.cnt}`));

  const remain = await pool.query(
    `SELECT COUNT(*) as cnt FROM articles WHERE site='automotoflux' AND author = 'Auto Editorial Team'`
  );
  console.log(`  Auto Editorial Team remaining: ${remain.rows[0].cnt}`);

  await pool.end();
}

main().catch(e => { console.error(e); pool.end(); process.exit(1); });
