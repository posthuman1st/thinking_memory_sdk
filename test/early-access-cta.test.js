const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('docs/index.html', 'utf8');

const expectedLinks = [
  /<a class="btn primary" href="#early-access"(?: data-cta="[^"]+")?>Request early access<\/a>/,
  /<a class="btn primary" href="#early-access"(?: data-cta="[^"]+")?>Request early access →<\/a>/,
];
for (const link of expectedLinks) {
  assert.match(html, link, 'early-access link remains prominent and points to the form');
}

assert.match(html, /<button class="btn primary" type="submit" id="s-submit">Request early access<\/button>/,
  'the form action names the requested early-access outcome');
assert.match(html, /cta\.textContent='Request early access'/,
  'the generated footer CTA uses the same early-access action');
assert.doesNotMatch(html, />Get early access →</, 'old hero CTA wording is removed');
assert.doesNotMatch(html, />Sign up for a call</, 'ambiguous call-only CTA wording is removed');

console.log('PASS early-access CTA regression (header, hero, form, and footer action labels)');
