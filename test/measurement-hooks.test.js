const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('docs/index.html', 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];

assert.match(html, /<input type="hidden" id="s-source" name="source" value="direct">/,
  'early-access source is carried as a non-visible form field');
assert.match(html, /data-cta="header"/,
  'header early-access CTA has a measurable source');
assert.match(html, /data-cta="hero"/,
  'hero early-access CTA has a measurable source');
assert.match(script, /source:f\('s-source'\)\.value\|\|signupSource/,
  'submitted early-access payload includes the CTA source');
assert.match(script, /thinking-memory:early-access-submitted/,
  'successful early-access delivery exposes a local measurement event');
assert.match(script, /thinking-memory:live-demo-question/,
  'live-demo question send exposes a local measurement event');

const questionEvent = script.indexOf("thinking-memory:live-demo-question");
const questionSend = script.indexOf("ws.send(JSON.stringify({type:'utterance',text}))");
assert.ok(questionEvent !== -1 && questionEvent < questionSend,
  'live-demo question measurement happens immediately before the existing WebSocket send');
assert.doesNotMatch(html, /<(script|img|iframe)[^>]+(?:google-analytics|googletagmanager|plausible|posthog)/i,
  'measurement draft adds no external analytics service');

console.log('PASS measurement hooks regression (early-access source + successful form/demo events)');
