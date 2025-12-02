const { Pool } = require('pg');
const https = require('https');
require('dotenv').config();

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL, 
  ssl: { rejectUnauthorized: false } 
});

const API_KEY = 'AIzaSyD5Qa22ECngFkZ4uZuc9i9q9v42BPko4Jo';

function extractVideoId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function checkVideo(videoId) {
  return new Promise((resolve) => {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=status&id=${videoId}&key=${API_KEY}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.items && json.items.length > 0);
        } catch(e) {
          resolve(false);
        }
      });
    }).on('error', () => resolve(false));
  });
}

async function verifyAllLinks() {
  console.log('🔍 Fetching all YouTube links from database...\n');
  
  const result = await pool.query(`
    SELECT m.id, m.title, m.links, g.grade_number, t.name as topic
    FROM media m
    JOIN topics t ON t.id = m.topic_id
    JOIN categories c ON c.id = t.category_id
    JOIN grades g ON g.id = c.grade_id
    WHERE m.links::text LIKE '%youtube%'
    ORDER BY g.grade_number::int, t.name
  `);
  
  console.log('Found', result.rows.length, 'items with YouTube links\n');
  
  let valid = 0, invalid = 0, noId = 0;
  const broken = [];
  
  for (let i = 0; i < result.rows.length; i++) {
    const row = result.rows[i];
    const links = typeof row.links === 'string' ? JSON.parse(row.links) : row.links;
    const ytUrl = links.youtube;
    
    if (!ytUrl) continue;
    
    const videoId = extractVideoId(ytUrl);
    
    if (!videoId) {
      noId++;
      broken.push({ ...row, reason: 'Invalid URL format', url: ytUrl });
      process.stdout.write('?');
      continue;
    }
    
    const exists = await checkVideo(videoId);
    
    if (exists) {
      valid++;
      process.stdout.write('.');
    } else {
      invalid++;
      broken.push({ ...row, reason: 'Video not found', url: ytUrl, videoId });
      process.stdout.write('X');
    }
    
    // Rate limit - YouTube API allows 10,000 units/day, each check is 1 unit
    if (i % 10 === 0) await new Promise(r => setTimeout(r, 100));
  }
  
  console.log('\n\n📊 RESULTS:');
  console.log('  ✅ Valid:', valid);
  console.log('  ❌ Broken:', invalid);
  console.log('  ❓ Bad format:', noId);
  
  if (broken.length > 0) {
    console.log('\n🚨 BROKEN LINKS:\n');
    broken.forEach(b => {
      console.log('Grade', b.grade_number, '-', b.topic);
      console.log('  ID:', b.id);
      console.log('  Title:', b.title);
      console.log('  URL:', b.url);
      console.log('  Reason:', b.reason);
      console.log();
    });
    
    // Save broken links to file
    const fs = require('fs');
    fs.writeFileSync('broken-youtube-links.json', JSON.stringify(broken, null, 2));
    console.log('💾 Saved broken links to broken-youtube-links.json');
  }
  
  await pool.end();
}

verifyAllLinks().catch(err => {
  console.error('Error:', err);
  pool.end();
});

