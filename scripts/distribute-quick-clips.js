/**
 * Distribute Quick Clips into their appropriate curriculum categories
 * Run with: node scripts/distribute-quick-clips.js
 */

const fs = require('fs');
const path = require('path');

const gradesDir = path.join(__dirname, '..', 'grades');

// Mapping of quick clip topics to target categories/topics
const clipMappings = {
  // Grade 5 mappings
  'grade-5': {
    'indigenous-americas-clips': {
      targetCategory: 'indigenous-peoples',
      targetTopic: 'maya-aztec-inca'
    },
    'geography-clips': {
      targetCategory: 'geography-environment',
      targetTopic: 'physical-geography'
    },
    'colonial-clips': {
      targetCategory: 'european-contact',
      targetTopic: 'spanish-exploration'
    },
    'revolution-clips': {
      targetCategory: 'revolution-independence',
      targetTopic: 'american-revolution-5'
    }
  },
  
  // Grade 7 mappings
  'grade-7': {
    'colonial-ny-clips': {
      targetCategory: 'colonial-ny',
      targetTopic: 'colonial-ny-society'
    },
    'revolution-clips': {
      targetCategory: 'american-revolution',
      targetTopic: 'causes-revolution'
    },
    'civil-war-clips': {
      targetCategory: 'civil-war-reconstruction',
      targetTopic: 'causes-civil-war'
    },
    'immigration-clips': {
      targetCategory: 'immigration-urbanization',
      targetTopic: 'waves-immigration'
    }
  },
  
  // Grade 9 mappings
  'grade-9': {
    'ancient-civ-shorts': {
      targetCategory: 'ancient-civilizations',
      targetTopic: 'paleolithic-first-civilizations'
    },
    'medieval-shorts': {
      targetCategory: 'medieval-world',
      targetTopic: 'byzantine-empire'
    },
    'renaissance-exploration-shorts': {
      targetCategory: 'renaissance-reformation',
      targetTopic: 'renaissance'
    },
    'empires-shorts': {
      targetCategory: 'empires-conflict',
      targetTopic: 'ottoman-empire'
    }
  },
  
  // Grade 10 mappings
  'grade-10': {
    'enlightenment-clips': {
      targetCategory: 'enlightenment-revolution',
      targetTopic: 'enlightenment-ideas'
    },
    'revolution-clips': {
      targetCategory: 'political-revolutions',
      targetTopic: 'french-revolution'
    },
    'imperialism-clips': {
      targetCategory: 'imperialism',
      targetTopic: 'new-imperialism'
    },
    'world-wars-clips': {
      targetCategory: 'world-wars',
      targetTopic: 'world-war-i'
    },
    'modern-era-clips': {
      targetCategory: 'cold-war',
      targetTopic: 'cold-war-origins'
    }
  },
  
  // Grade 11 mappings
  'grade-11': {
    'colonial-clips': {
      targetCategory: 'colonial-foundations',
      targetTopic: 'colonial-america'
    },
    'revolution-clips': {
      targetCategory: 'revolutionary-era',
      targetTopic: 'causes-independence'
    },
    'civil-war-clips': {
      targetCategory: 'civil-war',
      targetTopic: 'causes-civil-war-11'
    },
    'modern-clips': {
      targetCategory: 'modern-america',
      targetTopic: 'post-war-america'
    }
  }
};

function processGradeFile(gradeFile) {
  const filePath = path.join(gradesDir, gradeFile);
  const gradeNum = gradeFile.replace('grade-', '').replace('.json', '');
  
  console.log(`\nProcessing ${gradeFile}...`);
  
  let data;
  try {
    data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    console.log(`  Skipping ${gradeFile} - could not parse`);
    return;
  }
  
  // Find the quick-clips category
  const quickClipsIndex = data.categories.findIndex(c => 
    c.id === 'quick-clips' || c.name?.toLowerCase().includes('quick clips')
  );
  
  if (quickClipsIndex === -1) {
    console.log(`  No Quick Clips category found`);
    return;
  }
  
  const quickClips = data.categories[quickClipsIndex];
  console.log(`  Found Quick Clips category with ${quickClips.topics?.length || 0} topics`);
  
  // Process each quick clip topic
  let movedCount = 0;
  
  if (quickClips.topics) {
    for (const clipTopic of quickClips.topics) {
      const clipMedia = clipTopic.media || [];
      if (clipMedia.length === 0) continue;
      
      // Find the best target category/topic
      let targetFound = false;
      
      // Try to find a matching category by searching for keywords in the clip topic name
      for (const category of data.categories) {
        if (category.id === 'quick-clips') continue;
        
        // Check if category name relates to clip topic
        const clipName = clipTopic.name.toLowerCase();
        const catName = category.name.toLowerCase();
        
        // Look for keyword matches
        const keywords = extractKeywords(clipName);
        const catKeywords = extractKeywords(catName);
        
        if (hasOverlap(keywords, catKeywords)) {
          // Found a matching category, find or create appropriate topic
          if (!category.topics) category.topics = [];
          
          // Find best matching topic or add to first topic
          let targetTopic = category.topics[0];
          
          for (const topic of category.topics) {
            const topicKeywords = extractKeywords(topic.name.toLowerCase());
            if (hasOverlap(keywords, topicKeywords)) {
              targetTopic = topic;
              break;
            }
          }
          
          if (targetTopic) {
            if (!targetTopic.media) targetTopic.media = [];
            
            // Add clips to the target topic
            for (const media of clipMedia) {
              // Mark as quick clip
              media.notes = media.notes ? `[Quick Clip] ${media.notes}` : '[Quick Clip]';
              targetTopic.media.push(media);
            }
            
            console.log(`  Moved ${clipMedia.length} clips from "${clipTopic.name}" → "${category.name}/${targetTopic.name}"`);
            movedCount += clipMedia.length;
            targetFound = true;
            break;
          }
        }
      }
      
      if (!targetFound) {
        // If no match found, try to add to a related category based on content
        const firstCategory = data.categories.find(c => c.id !== 'quick-clips');
        if (firstCategory && firstCategory.topics && firstCategory.topics[0]) {
          if (!firstCategory.topics[0].media) firstCategory.topics[0].media = [];
          for (const media of clipMedia) {
            media.notes = media.notes ? `[Quick Clip] ${media.notes}` : '[Quick Clip]';
            firstCategory.topics[0].media.push(media);
          }
          console.log(`  Moved ${clipMedia.length} clips from "${clipTopic.name}" → "${firstCategory.name}" (fallback)`);
          movedCount += clipMedia.length;
        }
      }
    }
  }
  
  // Remove the quick-clips category
  data.categories.splice(quickClipsIndex, 1);
  
  // Write the updated file
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`  ✅ Removed Quick Clips category, moved ${movedCount} clips`);
}

function extractKeywords(text) {
  // Remove common words and extract meaningful keywords
  const stopWords = ['the', 'and', 'of', 'in', 'to', 'a', 'for', 'clips', 'quick', 'shorts', 'short', 'educational'];
  return text
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.includes(w));
}

function hasOverlap(arr1, arr2) {
  return arr1.some(item => arr2.includes(item));
}

// Process all grade files
const gradeFiles = fs.readdirSync(gradesDir)
  .filter(f => f.endsWith('.json') && f.startsWith('grade-'));

console.log('Distributing Quick Clips into curriculum categories...');

for (const file of gradeFiles) {
  processGradeFile(file);
}

console.log('\n✅ Done! Quick Clips have been distributed into their relevant categories.');
console.log('Run "npm run seed" to update the database with the new structure.');

