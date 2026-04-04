/**
 * metrika-analytics.js — Yandex Metrika API client for traffic-driven content decisions
 * 
 * Integrates with the existing content pipeline to provide:
 * - Traffic analysis (visits, pageviews, bounce rate by page)
 * - Hot topic detection (pages with growing traffic)
 * - Content gap analysis (popular search queries without landing pages)
 * - Post-publish monitoring (track article performance over time)
 * 
 * Usage:
 *   node scripts/metrika-analytics.js --action top-pages --days 7
 *   node scripts/metrika-analytics.js --action hot-topics --days 14
 *   node scripts/metrika-analytics.js --action page-stats --url "/blog/remont-iphone"
 *   node scripts/metrika-analytics.js --action traffic-sources --days 30
 *   node scripts/metrika-analytics.js --action search-phrases --days 30
 *   node scripts/metrika-analytics.js --action compare --days-a 7 --days-b 14
 */

import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = 'https://api-metrika.yandex.net';
const TOKEN = process.env.YANDEX_OAUTH_TOKEN;

// --- Config ---
const COUNTER_ID = process.env.YANDEX_METRIKA_COUNTER_ID || null; // Set in .env when known

// --- API Helpers ---

async function apiGet(path, params = {}) {
  const url = new URL(path, BASE_URL);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  
  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `OAuth ${TOKEN}`,
      'Accept': 'application/json'
    }
  });
  
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API Error ${response.status}: ${err}`);
  }
  
  return response.json();
}

async function getCounters() {
  return apiGet('/management/v1/counters', { per_page: 50 });
}

async function getCounterId(siteMatch) {
  if (COUNTER_ID) return COUNTER_ID;
  
  const data = await getCounters();
  const counters = data.counters || [];
  
  if (counters.length === 1) return counters[0].id;
  
  const found = counters.find(c => 
    (c.site && c.site.includes(siteMatch)) || 
    (c.name && c.name.toLowerCase().includes(siteMatch))
  );
  
  if (found) return found.id;
  
  // List available counters
  console.log('Available counters:');
  counters.forEach(c => console.log(`  [${c.id}] ${c.name} — ${c.site}`));
  throw new Error('Specify COUNTER_ID in .env or pass --counter');
}

async function getTopPages(cid, days = 7, limit = 20) {
  return apiGet('/stat/v1/data', {
    ids: cid,
    dimensions: 'ym:pv:URL',
    metrics: 'ym:pv:pageviews,ym:pv:users,ym:pv:avgVisitDurationSec,ym:pv:bounceRate',
    sort: '-ym:pv:pageviews',
    limit: limit,
    date1: `${days}daysAgo`,
    date2: 'yesterday'
  });
}

async function getTrafficSources(cid, days = 30, limit = 15) {
  return apiGet('/stat/v1/data', {
    ids: cid,
    dimensions: 'ym:s:lastTrafficSource',
    metrics: 'ym:s:visits,ym:s:users,ym:s:bounceRate',
    sort: '-ym:s:visits',
    limit: limit,
    date1: `${days}daysAgo`,
    date2: 'yesterday'
  });
}

async function getSearchPhrases(cid, days = 30, limit = 30) {
  return apiGet('/stat/v1/data', {
    ids: cid,
    dimensions: 'ym:s:lastSearchEnginePhrase',
    metrics: 'ym:s:visits',
    sort: '-ym:s:visits',
    limit: limit,
    date1: `${days}daysAgo`,
    date2: 'yesterday'
  });
}

async function getVisitsByDay(cid, days = 30) {
  return apiGet('/stat/v1/data', {
    ids: cid,
    dimensions: 'ym:s:date',
    metrics: 'ym:s:visits,ym:s:pageviews,ym:s:users',
    sort: 'ym:s:date',
    date1: `${days}daysAgo`,
    date2: 'yesterday'
  });
}

async function getLandingPages(cid, days = 30, limit = 20) {
  return apiGet('/stat/v1/data', {
    ids: cid,
    dimensions: 'ym:s:startPage',
    metrics: 'ym:s:visits,ym:s:users,ym:s:bounceRate',
    sort: '-ym:s:visits',
    limit: limit,
    date1: `${days}daysAgo`,
    date2: 'yesterday'
  });
}

async function getPageStats(cid, pagePath, days = 14) {
  return apiGet('/stat/v1/data', {
    ids: cid,
    dimensions: 'ym:pv:URL',
    metrics: 'ym:pv:pageviews,ym:pv:users,ym:pv:avgVisitDurationSec,ym:pv:bounceRate,ym:pv:depth',
    filters: `ym:pv:URL=='${pagePath}'`,
    date1: `${days}daysAgo`,
    date2: 'yesterday'
  });
}

// --- Analysis Functions ---

function parseReportData(report) {
  if (!report || !report.data || !report.data[0]) return [];
  
  const row = report.data[0];
  const dimensions = row.dimensions || [];
  const metrics = row.metrics || [];
  
  // Extract dimension values
  let dimValues = {};
  if (dimensions[0] && dimensions[0].name) {
    const name = dimensions[0].name;
    dimValues.dimension = name;
    if (dimensions[0].id) dimValues.id = dimensions[0].id;
  }
  
  // Extract metric values
  const metricIds = {};
  if (report.query && report.query.metrics) {
    report.query.metrics.split(',').forEach((m, i) => {
      metricIds[m] = i;
    });
  }
  
  return (row.data || []).map(d => {
    const item = { ...dimValues };
    if (d.dimensions && d.dimensions[0]) {
      item.name = d.dimensions[0].name;
    }
    if (d.metrics) {
      Object.entries(metricIds).forEach(([metric, idx]) => {
        item[metric] = d.metrics[idx];
      });
    }
    return item;
  });
}

async function detectHotTopics(cid, currentDays = 7, previousDays = 14, minGrowth = 30, minViews = 10) {
  console.log(`\n🔥 Hot Topic Detection`);
  console.log(`Comparing: last ${currentDays} days vs previous ${previousDays} days\n`);
  
  // Get current period
  const current = await apiGet('/stat/v1/data', {
    ids: cid,
    dimensions: 'ym:pv:URL',
    metrics: 'ym:pv:pageviews',
    date1: `${currentDays}daysAgo`,
    date2: `${currentDays + 1}daysAgo`
  });
  
  // Get previous period
  const previous = await apiGet('/stat/v1/data', {
    ids: cid,
    dimensions: 'ym:pv:URL',
    metrics: 'ym:pv:pageviews',
    date1: `${currentDays + previousDays}daysAgo`,
    date2: `${currentDays + 1}daysAgo`
  });
  
  const currentPages = {};
  const previousPages = {};
  
  parseReportData(current).forEach(p => { currentPages[p.name] = p['ym:pv:pageviews'] || 0; });
  parseReportData(previous).forEach(p => { previousPages[p.name] = p['ym:pv:pageviews'] || 0; });
  
  const hotTopics = [];
  
  Object.entries(currentPages).forEach(([url, currentViews]) => {
    const previousViews = previousPages[url] || 0;
    if (previousViews === 0 && currentViews >= minViews) {
      hotTopics.push({
        url,
        currentViews,
        previousViews,
        growthRate: Infinity,
        status: 'NEW'
      });
    } else if (previousViews > 0) {
      const growthRate = ((currentViews - previousViews) / previousViews) * 100;
      if (growthRate >= minGrowth && currentViews >= minViews) {
        hotTopics.push({
          url,
          currentViews,
          previousViews,
          growthRate: Math.round(growthRate),
          status: 'GROWING'
        });
      }
    }
  });
  
  hotTopics.sort((a, b) => b.growthRate - a.growthRate);
  
  if (hotTopics.length === 0) {
    console.log('No hot topics detected. Traffic is stable.');
    return [];
  }
  
  console.log(`Found ${hotTopics.length} hot topics:\n`);
  hotTopics.forEach((t, i) => {
    const icon = t.status === 'NEW' ? '🆕' : '📈';
    const rate = t.growthRate === Infinity ? 'NEW' : `+${t.growthRate}%`;
    console.log(`${i + 1}. ${icon} ${t.url}`);
    console.log(`   Views: ${t.previousViews} → ${t.currentViews} (${rate})`);
  });
  
  return hotTopics;
}

async function findContentGaps(cid, days = 30, limit = 20) {
  console.log(`\n🔍 Content Gap Analysis`);
  console.log(`Finding popular search queries without landing pages\n`);
  
  const phrases = await getSearchPhrases(cid, days, limit);
  const pages = await getTopPages(cid, days, 100);
  
  const pageUrls = parseReportData(pages).map(p => p.name.toLowerCase());
  const phraseData = parseReportData(phrases);
  
  // Get existing blog index to check coverage
  let blogIndex = [];
  try {
    const fs = await import('fs');
    const path = await import('path');
    const indexPath = path.join(process.cwd(), 'site/public/blog/index.json');
    if (fs.existsSync(indexPath)) {
      blogIndex = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    }
  } catch (e) {
    // No blog index available
  }
  
  const blogUrls = blogIndex.map(a => (a.url || '').toLowerCase());
  const allUrls = [...pageUrls, ...blogUrls];
  
  const gaps = phraseData.filter(phrase => {
    const query = phrase.name.toLowerCase();
    // Check if any existing page covers this query
    return !allUrls.some(url => url.includes(query.substring(0, Math.min(query.length, 20))));
  });
  
  if (gaps.length === 0) {
    console.log('No content gaps found. Good coverage!');
    return [];
  }
  
  console.log(`Found ${gaps.length} content gaps:\n`);
  gaps.slice(0, 10).forEach((g, i) => {
    console.log(`${i + 1}. "${g.name}" — ${g['ym:s:visits']} visits/month`);
  });
  
  return gaps;
}

// --- CLI ---

async function main() {
  const args = process.argv.slice(2);
  
  const getArg = (name) => {
    const idx = args.indexOf(`--${name}`);
    if (idx === -1) return null;
    return args[idx + 1];
  };
  
  const action = getArg('action');
  const days = parseInt(getArg('days') || '30');
  const url = getArg('url');
  const daysA = parseInt(getArg('days-a') || '7');
  const daysB = parseInt(getArg('days-b') || '14');
  const limit = parseInt(getArg('limit') || '20');
  
  if (!TOKEN) {
    console.error('Error: YANDEX_OAUTH_TOKEN not set in .env');
    process.exit(1);
  }
  
  try {
    const cid = await getCounterId('admin-ko');
    
    switch (action) {
      case 'top-pages': {
        console.log(`\n📊 Top Pages (last ${days} days)\n`);
        const report = await getTopPages(cid, days, limit);
        const pages = parseReportData(report);
        pages.forEach((p, i) => {
          console.log(`${i + 1}. ${p.name}`);
          console.log(`   Views: ${p['ym:pv:pageviews']} | Users: ${p['ym:pv:users']} | Avg Time: ${Math.round(p['ym:pv:avgVisitDurationSec'] || 0)}s | Bounce: ${Math.round((p['ym:pv:bounceRate'] || 0) * 100) / 100}%`);
        });
        break;
      }
      
      case 'traffic-sources': {
        console.log(`\n🔍 Traffic Sources (last ${days} days)\n`);
        const report = await getTrafficSources(cid, days, limit);
        const sources = parseReportData(report);
        sources.forEach((s, i) => {
          console.log(`${i + 1}. ${s.name || '(direct)'}`);
          console.log(`   Visits: ${s['ym:s:visits']} | Users: ${s['ym:s:users']} | Bounce: ${Math.round((s['ym:s:bounceRate'] || 0) * 100) / 100}%`);
        });
        break;
      }
      
      case 'search-phrases': {
        console.log(`\n🔎 Search Phrases (last ${days} days)\n`);
        const report = await getSearchPhrases(cid, days, limit);
        const phrases = parseReportData(report);
        phrases.forEach((p, i) => {
          console.log(`${i + 1}. "${p.name}" — ${p['ym:s:visits']} visits`);
        });
        break;
      }
      
      case 'landing-pages': {
        console.log(`\n🚪 Landing Pages (last ${days} days)\n`);
        const report = await getLandingPages(cid, days, limit);
        const pages = parseReportData(report);
        pages.forEach((p, i) => {
          console.log(`${i + 1}. ${p.name}`);
          console.log(`   Visits: ${p['ym:s:visits']} | Bounce: ${Math.round((p['ym:s:bounceRate'] || 0) * 100) / 100}%`);
        });
        break;
      }
      
      case 'page-stats': {
        if (!url) {
          console.error('Error: --url required for page-stats action');
          process.exit(1);
        }
        console.log(`\n📈 Stats for ${url} (last ${days} days)\n`);
        const report = await getPageStats(cid, url, days);
        const stats = parseReportData(report);
        if (stats.length === 0) {
          console.log('No data for this page.');
        } else {
          stats.forEach(s => {
            console.log(`Page: ${s.name}`);
            console.log(`Views: ${s['ym:pv:pageviews']} | Users: ${s['ym:pv:users']}`);
            console.log(`Avg Time: ${Math.round(s['ym:pv:avgVisitDurationSec'] || 0)}s`);
            console.log(`Bounce: ${Math.round((s['ym:pv:bounceRate'] || 0) * 100) / 100}%`);
          });
        }
        break;
      }
      
      case 'hot-topics': {
        await detectHotTopics(cid, daysA, daysB);
        break;
      }
      
      case 'content-gaps': {
        await findContentGaps(cid, days, limit);
        break;
      }
      
      case 'compare': {
        console.log(`\n📊 Period Comparison`);
        console.log(`Period A: last ${daysA} days`);
        console.log(`Period B: previous ${daysB} days\n`);
        
        const a = await getVisitsByDay(cid, daysA);
        const b = await getVisitsByDay(cid, daysB);
        
        const totalA = (a.data?.[0]?.data || []).reduce((sum, d) => sum + (d.metrics?.[0] || 0), 0);
        const totalB = (b.data?.[0]?.data || []).reduce((sum, d) => sum + (d.metrics?.[0] || 0), 0);
        const change = totalB > 0 ? ((totalA - totalB) / totalB * 100).toFixed(1) : 0;
        
        console.log(`Period A: ${totalA} visits`);
        console.log(`Period B: ${totalB} visits`);
        console.log(`Change: ${change > 0 ? '+' : ''}${change}%`);
        break;
      }
      
      case 'list-counters': {
        const data = await getCounters();
        console.log('\n📋 Available counters:\n');
        (data.counters || []).forEach(c => {
          console.log(`[${c.id}] ${c.name}`);
          console.log(`    Site: ${c.site}`);
          console.log(`    Status: ${c.status}\n`);
        });
        break;
      }
      
      default:
        console.log(`
Yandex Metrika Analytics for admin-ko.ru

Usage: node scripts/metrika-analytics.js --action <action> [options]

Actions:
  top-pages         Top pages by views           [--days 7] [--limit 20]
  traffic-sources   Traffic source breakdown     [--days 30]
  search-phrases    Search queries               [--days 30]
  landing-pages     Entry pages                  [--days 30]
  page-stats        Stats for specific page      --url "/blog/..."
  hot-topics        Detect growing topics        [--days-a 7] [--days-b 14]
  content-gaps      Find missing content         [--days 30]
  compare           Compare periods              [--days-a 7] [--days-b 14]
  list-counters     List all counters

Examples:
  node scripts/metrika-analytics.js --action top-pages --days 7
  node scripts/metrika-analytics.js --action hot-topics
  node scripts/metrika-analytics.js --action content-gaps --days 30
  node scripts/metrika-analytics.js --action page-stats --url "/blog/remont-iphone"
`);
    }
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
