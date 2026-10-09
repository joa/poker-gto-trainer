// Flop-Handstärke: ordnet zwei Startkarten + drei Board-Karten in sechs Gruppen ein
// und zerlegt eine Range auf einem Flop in diese Gruppen. Vereinfachte Heuristik zum Lernen.
(function (root) {
  const RANK_ORDER = "23456789TJQKA";
  const val = (c) => RANK_ORDER.indexOf(c[0]) + 2; // 2..14
  const SUITS = ["s", "h", "d", "c"];
  const RANK_NAME = { 14: "Asse", 13: "Könige", 12: "Damen", 11: "Buben", 10: "Zehnen", 9: "Neunen", 8: "Achten", 7: "Siebenen", 6: "Sechsen", 5: "Fünfen", 4: "Vieren", 3: "Dreien", 2: "Zweien" };

  const GROUPS = [
    null,
    { name: "Sehr stark", detail: "Straße, Flush, Set, Drilling, Zwei Paare" },
    { name: "Gutes Paar", detail: "Top Pair, Overpair" },
    { name: "Mittel", detail: "zweites Paar, Flush-Draw, Open-Ender" },
    { name: "Schwaches Paar", detail: "Bottom Pair, kleines Pocket Pair" },
    { name: "Schwacher Draw", detail: "Gutshot, zwei Overcards, Ass-hoch, Backdoor-Flush-Draw" },
    { name: "Nichts", detail: "kein Paar, kein Draw" },
  ];

  // Faustregel: bis 1/2 Pot spielen Gruppen 1–5 weiter, bis Pot 1–4, bei Overbets 1–3.
  const maxGroupFor = (frac) => (frac <= 0.5 ? 5 : frac <= 1 ? 4 : 3);
  // Bet-Größen gegen den BB. `maxGroup` = schwächste Gruppe, die noch weiterspielt.
  const BETS = {};
  for (const [key, label, frac] of [
    ["quarter", "1/4 Pot", 1 / 4], ["small", "1/3 Pot", 1 / 3], ["half", "1/2 Pot", 1 / 2],
    ["twothirds", "2/3 Pot", 2 / 3], ["large", "3/4 Pot", 3 / 4], ["pot", "Pot", 1], ["over", "Overbet 1,5× Pot", 1.5],
  ]) BETS[key] = { label, frac, maxGroup: maxGroupFor(frac) };

  function isStraight(ranks) {
    const set = new Set(ranks);
    if (set.has(14)) set.add(1);
    for (let lo = 1; lo <= 10; lo++) {
      let ok = true;
      for (let r = lo; r < lo + 5; r++) if (!set.has(r)) { ok = false; break; }
      if (ok) return true;
    }
    return false;
  }

  // Anzahl der Ränge, die eine Straße vervollständigen würden (2 = Open-Ender, 1 = Gutshot).
  // Straßen, die schon mit dem Board allein entstehen, zählen nicht als eigener Draw.
  function straightOuts(ranks, boardRanks = []) {
    let outs = 0;
    for (let r = 2; r <= 14; r++) {
      if (ranks.includes(r)) continue;
      if (isStraight([...ranks, r]) && !isStraight([...boardRanks, r])) outs++;
    }
    return outs;
  }

  function evalFlop(hole, board) {
    const all = [...hole, ...board];
    const hv = hole.map(val).sort((a, b) => b - a);
    const bv = board.map(val);
    const boardDistinct = [...new Set(bv)].sort((a, b) => b - a);
    const top = boardDistinct[0];
    const boardCount = (r) => bv.filter((x) => x === r).length;
    const suitCount = (s) => all.filter((c) => c[1] === s).length;

    // ---- fertige Hände ----
    if (SUITS.some((s) => suitCount(s) >= 5)) return { group: 1, label: "Flush" };
    if (isStraight(all.map(val))) return { group: 1, label: "Straße" };

    let made = null; // { group, label }
    if (hv[0] === hv[1]) {
      const p = hv[0];
      const onBoard = boardCount(p);
      if (onBoard === 2) made = { group: 1, label: "Vierling" };
      else if (onBoard === 1) made = { group: 1, label: boardDistinct.length < 3 ? "Full House" : `Set (${RANK_NAME[p]})` };
      else if (p > top) made = { group: 2, label: `Overpair (${RANK_NAME[p]})` };
      else if (boardDistinct.length > 1 && p > boardDistinct[1]) made = { group: 3, label: `Pocket Pair unter der höchsten Board-Karte (${RANK_NAME[p]})` };
      else made = { group: 4, label: `kleines Pocket Pair (${RANK_NAME[p]})` };
    } else {
      const hits = hv.filter((r) => boardCount(r) > 0);
      if (hits.length === 2) {
        made = boardDistinct.length < 3 ? { group: 1, label: "Full House" } : { group: 1, label: "Zwei Paare" };
      } else if (hits.length === 1) {
        const r = hits[0];
        if (boardCount(r) === 2) made = { group: 1, label: `Drilling (${RANK_NAME[r]})` };
        else if (r === top) made = { group: 2, label: `Top Pair (${RANK_NAME[r]})` };
        else if (r === boardDistinct[1]) made = { group: 3, label: `zweites Paar (${RANK_NAME[r]})` };
        else made = { group: 4, label: `Bottom Pair (${RANK_NAME[r]})` };
      }
    }
    if (made && made.group === 1) return made;

    // ---- Draws ----
    const draws = [];
    let drawGroup = 6;
    const fdSuit = SUITS.find((s) => suitCount(s) === 4 && hole.some((c) => c[1] === s));
    if (fdSuit) { draws.push("Flush-Draw"); drawGroup = 3; }
    const so = straightOuts(all.map(val), bv);
    if (so >= 2) { draws.push("Open-Ended Straight Draw"); drawGroup = 3; }
    else if (so === 1) { draws.push("Gutshot"); drawGroup = Math.min(drawGroup, 5); }
    if (!made && hv[1] > top) { draws.push("zwei Overcards"); drawGroup = Math.min(drawGroup, 5); }
    else if (!made && !draws.length && hv[0] === 14) { draws.push("Ass-hoch"); drawGroup = 5; }
    // Backdoor-Flush-Draw: suited Hand plus genau eine Board-Karte dieser Farbe (braucht Turn und River).
    if (!fdSuit && hole[0][1] === hole[1][1] && suitCount(hole[0][1]) === 3) { draws.push("Backdoor-Flush-Draw"); drawGroup = Math.min(drawGroup, 5); }

    const group = Math.min(made ? made.group : 6, drawGroup);
    const parts = [made && made.label, ...draws].filter(Boolean);
    return { group, label: parts.length ? parts.join(" + ") : "nichts (kein Paar, kein Draw)" };
  }

  // Alle konkreten Kombos einer Handklasse, ohne Karten, die schon liegen.
  function combosOf(hand, dead) {
    const out = [];
    const [r1, r2] = [hand[0], hand[1]];
    for (const s1 of SUITS) for (const s2 of SUITS) {
      const a = r1 + s1, b = r2 + s2;
      if (hand.length === 2 && s1 >= s2) continue; // Paare: jede Kombination einmal
      if (hand[2] === "s" && s1 !== s2) continue;
      if (hand[2] === "o" && s1 === s2) continue;
      if (dead.has(a) || dead.has(b)) continue;
      out.push([a, b]);
    }
    return out;
  }

  // Zerlegt eine Range (Set von Handklassen) auf einem Board in die sechs Gruppen.
  function breakdown(range, board) {
    const dead = new Set(board);
    const counts = [0, 0, 0, 0, 0, 0, 0];
    const perHand = {};
    let total = 0;
    for (const hand of range) {
      const hc = [0, 0, 0, 0, 0, 0, 0];
      for (const combo of combosOf(hand, dead)) {
        const g = evalFlop(combo, board).group;
        hc[g]++; counts[g]++; total++;
      }
      perHand[hand] = hc;
    }
    const pct = counts.map((c) => (total ? (c / total) * 100 : 0));
    return { pct, perHand, total };
  }

  function randomBoard(n = 3) {
    const deck = [];
    for (const r of RANK_ORDER) for (const s of SUITS) deck.push(r + s);
    for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
    // Flop sortiert, Turn und River in der Reihenfolge, in der sie kommen.
    return [...deck.slice(0, 3).sort((a, b) => val(b) - val(a)), ...deck.slice(3, n)];
  }

  // ---- River: Value-Bet, Bluff oder Checken? ----
  const RIVER_CATS = {
    value: { name: "Value", detail: "Top Pair oder besser", action: "value" },
    showdown: { name: "Showdown-Value", detail: "mittleres oder kleines Paar, Ass-hoch", action: "check" },
    bluff: { name: "Verpasster Draw", detail: "kein Paar, aber Flush- oder Straight-Draw verpasst", action: "bluff" },
    giveup: { name: "Nichts", detail: "kein Paar, kein verpasster Draw", action: "check" },
  };
  const RIVER_BET = 0.75; // Bet-Größe am River als Anteil am Pot
  const bluffShare = (frac) => frac / (1 + 2 * frac);

  // Fertige Hand mit 5 Board-Karten. Nur Hände, zu denen deine Karten beitragen.
  function riverMade(hole, board) {
    const all = [...hole, ...board];
    const hv = hole.map(val).sort((a, b) => b - a);
    const bv = board.map(val);
    const boardDistinct = [...new Set(bv)].sort((a, b) => b - a);
    const top = boardDistinct[0];
    const boardCount = (r) => bv.filter((x) => x === r).length;
    const flushSuit = SUITS.find((s) => all.filter((c) => c[1] === s).length >= 5);
    if (flushSuit && hole.some((c) => c[1] === flushSuit) && board.filter((c) => c[1] === flushSuit).length < 5) return { strong: true, label: "Flush" };
    if (isStraight(all.map(val)) && !isStraight(bv)) return { strong: true, label: "Straße" };
    if (hv[0] === hv[1]) {
      const p = hv[0], on = boardCount(p);
      if (on >= 1) return { strong: true, label: on === 2 ? "Vierling" : boardDistinct.length < board.length ? "Full House" : `Set (${RANK_NAME[p]})` };
      if (p > top) return { strong: true, label: `Overpair (${RANK_NAME[p]})` };
      return { strong: false, label: p > boardDistinct[1] ? `Pocket Pair unter der höchsten Board-Karte (${RANK_NAME[p]})` : `kleines Pocket Pair (${RANK_NAME[p]})` };
    }
    const hits = hv.filter((r) => boardCount(r) > 0);
    if (hits.length === 2) return { strong: true, label: "Zwei Paare" };
    if (hits.length === 1) {
      const r = hits[0];
      if (boardCount(r) >= 2) return { strong: true, label: `Drilling (${RANK_NAME[r]})` };
      if (r === top) return { strong: true, label: `Top Pair (${RANK_NAME[r]})` };
      return { strong: false, label: r === boardDistinct[1] ? `zweites Paar (${RANK_NAME[r]})` : `kleines Paar (${RANK_NAME[r]})` };
    }
    return null;
  }

  // Welcher echte Draw (kein Backdoor) war auf Flop oder Turn da?
  function missedDraw(hole, board) {
    for (const n of [3, 4]) {
      const parts = evalFlop(hole, board.slice(0, n)).label.split(" + ");
      if (parts.includes("Flush-Draw")) return "Flush-Draw";
      if (parts.includes("Open-Ended Straight Draw")) return "Straight-Draw";
      if (parts.includes("Gutshot")) return "Gutshot";
    }
    return null;
  }

  function classifyRiver(hole, board) {
    const made = riverMade(hole, board);
    if (made) return { cat: made.strong ? "value" : "showdown", label: made.label };
    const draw = missedDraw(hole, board);
    if (draw) return { cat: "bluff", label: `kein Paar, verpasster ${draw}` };
    if (hole.some((c) => c[0] === "A")) return { cat: "showdown", label: "Ass-hoch" };
    return { cat: "giveup", label: "kein Paar, kein verpasster Draw" };
  }

  // Blocker-Hinweis: Ass der Farbe, in der auf dem Board ein Flush möglich ist.
  function nutFlushBlocker(hole, board) {
    const suit = SUITS.find((s) => board.filter((c) => c[1] === s).length >= 3);
    return suit && hole.includes("A" + suit) ? suit : null;
  }

  function riverBreakdown(range, board) {
    const dead = new Set(board);
    const counts = { value: 0, showdown: 0, bluff: 0, giveup: 0 };
    const perHand = {};
    let total = 0;
    for (const hand of range) {
      const hc = { value: 0, showdown: 0, bluff: 0, giveup: 0 };
      for (const combo of combosOf(hand, dead)) {
        const k = classifyRiver(combo, board).cat;
        hc[k]++; counts[k]++; total++;
      }
      perHand[hand] = hc;
    }
    const pct = {};
    for (const k in counts) pct[k] = total ? (counts[k] / total) * 100 : 0;
    return { pct, perHand, total };
  }

  const api = { GROUPS, BETS, maxGroupFor, evalFlop, combosOf, breakdown, randomBoard, isStraight, straightOuts,
    RIVER_CATS, RIVER_BET, bluffShare, classifyRiver, riverBreakdown, nutFlushBlocker };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.POSTFLOP = api;
})(typeof window !== "undefined" ? window : globalThis);
