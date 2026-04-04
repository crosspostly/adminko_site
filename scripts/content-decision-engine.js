/**
 * content-decision-engine.js — Data-driven content decisions
 * 
 * Analyzes Yandex Metrika data to decide:
 * 1. What topics to create next (hot topics, content gaps)
 * 2. What articles to update (falling traffic, low CTR)
 * 3. What articles to expand (growing traffic → related content)
 * 
 * Integrates with the content orchestrator to override topic selection.
 * 
 * Usage:
 *   node scripts/content-decision-engine.js              # Full analysis + recommendations
 *   node scripts/content-decision-engine.js --action plan # Generate content plan
 *   node scripts/content-decision-engine.js --action monitor # Check published articles
 */

const fs = require('fs');
const path = require('path');

const METRIKA_SCRIPT = path.join(__dirname, 'metrika-analytics.js');
const BLOG_INDEX = path.join(__dirname, '../site/public/blog/index.json');
const WORDSTAT_TOPICS = path.join(__dirname, '../data/wordstat_topics.json');
const DECISIONS_FILE = path.join(__dirname, '../data/content_decisions.json');

function loadBlogIndex() {
  if (!fs.existsSync(BLOG_INDEX)) return [];
  return JSON.parse(fs.readFileSync(BLOG_INDEX, 'utf-8'));
}

function loadWordstatTopics() {
  if (!fs.existsSync(WORDSTAT_TOPICS)) return [];
  return JSON.parse(fs.readFileSync(WORDSTAT_TOPICS, 'utf-8'));
}

function saveDecisions(decisions) {
  fs.writeFileSync(DECISIONS_FILE, JSON.stringify(decisions, null, 2));
  console.log(`\n💾 Decisions saved to ${DECISIONS_FILE}`);
}

function runMetrikaCommand(args) {
  const { execSync } = require('child_process');
  try {
    const result = execSync(`node ${METRIKA_SCRIPT} ${args}`, {
      encoding: 'utf-8',
      timeout: 60000
    });
    return result;
  } catch (e) {
    return e.stdout || e.stderr || e.message;
  }
}

async function generateContentPlan() {
  console.log('\n📋 DATA-DRIVEN CONTENT PLAN\n');
  console.log('=' .repeat(60));
  
  const decisions = {
    timestamp: new Date().toISOString(),
    create: [],    // New articles to write
    update: [],    // Existing articles to improve
    expand: [],    // Hot topics to create related content
    deprioritize: [] // Low-value topics to skip
  };
  
  // 1. HOT TOPICS — what's growing
  console.log('\n📈 STEP 1: Hot Topic Detection');
  const hotOutput = runMetrikaCommand('--action hot-topics --days-a 7 --days-b 14');
  console.log(hotOutput);
  
  // Parse hot topics from output
  const hotRegex = /(\d+)\.\s+(?:📈|🆕)\s+(.+?)\s+Views:\s+(\d+)\s+→\s+(\d+)\s+\((.+?)\)/g;
  let match;
  while ((match = hotRegex.exec(hotOutput)) !== null) {
    decisions.expand.push({
      url: match[2].trim(),
      previousViews: parseInt(match[3]),
      currentViews: parseInt(match[4]),
      growth: match[5].trim(),
      action: 'create_related_articles',
      count: 2
    });
  }
  
  // 2. TOP PAGES — what drives most traffic
  console.log('\n📊 STEP 2: Top Performing Pages');
  const topOutput = runMetrikaCommand('--action top-pages --days 30 --limit 15');
  console.log(topOutput);
  
  // 3. CONTENT GAPS — what people search for but we don't have
  console.log('\n🔍 STEP 3: Content Gap Analysis');
  const gapOutput = runMetrikaCommand('--action content-gaps --days 30 --limit 20');
  console.log(gapOutput);
  
  // Parse gaps
  const gapRegex = /(\d+)\.\s+"(.+?)"\s+—\s+(\d+)\s+visits/g;
  while ((match = gapRegex.exec(gapOutput)) !== null) {
    decisions.create.push({
      query: match[2].trim(),
      monthlyVisits: parseInt(match[3]),
      priority: 'high',
      reason: 'content_gap'
    });
  }
  
  // 4. SEARCH PHRASES — what people actually search
  console.log('\n🔎 STEP 4: Search Phrase Analysis');
  const searchOutput = runMetrikaCommand('--action search-phrases --days 30 --limit 25');
  console.log(searchOutput);
  
  // 5. TRAFFIC SOURCES — where visitors come from
  console.log('\n🌐 STEP 5: Traffic Source Breakdown');
  const sourceOutput = runMetrikaCommand('--action traffic-sources --days 30');
  console.log(sourceOutput);
  
  // 6. Check existing content for updates needed
  console.log('\n📝 STEP 6: Existing Content Review');
  const articles = loadBlogIndex();
  const topics = loadWordstatTopics();
  
  // Find topics with high Wordstat volume but no article
  const articleUrls = articles.map(a => (a.url || '').toLowerCase());
  
  topics.forEach(topic => {
    const hasArticle = articleUrls.some(url => 
      url.includes(topic.topic.toLowerCase().substring(0, 30))
    );
    
    if (!hasArticle && topic.totalQueries && topic.totalQueries > 10) {
      decisions.create.push({
        topic: topic.topic,
        keywords: topic.keywords?.slice(0, 3) || [],
        monthlyQueries: topic.totalQueries,
        priority: topic.totalQueries > 50 ? 'high' : 'medium',
        reason: 'wordstat_demand'
      });
    }
  });
  
  // Deduplicate and sort creates
  decisions.create.sort((a, b) => (b.monthlyQueries || b.monthlyVisits || 0) - (a.monthlyQueries || a.monthlyVisits || 0));
  decisions.create = decisions.create.slice(0, 20);
  
  // 7. Generate final plan
  console.log('\n' + '=' .repeat(60));
  console.log('📋 FINAL CONTENT PLAN\n');
  
  console.log(`🆕 CREATE: ${decisions.create.length} new articles`);
  decisions.create.slice(0, 10).forEach((item, i) => {
    const query = item.topic || item.query;
    const volume = item.monthlyQueries || item.monthlyVisits || '?';
    console.log(`  ${i + 1}. "${query}" (vol: ${volume}) [${item.priority}]`);
  });
  
  console.log(`\n📈 EXPAND: ${decisions.expand.length} hot topic clusters`);
  decisions.expand.slice(0, 5).forEach((item, i) => {
    console.log(`  ${i + 1}. ${item.url} → create ${item.count} related articles (${item.growth} growth)`);
  });
  
  console.log(`\n🔄 UPDATE: ${decisions.update.length} articles need revision`);
  decisions.update.slice(0, 5).forEach((item, i) => {
    console.log(`  ${i + 1}. ${item.url} — ${item.reason}`);
  });
  
  console.log(`\n⏸️ SKIP: ${decisions.deprioritize.length} low-value topics`);
  
  // Save decisions
  saveDecisions(decisions);
  
  // Update wordstat topics with new data-driven priorities
  if (decisions.create.length > 0) {
    const updatedTopics = [...topics];
    decisions.create.forEach(item => {
      if (item.topic && !updatedTopics.some(t => t.topic === item.topic)) {
        updatedTopics.unshift({
          topic: item.topic,
          keywords: item.keywords || [item.topic],
          category: item.category || 'phone',
          totalQueries: item.monthlyQueries || 0,
          priority: item.priority,
          source: 'decision_engine'
        });
      }
    });
    fs.writeFileSync(WORDSTAT_TOPICS, JSON.stringify(updatedTopics, null, 2));
    console.log(`\n✅ Updated ${WORDSTAT_TOPICS} with ${decisions.create.length} new topics`);
  }
  
  return decisions;
}

async function monitorPublishedArticles() {
  console.log('\n📊 MONITORING PUBLISHED ARTICLES\n');
  console.log('=' .repeat(60));
  
  const articles = loadBlogIndex();
  if (articles.length === 0) {
    console.log('No articles found in blog index.');
    return;
  }
  
  console.log(`Total articles: ${articles.length}\n`);
  
  // Group by category
  const byCategory = {};
  articles.forEach(a => {
    const cat = a.category || 'unknown';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(a);
  });
  
  console.log('Articles by category:');
  Object.entries(byCategory).forEach(([cat, arts]) => {
    console.log(`  ${cat}: ${arts.length} articles`);
  });
  
  // Check SEO audit results if available
  const auditsDir = path.join(__dirname, '../logs/seo-audits');
  if (fs.existsSync(auditsDir)) {
    const audits = fs.readdirSync(auditsDir).filter(f => f.endsWith('.md'));
    console.log(`\n🔍 SEO Audits on file: ${audits.length}`);
    
    // Find latest audit
    const latest = audits.sort().pop();
    if (latest) {
      const content = fs.readFileSync(path.join(auditsDir, latest), 'utf-8');
      const scoreMatch = content.match(/Overall Score:\s+(\d+)\/100 \(([A-F])\)/);
      if (scoreMatch) {
        console.log(`   Latest: ${scoreMatch[1]}/100 (${scoreMatch[2]})`);
      }
    }
  }
  
  // Recent articles
  const now = new Date();
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const recent = articles.filter(a => a.date && new Date(a.date) >= weekAgo);
  
  console.log(`\n📅 Articles this week: ${recent.length}`);
  recent.slice(0, 10).forEach((a, i) => {
    console.log(`  ${i + 1}. ${a.title || a.url} (${a.category || '?'})`);
  });
}

// --- CLI ---

async function main() {
  const args = process.argv.slice(2);
  const action = args.find(a => a.startsWith('--action'))?.split('=')[1] || args.find((_, i) => args[i - 1] === '--action');
  
  if (!action || action === 'plan') {
    await generateContentPlan();
  } else if (action === 'monitor') {
    await monitorPublishedArticles();
  } else {
    console.log(`
Content Decision Engine

Usage:
  node scripts/content-decision-engine.js              # Full plan
  node scripts/content-decision-engine.js --action plan # Content plan
  node scripts/content-decision-engine.js --action monitor # Monitor articles
`);
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
