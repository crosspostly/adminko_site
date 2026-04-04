/**
 * seo-audit-check.js — SEO/GEO Auditor integration for the content pipeline
 * 
 * Runs IndexLift SEO Auditor on newly generated articles before publishing.
 * If score < threshold, flags article for revision.
 * 
 * Usage:
 *   node scripts/seo-audit-check.js --file site/public/blog/article.html --min-score 80
 *   node scripts/seo-audit-check.js --all-recent --days 1
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const AUDITOR_DIR = path.join(__dirname, '../seo_skill_repo_tmp/.agents/skills/indexlift-seo-auditor');
const OUTPUT_DIR = path.join(__dirname, '../logs/seo-audits');
const MIN_SCORE = parseInt(process.env.SEO_MIN_SCORE || '80');

// Ensure output dir exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function runAudit(url, tier = 'basic') {
  const cmd = `node scripts/run-audit.js --url "${url}" --tier ${tier} --engines google,yandex --output "${OUTPUT_DIR}/"`;
  
  try {
    const result = execSync(cmd, {
      cwd: AUDITOR_DIR,
      encoding: 'utf-8',
      timeout: 120000
    });
    
    // Parse the output to find score
    const scoreMatch = result.match(/Overall score: (\d+)\/100 \(([A-F])\)/);
    const failuresMatch = result.match(/Failures:\s+(\d+)/);
    const warningsMatch = result.match(/Warnings:\s+(\d+)/);
    const mdMatch = result.match(/Markdown:\s+(.+)/);
    
    return {
      success: true,
      score: scoreMatch ? parseInt(scoreMatch[1]) : null,
      grade: scoreMatch ? scoreMatch[2] : null,
      failures: failuresMatch ? parseInt(failuresMatch[1]) : null,
      warnings: warningsMatch ? parseInt(warningsMatch[1]) : null,
      reportPath: mdMatch ? mdMatch[1].trim() : null,
      rawOutput: result,
      passed: scoreMatch ? parseInt(scoreMatch[1]) >= MIN_SCORE : false
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      passed: false
    };
  }
}

function auditFile(filePath, baseUrl = null) {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return { success: false, error: 'File not found' };
  }
  
  // Read the HTML file
  const html = fs.readFileSync(filePath, 'utf-8');
  
  // Extract URL from the file or use base URL
  let url = baseUrl;
  if (!url) {
    // Try to extract URL from JSON-LD or use file path
    const urlMatch = html.match(/"url":\s*"([^"]+)"/);
    if (urlMatch) {
      url = urlMatch[1];
    } else {
      // Construct URL from file path
      const relativePath = path.relative(path.join(__dirname, '../site/public'), filePath);
      url = `https://admin-ko.ru/${relativePath}`;
    }
  }
  
  console.log(`\n🔍 SEO Audit: ${url}`);
  console.log(`File: ${filePath}\n`);
  
  const result = runAudit(url);
  
  if (result.success) {
    const icon = result.passed ? '✅' : '⚠️';
    console.log(`${icon} Score: ${result.score}/100 (${result.grade})`);
    console.log(`   Failures: ${result.failures} | Warnings: ${result.warnings}`);
    if (result.reportPath) {
      console.log(`   Report: ${result.reportPath}`);
    }
    
    if (!result.passed) {
      console.log(`\n⚠️ Score ${result.score} < ${MIN_SCORE} minimum`);
      console.log('   Article flagged for revision.');
    }
  } else {
    console.error(`❌ Audit failed: ${result.error}`);
  }
  
  return result;
}

function auditAllRecent(days = 1) {
  const blogDir = path.join(__dirname, '../site/public/blog');
  if (!fs.existsSync(blogDir)) {
    console.error('Blog directory not found');
    return [];
  }
  
  const blogIndex = JSON.parse(fs.readFileSync(path.join(blogDir, 'index.json'), 'utf-8'));
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  
  const recent = blogIndex.filter(a => {
    const date = a.date ? new Date(a.date) : null;
    return date && date >= cutoff;
  });
  
  console.log(`\n🔍 Auditing ${recent.length} recent articles (last ${days} days)\n`);
  
  const results = [];
  recent.forEach((article, i) => {
    console.log(`[${i + 1}/${recent.length}] ${article.title || article.url}`);
    const url = `https://admin-ko.ru${article.url || `/blog/${article.file}`}`;
    const result = runAudit(url);
    results.push({ article: article.title || article.url, ...result });
    
    const icon = result.passed ? '✅' : '⚠️';
    console.log(`   ${icon} ${result.score ? result.score + '/100' : 'N/A'}\n`);
  });
  
  // Summary
  const passed = results.filter(r => r.passed).length;
  const failed = results.length - passed;
  console.log(`\n📊 Summary: ${passed} passed, ${failed} flagged for revision`);
  
  return results;
}

// --- CLI ---

const args = process.argv.slice(2);

const getArg = (name) => {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1) return null;
  return args[idx + 1];
};

const file = getArg('file');
const allRecent = args.includes('--all-recent');
const days = parseInt(getArg('days') || '1');
const minScore = parseInt(getArg('min-score') || MIN_SCORE);

if (file) {
  const result = auditFile(file);
  process.exit(result.passed ? 0 : 1);
} else if (allRecent) {
  const results = auditAllRecent(days);
  const allPassed = results.every(r => r.passed);
  process.exit(allPassed ? 0 : 1);
} else {
  console.log(`
SEO Audit Check — Integration with content pipeline

Usage:
  node scripts/seo-audit-check.js --file <path> [--min-score 80]
  node scripts/seo-audit-check.js --all-recent [--days 1]

Options:
  --file         Path to HTML file to audit
  --all-recent   Audit all articles published in last N days
  --days         Number of days back (default: 1)
  --min-score    Minimum passing score (default: ${MIN_SCORE})

Examples:
  node scripts/seo-audit-check.js --file site/public/blog/new-article.html
  node scripts/seo-audit-check.js --all-recent --days 7
`);
}
