// Run with: node test-ranges.js
const assert = require("assert");
const G = require("./ranges.js");

const has = (str, hands) => { const s = G.parseRange(str); return hands.every((h) => s.has(h)); };
const lacks = (str, hands) => { const s = G.parseRange(str); return hands.every((h) => !s.has(h)); };

// Parser
assert.deepStrictEqual([...G.parseRange("22+")].length, 13);
assert(has("77+", ["77", "AA", "TT"]) && lacks("77+", ["66"]));
assert(has("99-55", ["99", "55", "77"]) && lacks("99-55", ["TT", "44"]));
assert.deepStrictEqual([...G.parseRange("ATs+")].sort(), ["AJs", "AKs", "AQs", "ATs"]);
assert.deepStrictEqual([...G.parseRange("T8s+")].sort(), ["T8s", "T9s"]);
assert.deepStrictEqual([...G.parseRange("A5s-A3s")].sort(), ["A3s", "A4s", "A5s"]);
assert.deepStrictEqual([...G.parseRange("KQo")], ["KQo"]);
assert.deepStrictEqual([...G.parseRange("AK")].sort(), ["AKo", "AKs"]);
assert.throws(() => G.parseRange("KAs"));
assert.strictEqual(G.rangePercent(new Set(G.ALL_HANDS)), 100);

// Grid mapping round-trips
for (let r = 0; r < 13; r++) for (let c = 0; c < 13; c++) {
  assert.deepStrictEqual(G.handCell(G.cellHand(r, c)), [r, c]);
}
assert.strictEqual(G.cellHand(0, 1), "AKs");
assert.strictEqual(G.cellHand(1, 0), "AKo");

// Every chart parses
for (const k in G.RFI) G.parseRange(G.RFI[k]);
for (const t in G.VS_OPEN) for (const h in G.VS_OPEN[t]) {
  G.parseRange(G.VS_OPEN[t][h].threeBet); G.parseRange(G.VS_OPEN[t][h].call);
}

// RFI widens monotonically as fewer players are left behind, and stays nested
const pct = {};
for (const k in G.RFI) pct[k] = G.rangePercent(G.parseRange(G.RFI[k]));
console.log("RFI %:", Object.entries(pct).map(([k, v]) => `${k}:${v.toFixed(1)}`).join("  "));
for (let b = 8; b > 2; b--) {
  assert(pct[b] < pct[b - 1], `RFI ${b} behind should be tighter than ${b - 1}`);
  const tight = G.parseRange(G.RFI[b]), loose = G.parseRange(G.RFI[b - 1]);
  for (const h of tight) assert(loose.has(h), `${h} in ${b}-behind range but not ${b - 1}`);
}
const inBand = (v, lo, hi, name) => assert(v >= lo && v <= hi, `${name} ${v.toFixed(1)}% outside ${lo}-${hi}`);
inBand(pct[5], 14, 19, "6-max UTG");
inBand(pct[4], 18, 24, "HJ");
inBand(pct[3], 25, 31, "CO");
inBand(pct[2], 42, 52, "BTN");
inBand(pct.SB, 36, 48, "SB");
inBand(pct.HU, 72, 88, "HU BTN");

// Every table size yields labels and charts for every position and every valid vs-open spot
for (let n = 2; n <= 9; n++) {
  const pos = G.positions(n);
  assert.strictEqual(pos.length, n);
  for (const p of pos) {
    if (p !== "BB") assert(G.rfiRange(n, p).size > 0, `no RFI chart for ${p} at ${n}`);
  }
  for (let i = 0; i < n - 1; i++) for (let j = i + 1; j < n; j++) {
    const v = G.vsOpenRanges(n, pos[i], pos[j]);
    assert(v, `no vs-open chart: ${pos[j]} vs ${pos[i]} at ${n}`);
    for (const h of v.call) assert(!v.threeBet.has(h));
  }
}

// Dealt cards match their class
for (const h of G.ALL_HANDS) {
  const [a, b] = G.dealHand(h);
  assert.strictEqual(a[0] + b[0], h.slice(0, 2));
  assert(a !== b);
  if (h.length === 3) assert.strictEqual(a[1] === b[1], h[2] === "s");
}

// Example hands: preflop answers must match the charts, cards must not repeat
global.window = {};
require("./examples.js");
const toAction = (label) => /^Passen/.test(label) ? "fold" : /^Mitgehen/.test(label) ? "call" : /^Erhöhen/.test(label) ? "raise" : /^3-Bet/.test(label) ? "threeBet" : null;
const handClass = ([a, b]) => {
  const [hi, lo] = G.RANKS.indexOf(a[0]) <= G.RANKS.indexOf(b[0]) ? [a, b] : [b, a];
  return hi[0] === lo[0] ? hi[0] + lo[0] : hi[0] + lo[0] + (hi[1] === lo[1] ? "s" : "o");
};
for (const ex of window.EXAMPLES) {
  const hand = handClass(ex.heroCards);
  const pre = ex.steps[0];
  assert.strictEqual(pre.street, "preflop", ex.id);
  const opener = Object.entries(pre.notes || {}).find(([, n]) => n.startsWith("Erhöht"));
  let expected;
  if (opener) {
    const v = G.vsOpenRanges(ex.players, opener[0], ex.hero);
    expected = v.threeBet.has(hand) ? "threeBet" : v.call.has(hand) ? "call" : "fold";
  } else {
    expected = G.rfiRange(ex.players, ex.hero).has(hand) ? "raise" : "fold";
  }
  assert.strictEqual(toAction(pre.options[pre.answer]), expected, `${ex.id}: preflop answer disagrees with chart for ${hand}`);
  for (const st of ex.steps) {
    const cards = [...ex.heroCards, ...st.board];
    assert.strictEqual(new Set(cards).size, cards.length, `${ex.id}: duplicate card`);
    assert(st.answer < st.options.length && (st.ok || []).every((i) => i < st.options.length && i !== st.answer), ex.id);
  }
}

// Flop hand strength groups
const P = require("./postflop.js");
const flopCases = [
  [["9h", "8h"], ["7s", "6d", "5c"], 1], // straight
  [["6c", "5h"], ["7s", "6d", "5c"], 1], // two pair
  [["5s", "5d"], ["Kh", "Kc", "5d"].map((c) => c === "5d" ? "5c" : c), 1], // full house
  [["Ks", "Qd"], ["Kh", "Kc", "5d"], 1], // trips
  [["As", "Ks"], ["Qs", "Js", "2s"], 1], // flush
  [["As", "Kd"], ["Ah", "7c", "2d"], 2], // top pair
  [["Qs", "Qd"], ["9h", "6c", "2d"], 2], // overpair
  [["8s", "4d"], ["Kh", "8c", "3d"], 3], // second pair
  [["Kh", "Th"], ["Jh", "6h", "2c"], 3], // flush draw
  [["9s", "8s"], ["Jh", "Tc", "2d"], 3], // open-ender
  [["3s", "2d"], ["Kh", "8c", "3d"], 4], // bottom pair
  [["2s", "2d"], ["Kh", "8c", "3d"], 4], // small pocket pair
  [["As", "Kd"], ["7s", "6d", "5c"], 5], // two overcards
  [["Js", "4d"], ["Ah", "Kc", "Qd"], 5], // gutshot
  [["As", "5d"], ["Kh", "8c", "3d"], 5], // ace high
  [["Qh", "4h"], ["Kh", "8c", "3d"], 5], // backdoor flush draw
  [["Qs", "4d"], ["Kh", "8c", "3d"], 6], // nothing
];
for (const [hole, board, g] of flopCases) {
  const ev = P.evalFlop(hole, board);
  assert.strictEqual(ev.group, g, `${hole.join("")} on ${board.join(" ")}: expected group ${g}, got ${ev.group} (${ev.label})`);
}
// Breakdown sums to 100% and blocks board cards
const bbCall = G.vsOpenRanges(6, "BTN", "BB").call;
for (let i = 0; i < 50; i++) {
  const board = P.randomBoard();
  assert.strictEqual(new Set(board).size, 3);
  const bd = P.breakdown(bbCall, board);
  assert(Math.abs(bd.pct.reduce((a, b) => a + b, 0) - 100) < 1e-6);
  for (const h of bbCall) for (const c of P.combosOf(h, new Set(board))) assert(!board.includes(c[0]) && !board.includes(c[1]));
}
// Bet sizes: bigger bets never let more groups continue
const sizes = Object.values(P.BETS).sort((a, b) => a.frac - b.frac);
for (let i = 1; i < sizes.length; i++) assert(sizes[i].maxGroup <= sizes[i - 1].maxGroup, sizes[i].label);
assert.deepStrictEqual([P.BETS.small.maxGroup, P.BETS.half.maxGroup, P.BETS.twothirds.maxGroup, P.BETS.pot.maxGroup, P.BETS.over.maxGroup], [5, 5, 4, 4, 3]);
// River categories
const riverCases = [
  [["Qs", "Js"], ["Ts", "9d", "3s", "4h", "2c"], "bluff"],    // missed flush + straight draw
  [["7s", "6s"], ["9h", "8c", "2d", "Kc", "Ad"], "bluff"],    // missed open-ender
  [["As", "Kd"], ["Ah", "7c", "2d", "5s", "Kc"], "value"],    // two pair
  [["Ah", "3h"], ["Kh", "9h", "7h", "4s", "2c"], "value"],    // flush
  [["Ks", "4d"], ["Kh", "9c", "7d", "3s", "2h"], "value"],    // top pair
  [["8s", "8d"], ["Kh", "7c", "2d", "5s", "3c"], "showdown"], // pocket pair under top card
  [["As", "5d"], ["Kh", "9c", "7d", "4s", "2c"], "showdown"], // ace high, no draw
  [["Qd", "4c"], ["Kh", "9c", "7d", "3s", "2h"], "giveup"],   // nothing
  [["Ad", "Kd"], ["Ts", "9s", "8s", "7s", "6s"], "showdown"], // board straight flush: ace high plays the board
];
for (const [hole, board, cat] of riverCases) {
  const r = P.classifyRiver(hole, board);
  assert.strictEqual(r.cat, cat, `${hole.join("")} on ${board.join(" ")}: expected ${cat}, got ${r.cat} (${r.label})`);
}
assert.strictEqual(P.nutFlushBlocker(["As", "2d"], ["Ks", "9s", "7s", "4d", "Jd"]), "s");
assert.strictEqual(Math.round(P.bluffShare(0.75) * 100), 30);
const rb = P.riverBreakdown(G.rfiRange(6, "BTN"), P.randomBoard(5));
assert(Math.abs(Object.values(rb.pct).reduce((a, b) => a + b, 0) - 100) < 1e-6);
assert.strictEqual(P.combosOf("AKs", new Set()).length, 4);
assert.strictEqual(P.combosOf("AKo", new Set()).length, 12);
assert.strictEqual(P.combosOf("QQ", new Set()).length, 6);
assert.strictEqual(P.combosOf("QQ", new Set(["Qh"])).length, 3);

console.log("All tests passed.");
