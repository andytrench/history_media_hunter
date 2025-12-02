/**
 * Add more Kurzgesagt videos with correct category mappings
 */

const fs = require('fs');
const path = require('path');

const gradesDir = path.join(__dirname, '..', 'grades');

// Kurzgesagt videos with CORRECT category IDs
const kurzgesagtVideos = {
  // Grade 7
  'grade-7': [
    {
      targetCategory: 'modern-america',
      video: {
        title: "Kurzgesagt: The European Refugee Crisis and Syria Explained",
        type: "short",
        year: 2015,
        rating: "NR",
        runtime: 6,
        relevance: "Modern migration and refugee issues - connects historical immigration patterns to contemporary events",
        links: { youtube: "https://www.youtube.com/watch?v=RvOnXh3NN9w" },
        ageAppropriate: true,
        contentType: "educational",
        notes: "[Kurzgesagt] Explains push/pull factors of migration"
      }
    }
  ],

  // Grade 10
  'grade-10': [
    {
      targetCategory: 'world-war-1',
      video: {
        title: "Kurzgesagt: The Emu War",
        type: "short",
        year: 2021,
        rating: "NR",
        runtime: 8,
        relevance: "Humorous but educational look at Australia's Great Emu War - post-WWI context in the British Empire",
        links: { youtube: "https://www.youtube.com/watch?v=BXpu6tbFCsI" },
        ageAppropriate: true,
        contentType: "educational",
        notes: "[Kurzgesagt] Engaging story with interwar historical context"
      }
    },
    {
      targetCategory: 'world-war-2',
      video: {
        title: "Kurzgesagt: What if We Nuke a City?",
        type: "short",
        year: 2019,
        rating: "NR",
        runtime: 9,
        relevance: "Explains nuclear weapons effects - relevant to WWII atomic bombs and Cold War",
        links: { youtube: "https://www.youtube.com/watch?v=5iPH-br_eJQ" },
        ageAppropriate: true,
        contentType: "educational",
        notes: "[Kurzgesagt] Nuclear weapons explained - Hiroshima/Nagasaki context"
      }
    },
    {
      targetCategory: 'technology-society',
      video: {
        title: "Kurzgesagt: Why The War on Drugs Is a Huge Failure",
        type: "short",
        year: 2016,
        rating: "NR",
        runtime: 6,
        relevance: "Modern policy analysis - global drug trade and policy impacts",
        links: { youtube: "https://www.youtube.com/watch?v=wJUXLqNHCaI" },
        ageAppropriate: true,
        contentType: "educational",
        notes: "[Kurzgesagt] Modern social policy analysis"
      }
    },
    {
      targetCategory: 'technology-society',
      video: {
        title: "Kurzgesagt: Climate Change: What Can We Do?",
        type: "short",
        year: 2021,
        rating: "NR",
        runtime: 13,
        relevance: "Comprehensive climate change overview - essential for modern global issues",
        links: { youtube: "https://www.youtube.com/watch?v=yiw6_JakZFc" },
        ageAppropriate: true,
        contentType: "educational",
        notes: "[Kurzgesagt] Climate science and solutions"
      }
    },
    {
      targetCategory: 'technology-society',
      video: {
        title: "Kurzgesagt: Plastic Pollution: How Humans are Turning the World into Plastic",
        type: "short",
        year: 2018,
        rating: "NR",
        runtime: 8,
        relevance: "Environmental pollution and global responsibility",
        links: { youtube: "https://www.youtube.com/watch?v=RS7IzU2VJIQ" },
        ageAppropriate: true,
        contentType: "educational",
        notes: "[Kurzgesagt] Environmental issues explained"
      }
    },
    {
      targetCategory: 'technology-society',
      video: {
        title: "Kurzgesagt: The Rise of the Machines – Why Automation is Different this Time",
        type: "short",
        year: 2017,
        rating: "NR",
        runtime: 12,
        relevance: "Automation and the future of work - connects industrial revolutions to modern technology",
        links: { youtube: "https://www.youtube.com/watch?v=WSKi8HfcxEk" },
        ageAppropriate: true,
        contentType: "educational",
        notes: "[Kurzgesagt] Industrial revolution to modern automation"
      }
    },
    {
      targetCategory: 'human-rights',
      video: {
        title: "Kurzgesagt: Addiction",
        type: "short",
        year: 2015,
        rating: "NR",
        runtime: 5,
        relevance: "Understanding addiction as a health issue - relevant to human rights and social policy",
        links: { youtube: "https://www.youtube.com/watch?v=ao8L-0nSYzg" },
        ageAppropriate: true,
        contentType: "educational",
        notes: "[Kurzgesagt] Social health issues"
      }
    }
  ],

  // Grade 11 Part 2
  'grade-11-part2': [
    {
      targetCategory: 'modern-america',
      video: {
        title: "Kurzgesagt: Universal Basic Income Explained – Free Money for Everybody?",
        type: "short",
        year: 2017,
        rating: "NR",
        runtime: 7,
        relevance: "Modern economic policy debate - connects to US economic history and future",
        links: { youtube: "https://www.youtube.com/watch?v=kl39KHS07Xc" },
        ageAppropriate: true,
        contentType: "educational",
        notes: "[Kurzgesagt] Economic policy analysis"
      }
    },
    {
      targetCategory: 'civil-rights-movement',
      video: {
        title: "Kurzgesagt: Loneliness",
        type: "short",
        year: 2019,
        rating: "NR",
        runtime: 9,
        relevance: "Social isolation and community - relevant to discussions of social movements and belonging",
        links: { youtube: "https://www.youtube.com/watch?v=n3Xv_g3g-mA" },
        ageAppropriate: true,
        contentType: "educational",
        notes: "[Kurzgesagt] Social connection and community"
      }
    },
    {
      targetCategory: 'cold-war',
      video: {
        title: "Kurzgesagt: The Side Effects of Vaccines – How High is the Risk?",
        type: "short",
        year: 2019,
        rating: "NR",
        runtime: 10,
        relevance: "Science and public health policy - connects to Cold War era science and modern debates",
        links: { youtube: "https://www.youtube.com/watch?v=zBkVCpbNnkU" },
        ageAppropriate: true,
        contentType: "educational",
        notes: "[Kurzgesagt] Public health and policy"
      }
    },
    {
      targetCategory: 'contemporary-issues',
      video: {
        title: "Kurzgesagt: The Coronavirus Explained & What You Should Do",
        type: "short",
        year: 2020,
        rating: "NR",
        runtime: 8,
        relevance: "COVID-19 pandemic explanation - connects to modern US history",
        links: { youtube: "https://www.youtube.com/watch?v=BtN-goy9VOY" },
        ageAppropriate: true,
        contentType: "educational",
        notes: "[Kurzgesagt] Recent pandemic history"
      }
    },
    {
      targetCategory: 'contemporary-issues',
      video: {
        title: "Kurzgesagt: Genetic Engineering Will Change Everything Forever – CRISPR",
        type: "short",
        year: 2016,
        rating: "NR",
        runtime: 16,
        relevance: "Modern biotechnology and ethics - important contemporary issue",
        links: { youtube: "https://www.youtube.com/watch?v=jAhjPd4uNFY" },
        ageAppropriate: true,
        contentType: "educational",
        notes: "[Kurzgesagt] Science and ethics in modern America"
      }
    },
    {
      targetCategory: 'world-war-2-11',
      video: {
        title: "Kurzgesagt: What if We Nuke a City?",
        type: "short",
        year: 2019,
        rating: "NR",
        runtime: 9,
        relevance: "Explains nuclear weapons effects - relevant to WWII atomic bombs",
        links: { youtube: "https://www.youtube.com/watch?v=5iPH-br_eJQ" },
        ageAppropriate: true,
        contentType: "educational",
        notes: "[Kurzgesagt] Nuclear weapons - Hiroshima/Nagasaki context"
      }
    },
    {
      targetCategory: 'cold-war',
      video: {
        title: "Kurzgesagt: Nuclear Energy Explained: How Does it Work?",
        type: "short",
        year: 2015,
        rating: "NR",
        runtime: 5,
        relevance: "Explains nuclear technology - essential for understanding Cold War nuclear arms race",
        links: { youtube: "https://www.youtube.com/watch?v=rcOFV4y5z8c" },
        ageAppropriate: true,
        contentType: "educational",
        notes: "[Kurzgesagt] Nuclear technology basics"
      }
    }
  ]
};

function addVideosToGrade(gradeFile, videos) {
  const filePath = path.join(gradesDir, gradeFile + '.json');
  
  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠️ ${gradeFile}.json not found`);
    return 0;
  }
  
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let addedCount = 0;
  
  for (const item of videos) {
    // Find target category by ID
    const category = data.categories.find(c => c.id === item.targetCategory);
    
    if (!category) {
      console.log(`    ⚠️ Category not found: ${item.targetCategory}`);
      continue;
    }
    
    // Use first topic in category
    const topic = category.topics?.[0];
    
    if (!topic) {
      console.log(`    ⚠️ No topics in category: ${category.name}`);
      continue;
    }
    
    // Check if video already exists
    if (topic.media?.some(m => m.title === item.video.title)) {
      console.log(`    ⏭️ Already exists: ${item.video.title}`);
      continue;
    }
    
    // Add video
    if (!topic.media) topic.media = [];
    topic.media.push(item.video);
    addedCount++;
    console.log(`    ✅ Added to "${category.name}": ${item.video.title}`);
  }
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  return addedCount;
}

// Main
console.log('🎬 Adding More Kurzgesagt Videos\n');

let totalAdded = 0;

for (const [grade, videos] of Object.entries(kurzgesagtVideos)) {
  console.log(`\n📚 Processing ${grade}...`);
  const added = addVideosToGrade(grade, videos);
  totalAdded += added;
}

console.log('\n' + '='.repeat(50));
console.log(`📊 Total Kurzgesagt videos added: ${totalAdded}`);
console.log('='.repeat(50));
console.log('\n✅ Done!');

