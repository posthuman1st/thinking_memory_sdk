const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('docs/index.html', 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const start = script.indexOf('  async function start(){');
const end = script.indexOf('  startBtn.addEventListener', start);
assert.notEqual(start, -1, 'live-demo start function is present');
assert.notEqual(end, -1, 'live-demo start function boundary is present');

function makeContext(connect, ws = null, startHidden = false) {
  const events = [];
  const state = { startHidden, disabled: false, label: 'Start the live demo' };
  const context = {
    WebSocket: { OPEN: 1 },
    ws,
    connect,
    failText: () => 'unexpected failure',
    performance: { now: () => 52 },
    startRow: {},
    startBtn: {},
    startNote: { textContent: '' },
    pill: { textContent: '' },
    input: { focus: options => events.push(['focus', options]) },
    add: () => events.push(['message']),
  };
  Object.defineProperty(context.startBtn, 'disabled', {
    get: () => state.disabled,
    set: value => { state.disabled = value; events.push(['disabled', value]); },
  });
  Object.defineProperty(context.startBtn, 'textContent', {
    get: () => state.label,
    set: value => { state.label = value; events.push(['label', value]); },
  });
  Object.defineProperty(context.startRow, 'hidden', {
    get: () => state.startHidden,
    set: value => { state.startHidden = value; events.push(['overlay', value]); },
  });
  vm.runInNewContext(`this.start = ${script.slice(start, end)}`, context);
  return { context, events, state };
}

(async () => {
  let resolveOpening;
  const opening = new Promise(resolve => { resolveOpening = resolve; });
  const pendingCase = makeContext(() => opening);
  const pendingStart = pendingCase.context.start();
  await Promise.resolve();
  assert.equal(pendingCase.state.startHidden, false, 'pending connection keeps the start overlay visible');
  assert.equal(pendingCase.state.disabled, true, 'pending connection disables the start control');
  assert.equal(pendingCase.state.label, 'Connecting…', 'pending connection exposes its status');
  resolveOpening();
  await pendingStart;
  assert.equal(pendingCase.state.startHidden, true, 'successful connection hides the start overlay');
  assert.equal(pendingCase.state.disabled, false, 'successful connection re-enables the start button');
  assert.equal(pendingCase.state.label, 'Connected', 'successful connection settles the start button label');
  assert.equal(pendingCase.context.pill.textContent, 'Live · nothing stored', 'successful connection marks the demo live');

  const failedCase = makeContext(async () => { throw 17; });
  await failedCase.context.start();
  assert.equal(failedCase.state.startHidden, false, 'failed connection keeps the start overlay visible');
  assert.equal(failedCase.state.disabled, false, 'failed connection restores an enabled start control');
  assert.equal(failedCase.state.label, 'Try again', 'failed connection keeps the retry action');
  assert.equal(failedCase.context.pill.textContent, 'Live demo · offline', 'failed connection marks the demo offline');

  const openCase = makeContext(async () => {}, { readyState: 1 });
  await openCase.context.start();
  assert.equal(openCase.state.startHidden, true, 'an already-open connection repairs a visible start overlay');
  assert.equal(openCase.state.label, 'Connected', 'an already-open connection settles the label');
  assert.equal(openCase.events.filter(([kind]) => kind === 'message').length, 1,
    'an already-open connection records one connected message');

  const noOpCase = makeContext(async () => { throw new Error('should not connect'); }, { readyState: 1 }, true);
  await noOpCase.context.start();
  assert.deepEqual(noOpCase.events, [], 'a hidden start overlay is a safe no-op');

  console.log('PASS live-demo start-state regression (pending, click repair, and hidden no-op outcomes)');
})();
