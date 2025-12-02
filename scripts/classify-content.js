/**
 * Classify media content as Educational or Entertainment
 * 
 * EDUCATIONAL criteria:
 * - Documentaries from PBS, History Channel, BBC, National Geographic
 * - Educational series (Crash Course, TED-Ed, Extra History, Oversimplified)
 * - Films explicitly designed to teach (educational shorts)
 * - Academic/museum productions
 * 
 * ENTERTAINMENT criteria:
 * - Hollywood feature films (even if historically themed)
 * - Dramatic interpretations of history
 * - Action/adventure films set in historical periods
 * - Animated entertainment (Disney, DreamWorks) unless explicitly educational
 */

const fs = require('fs');
const path = require('path');

const gradesDir = path.join(__dirname, '..', 'grades');

// Keywords/patterns that indicate EDUCATIONAL content
const educationalIndicators = {
  // Types that are almost always educational
  types: ['documentary', 'short', 'educational'],
  
  // Sources known for educational content
  sources: [
    'crash course', 'ted-ed', 'ted ed', 'extra history', 'oversimplified',
    'kings and generals', 'history matters', 'simple history',
    'pbs', 'nova', 'frontline', 'american experience',
    'bbc', 'national geographic', 'nat geo', 'smithsonian',
    'history channel', 'engineering an empire', 'secrets of the dead',
    'ken burns', 'david attenborough', 'michael wood',
    'great courses', 'khan academy', 'brainpop',
    'horrible histories' // Educational comedy
  ],
  
  // Title patterns that indicate educational content
  titlePatterns: [
    /history of/i, /rise and fall/i, /empire:/i, /civilization:/i,
    /: a documentary/i, /: the story of/i, /secrets of/i,
    /explained$/i, /: an exploration/i
  ],
  
  // Notes that indicate educational
  notePatterns: [
    /educational/i, /documentary/i, /pbs/i, /bbc/i, /history channel/i,
    /academic/i, /museum/i, /scholarly/i, /crash course/i, /ted-ed/i,
    /quick clip/i, /short video/i
  ]
};

// Keywords that indicate ENTERTAINMENT (even if historically themed)
const entertainmentIndicators = {
  // Studios known for entertainment
  studios: [
    'disney', 'pixar', 'dreamworks', 'warner bros', 'universal',
    'paramount', 'fox', '20th century', 'marvel', 'dc'
  ],
  
  // Genres that are entertainment
  genres: [
    'adventure', 'action', 'thriller', 'drama', 'comedy', 'romance',
    'epic', 'blockbuster', 'animated feature'
  ],
  
  // Common entertainment indicators in notes
  notePatterns: [
    /hollywood/i, /fiction/i, /dramatiz/i, /entertaining/i,
    /not.*for classroom/i, /epic.*film/i, /blockbuster/i,
    /beautiful.*visuals/i, /sparks interest/i, /fun.*watch/i,
    /teacher.*review/i, /r-rated/i, /pg-13/i, /select scenes/i,
    /historical.*problems/i, /historically.*problematic/i
  ],
  
  // Specific entertainment titles
  knownEntertainment: [
    'the mummy', 'troy', 'gladiator', 'alexander', '300', 'ben-hur',
    'spartacus', 'cleopatra', 'the prince of egypt', 'mulan', 
    'kung fu panda', 'the road to el dorado', 'black panther',
    'brave', 'pocahontas', 'moana', 'coco', 'encanto',
    'night at the museum', 'national treasure', 'indiana jones',
    'pirates of the caribbean', 'a knight\'s tale', 'robin hood',
    'kingdom of heaven', 'braveheart', 'the patriot', 'apocalypto',
    'the last samurai', 'pearl harbor', 'saving private ryan',
    'schindler\'s list', 'the pianist', 'dunkirk', 'hacksaw ridge',
    'the imitation game', 'hidden figures', '12 years a slave',
    'lincoln', 'selma', 'malcolm x', 'gandhi', 'the king\'s speech',
    'darkest hour', '1917', 'jojo rabbit', 'the reader',
    'hotel rwanda', 'blood diamond', 'the last emperor',
    'hero', 'house of flying daggers', 'crouching tiger',
    'seven years in tibet', 'kundun', 'little buddha',
    'jodhaa akbar', 'lagaan', 'argo', 'zero dark thirty',
    'american sniper', 'lone survivor', 'platoon', 'apocalypse now',
    'full metal jacket', 'forrest gump', 'the butler',
    'the help', 'green book', 'remember the titans',
    'glory', 'dances with wolves', 'last of the mohicans',
    'the revenant', 'master and commander', 'amistad',
    'amazing grace', 'harriet', 'the color purple',
    'monty python', 'ever after', 'a beautiful mind',
    'the theory of everything', 'oppenheimer', 'first man',
    'apollo 13', 'the right stuff', 'october sky'
  ]
};

function classifyMedia(media) {
  const title = (media.title || '').toLowerCase();
  const type = (media.type || '').toLowerCase();
  const notes = (media.notes || '').toLowerCase();
  const relevance = (media.relevance || '').toLowerCase();
  const combined = `${title} ${notes} ${relevance}`;
  
  // Default scores
  let eduScore = 0;
  let entScore = 0;
  
  // Check type
  if (educationalIndicators.types.includes(type)) {
    eduScore += 3;
  }
  if (type === 'movie') {
    entScore += 1; // Movies are slightly more likely to be entertainment
  }
  if (type === 'series') {
    // Series could go either way
  }
  
  // Check for educational sources
  for (const source of educationalIndicators.sources) {
    if (combined.includes(source)) {
      eduScore += 4;
      break;
    }
  }
  
  // Check title patterns
  for (const pattern of educationalIndicators.titlePatterns) {
    if (pattern.test(title)) {
      eduScore += 2;
      break;
    }
  }
  
  // Check note patterns for educational
  for (const pattern of educationalIndicators.notePatterns) {
    if (pattern.test(notes)) {
      eduScore += 2;
      break;
    }
  }
  
  // Check for entertainment indicators
  for (const pattern of entertainmentIndicators.notePatterns) {
    if (pattern.test(notes) || pattern.test(relevance)) {
      entScore += 2;
    }
  }
  
  // Check known entertainment titles
  for (const entTitle of entertainmentIndicators.knownEntertainment) {
    if (title.includes(entTitle.toLowerCase())) {
      entScore += 5;
      break;
    }
  }
  
  // Special cases
  if (notes.includes('not for classroom') || notes.includes('teacher reference')) {
    entScore += 2;
  }
  if (notes.includes('highly recommended') && type === 'documentary') {
    eduScore += 2;
  }
  if (title.includes('crash course') || title.includes('ted-ed')) {
    eduScore += 5;
  }
  
  // Determine classification
  // Educational needs to clearly win, otherwise it's entertainment
  if (eduScore > entScore + 1) {
    return 'educational';
  } else {
    return 'entertainment';
  }
}

function processGradeFile(gradeFile) {
  const filePath = path.join(gradesDir, gradeFile);
  
  console.log(`\nProcessing ${gradeFile}...`);
  
  let data;
  try {
    data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    console.log(`  Skipping ${gradeFile} - could not parse`);
    return { edu: 0, ent: 0 };
  }
  
  let eduCount = 0;
  let entCount = 0;
  
  // Process each category and topic
  if (data.categories) {
    for (const category of data.categories) {
      if (category.topics) {
        for (const topic of category.topics) {
          if (topic.media) {
            for (const media of topic.media) {
              const classification = classifyMedia(media);
              media.contentType = classification;
              
              if (classification === 'educational') {
                eduCount++;
              } else {
                entCount++;
              }
            }
          }
        }
      }
    }
  }
  
  // Write the updated file
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`  ✅ Educational: ${eduCount}, Entertainment: ${entCount}`);
  
  return { edu: eduCount, ent: entCount };
}

// Process all grade files
const gradeFiles = fs.readdirSync(gradesDir)
  .filter(f => f.endsWith('.json') && f.startsWith('grade-'));

console.log('🎓 Classifying content as Educational vs Entertainment...');

let totalEdu = 0;
let totalEnt = 0;

for (const file of gradeFiles) {
  const { edu, ent } = processGradeFile(file);
  totalEdu += edu;
  totalEnt += ent;
}

console.log('\n📊 Summary:');
console.log(`   Total Educational: ${totalEdu}`);
console.log(`   Total Entertainment: ${totalEnt}`);
console.log(`   Ratio: ${Math.round((totalEdu / (totalEdu + totalEnt)) * 100)}% educational`);
console.log('\n✅ Done! Run "npm run seed" to update the database.');

