const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('docs/index.html', 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const start = script.indexOf('  function hasAnswerEvidence(a){');
const end = script.indexOf('  function patchHTML(', start);
assert.notEqual(start, -1, 'evidence guard is present in the live-demo script');
assert.notEqual(end, -1, 'answer renderer boundary is present in the live-demo script');

const context = { esc: value => String(value), bold: () => 'rendered answer', chain: () => '', timingHTML: () => '' };
vm.runInNewContext(`${script.slice(start, end)};this.answerHTML=answerHTML;`, context);

const fallback = `<div class="a">I don't know.</div><div class="meta"><span>Nothing in the graph answers that yet. Try a person, a place, a film or a company.</span></div>`;
const cases = [
  ['empty evidence', { text: 'untrusted answer', evidence: [] }],
  ['missing evidence', { text: 'untrusted answer' }],
  ['malformed evidence row', { text: 'untrusted answer', evidence: [['subject', 'relation', '']] }],
  ['null evidence row', { text: 'untrusted answer', evidence: [['subject', 'relation', 'object', null]] }],
  ['whitespace evidence field', { text: 'untrusted answer', evidence: [['subject', 'relation', 'object', '   ']] }],
];

for (const [name, answer] of cases) {
  assert.equal(context.answerHTML(answer, 0), fallback, `${name} uses the safe fallback`);
}

const supported = {
  text: 'A supported answer',
  evidence: [['subject', 'relation', 'object', 'source']],
  values: [],
  ms: 1,
};
assert.match(context.answerHTML(supported, 0), /rendered answer/, 'well-formed evidence keeps the answer path');

console.log(`PASS live-demo fallback regression (${cases.length} empty/malformed cases + valid evidence control)`);
