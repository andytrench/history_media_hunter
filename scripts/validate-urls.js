/**
 * URL Validation Script
 * Checks all media URLs for dead links
 * 
 * Run: node scripts/validate-urls.js
 * 
 * Options:
 *   --fix     Remove dead links from JSON files
 *   --report  Generate detailed report (default)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const gradesDir = path.join(__dirname, '..', 'grades');
const TIMEOUT = 10000; // 10 seconds
const DELAY_BETWEEN_REQUESTS = 500; // 500ms between requests to avoid rate limiting

// Results tracking
const results = {
    total: 0,
    valid: 0,
    invalid: [],
    errors: [],
    skipped: []
};

// Check if URL is valid
function checkUrl(url) {
    return new Promise((resolve) => {
        if (!url || typeof url !== 'string') {
            resolve({ valid: false, error: 'Invalid URL format' });
            return;
        }

        // Skip certain URLs that we can't easily validate
        if (url.includes('justwatch.com') || url === '' || url.startsWith('search')) {
            resolve({ valid: true, skipped: true });
            return;
        }

        const protocol = url.startsWith('https') ? https : http;
        
        const options = {
            method: 'HEAD',
            timeout: TIMEOUT,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
        };

        try {
            const req = protocol.request(url, options, (res) => {
                // 2xx and 3xx are valid
                if (res.statusCode >= 200 && res.statusCode < 400) {
                    resolve({ valid: true, status: res.statusCode });
                } else if (res.statusCode === 404) {
                    resolve({ valid: false, status: res.statusCode, error: 'Not Found (404)' });
                } else {
                    resolve({ valid: false, status: res.statusCode, error: `HTTP ${res.statusCode}` });
                }
            });

            req.on('error', (err) => {
                resolve({ valid: false, error: err.message });
            });

            req.on('timeout', () => {
                req.destroy();
                resolve({ valid: false, error: 'Timeout' });
            });

            req.end();
        } catch (err) {
            resolve({ valid: false, error: err.message });
        }
    });
}

// Extract all URLs from a media object
function extractUrls(media) {
    const urls = [];
    
    if (media.links) {
        if (media.links.imdb) {
            urls.push({ type: 'imdb', url: media.links.imdb });
        }
        if (media.links.youtube) {
            urls.push({ type: 'youtube', url: media.links.youtube });
        }
        if (media.links.streaming && Array.isArray(media.links.streaming)) {
            media.links.streaming.forEach(s => {
                if (s.url) {
                    urls.push({ type: s.service || 'streaming', url: s.url });
                }
            });
        }
    }
    
    return urls;
}

// Sleep helper
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Process a single grade file
async function processGradeFile(gradeFile) {
    const filePath = path.join(gradesDir, gradeFile);
    
    console.log(`\n📁 Processing ${gradeFile}...`);
    
    let data;
    try {
        data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
        console.log(`  ⚠️ Skipping ${gradeFile} - could not parse`);
        return;
    }

    const gradeUrls = [];
    
    // Collect all URLs from this grade
    if (data.categories) {
        for (const category of data.categories) {
            if (category.topics) {
                for (const topic of category.topics) {
                    if (topic.media) {
                        for (const media of topic.media) {
                            const urls = extractUrls(media);
                            urls.forEach(u => {
                                gradeUrls.push({
                                    ...u,
                                    grade: gradeFile,
                                    category: category.name,
                                    topic: topic.name,
                                    title: media.title
                                });
                            });
                        }
                    }
                }
            }
        }
    }

    console.log(`  Found ${gradeUrls.length} URLs to check`);
    
    let checked = 0;
    for (const urlInfo of gradeUrls) {
        results.total++;
        checked++;
        
        // Progress indicator
        if (checked % 10 === 0) {
            process.stdout.write(`  Checking: ${checked}/${gradeUrls.length}\r`);
        }
        
        const result = await checkUrl(urlInfo.url);
        
        if (result.skipped) {
            results.skipped.push(urlInfo);
        } else if (result.valid) {
            results.valid++;
        } else {
            results.invalid.push({
                ...urlInfo,
                error: result.error,
                status: result.status
            });
        }
        
        // Rate limiting
        await sleep(DELAY_BETWEEN_REQUESTS);
    }
    
    console.log(`  ✅ Done checking ${gradeUrls.length} URLs`);
}

// Generate report
function generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 URL VALIDATION REPORT');
    console.log('='.repeat(60));
    
    console.log(`\nTotal URLs checked: ${results.total}`);
    console.log(`Valid: ${results.valid}`);
    console.log(`Invalid/Broken: ${results.invalid.length}`);
    console.log(`Skipped: ${results.skipped.length}`);
    
    if (results.invalid.length > 0) {
        console.log('\n' + '-'.repeat(60));
        console.log('❌ BROKEN LINKS:');
        console.log('-'.repeat(60));
        
        // Group by grade
        const byGrade = {};
        results.invalid.forEach(item => {
            if (!byGrade[item.grade]) byGrade[item.grade] = [];
            byGrade[item.grade].push(item);
        });
        
        for (const [grade, items] of Object.entries(byGrade)) {
            console.log(`\n📁 ${grade}:`);
            items.forEach(item => {
                console.log(`  "${item.title}"`);
                console.log(`    Type: ${item.type}`);
                console.log(`    URL: ${item.url}`);
                console.log(`    Error: ${item.error}`);
                console.log(`    Location: ${item.category} > ${item.topic}`);
                console.log('');
            });
        }
    }
    
    // Save report to file
    const reportPath = path.join(__dirname, '..', 'url-validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
        generated: new Date().toISOString(),
        summary: {
            total: results.total,
            valid: results.valid,
            invalid: results.invalid.length,
            skipped: results.skipped.length
        },
        brokenLinks: results.invalid
    }, null, 2));
    
    console.log(`\n📄 Detailed report saved to: url-validation-report.json`);
}

// Main function
async function main() {
    console.log('🔍 URL Validation Script');
    console.log('Checking all media URLs for dead links...\n');
    console.log('⚠️  This may take several minutes due to rate limiting.\n');
    
    const gradeFiles = fs.readdirSync(gradesDir)
        .filter(f => f.endsWith('.json') && f.startsWith('grade-'));
    
    for (const file of gradeFiles) {
        await processGradeFile(file);
    }
    
    generateReport();
    
    if (results.invalid.length > 0) {
        console.log('\n💡 To fix broken links, you can:');
        console.log('   1. Run: node scripts/fix-broken-urls.js');
        console.log('   2. Manually update the JSON files');
        console.log('   3. Search for replacement videos on YouTube');
    }
}

main().catch(console.error);

