const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('docs/index.html', 'utf8');
const canonicalUrl = 'https://posthuman1st.github.io/thinking_memory_sdk/';

assert.match(html, new RegExp(`<meta property="og:url" content="${canonicalUrl.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}">`),
  'Open Graph URL points to the reachable Thinking Memory site');
assert.doesNotMatch(html, /<meta property="og:url" content="https:\/\/posthuman1st\.github\.io\/thinking_memory\/">/,
  'Open Graph URL does not point to the obsolete path');

console.log('PASS Open Graph URL regression');
