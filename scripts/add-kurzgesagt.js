/**
 * Add Kurzgesagt videos to the curriculum
 * These are high-quality animated educational videos perfect for social studies
 */

const fs = require('fs');
const path = require('path');

const gradesDir = path.join(__dirname, '..', 'grades');

// Kurzgesagt videos organized by curriculum relevance
const kurzgesagtVideos = {
  // Grade 5 - Western Hemisphere
  'grade-5': [
    {
      targetCategory: 'expansion-conflict',
      targetTopic: 'westward-expansion',
      video: {
        title: "Kurzgesagt: Overpopulation – The Human Explosion Explained",
        type: "short",
        year: 2016,
        rating: "NR",
        runtime: 6,
        relevance: "Explains population growth and human expansion across the globe, relevant to understanding migration and settlement patterns",
        links: { youtube: "https://www.youtube.com/watch?v=QsBT5EQt348" },
        ageAppropriate: true,
        contentType: "educational",
        notes: "[Kurzgesagt] Animated explainer on human population growth"
      }
    }
  ],

  // Grade 7 - US & NY History
  'grade-7': [
    {
      targetCategory: 'immigration-urbanization',
      targetTopic: 'waves-immigration',
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
    },
    {
      targetCategory: 'industrial-revolution',
      targetTopic: 'industrial-revolution-effects',
      video: {
        title: "Kurzgesagt: The Rise of the Machines – Why Automation is Different this Time",
        type: "short",
        year: 2017,
        rating: "NR",
        runtime: 12,
        relevance: "Compares industrial revolutions and automation - connects historical industrialization to modern technology",
        links: { youtube: "https://www.youtube.com/watch?v=WSKi8HfcxEk" },
        ageAppropriate: true,
        contentType: "educational",
        notes: "[Kurzgesagt] Industrial revolution context for modern automation"
      }
    }
  ],

  // Grade 9 - Global History I
  'grade-9': [
    {
      targetCategory: 'medieval-world',
      targetTopic: 'feudalism-medieval-society',
      video: {
        title: "Kurzgesagt: The Black Death – How The Deadliest Pandemic Changed History",
        type: "short",
        year: 2019,
        rating: "NR",
        runtime: 10,
        relevance: "Comprehensive animated explanation of the Black Death and its impact on medieval society",
        links: { youtube: "https://www.youtube.com/watch?v=JEYh5WACqEk" },
        ageAppropriate: true,
        contentType: "educational",
        notes: "[Kurzgesagt] ESSENTIAL - Perfect for medieval unit"
      }
    },
    {
      targetCategory: 'ancient-civilizations',
      targetTopic: 'paleolithic-first-civilizations',
      video: {
        title: "Kurzgesagt: The History and Future of Everything – Time",
        type: "short",
        year: 2013,
        rating: "NR",
        runtime: 8,
        relevance: "Sweeping overview of human history from Big Bang to future - great for historical perspective",
        links: { youtube: "https://www.youtube.com/watch?v=2XkV6IpV2Y0" },
        ageAppropriate: true,
        contentType: "educational",
        notes: "[Kurzgesagt] Big picture view of human history"
      }
    },
    {
      targetCategory: 'ancient-civilizations',
      targetTopic: 'paleolithic-first-civilizations',
      video: {
        title: "Kurzgesagt: What Happened Before History? Human Origins",
        type: "short",
        year: 2016,
        rating: "NR",
        runtime: 10,
        relevance: "Excellent animated overview of early human history and the development of civilization",
        links: { youtube: "https://www.youtube.com/watch?v=dGiQaabX3_o" },
        ageAppropriate: true,
        contentType: "educational",
        notes: "[Kurzgesagt] HIGHLY RECOMMENDED - Early humans and civilization"
      }
    },
    {
      targetCategory: 'trade-networks',
      targetTopic: 'silk-road-trans-saharan',
      video: {
        title: "Kurzgesagt: Banking Explained – Money and Credit",
        type: "short",
        year: 2015,
        rating: "NR",
        runtime: 6,
        relevance: "Explains development of banking and trade systems - relevant to understanding trade networks",
        links: { youtube: "https://www.youtube.com/watch?v=fTTGALaRZoc" },
        ageAppropriate: true,
        contentType: "educational",
        notes: "[Kurzgesagt] Economic systems and trade"
      }
    }
  ],

  // Grade 10 - Global History II
  'grade-10': [
    {
      targetCategory: 'world-wars',
      targetTopic: 'world-war-i',
      video: {
        title: "Kurzgesagt: The Emu War",
        type: "short",
        year: 2021,
        rating: "NR",
        runtime: 8,
        relevance: "Humorous but educational look at Australia's Great Emu War - post-WWI context",
        links: { youtube: "https://www.youtube.com/watch?v=BXpu6tbFCsI" },
        ageAppropriate: true,
        contentType: "educational",
        notes: "[Kurzgesagt] Engaging story with historical context"
      }
    },
    {
      targetCategory: 'world-wars',
      targetTopic: 'world-war-ii',
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
      targetCategory: 'cold-war',
      targetTopic: 'cold-war-origins',
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
    },
    {
      targetCategory: 'cold-war',
      targetTopic: 'cold-war-origins',
      video: {
        title: "Kurzgesagt: Atomic Bombs vs Nuclear Bombs: What's the Difference?",
        type: "short",
        year: 2023,
        rating: "NR",
        runtime: 10,
        relevance: "Detailed explanation of nuclear weapons - crucial for Cold War unit",
        links: { youtube: "https://www.youtube.com/watch?v=pu3jLZsAW8s" },
        ageAppropriate: true,
        contentType: "educational",
        notes: "[Kurzgesagt] Nuclear weapons technology explained"
      }
    },
    {
      targetCategory: 'decolonization',
      targetTopic: 'end-empires',
      video: {
        title: "Kurzgesagt: Is Civilization on the Brink of Collapse?",
        type: "short",
        year: 2022,
        rating: "NR",
        runtime: 13,
        relevance: "Examines civilizational collapse throughout history and modern risks",
        links: { youtube: "https://www.youtube.com/watch?v=W93XyXHI8Nw" },
        ageAppropriate: true,
        contentType: "educational",
        notes: "[Kurzgesagt] Civilizational rise and fall patterns"
      }
    },
    {
      targetCategory: 'modern-challenges',
      targetTopic: 'globalization',
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
      targetCategory: 'modern-challenges',
      targetTopic: 'environmental-issues',
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
      targetCategory: 'modern-challenges',
      targetTopic: 'environmental-issues',
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
    }
  ],

  // Grade 11 - US History
  'grade-11': [
    {
      targetCategory: 'modern-america',
      targetTopic: 'post-war-america',
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
      targetTopic: 'civil-rights-era',
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
      targetCategory: 'cold-war-america',
      targetTopic: 'cold-war-domestic',
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
      targetCategory: 'contemporary-america',
      targetTopic: 'modern-challenges',
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
      targetCategory: 'contemporary-america',
      targetTopic: 'technology-society',
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
    }
  ]
};

// Additional Kurzgesagt videos that apply to multiple grades (philosophical/general)
const universalVideos = [
  {
    title: "Kurzgesagt: The Egg - A Short Story",
    type: "short",
    year: 2019,
    rating: "NR",
    runtime: 8,
    relevance: "Philosophical animated story about life and death - great for discussions of meaning and ethics",
    links: { youtube: "https://www.youtube.com/watch?v=h6fcK_fRYaI" },
    ageAppropriate: true,
    contentType: "educational",
    notes: "[Kurzgesagt] Philosophy - Andy Weir story"
  },
  {
    title: "Kurzgesagt: Optimistic Nihilism",
    type: "short",
    year: 2017,
    rating: "NR",
    runtime: 6,
    relevance: "Philosophy of meaning in an indifferent universe - thought-provoking for older students",
    links: { youtube: "https://www.youtube.com/watch?v=MBRqu0YOH14" },
    ageAppropriate: true,
    contentType: "educational",
    notes: "[Kurzgesagt] Philosophy and worldview"
  },
  {
    title: "Kurzgesagt: What Is Life? Is Death Real?",
    type: "short",
    year: 2014,
    rating: "NR",
    runtime: 6,
    relevance: "Philosophical exploration of life and death - connects to various historical discussions",
    links: { youtube: "https://www.youtube.com/watch?v=QOCaacO8wus" },
    ageAppropriate: true,
    contentType: "educational",
    notes: "[Kurzgesagt] Philosophy of life"
  }
];

function addVideosToGrade(gradeFile, videos) {
  const filePath = path.join(gradesDir, gradeFile + '.json');
  
  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠️ ${gradeFile}.json not found`);
    return 0;
  }
  
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let addedCount = 0;
  
  for (const item of videos) {
    // Find target category
    const category = data.categories.find(c => 
      c.id === item.targetCategory || 
      c.name.toLowerCase().includes(item.targetCategory.replace(/-/g, ' '))
    );
    
    if (!category) {
      console.log(`    ⚠️ Category not found: ${item.targetCategory}`);
      continue;
    }
    
    // Find target topic or use first topic
    let topic = category.topics?.find(t => 
      t.id === item.targetTopic ||
      t.name.toLowerCase().includes(item.targetTopic?.replace(/-/g, ' ') || '')
    );
    
    if (!topic && category.topics?.length > 0) {
      topic = category.topics[0];
    }
    
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
    console.log(`    ✅ Added: ${item.video.title}`);
  }
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  return addedCount;
}

// Main
console.log('🎬 Adding Kurzgesagt Videos to Curriculum\n');

let totalAdded = 0;

for (const [grade, videos] of Object.entries(kurzgesagtVideos)) {
  console.log(`\n📚 Processing ${grade}...`);
  const added = addVideosToGrade(grade, videos);
  totalAdded += added;
}

console.log('\n' + '='.repeat(50));
console.log(`📊 Total Kurzgesagt videos added: ${totalAdded}`);
console.log('='.repeat(50));
console.log('\n✅ Done! Run "npm run seed" to update the database.');

