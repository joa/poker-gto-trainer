// Simplified GTO-style preflop charts for 100bb cash games, no antes.
// These are approximations of solver output, meant for learning the fundamentals.
(function (root) {
  const RANKS = "AKQJT98765432"; // index 0 = Ace (strongest)
  const SUITS = ["s", "h", "d", "c"];

  const rankIdx = (r) => RANKS.indexOf(r);

  // Hand class for grid cell (row, col): pairs on the diagonal, suited above, offsuit below.
  function cellHand(row, col) {
    if (row === col) return RANKS[row] + RANKS[col];
    if (row < col) return RANKS[row] + RANKS[col] + "s";
    return RANKS[col] + RANKS[row] + "o";
  }

  function handCell(hand) {
    const a = rankIdx(hand[0]);
    const b = rankIdx(hand[1]);
    if (hand.length === 2) return [a, a];
    return hand[2] === "s" ? [a, b] : [b, a];
  }

  const ALL_HANDS = [];
  for (let r = 0; r < 13; r++) for (let c = 0; c < 13; c++) ALL_HANDS.push(cellHand(r, c));

  function combos(hand) {
    if (hand.length === 2) return 6;
    return hand[2] === "s" ? 4 : 12;
  }

  // Parses PokerStove-style notation: "77+", "99-55", "ATs+", "A5s-A2s", "KQo", "AK", "T8s+".
  function parseRange(str) {
    const set = new Set();
    if (!str) return set;
    for (let raw of str.split(",")) {
      const tok = raw.trim();
      if (!tok) continue;
      const m = tok.match(/^([AKQJT2-9])([AKQJT2-9])([so]?)(\+?)(?:-([AKQJT2-9])([AKQJT2-9])([so]?))?$/);
      if (!m) throw new Error("Bad range token: " + tok);
      const [, h, k, suit, plus, h2, k2, suit2] = m;
      const hi = rankIdx(h);
      const lo = rankIdx(k);
      const suits = suit ? [suit] : ["s", "o"];

      if (hi === lo) {
        // Pairs
        let from = hi, to = hi;
        if (plus) { from = 0; }
        if (h2) { to = rankIdx(h2); }
        const a = Math.min(from, to), b = Math.max(from, to);
        for (let i = a; i <= b; i++) set.add(RANKS[i] + RANKS[i]);
        continue;
      }
      if (hi > lo) throw new Error("Write high card first: " + tok);
      if (h2 && (h2 !== h || (suit2 || "") !== suit)) throw new Error("Span must keep the high card and suitedness: " + tok);

      let kFrom = lo, kTo = lo;
      if (plus) kTo = hi + 1; // kicker climbs up to one below the high card
      if (h2) kTo = rankIdx(k2);
      const a = Math.min(kFrom, kTo), b = Math.max(kFrom, kTo);
      for (let i = a; i <= b; i++) for (const s of suits) set.add(h + RANKS[i] + s);
    }
    return set;
  }

  // ---- Raise-first-in (RFI) charts, keyed by how many players are left to act behind ----
  const RFI = {
    8: "77+, A9s+, A5s-A4s, KTs+, QTs+, JTs, T9s, AJo+, KQo",
    7: "66+, A8s+, A5s-A4s, KTs+, QTs+, JTs, T9s, 98s, AJo+, KQo",
    6: "55+, A7s+, A5s-A3s, K9s+, Q9s+, J9s+, T9s, 98s, 87s, ATo+, KJo+",
    5: "55+, A2s+, K9s+, Q9s+, J9s+, T9s, 98s, 87s, 76s, 65s, ATo+, KJo+, QJo",
    4: "44+, A2s+, K8s+, Q9s+, J9s+, T8s+, 97s+, 86s+, 76s, 65s, A9o+, KTo+, QJo",
    3: "22+, A2s+, K7s+, Q8s+, J8s+, T8s+, 97s+, 86s+, 75s+, 65s, 54s, A7o+, K9o+, QTo+, JTo, T9o",
    2: "22+, A2s+, K2s+, Q4s+, J6s+, T6s+, 96s+, 85s+, 74s+, 63s+, 53s+, 43s, A2o+, K7o+, Q8o+, J8o+, T8o+, 98o, 87o",
    SB: "22+, A2s+, K2s+, Q3s+, J5s+, T6s+, 96s+, 85s+, 75s+, 64s+, 54s, A2o+, K8o+, Q9o+, J9o+, T9o",
    HU: "22+, A2s+, K2s+, Q2s+, J2s+, T2s+, 92s+, 82s+, 72s+, 62s+, 52s+, 42s+, 32s, A2o+, K2o+, Q2o+, J4o+, T6o+, 96o+, 85o+, 75o+, 64o+, 54o",
  };

  // ---- Facing a single open: opener tier x hero type -> {threeBet, call} ----
  // SB facing an open plays 3-bet-or-fold (calling out of position with the BB behind leaks money).
  const VS_OPEN = {
    EP: {
      IP: { threeBet: "QQ+, AKs, AKo, A5s-A4s", call: "JJ-77, AQs-ATs, KQs-KJs, QJs, JTs, T9s, AQo" },
      SB: { threeBet: "QQ+, AKs, AQs, AKo, A5s-A4s, KQs", call: "" },
      BB: {
        threeBet: "QQ+, AKs, AKo, A5s-A4s",
        call: "JJ-22, AQs-A6s, A3s-A2s, KQs-K9s, QJs-Q9s, JTs-J9s, T9s-T8s, 98s-97s, 87s-86s, 76s-75s, 65s, 54s, AQo-AJo, KQo-KJo, QJo",
      },
    },
    MP: {
      IP: { threeBet: "JJ+, AQs+, AQo+, A5s-A4s, KQs, 65s", call: "TT-55, AJs-ATs, KJs-KTs, QJs-QTs, JTs, T9s, 98s, 87s, AJo, KQo" },
      SB: { threeBet: "TT+, AJs+, AQo+, A5s-A3s, KTs+, QJs, JTs, KQo", call: "" },
      BB: {
        threeBet: "JJ+, AQs+, AQo+, A5s-A3s, KQs, 76s, 65s",
        call: "TT-22, AJs-A6s, A2s, KJs-K6s, QJs-Q8s, JTs-J8s, T9s-T7s, 98s-96s, 87s-85s, 75s-74s, 64s, 54s-53s, 43s, AJo-A9o, KQo-KTo, QJo-QTo, JTo",
      },
    },
    LP: {
      SB: { threeBet: "88+, A8s+, A5s-A3s, KTs+, QTs+, JTs, T9s, AJo+, KQo", call: "" },
      BB: {
        threeBet: "TT+, AJs+, AQo+, A5s-A3s, KJs+, 76s, 65s",
        call: "99-22, ATs-A6s, A2s, KTs-K2s, QJs-Q2s, JTs-J4s, T9s-T6s, 98s-95s, 87s-84s, 75s-73s, 64s-63s, 54s-53s, 43s, AJo-A2o, KQo-K7o, QJo-Q8o, JTo-J8o, T9o-T8o, 98o, 87o, 76o",
      },
    },
  };

  const FULL_ORDER = ["UTG", "UTG+1", "UTG+2", "LJ", "HJ", "CO", "BTN", "SB", "BB"];

  const SHORT_ORDER = ["UTG", "HJ", "CO", "BTN", "SB", "BB"];

  // 9-max names; 6-max and smaller use the common UTG/HJ/CO naming.
  function positions(n) {
    if (n === 2) return ["BTN/SB", "BB"];
    if (n <= 6) return SHORT_ORDER.slice(SHORT_ORDER.length - n);
    return [...FULL_ORDER.slice(0, n - 6), ...FULL_ORDER.slice(3)];
  }

  function playersBehind(n, pos) {
    return n - 1 - positions(n).indexOf(pos);
  }

  function rfiKey(n, pos) {
    if (pos === "BB") return null;
    if (pos === "BTN/SB") return "HU";
    if (pos === "SB") return "SB";
    return playersBehind(n, pos);
  }

  const rangeCache = {};
  function cached(str) {
    if (!(str in rangeCache)) rangeCache[str] = parseRange(str);
    return rangeCache[str];
  }

  function rfiRange(n, pos) {
    const key = rfiKey(n, pos);
    return key === null ? null : cached(RFI[key]);
  }

  function openerTier(n, pos) {
    const key = rfiKey(n, pos);
    if (key === "HU" || key === "SB" || key === 2) return "LP";
    if (key >= 5) return "EP";
    return "MP";
  }

  function heroType(pos) {
    if (pos === "BB") return "BB";
    if (pos === "SB") return "SB";
    return "IP";
  }

  // Returns { threeBet: Set, call: Set, tier, type } or null if the spot can't occur.
  function vsOpenRanges(n, opener, hero) {
    const pos = positions(n);
    if (pos.indexOf(hero) <= pos.indexOf(opener) || opener === "BB") return null;
    const tier = openerTier(n, opener);
    const type = heroType(hero);
    const chart = VS_OPEN[tier][type];
    if (!chart) return null;
    const threeBet = cached(chart.threeBet);
    const call = new Set([...cached(chart.call)].filter((h) => !threeBet.has(h)));
    return { threeBet, call, tier, type };
  }

  function rangePercent(set) {
    let c = 0;
    for (const h of set) c += combos(h);
    return (c / 1326) * 100;
  }

  // Deal two concrete cards matching a hand class, e.g. "AKs" -> ["Ah","Kh"].
  function dealHand(hand) {
    const shuffled = SUITS.slice().sort(() => Math.random() - 0.5);
    const [s1, s2] = shuffled;
    if (hand.length === 2) return [hand[0] + s1, hand[1] + s2];
    if (hand[2] === "s") return [hand[0] + s1, hand[1] + s1];
    return [hand[0] + s1, hand[1] + s2];
  }

  const api = {
    RANKS, SUITS, ALL_HANDS, RFI, VS_OPEN, FULL_ORDER,
    cellHand, handCell, combos, parseRange, positions, playersBehind, rfiKey,
    rfiRange, openerTier, heroType, vsOpenRanges, rangePercent, dealHand,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.GTO = api;
})(typeof window !== "undefined" ? window : globalThis);
