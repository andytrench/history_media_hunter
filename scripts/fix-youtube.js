const { Pool } = require('pg');
const https = require('https');
require('dotenv').config();

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL, 
  ssl: { rejectUnauthorized: false } 
});

const API_KEY = 'AIzaSyD5Qa22ECngFkZ4uZuc9i9q9v42BPko4Jo';

function searchYouTube(query) {
  return new Promise((resolve) => {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=1&key=${API_KEY}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.items && json.items.length > 0) {
            resolve({
              videoId: json.items[0].id.videoId,
              title: json.items[0].snippet.title
            });
          } else {
            resolve(null);
          }
        } catch(e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

async function fixBrokenLinks() {
  const fs = require('fs');
  const broken = JSON.parse(fs.readFileSync('broken-youtube-links.json', 'utf8'));
  
  console.log(`🔧 Attempting to fix ${broken.length} broken YouTube links...\n`);
  
  let fixed = 0, removed = 0, skipped = 0;
  
  for (const item of broken) {
    // Skip playlist URLs - these need manual handling
    if (item.reason === 'Invalid URL format') {
      console.log(`⏭️  Skipping playlist: ${item.title}`);
      skipped++;
      continue;
    }
    
    // Search for replacement video based on title
    const searchQuery = item.title.replace(/^(TED-Ed|Crash Course|Kurzgesagt|Simple History|Oversimplified|Extra History|Hip Hughes|Kings and Generals|Epic History TV|History Matters):\s*/i, '');
    
    console.log(`🔍 Searching for: "${searchQuery}"`);
    
    const result = await searchYouTube(searchQuery);
    
    if (result) {
      const newUrl = `https://www.youtube.com/watch?v=${result.videoId}`;
      
      // Update the database
      const links = typeof item.links === 'string' ? JSON.parse(item.links) : item.links;
      links.youtube = newUrl;
      
      await pool.query(
        'UPDATE media SET links = $1 WHERE id = $2',
        [JSON.stringify(links), item.id]
      );
      
      console.log(`  ✅ Fixed: ${newUrl}`);
      console.log(`     Found: "${result.title}"\n`);
      fixed++;
    } else {
      // Remove YouTube link but keep other links
      const links = typeof item.links === 'string' ? JSON.parse(item.links) : item.links;
      delete links.youtube;
      
      // Add JustWatch search as fallback
      const searchTitle = item.title.replace(/^(TED-Ed|Crash Course|Kurzgesagt|Simple History|Oversimplified|Extra History):\s*/i, '');
      links.justwatch = `https://www.justwatch.com/us/search?q=${encodeURIComponent(searchTitle)}`;
      
      await pool.query(
        'UPDATE media SET links = $1 WHERE id = $2',
        [JSON.stringify(links), item.id]
      );
      
      console.log(`  ❌ No replacement found, removed YouTube link\n`);
      removed++;
    }
    
    // Rate limit
    await new Promise(r => setTimeout(r, 200));
  }
  
  console.log('\n📊 SUMMARY:');
  console.log(`  ✅ Fixed: ${fixed}`);
  console.log(`  ❌ Removed: ${removed}`);
  console.log(`  ⏭️  Skipped (playlists): ${skipped}`);
  
  await pool.end();
}

fixBrokenLinks().catch(err => {
  console.error('Error:', err);
  pool.end();
});

