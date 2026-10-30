const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('docs/index.html', 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const start = script.indexOf('  async function start(){');
const end = script.indexOf('  startBtn.addEventListener', start);
assert.notEqual(start, -1, 'live-demo start function is present');
assert.notEqual(end, -1, 'live-demo start function boundary is present');

const events = [];
const state = { startHidden: false, disabled: false, label: 'Start the live demo' };
const context = {
  WebSocket: { OPEN: 1 },
  ws: null,
  connect: async () => {},
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

(async () => {
  await context.start();

  assert.equal(state.startHidden, true, 'successful connection hides the start overlay');
  assert.equal(state.disabled, false, 'successful connection re-enables the start button');
  assert.equal(state.label, 'Connected', 'successful connection settles the start button label');
  assert.equal(context.pill.textContent, 'Live · nothing stored', 'successful connection marks the demo live');

  const overlayIndex = events.findIndex(([kind, value]) => kind === 'overlay' && value === true);
  const enabledIndex = events.findIndex(([kind, value]) => kind === 'disabled' && value === false);
  const labelIndex = events.findIndex(([kind, value]) => kind === 'label' && value === 'Connected');
  assert.ok(enabledIndex !== -1 && enabledIndex < overlayIndex,
    'button is re-enabled before the start overlay is hidden');
  assert.ok(labelIndex !== -1 && labelIndex < overlayIndex,
    'button label settles before the start overlay is hidden');

  console.log('PASS live-demo start-state regression (successful connection settles control before overlay hide)');
})();
