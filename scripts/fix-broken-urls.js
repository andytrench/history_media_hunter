/**
 * Fix Broken URLs Script
 * Removes or updates broken links identified by validate-urls.js
 * 
 * Run: node scripts/fix-broken-urls.js
 */

const fs = require('fs');
const path = require('path');

const gradesDir = path.join(__dirname, '..', 'grades');

// Known fixes for specific broken links
const urlFixes = {
    // IMDb URL corrections
    'https://www.imdb.com/title/tt0884140/': 'https://www.imdb.com/title/tt0959050/', // Engineering an Empire: Aztecs correct IMDb
    
    // Disney+ URLs change frequently - remove specific paths, keep just search intent
    // These will be converted to JustWatch searches instead
};

// URLs to remove entirely (streaming URLs that change too often)
const urlsToRemove = [
    'https://www.netflix.com/title/60000432',
    'https://www.amazon.com/gp/video/detail/B001EBV0JK',
    'https://www.disneyplus.com/movies/the-emperors-new-groove/3qZBVdraVfIw',
    'https://www.disneyplus.com/movies/pocahontas/1CPmvJoKl0es',
    'https://www.pbs.org/video/harriet-tubman-they-called-her-moses-qipbxn/'
];

function processGradeFile(gradeFile) {
    const filePath = path.join(gradesDir, gradeFile);
    
    console.log(`\n📁 Processing ${gradeFile}...`);
    
    let data;
    try {
        data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
        console.log(`  ⚠️ Skipping ${gradeFile} - could not parse`);
        return { fixed: 0, removed: 0 };
    }

    let fixedCount = 0;
    let removedCount = 0;
    
    if (data.categories) {
        for (const category of data.categories) {
            if (category.topics) {
                for (const topic of category.topics) {
                    if (topic.media) {
                        for (const media of topic.media) {
                            if (!media.links) continue;
                            
                            // Fix IMDb URLs
                            if (media.links.imdb && urlFixes[media.links.imdb]) {
                                console.log(`  ✅ Fixed IMDb URL for "${media.title}"`);
                                media.links.imdb = urlFixes[media.links.imdb];
                                fixedCount++;
                            }
                            
                            // Remove broken streaming URLs
                            if (media.links.streaming && Array.isArray(media.links.streaming)) {
                                const originalLength = media.links.streaming.length;
                                media.links.streaming = media.links.streaming.filter(s => {
                                    if (urlsToRemove.includes(s.url)) {
                                        console.log(`  🗑️ Removed broken ${s.service} URL for "${media.title}"`);
                                        return false;
                                    }
                                    return true;
                                });
                                removedCount += originalLength - media.links.streaming.length;
                            }
                            
                            // Add JustWatch search link if no streaming links remain
                            if ((!media.links.streaming || media.links.streaming.length === 0) && 
                                !media.links.justwatch) {
                                const searchQuery = encodeURIComponent(`${media.title} ${media.year || ''}`);
                                media.links.justwatch = `https://www.justwatch.com/us/search?q=${searchQuery}`;
                            }
                        }
                    }
                }
            }
        }
    }
    
    // Write updated file
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`  ✅ Fixed: ${fixedCount}, Removed: ${removedCount}`);
    
    return { fixed: fixedCount, removed: removedCount };
}

// Main
console.log('🔧 Fixing Broken URLs\n');

const gradeFiles = fs.readdirSync(gradesDir)
    .filter(f => f.endsWith('.json') && f.startsWith('grade-'));

let totalFixed = 0;
let totalRemoved = 0;

for (const file of gradeFiles) {
    const { fixed, removed } = processGradeFile(file);
    totalFixed += fixed;
    totalRemoved += removed;
}

console.log('\n' + '='.repeat(50));
console.log('📊 SUMMARY');
console.log('='.repeat(50));
console.log(`Total URLs fixed: ${totalFixed}`);
console.log(`Total URLs removed: ${totalRemoved}`);
console.log('\n✅ Done! Run "npm run seed" to update the database.');

