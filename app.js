(function () {
  const G = window.GTO;
  const $ = (sel, el = document) => el.querySelector(sel);
  const SUIT_SYM = { s: "♠", h: "♥", d: "♦", c: "♣" };
  const ACTION_LABEL = { raise: "Erhöhen", threeBet: "3-Bet", call: "Mitgehen", fold: "Passen" };

  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem("gto." + key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem("gto." + key, JSON.stringify(value)); } catch { /* Speicher nicht verfügbar */ }
    },
  };

  const state = {
    players: store.get("players", 6),
    tab: store.get("tab", "learn"),
    ranges: { mode: "rfi", hero: null, opener: null },
    quizMode: store.get("quizMode", "rfi"),
    question: null,
    stats: store.get("stats", {}),
    glossFocus: null,
    ex: store.get("example", null) ? { id: store.get("example", null), step: 0, picked: null } : null,
  };

  // ---------- Hilfsfunktionen ----------
  const num = (v) => (Math.round(v * 10) / 10).toLocaleString("de-DE");
  const fmtPct = (v) => num(v) + " %";
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = (arr) => arr.map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map((p) => p[1]);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const spieler = (k) => `${k} Spieler`;

  // Fachbegriffe in den Textbereichen eines Tabs mit Glossar-Tooltips versehen.
  function linkTerms(el) {
    el.querySelectorAll(".lesson-body, .spot, .feedback > p, .mcq-q, .cell-info, .intro p, .ex-text, .bd > p").forEach((n) => window.GLOSS.linkify(n));
  }

  function cardHTML(card, size = "") {
    const r = card[0] === "T" ? "10" : card[0];
    const s = card[1];
    const red = s === "h" || s === "d";
    return `<div class="card ${size} ${red ? "red" : ""}"><span class="cr">${r}</span><span class="cs">${SUIT_SYM[s]}</span></div>`;
  }

  function handName(hand) {
    if (hand.length === 2) return "Pocket Pair";
    return hand[2] === "s" ? "suited" : "offsuit";
  }

  // Aktion für eine Hand in der aktuellen Situation.
  function rfiAction(n, pos) {
    const range = G.rfiRange(n, pos);
    return (h) => (range.has(h) ? "raise" : "fold");
  }
  function vsOpenAction(n, opener, hero) {
    const v = G.vsOpenRanges(n, opener, hero);
    return (h) => (v.threeBet.has(h) ? "threeBet" : v.call.has(h) ? "call" : "fold");
  }

  function gridHTML(actionOf, { highlight = null, clickable = false } = {}) {
    let html = `<div class="grid ${clickable ? "clickable" : ""}">`;
    for (let r = 0; r < 13; r++) for (let c = 0; c < 13; c++) {
      const h = G.cellHand(r, c);
      const act = actionOf(h);
      const hl = h === highlight ? " hl" : "";
      html += `<div class="cell a-${act}${hl}" data-hand="${h}" title="${h}: ${ACTION_LABEL[act]}">${h}</div>`;
    }
    return html + "</div>";
  }

  function legendHTML(actions) {
    return `<div class="legend">${actions.map((a) => `<span><i class="sw a-${a}"></i>${ACTION_LABEL[a]}</span>`).join("")}</div>`;
  }

  function seatTitle(p) {
    const t = window.GLOSS.byId[{ "BTN/SB": "heads-up", BB: "bb-seat", "UTG+1": "utg", "UTG+2": "utg" }[p] || p.toLowerCase()];
    return t ? `${t.term}: ${t.def}` : p;
  }

  function tableHTML(n, { hero, opener }) {
    const pos = G.positions(n);
    const heroIdx = pos.indexOf(hero);
    const dealerIdx = pos.indexOf(n === 2 ? "BTN/SB" : "BTN");
    // Drehen, sodass der Spieler unten am Tisch sitzt.
    let seats = "";
    pos.forEach((p, i) => {
      const angle = Math.PI / 2 + ((i - heroIdx) / n) * Math.PI * 2;
      const x = 50 + 42 * Math.cos(angle);
      const y = 50 + 38 * Math.sin(angle);
      let cls = "seat";
      let note = "";
      if (p === hero) { cls += " hero"; note = "Du"; }
      else if (p === opener) { cls += " opener"; note = "Erhöht"; }
      else if (i < heroIdx) { cls += " folded"; note = "Gepasst"; }
      else note = "Noch dran";
      seats += `<div class="${cls}" style="left:${x}%;top:${y}%" title="${esc(seatTitle(p))}"><b>${p}</b><small>${note}</small>${i === dealerIdx ? `<span class="dbtn">D</span>` : ""}</div>`;
    });
    return `<div class="felt"><div class="felt-inner"><span>${spieler(n)}</span></div>${seats}</div>`;
  }

  function spotDescription(n, hero, opener) {
    if (!opener) {
      const behind = G.playersBehind(n, hero);
      const pct = G.rangePercent(G.rfiRange(n, hero));
      const extra = hero === "SB" ? " Nur noch der Big Blind ist übrig, aber du bist nach dem Flop ohne Position."
        : hero === "BTN/SB" ? " Heads-up handelt der Button nach dem Flop auf jeder Straße als Letzter und eröffnet deshalb eine sehr breite Range."
        : "";
      return `Alle haben bis zu dir gepasst, du sitzt im <b>${hero}</b>. Nach dir ${behind === 1 ? "handelt noch 1 Spieler" : `handeln noch ${behind} Spieler`}. Von diesem Platz eröffnest du etwa <b>${fmtPct(pct)}</b> der Hände.${extra}`;
    }
    const v = G.vsOpenRanges(n, opener, hero);
    const tierText = { EP: "eine Eröffnung aus früher Position (starke Range)", MP: "eine Eröffnung aus mittlerer Position", LP: "eine Eröffnung aus später Position (breite Range)" }[v.tier];
    const typeText = { IP: "Du hast nach dem Flop Position.", SB: "Du bist im Small Blind: meistens 3-Bet oder Passen.", BB: "Du bist im Big Blind und hast schon 1bb investiert, also bekommst du einen guten Preis zum Verteidigen." }[v.type];
    return `<b>${opener}</b> erhöht, alle anderen passen bis zu dir im <b>${hero}</b>. Das ist ${tierText}. ${typeText}`;
  }

  // ---------- Tabs ----------
  function setTab(tab) {
    state.tab = tab;
    store.set("tab", tab);
    document.querySelectorAll(".tabs button").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
    document.querySelectorAll(".tab-panel").forEach((p) => p.classList.toggle("active", p.id === "tab-" + tab));
    render();
  }

  function render() {
    ({ learn: renderLearn, examples: renderExamples, ranges: renderRanges, quiz: renderQuiz, glossary: renderGlossary, stats: renderStats })[state.tab]();
  }

  // ---------- Lernen ----------
  const LESSON_EXAMPLE = { gto: "river-bluff", position: "value", rfi: "value", vsopen: "fold-ajo", potodds: "draw", mdf: "river-bluff", cbet: "wet-board", blockers: "3bet-bluff", flop: "wet-board" };

  function renderLearn() {
    const el = $("#tab-learn");
    const open = store.get("openLesson", "gto");
    el.innerHTML = `
      <div class="intro">
        <h2>Die Grundlagen lernen</h2>
        <p>Lies eine Lektion, schau dir die Charts unter <b>Ranges</b> an und trainiere sie dann unter <b>Training &amp; Quiz</b>. Die Spielerzahl oben verändert alle Charts und Übungen. Unterstrichene Begriffe zeigen beim Antippen ihre Erklärung.</p>
      </div>
      <div class="lessons">
        ${window.LESSONS.map((l) => `
          <details class="lesson" data-id="${l.id}" ${l.id === open ? "open" : ""}>
            <summary>${l.title}</summary>
            <div class="lesson-body">${l.body}
              <div class="lesson-actions">
                ${LESSON_EXAMPLE[l.id] ? `<button class="btn see-example" data-ex="${LESSON_EXAMPLE[l.id]}">Beispielhand ansehen</button>` : ""}
                <button class="btn primary practice" data-mode="${l.practice}">Jetzt üben →</button>
              </div>
            </div>
          </details>`).join("")}
      </div>`;
    linkTerms(el);
    el.querySelectorAll("details").forEach((d) => d.addEventListener("toggle", () => { if (d.open) store.set("openLesson", d.dataset.id); }));
    el.querySelectorAll(".see-example").forEach((b) => b.addEventListener("click", () => openExample(b.dataset.ex)));
    el.querySelectorAll(".practice").forEach((b) => b.addEventListener("click", () => {
      setQuizMode(b.dataset.mode);
      setTab("quiz");
    }));
  }

  // ---------- Ranges ----------
  function renderRanges() {
    const el = $("#tab-ranges");
    const n = state.players;
    const pos = G.positions(n);
    const r = state.ranges;
    if (r.mode === "flop") return renderFlopRanges(el);

    if (r.mode === "rfi") {
      const openers = pos.filter((p) => p !== "BB");
      if (!openers.includes(r.hero)) r.hero = openers[0];
      r.opener = null;
    } else {
      const openers = pos.slice(0, -1);
      if (!openers.includes(r.opener)) r.opener = openers[0];
      const heroes = pos.slice(pos.indexOf(r.opener) + 1);
      if (!heroes.includes(r.hero)) r.hero = heroes[heroes.length - 1];
    }

    const chips = (list, sel, attr) => list.map((p) => `<button class="chip ${p === sel ? "on" : ""}" data-${attr}="${p}">${p}</button>`).join("");

    let controls, actionOf, legend, summary;
    if (r.mode === "rfi") {
      controls = `<div class="ctl-row"><span class="ctl-label">Dein Platz</span>${chips(pos.filter((p) => p !== "BB"), r.hero, "hero")}</div>`;
      actionOf = rfiAction(n, r.hero);
      legend = legendHTML(["raise", "fold"]);
      summary = `Erhöhen <b>${fmtPct(G.rangePercent(G.rfiRange(n, r.hero)))}</b> aller Starthände`;
    } else {
      const heroes = pos.slice(pos.indexOf(r.opener) + 1);
      controls = `
        <div class="ctl-row"><span class="ctl-label">Eröffnet von</span>${chips(pos.slice(0, -1), r.opener, "opener")}</div>
        <div class="ctl-row"><span class="ctl-label">Dein Platz</span>${chips(heroes, r.hero, "hero")}</div>`;
      const v = G.vsOpenRanges(n, r.opener, r.hero);
      actionOf = vsOpenAction(n, r.opener, r.hero);
      legend = legendHTML(v.type === "SB" ? ["threeBet", "fold"] : ["threeBet", "call", "fold"]);
      const fold = 100 - G.rangePercent(v.threeBet) - G.rangePercent(v.call);
      summary = `3-Bet <b>${fmtPct(G.rangePercent(v.threeBet))}</b> · Mitgehen <b>${fmtPct(G.rangePercent(v.call))}</b> · Passen <b>${fmtPct(fold)}</b> <span class="muted">(von allen Starthänden)</span>`;
    }

    el.innerHTML = `
      <div class="ranges-layout">
        <div class="ranges-side">
          ${rangeSeg(r.mode)}
          ${controls}
          ${tableHTML(n, { hero: r.hero, opener: r.opener })}
          <p class="spot">${spotDescription(n, r.hero, r.opener)}</p>
          <div id="cell-info" class="cell-info muted">Klicke auf eine Hand im Chart, um Details zu sehen.</div>
        </div>
        <div class="ranges-main">
          <div class="chart-head"><div class="summary">${summary}</div>${legend}</div>
          ${gridHTML(actionOf, { clickable: true })}
          <p class="muted small">Paare auf der Diagonale, suited Hände darüber, offsuit Hände darunter. T = Zehn. Alle Prozente beziehen sich auf alle 1.326 möglichen Starthände. Jede Hand zählt so oft, wie sie ausgeteilt werden kann: Paare 6-mal, suited Hände 4-mal, offsuit Hände 12-mal.</p>
        </div>
      </div>`;
    linkTerms(el);

    bindRangeSeg(el);
    el.querySelectorAll("[data-hero]").forEach((b) => b.addEventListener("click", () => { r.hero = b.dataset.hero; renderRanges(); }));
    el.querySelectorAll("[data-opener]").forEach((b) => b.addEventListener("click", () => { r.opener = b.dataset.opener; renderRanges(); }));
    el.querySelectorAll(".grid .cell").forEach((c) => c.addEventListener("click", () => {
      el.querySelectorAll(".grid .cell.hl").forEach((x) => x.classList.remove("hl"));
      c.classList.add("hl");
      const h = c.dataset.hand;
      const act = actionOf(h);
      const info = $("#cell-info");
      info.classList.remove("muted");
      info.innerHTML = `<b>${h}</b> (${handName(h)}, ${G.combos(h)} Kombos): <span class="tag a-${act}">${ACTION_LABEL[act]}</span><br><span class="small">${handReason(h, act, n, r.hero, r.opener)}</span>`;
      window.GLOSS.linkify(info);
    }));
  }

  // ---------- Begründungen ----------
  function handFeatures(h) {
    const hi = G.RANKS.indexOf(h[0]), lo = G.RANKS.indexOf(h[1]);
    return {
      pair: h.length === 2,
      suited: h[2] === "s",
      offsuit: h[2] === "o",
      gap: lo - hi - 1,
      broadway: hi <= 4 && lo <= 4,
      ace: h[0] === "A",
      wheelAce: h[0] === "A" && lo >= 8, // A5-A2
      lowRank: lo,
    };
  }

  function handReason(h, act, n, hero, opener) {
    const f = handFeatures(h);
    if (!opener) {
      const behind = G.playersBehind(n, hero);
      const nach = behind === 1 ? "nur noch 1 Spieler" : `${behind} Spieler`;
      if (act === "raise") {
        if (f.pair && f.lowRank >= 7) return "Kleine Paare werden aus späteren Positionen eröffnet. Sie leben davon, ein Set zu floppen, und gewinnen gern die Blinds kampflos oder spielen in Position.";
        if (f.pair) return "So starke Paare sind von jedem Platz eine profitable Eröffnung.";
        if (f.suited && f.gap <= 1 && !f.broadway) return "Suited Connectors machen Straights und Flushes. Sie spielen sich postflop gut und ergänzen die Range, damit du nicht nur hohe Karten eröffnest.";
        if (f.wheelAce && f.suited) return "Suited Wheel-Asse blockieren AA/AK, machen Nut-Flushes und können Wheel-Straights machen – deutlich spielbarer als Ax offsuit.";
        if (f.offsuit && behind <= 2) return `Wenn nach dir ${behind === 1 ? "nur noch 1 Spieler handelt" : `nur noch ${behind} Spieler handeln`}, gewinnst du die Blinds oft genug kampflos, dass selbst schwächere offsuit Hände profitable Eröffnungen sind.`;
        return "Stark genug zum Eröffnen: Sie schlägt die Hände, die mitgehen oder eine 3-Bet machen, oft genug, oder sie spielt sich postflop gut.";
      }
      if (f.offsuit && (f.broadway || f.ace)) return `Offsuit Hände mit schwachem Kicker werden dominiert. Mit ${nach} nach dir hält oft jemand eine bessere Version dieser Hand.`;
      if (f.pair) return `Mit ${nach} nach dir bekommen kleine Paare oft eine 3-Bet und verlieren ihre Equity, oder sie spielen ohne Position. Eröffne sie aus späteren Positionen.`;
      return `Mit ${nach} nach dir nicht stark oder spielbar genug.`;
    }
    const v = G.vsOpenRanges(n, opener, hero);
    if (act === "threeBet") {
      if (f.wheelAce || (f.suited && !f.broadway && !f.pair)) return "Ein 3-Bet-Bluff: Die Hand blockiert einige starke Hände des Eröffners und hat trotzdem gute Equity, wenn sie gecallt wird.";
      return "3-Bet für Value. Die Hand liegt vor den Händen, die mitgehen oder eine 4-Bet machen.";
    }
    if (act === "call") {
      if (v.type === "BB") return "Der Big Blind bekommt mit 1bb schon im Pot einen sehr guten Preis. Hände, die sich postflop gut spielen, sind profitabel zu verteidigen.";
      return "Stark genug zum Weiterspielen, aber eine 3-Bet würde schlechtere Hände zum Passen bringen und von besseren gecallt werden. Mitgehen in Position hält den Pot kontrolliert.";
    }
    if (v.type === "SB" && (f.pair || f.suited)) return "Aus dem SB ohne Position mitzugehen, während der BB noch handeln kann, kostet Geld. Für eine 3-Bet ist die Hand nicht stark genug, also passt du.";
    if (v.tier === "EP") return "Eröffnungen aus früher Position sind stark. Diese Hand ist oft dominiert oder ohne Position, also passt du.";
    return "Nicht genug Equity oder Spielbarkeit gegen diese Eröffnungs-Range.";
  }

  // ---------- Quiz ----------
  const QUIZ_MODES = {
    rfi: { label: "Preflop: Eröffnen oder Passen" },
    vsopen: { label: "Preflop: gegen eine Eröffnung" },
    postflop: { label: "Flop: Weiterspielen?" },
    river: { label: "River: Bluffen?" },
    math: { label: "Pot Odds & MDF" },
    concepts: { label: "Konzepte" },
  };

  function setQuizMode(mode) {
    state.quizMode = mode;
    store.set("quizMode", mode);
    state.question = null;
  }

  // Hände nahe der Range-Grenze ziehen, damit die Übung nicht hauptsächlich aus klaren Folds besteht.
  function sampleHand(actionOf) {
    if (Math.random() < 0.25) return pick(G.ALL_HANDS);
    const boundary = [];
    for (let r = 0; r < 13; r++) for (let c = 0; c < 13; c++) {
      const h = G.cellHand(r, c);
      const a = actionOf(h);
      let edge = false;
      for (let dr = -1; dr <= 1 && !edge; dr++) for (let dc = -1; dc <= 1; dc++) {
        const rr = r + dr, cc = c + dc;
        if (rr < 0 || cc < 0 || rr > 12 || cc > 12 || (!dr && !dc)) continue;
        if (actionOf(G.cellHand(rr, cc)) !== a) { edge = true; break; }
      }
      if (edge) boundary.push(h);
    }
    return pick(boundary.length ? boundary : G.ALL_HANDS);
  }

  function makePreflopQuestion(mode) {
    const n = state.players;
    const pos = G.positions(n);
    let hero, opener = null, actionOf, choices;
    if (mode === "rfi") {
      hero = pick(pos.filter((p) => p !== "BB"));
      actionOf = rfiAction(n, hero);
      choices = ["fold", "raise"];
    } else {
      const oi = Math.floor(Math.random() * (n - 1));
      opener = pos[oi];
      hero = pick(pos.slice(oi + 1));
      actionOf = vsOpenAction(n, opener, hero);
      choices = ["fold", "call", "threeBet"];
    }
    const hand = sampleHand(actionOf);
    return { kind: "preflop", n, hero, opener, hand, cards: G.dealHand(hand), actionOf, choices, answer: actionOf(hand) };
  }

  function makeChoices(correct, distractors, fmt) {
    const set = new Set([fmt(correct)]);
    for (const d of distractors) { if (set.size >= 4) break; set.add(fmt(d)); }
    // Mit nahen Werten auffüllen, wenn Ablenker zusammenfallen; dabei innerhalb von (0, 1) bleiben.
    for (let step = 0.05; set.size < 4; step += 0.05) {
      for (const v of [correct + step, correct - step]) if (set.size < 4 && v > 0 && v < 1) set.add(fmt(v));
    }
    const list = shuffle([...set]);
    return { choices: list, answer: list.indexOf(fmt(correct)) };
  }

  function makeMathQuestion() {
    const pot = pick([4, 6, 8, 10, 12, 20, 30, 40, 60, 100]);
    const frac = pick([0.25, 1 / 3, 0.5, 2 / 3, 0.75, 1, 1.5, 2]);
    const bet = Math.round(pot * frac * 10) / 10;
    const pct = (v) => Math.round(v * 100) + " %";
    const type = pick(["odds", "odds", "mdf", "bluff", "outs"]);
    const P = num(pot), B = num(bet);

    if (type === "odds") {
      const c = bet / (pot + 2 * bet);
      return { kind: "mcq", tag: "Pot Odds", q: `Der Pot ist <b>${P}bb</b> und der Gegner setzt <b>${B}bb</b>. Wie viel Equity brauchst du für einen Call?`,
        ...makeChoices(c, [bet / pot, bet / (pot + bet), pot / (pot + bet)].filter((d) => d <= 1), pct),
        why: `Benötigte Equity = Call ÷ Pot am Ende = ${B} ÷ (${P} + ${B} + ${B}) = ${pct(c)}. Deine Hand muss also in mindestens ${pct(c)} der Fälle gegen die möglichen Hände des Gegners gewinnen.` };
    }
    if (type === "mdf") {
      const c = pot / (pot + bet);
      return { kind: "mcq", tag: "MDF", q: `Der Gegner setzt <b>${B}bb</b> in einen Pot von <b>${P}bb</b>. Wie hoch ist deine Minimum Defense Frequency (MDF)?`,
        ...makeChoices(c, [1 - c, bet / (pot + 2 * bet), 1 - bet / (pot + 2 * bet)], pct),
        why: `MDF = Pot ÷ (Pot + Bet) = ${P} ÷ (${P} + ${B}) = ${pct(c)}. Passt du öfter als ${pct(1 - c)}, kann der Gegner mit beliebigen Karten profitabel setzen. Die ${pct(c)} beziehen sich auf die Hände, die du an dieser Stelle noch hältst, nicht auf alle Starthände.` };
    }
    if (type === "bluff") {
      const c = bet / (pot + 2 * bet);
      return { kind: "mcq", tag: "Bluff-Anteil", q: `Am River setzt du <b>${B}bb</b> in einen Pot von <b>${P}bb</b>. Welcher Anteil deiner Bets sollte aus Bluffs bestehen, damit die Bluff-Catcher des Gegners indifferent sind?`,
        ...makeChoices(c, [pot / (pot + bet), bet / (pot + bet), 0.5].filter((d) => Math.abs(d - c) > 0.005), pct),
        why: `Bluff-Anteil = Bet ÷ (Pot + 2·Bet) = ${B} ÷ ${num(pot + 2 * bet)} = ${pct(c)}. Gemeint ist der Anteil an den Händen, mit denen du am River setzt. Das ist genau die Equity, die der Gegner für einen Call braucht.` };
    }
    const draws = [
      { name: "einen Flush-Draw", outs: 9 }, { name: "einen Open-Ended Straight Draw", outs: 8 },
      { name: "einen Gutshot", outs: 4 }, { name: "zwei Overcards", outs: 6 },
      { name: "einen Flush-Draw plus Open-Ender", outs: 15 }, { name: "einen Gutshot plus zwei Overcards", outs: 10 },
    ];
    const d = pick(draws);
    const flop = Math.random() < 0.5;
    const eq = d.outs * (flop ? 4 : 2) / 100;
    return { kind: "mcq", tag: "Outs", q: `Du hast ${d.name} auf dem <b>${flop ? "Flop" : "Turn"}</b>${flop ? " und siehst beide restlichen Karten" : ""}. Wie hoch ist ungefähr deine Equity, zu treffen?`,
      ...makeChoices(eq, [d.outs * (flop ? 2 : 4) / 100, d.outs / 100, (d.outs + 2) * (flop ? 4 : 2) / 100], pct),
      why: `${d.outs} Outs × ${flop ? 4 : 2} (${flop ? 4 : 2}er-Regel) ≈ ${pct(eq)}.` };
  }

  function makeConceptQuestion() {
    const q = pick(window.CONCEPT_QUESTIONS);
    const order = shuffle(q.choices.map((_, i) => i));
    return { kind: "mcq", tag: "Konzept", q: esc(q.q), choices: order.map((i) => q.choices[i]), answer: order.indexOf(q.answer), why: q.why };
  }

  function newQuestion() {
    const m = state.quizMode;
    state.question = m === "rfi" || m === "vsopen" ? makePreflopQuestion(m) : m === "postflop" ? makePostflopQuestion() : m === "river" ? makeRiverQuestion() : m === "math" ? makeMathQuestion() : makeConceptQuestion();
    state.question.picked = null;
  }

  function renderQuiz() {
    const el = $("#tab-quiz");
    if (!state.question || (state.question.kind === "preflop" && state.question.n !== state.players)) newQuestion();
    const q = state.question;
    const s = statFor(state.quizMode);

    const modeBtns = Object.entries(QUIZ_MODES).map(([k, m]) => `<button class="${k === state.quizMode ? "on" : ""}" data-mode="${k}">${m.label}</button>`).join("");

    let body;
    if (q.kind === "postflop") {
      body = postflopBody(q);
    } else if (q.kind === "river") {
      body = riverBody(q);
    } else if (q.kind === "preflop") {
      const answered = q.picked !== null;
      const btns = q.choices.map((a, i) => {
        let cls = "btn act a-" + a;
        if (answered) cls += a === q.answer ? " correct" : a === q.picked ? " wrong" : " dim";
        return `<button class="${cls}" data-pick="${a}" ${answered ? "disabled" : ""}><kbd>${i + 1}</kbd>${ACTION_LABEL[a]}</button>`;
      }).join("");
      let feedback = "";
      if (answered) {
        const ok = q.picked === q.answer;
        const legend = q.opener ? (G.heroType(q.hero) === "SB" ? ["threeBet", "fold"] : ["threeBet", "call", "fold"]) : ["raise", "fold"];
        feedback = `
          <div class="feedback ${ok ? "ok" : "bad"}">
            <h3>${ok ? "Richtig" : "Nicht ganz"}: ${q.hand} → ${ACTION_LABEL[q.answer]}</h3>
            <p>${handReason(q.hand, q.answer, q.n, q.hero, q.opener)}</p>
            <div class="chart-head"><div class="summary">${q.opener ? `${q.hero} gegen Eröffnung von ${q.opener}` : `Eröffnen aus ${q.hero}`}</div>${legendHTML(legend)}</div>
            ${gridHTML(q.actionOf, { highlight: q.hand })}
          </div>`;
      }
      body = `
        <div class="quiz-spot">
          ${tableHTML(q.n, { hero: q.hero, opener: q.opener })}
          <div class="quiz-right">
            <p class="spot">${spotDescription(q.n, q.hero, q.opener)}</p>
            <div class="hand">${q.cards.map(cardHTML).join("")}</div>
            <div class="actions">${btns}</div>
            ${answered ? `<button class="btn primary next">Nächste Hand <kbd>Enter</kbd></button>` : ""}
          </div>
        </div>
        ${feedback}`;
    } else {
      const answered = q.picked !== null;
      const btns = q.choices.map((c, i) => {
        let cls = "btn choice";
        if (answered) cls += i === q.answer ? " correct" : i === q.picked ? " wrong" : " dim";
        return `<button class="${cls}" data-pick="${i}" ${answered ? "disabled" : ""}><kbd>${i + 1}</kbd>${esc(c)}</button>`;
      }).join("");
      body = `
        <div class="mcq">
          <span class="pill">${q.tag}</span>
          <p class="mcq-q">${q.q}</p>
          <div class="choices">${btns}</div>
          ${answered ? `
            <div class="feedback ${q.picked === q.answer ? "ok" : "bad"}">
              <h3>${q.picked === q.answer ? "Richtig" : "Nicht ganz"}</h3><p>${q.why}</p>
            </div>
            <button class="btn primary next">Nächste Frage <kbd>Enter</kbd></button>` : ""}
        </div>`;
    }

    el.innerHTML = `
      <div class="quiz-head">
        <div class="seg wrap">${modeBtns}</div>
        <div class="score">
          <span><b>${s.correct}</b>/${s.total} richtig</span>
          <span>Serie <b>${s.streak}</b></span>
          <span>Rekord <b>${s.best}</b></span>
        </div>
      </div>
      ${body}`;
    linkTerms(el);

    el.querySelectorAll(".quiz-head .seg button").forEach((b) => b.addEventListener("click", () => { setQuizMode(b.dataset.mode); renderQuiz(); }));
    el.querySelectorAll("[data-pick]").forEach((b) => b.addEventListener("click", () => answer(b.dataset.pick)));
    el.querySelectorAll("[data-group]").forEach((b) => b.addEventListener("click", () => pickFlopGroup(Number(b.dataset.group))));
    el.querySelectorAll("[data-flopact]").forEach((b) => b.addEventListener("click", () => pickFlopAction(b.dataset.flopact)));
    el.querySelectorAll("[data-riveract]").forEach((b) => b.addEventListener("click", () => pickRiverAction(b.dataset.riveract)));
    const next = $(".next", el);
    if (next) next.addEventListener("click", () => { newQuestion(); renderQuiz(); });
  }

  function answer(raw) {
    const q = state.question;
    if (!q || q.picked !== null) return;
    q.picked = q.kind === "preflop" ? raw : Number(raw);
    const ok = q.picked === q.answer;
    recordResult(state.quizMode, ok, q);
    renderQuiz();
    const fb = $("#tab-quiz .feedback");
    if (fb && fb.getBoundingClientRect().top > window.innerHeight) fb.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  document.addEventListener("keydown", (e) => {
    if (state.tab !== "quiz" || !state.question || /^(SELECT|INPUT)$/.test(e.target.tagName)) return;
    const q = state.question;
    if (q.kind === "river" && q.picked === null) {
      if (/^[1-3]$/.test(e.key)) pickRiverAction(["check", "value", "bluff"][Number(e.key) - 1]);
      return;
    }
    if (q.kind === "postflop" && q.picked === null) {
      if (q.groupPick === null && /^[1-6]$/.test(e.key)) pickFlopGroup(Number(e.key));
      else if (q.groupPick !== null && /^[12]$/.test(e.key)) pickFlopAction(e.key === "1" ? "fold" : "continue");
      return;
    }
    if (q.picked === null && /^[1-4]$/.test(e.key)) {
      const i = Number(e.key) - 1;
      if (i < q.choices.length) answer(q.kind === "preflop" ? q.choices[i] : String(i));
    } else if (q.picked !== null && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      newQuestion();
      renderQuiz();
    }
  });

  // ---------- Nach dem Flop (BB gegen C-Bet des Buttons) ----------
  const PF = window.POSTFLOP;
  const FLOP_SPOT = { players: 6, hero: "BB", villain: "BTN" };
  const FLOP_POT = 5.5;
  const FLOP_PRESETS = [
    { label: "A-7-2 trocken", board: ["Ah", "7c", "2d"] },
    { label: "K-8-3 trocken", board: ["Kh", "8c", "3d"] },
    { label: "8-7-6 nass", board: ["8h", "7h", "6c"] },
    { label: "K-K-5 gepaart", board: ["Kh", "Kc", "5d"] },
    { label: "T-9-3 mit Draws", board: ["Ts", "9d", "3s"] },
    { label: "Q-J-2 eine Farbe", board: ["Qs", "Js", "2s"] },
  ];
  let bbRange = null;
  const bbFlopRange = () => bbRange || (bbRange = G.vsOpenRanges(6, "BTN", "BB").call);
  const GROUP_NUMS = [1, 2, 3, 4, 5, 6];
  const betAmount = (key) => num(FLOP_POT * PF.BETS[key].frac);
  const mdfPct = (key) => 100 / (1 + PF.BETS[key].frac);
  const contPct = (bd, key) => GROUP_NUMS.filter((g) => g <= PF.BETS[key].maxGroup).reduce((a, g) => a + bd.pct[g], 0);
  const gtag = (g) => `<span class="gtag g${g}">${g}</span>`;
  const boardText = (board) => board.map((c) => (c[0] === "T" ? "10" : c[0]) + SUIT_SYM[c[1]]).join(" ");

  function breakdownHTML(bd, key, heroGroup = null) {
    const bet = PF.BETS[key];
    const cont = contPct(bd, key);
    const mdf = mdfPct(key);
    const segs = GROUP_NUMS.map((g) => `<span class="g${g}" style="width:${bd.pct[g]}%" title="Gruppe ${g}: ${fmtPct(bd.pct[g])}">${bd.pct[g] >= 7 ? Math.round(bd.pct[g]) + " %" : ""}</span>`).join("");
    const rows = GROUP_NUMS.map((g) => `
      <div class="bd-row ${g === heroGroup ? "mine" : ""}">
        ${gtag(g)}
        <span><b>${PF.GROUPS[g].name}</b> <span class="muted small">${PF.GROUPS[g].detail}</span></span>
        <span class="bd-pct">${fmtPct(bd.pct[g])}</span>
        <span class="bd-act ${g <= bet.maxGroup ? "go" : "stop"}">${g <= bet.maxGroup ? "weiter" : "passen"}</span>
      </div>`).join("");
    let note;
    if (cont < mdf - 5) note = "Weniger als die MDF: Dieser Flop trifft deine Range schlecht und die des Raisers gut (Range-Vorteil). Dann passt der BB öfter, als die MDF sagt. Sie ist eine Orientierung, kein Muss.";
    else if (cont > mdf + 10) note = "Mehr als die MDF: Dieser Flop trifft deine Range gut. Die MDF ist nur ein Minimum, mehr weiterzuspielen ist in Ordnung.";
    else note = "Das liegt nah an der MDF.";
    return `
      <div class="bd">
        <p>Gegen eine Bet von <b>${bet.label}</b> spielen die Gruppen 1–${bet.maxGroup} weiter: <b>${fmtPct(cont)}</b> deiner Range. Die MDF liegt bei <b>${fmtPct(mdf)}</b>. ${note}</p>
        <div class="bd-bar">${segs}<i class="bd-cut" style="left:${cont}%"><em>Grenze</em></i></div>
        <div class="bd-rows">${rows}</div>
      </div>`;
  }

  function flopGridHTML(bd, { highlight = null, clickable = false } = {}) {
    const range = bbFlopRange();
    let html = `<div class="grid ${clickable ? "clickable" : ""}">`;
    for (let r = 0; r < 13; r++) for (let c = 0; c < 13; c++) {
      const h = G.cellHand(r, c);
      const counts = bd.perHand[h];
      const total = counts ? counts.reduce((a, b) => a + b, 0) : 0;
      let cls = "g-out", title = `${h}: nicht in deiner BB-Range`;
      if (range.has(h) && total) {
        const g = GROUP_NUMS.reduce((best, x) => (counts[x] > counts[best] ? x : best), 1);
        cls = "g" + g;
        title = `${h}: ` + GROUP_NUMS.filter((x) => counts[x]).map((x) => `Gruppe ${x} ×${counts[x]}`).join(", ");
      } else if (range.has(h)) title = `${h}: alle Kombos durch Board-Karten blockiert`;
      html += `<div class="cell ${cls}${h === highlight ? " hl" : ""}" data-hand="${h}" title="${title}">${h}</div>`;
    }
    return html + "</div>";
  }

  function handOnBoardInfo(hand, board) {
    if (!bbFlopRange().has(hand)) return `<b>${hand}</b> ist nicht in deiner Range: Der BB passt diese Hand preflop oder spielt eine 3-Bet.`;
    const combos = PF.combosOf(hand, new Set(board));
    if (!combos.length) return `<b>${hand}</b>: Alle Kombos sind durch die Board-Karten blockiert.`;
    const byLabel = {};
    for (const c of combos) {
      const ev = PF.evalFlop(c, board);
      const k = ev.group + "|" + ev.label;
      byLabel[k] = (byLabel[k] || 0) + 1;
    }
    const parts = Object.entries(byLabel).sort().map(([k, n]) => { const [g, label] = k.split("|"); return `${gtag(g)} ${label} <span class="muted">(${n} ${n === 1 ? "Kombo" : "Kombos"})</span>`; });
    return `<b>${hand}</b> auf ${boardText(board)}, ${combos.length} mögliche Kombos:<br>${parts.join("<br>")}`;
  }

  function makePostflopQuestion() {
    const board = PF.randomBoard();
    const betKey = pick(Object.keys(PF.BETS));
    const range = bbFlopRange();
    const dead = new Set(board);
    // Erst eine Gruppe wählen, dann eine Hand daraus, damit alle Gruppen regelmäßig vorkommen.
    const byGroup = {};
    for (const hand of range) for (const combo of PF.combosOf(hand, dead)) {
      const g = PF.evalFlop(combo, board).group;
      (byGroup[g] = byGroup[g] || []).push({ hand, combo });
    }
    const { hand, combo } = pick(byGroup[pick(Object.keys(byGroup))]);
    const ev = PF.evalFlop(combo, board);
    return {
      kind: "postflop", board, betKey, hand, cards: combo, ev, bd: PF.breakdown(range, board),
      groupPick: null, picked: null, answer: ev.group <= PF.BETS[betKey].maxGroup ? "continue" : "fold",
    };
  }

  const FLOP_ACT = { continue: "Weiterspielen (Mitgehen oder Check-Raise)", fold: "Passen" };

  function postflopBody(q) {
    const bet = PF.BETS[q.betKey];
    const gp = q.groupPick;
    const groupBtns = GROUP_NUMS.map((g) => {
      let cls = "btn choice gchoice";
      if (gp !== null) cls += g === q.ev.group ? " correct" : g === gp ? " wrong" : " dim";
      return `<button class="${cls}" data-group="${g}" ${gp !== null ? "disabled" : ""}><kbd>${g}</kbd>${gtag(g)} <b>${PF.GROUPS[g].name}</b> <span class="muted small">${PF.GROUPS[g].detail}</span></button>`;
    }).join("");

    let step2 = "";
    if (gp !== null) {
      const actBtns = ["fold", "continue"].map((a, i) => {
        let cls = "btn choice";
        if (q.picked !== null) cls += a === q.answer ? " correct" : a === q.picked ? " wrong" : " dim";
        return `<button class="${cls}" data-flopact="${a}" ${q.picked !== null ? "disabled" : ""}><kbd>${i + 1}</kbd>${FLOP_ACT[a]}</button>`;
      }).join("");
      step2 = `
        <p class="ex-text group-result">${gp === q.ev.group ? "Richtig eingeordnet." : "Nicht ganz."} Deine Hand: <b>${q.ev.label}</b> → ${gtag(q.ev.group)} ${PF.GROUPS[q.ev.group].name}</p>
        <p class="spot ex-prompt">Schritt 2: Der Button setzt ${betAmount(q.betKey)}bb (${bet.label}). Was tust du?</p>
        <div class="choices">${actBtns}</div>`;
    }

    let feedback = "";
    if (q.picked !== null) {
      const ok = q.picked === q.answer;
      const go = q.answer === "continue";
      const amt = FLOP_POT * bet.frac;
      const need = (amt / (FLOP_POT + 2 * amt)) * 100;
      const sizes = Object.values(PF.BETS);
      const largestOk = sizes.filter((b) => q.ev.group <= b.maxGroup).pop();
      const range = !largestOk ? "Mit dieser Hand passt du gegen jede Bet-Größe."
        : largestOk === sizes[sizes.length - 1] ? "Mit dieser Hand spielst du gegen jede Bet-Größe weiter, auch gegen Overbets."
        : `Mit dieser Hand spielst du gegen Bets bis ${largestOk.label} weiter, gegen größere passt du.`;
      feedback = `
        <div class="feedback ${ok ? "ok" : "bad"}">
          <h3>${ok ? "Richtig" : "Nicht ganz"}: ${go ? "Weiterspielen" : "Passen"}</h3>
          <p>Gegen eine Bet von ${bet.label} spielen die Gruppen 1–${bet.maxGroup} weiter. Deine Hand ist in Gruppe ${q.ev.group}, also <b>${go ? "weiterspielen" : "passen"}</b>.
          ${range}</p>
          <p>Pot Odds: Du zahlst ${num(amt)}bb, um ${num(FLOP_POT + 2 * amt)}bb zu gewinnen, brauchst also ${fmtPct(need)} Equity, wenn du nur mitgehst. Je größer die Bet, desto mehr Equity brauchst du und desto weniger Hände spielen weiter.</p>
          <h4>Deine ganze Range auf diesem Flop</h4>
          ${breakdownHTML(q.bd, q.betKey, q.ev.group)}
          ${flopGridHTML(q.bd, { highlight: q.hand })}
          <p class="muted small">Jedes Feld zeigt die Gruppe, in die die meisten Kombos dieser Hand fallen. Grau: nicht in deiner BB-Range.</p>
        </div>
        <button class="btn primary next">Nächste Hand <kbd>Enter</kbd></button>`;
    }

    return `
      <div class="ex-layout">
        <div class="ex-left">
          ${sceneHTML(FLOP_SPOT, { board: q.board, pot: FLOP_POT })}
          <div class="ex-hero">
            <div class="ex-hero-cards">
              <div class="ex-box-label">Deine Karten</div>
              <div class="hand">${q.cards.map((c) => cardHTML(c)).join("")}</div>
            </div>
          </div>
        </div>
        <div class="ex-right">
          <div class="ex-box now"><div class="ex-box-label">Jetzt: Flop</div><ul class="ex-text">
            <li>6 Spieler. Der Button hat auf 2,5bb erhöht, du bist im Big Blind mitgegangen.</li>
            <li>Der Flop kommt: ${boardText(q.board)}. Pot: 5,5bb.</li>
            <li>Du checkst, der Button setzt ${betAmount(q.betKey)}bb (${bet.label}).</li>
          </ul></div>
          <p class="spot ex-prompt">Schritt 1: Wie stark ist deine Hand auf diesem Flop?</p>
          <div class="choices">${groupBtns}</div>
          ${step2}
        </div>
      </div>
      ${feedback}`;
  }

  function pickFlopGroup(g) {
    const q = state.question;
    if (!q || q.kind !== "postflop" || q.groupPick !== null) return;
    q.groupPick = g;
    renderQuiz();
  }

  function pickFlopAction(a) {
    const q = state.question;
    if (!q || q.kind !== "postflop" || q.groupPick === null || q.picked !== null) return;
    q.picked = a;
    recordResult(state.quizMode, a === q.answer, q);
    renderQuiz();
    const fb = $("#tab-quiz .feedback");
    if (fb && fb.getBoundingClientRect().top > window.innerHeight) fb.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderFlopRanges(el) {
    const r = state.ranges;
    if (!r.board) r.board = FLOP_PRESETS[0].board;
    if (!PF.BETS[r.bet]) r.bet = "small";
    const bd = PF.breakdown(bbFlopRange(), r.board);
    const boardKey = r.board.join("");
    el.innerHTML = `
      <div class="ranges-layout">
        <div class="ranges-side">
          ${rangeSeg(r.mode)}
          <div class="ctl-row"><span class="ctl-label">Flop</span>
            ${FLOP_PRESETS.map((p, i) => `<button class="chip ${p.board.join("") === boardKey ? "on" : ""}" data-preset="${i}">${p.label}</button>`).join("")}
            <button class="chip" id="flop-random">Zufälliger Flop ↻</button>
          </div>
          <div class="ctl-row"><span class="ctl-label">Bet des Buttons</span>
            ${Object.entries(PF.BETS).map(([k, b]) => `<button class="chip ${k === r.bet ? "on" : ""}" data-bet="${k}" title="${betAmount(k)}bb in einen Pot von 5,5bb">${b.label}</button>`).join("")}
          </div>
          ${sceneHTML(FLOP_SPOT, { board: r.board, pot: FLOP_POT })}
          <p class="spot">6 Spieler, immer dieselbe Situation: Der <b>Button</b> erhöht, du gehst im <b>Big Blind</b> mit. Auf dem Flop checkst du, der Button setzt ${PF.BETS[r.bet].label} (${betAmount(r.bet)}bb in einen Pot von 5,5bb). So sortiert sich deine Range auf diesem Flop.</p>
          <div id="cell-info" class="cell-info muted">Klicke auf eine Hand im Chart, um zu sehen, was sie auf diesem Flop getroffen hat.</div>
        </div>
        <div class="ranges-main">
          ${breakdownHTML(bd, r.bet)}
          ${flopGridHTML(bd, { clickable: true })}
          <p class="muted small">Jedes Feld zeigt die Gruppe, in die die meisten Kombos dieser Hand fallen. Grau: nicht in deiner BB-Range (preflop gepasst oder 3-Bet). Die Gruppen sind eine vereinfachte Faustregel, keine exakte Solver-Strategie.</p>
        </div>
      </div>`;
    linkTerms(el);
    bindRangeSeg(el);
    el.querySelectorAll("[data-preset]").forEach((b) => b.addEventListener("click", () => { r.board = FLOP_PRESETS[b.dataset.preset].board; renderRanges(); }));
    $("#flop-random").addEventListener("click", () => { r.board = PF.randomBoard(); renderRanges(); });
    el.querySelectorAll("[data-bet]").forEach((b) => b.addEventListener("click", () => { r.bet = b.dataset.bet; renderRanges(); }));
    el.querySelectorAll(".grid .cell").forEach((c) => c.addEventListener("click", () => {
      el.querySelectorAll(".grid .cell.hl").forEach((x) => x.classList.remove("hl"));
      c.classList.add("hl");
      const info = $("#cell-info");
      info.classList.remove("muted");
      info.innerHTML = handOnBoardInfo(c.dataset.hand, r.board);
    }));
  }

  function rangeSeg(mode) {
    return `<div class="seg wrap">
      <button class="${mode === "rfi" ? "on" : ""}" data-mode="rfi">Eröffnen (alle gepasst)</button>
      <button class="${mode === "vs" ? "on" : ""}" data-mode="vs">Gegen eine Eröffnung</button>
      <button class="${mode === "flop" ? "on" : ""}" data-mode="flop">Nach dem Flop</button>
    </div>`;
  }
  function bindRangeSeg(el) {
    el.querySelectorAll(".seg button").forEach((b) => b.addEventListener("click", () => { state.ranges.mode = b.dataset.mode; renderRanges(); }));
  }

  // ---------- River: Bluffen? (du bist am Button und setzt) ----------
  const RIVER_SPOT = { players: 6, hero: "BTN", villain: "BB" };
  const RIVER_POT = 20;
  const RIVER_CAT_KEYS = ["value", "showdown", "bluff", "giveup"];
  const RIVER_ACT = { check: "Checken", value: "Value-Bet", bluff: "Bluff" };
  let btnRange = null;
  const btnRiverRange = () => btnRange || (btnRange = G.rfiRange(6, "BTN"));
  const riverBet = () => RIVER_POT * PF.RIVER_BET;
  // Anteil der Range, der bluffen sollte, damit Bluffs ≈ 30 % aller Bets ausmachen.
  const neededBluffPct = (bd) => { const s = PF.bluffShare(PF.RIVER_BET); return (bd.pct.value * s) / (1 - s); };

  function makeRiverQuestion() {
    const board = PF.randomBoard(5);
    const dead = new Set(board);
    const byCat = {};
    for (const hand of btnRiverRange()) for (const combo of PF.combosOf(hand, dead)) {
      const k = PF.classifyRiver(combo, board).cat;
      (byCat[k] = byCat[k] || []).push({ hand, combo });
    }
    const { hand, combo } = pick(byCat[pick(Object.keys(byCat))]);
    const cls = PF.classifyRiver(combo, board);
    return { kind: "river", board, hand, cards: combo, cls, bd: PF.riverBreakdown(btnRiverRange(), board), picked: null, verdict: null };
  }

  // "ok" = beste Aktion, "meh" = auch vertretbar (abhängig davon, wie viele verpasste Draws es gibt), "bad" = falsch.
  function riverVerdict(q, act) {
    const best = PF.RIVER_CATS[q.cls.cat].action;
    if (act === best) return "ok";
    const need = neededBluffPct(q.bd);
    if (q.cls.cat === "bluff" && act === "check" && q.bd.pct.bluff > need * 1.5) return "meh";
    if (q.cls.cat === "giveup" && act === "bluff" && q.bd.pct.bluff < need) return "meh";
    return "bad";
  }

  function riverReason(q) {
    const blocker = PF.nutFlushBlocker(q.cards, q.board);
    const blockerText = blocker && q.cls.cat !== "value" ? ` Dazu ein Blocker: Du hältst das A${SUIT_SYM[blocker]}, der Gegner kann also keinen Nut-Flush haben. Das macht einen Bluff glaubwürdiger.` : "";
    return {
      value: "Deine Hand ist stark genug, dass schlechtere Hände mitgehen. Das ist eine Value-Bet. Checkst du, verschenkst du Geld, das der Gegner mit schwächeren Paaren noch bezahlt hätte.",
      showdown: "Das ist Showdown-Value: Deine Hand schlägt die Bluffs und verpassten Draws des Gegners. Setzt du, gehen nur bessere Hände mit, und schlechtere passen. Weder Value-Bet noch Bluff ergibt Sinn, also checkst du und gehst zum Showdown.",
      bluff: "Beim Showdown verlierst du damit fast immer. Nur ein Bluff kann den Pot noch gewinnen. Verpasste Draws sind die idealen Bluffs, weil sie nichts zu verlieren haben und der Gegner befürchten muss, dass du eine starke Hand hast.",
      giveup: "Damit gewinnst du den Showdown kaum, aber für Bluffs nimmst du zuerst die verpassten Draws: Sie hatten eine echte Chance und passen besser zu einer starken Hand. Diese Hand checkst du und gibst den Pot auf.",
    }[q.cls.cat] + blockerText;
  }

  function riverBreakdownHTML(bd, mineCat = null) {
    const need = neededBluffPct(bd);
    const segs = RIVER_CAT_KEYS.map((k) => `<span class="r-${k}" style="width:${bd.pct[k]}%" title="${PF.RIVER_CATS[k].name}: ${fmtPct(bd.pct[k])}">${bd.pct[k] >= 7 ? Math.round(bd.pct[k]) + " %" : ""}</span>`).join("");
    const rows = RIVER_CAT_KEYS.map((k) => `
      <div class="bd-row ${k === mineCat ? "mine" : ""}">
        <span class="gtag r-${k}"></span>
        <span><b>${PF.RIVER_CATS[k].name}</b> <span class="muted small">${PF.RIVER_CATS[k].detail}</span></span>
        <span class="bd-pct">${fmtPct(bd.pct[k])}</span>
        <span class="bd-act ${PF.RIVER_CATS[k].action === "check" ? "stop" : "go"}">${RIVER_ACT[PF.RIVER_CATS[k].action]}</span>
      </div>`).join("");
    let balance;
    if (bd.pct.bluff > need * 1.5) balance = `Du hast mehr verpasste Draws (${fmtPct(bd.pct.bluff)}) als nötig. Nicht jeder muss bluffen: Ein Teil davon checkt, sonst bluffst du zu oft.`;
    else if (bd.pct.bluff < need) balance = `Du hast zu wenige verpasste Draws (${fmtPct(bd.pct.bluff)}). Dann bluffen auch einige Hände ohne Draw, am besten solche mit Blockern.`;
    else balance = `Die verpassten Draws (${fmtPct(bd.pct.bluff)}) reichen ungefähr für die nötigen Bluffs.`;
    return `
      <div class="bd">
        <p>Bei einer Bet von 3/4 Pot sollten etwa <b>${fmtPct(PF.bluffShare(PF.RIVER_BET) * 100)}</b> deiner Bets Bluffs sein. Du hast <b>${fmtPct(bd.pct.value)}</b> Value-Hände, brauchst also Bluffs für etwa <b>${fmtPct(need)}</b> deiner Range. ${balance}</p>
        <div class="bd-bar">${segs}</div>
        <div class="bd-rows">${rows}</div>
      </div>`;
  }

  function riverGridHTML(bd, highlight) {
    const range = btnRiverRange();
    let html = `<div class="grid">`;
    for (let r = 0; r < 13; r++) for (let c = 0; c < 13; c++) {
      const h = G.cellHand(r, c);
      const counts = bd.perHand[h];
      let cls = "g-out", title = `${h}: nicht in deiner Button-Range`;
      if (range.has(h) && counts) {
        const total = RIVER_CAT_KEYS.reduce((a, k) => a + counts[k], 0);
        if (total) {
          const k = RIVER_CAT_KEYS.reduce((best, x) => (counts[x] > counts[best] ? x : best), "value");
          cls = "r-" + k;
          title = `${h}: ` + RIVER_CAT_KEYS.filter((x) => counts[x]).map((x) => `${PF.RIVER_CATS[x].name} ×${counts[x]}`).join(", ");
        }
      }
      html += `<div class="cell ${cls}${h === highlight ? " hl" : ""}" title="${title}">${h}</div>`;
    }
    return html + "</div>";
  }

  function riverBody(q) {
    const bet = num(riverBet());
    const btns = ["check", "value", "bluff"].map((a, i) => {
      let cls = "btn choice";
      if (q.picked !== null) {
        const v = riverVerdict(q, a);
        cls += v === "ok" ? " correct" : a === q.picked ? (v === "meh" ? " okay" : " wrong") : " dim";
      }
      const label = a === "check" ? "Checken" : `${RIVER_ACT[a]}: ${bet}bb setzen (3/4 Pot)`;
      return `<button class="${cls}" data-riveract="${a}" ${q.picked !== null ? "disabled" : ""}><kbd>${i + 1}</kbd>${label}</button>`;
    }).join("");

    let feedback = "";
    if (q.picked !== null) {
      const best = PF.RIVER_CATS[q.cls.cat].action;
      const head = { ok: "Richtig", meh: "Auch vertretbar", bad: "Nicht ganz" }[q.verdict];
      const mehText = q.verdict === "meh" ? (q.cls.cat === "bluff"
        ? " Weil es auf diesem Board mehr verpasste Draws gibt als nötige Bluffs, darf ein Teil davon auch checken."
        : " Weil es auf diesem Board zu wenige verpasste Draws gibt, bluffen auch einige Hände ohne Draw.") : "";
      feedback = `
        <div class="feedback ${q.verdict}">
          <h3>${head}${q.verdict === "ok" ? "" : ` – am besten: ${RIVER_ACT[best]}`}</h3>
          <p>Deine Hand: <b>${q.cls.label}</b>. ${riverReason(q)}${mehText}</p>
          <h4>Deine ganze Range auf diesem River</h4>
          ${riverBreakdownHTML(q.bd, q.cls.cat)}
          ${riverGridHTML(q.bd, q.hand)}
          <p class="muted small">Vereinfacht: Als Range zählt deine ganze Button-Eröffnung, ohne zu berücksichtigen, welche Hände auf Flop und Turn schon aufgegeben hätten. Jedes Feld zeigt die Kategorie, in die die meisten Kombos fallen.</p>
        </div>
        <button class="btn primary next">Nächste Hand <kbd>Enter</kbd></button>`;
    }

    return `
      <div class="tracker"><span class="st done">Preflop</span><span class="st-sep">›</span><span class="st done">Flop</span><span class="st-sep">›</span><span class="st done">Turn</span><span class="st-sep">›</span><span class="st now">River</span></div>
      <div class="ex-layout">
        <div class="ex-left">
          ${sceneHTML(RIVER_SPOT, { board: q.board, pot: RIVER_POT })}
          <div class="ex-hero">
            <div class="ex-hero-cards">
              <div class="ex-box-label">Deine Karten</div>
              <div class="hand">${q.cards.map((c) => cardHTML(c)).join("")}</div>
            </div>
          </div>
        </div>
        <div class="ex-right">
          <div class="ex-box now"><div class="ex-box-label">Jetzt: River</div><ul class="ex-text">
            <li>6 Spieler. Du hast am Button eröffnet, der Big Blind ist mitgegangen. Die Hand ist bis zum River gekommen.</li>
            <li>Board: ${boardText(q.board)}. Pot: ${RIVER_POT}bb.</li>
            <li>Der BB checkt zu dir.</li>
          </ul></div>
          <p class="spot ex-prompt">Was tust du, und warum?</p>
          <div class="choices">${btns}</div>
          ${feedback}
        </div>
      </div>`;
  }

  function pickRiverAction(a) {
    const q = state.question;
    if (!q || q.kind !== "river" || q.picked !== null) return;
    q.picked = a;
    q.verdict = riverVerdict(q, a);
    recordResult(state.quizMode, q.verdict !== "bad", q);
    renderQuiz();
    const fb = $("#tab-quiz .feedback");
    if (fb && fb.getBoundingClientRect().top > window.innerHeight) fb.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ---------- Beispiele ----------
  const STREETS = ["preflop", "flop", "turn", "river"];
  const STREET_LABEL = { preflop: "Preflop", flop: "Flop", turn: "Turn", river: "River" };

  function openExample(id) {
    state.ex = { id, step: 0, picked: null };
    store.set("example", id);
    setTab("examples");
    window.scrollTo(0, 0);
  }

  function sceneHTML(ex, step) {
    const pos = G.positions(ex.players);
    const heroIdx = pos.indexOf(ex.hero);
    const dealerIdx = pos.indexOf(ex.players === 2 ? "BTN/SB" : "BTN");
    const notes = step.notes || {};
    let seats = "";
    pos.forEach((p, i) => {
      const angle = Math.PI / 2 + ((i - heroIdx) / pos.length) * Math.PI * 2;
      const x = 50 + 44 * Math.cos(angle);
      const y = 50 + 41 * Math.sin(angle);
      const note = notes[p] || (p === ex.hero ? "Du" : p === ex.villain ? "Gegner" : "Gepasst");
      let cls = "seat";
      if (p === ex.hero) cls += " hero";
      else if (note.startsWith("Erhöht") || note === "Gegner") cls += " opener";
      else if (note === "Gepasst") cls += " folded";
      seats += `<div class="${cls}" style="left:${x}%;top:${y}%" title="${esc(seatTitle(p))}"><b>${p}</b><small>${note}</small>${i === dealerIdx ? `<span class="dbtn">D</span>` : ""}</div>`;
    });
    const slots = [0, 1, 2, 3, 4].map((i) => (step.board[i] ? cardHTML(step.board[i], "sm") : `<div class="card sm slot"></div>`)).join("");
    return `
      <div class="felt scene">
        <div class="felt-inner">
          <div class="board-area">
            <div class="board">${slots}</div>
            <div class="pot">Pot: <b>${num(step.pot)}bb</b></div>
          </div>
        </div>
        ${seats}
      </div>`;
  }

  function renderExamples() {
    const el = $("#tab-examples");
    const ex = state.ex && window.EXAMPLES.find((e) => e.id === state.ex.id);

    if (!ex) {
      el.innerHTML = `
        <div class="intro">
          <h2>Beispielhände</h2>
          <p>Spiele echte Situationen Schritt für Schritt durch: Du siehst deine Karten, die Karten auf dem Tisch, den Pot und was die anderen getan haben. An jeder Stelle entscheidest du, dann kommt die Erklärung.</p>
        </div>
        <div class="ex-list">
          ${window.EXAMPLES.map((e) => `
            <button class="ex-card" data-ex="${e.id}">
              <div class="ex-card-cards">${e.heroCards.map((c) => cardHTML(c, "sm")).join("")}</div>
              <div>
                <h3>${e.title}</h3>
                <p>${e.teaser}</p>
                <p class="muted small">${e.hero} · ${spieler(e.players)} · ${e.steps.length} ${e.steps.length === 1 ? "Entscheidung" : "Entscheidungen"} · Thema: ${e.lesson}</p>
              </div>
            </button>`).join("")}
        </div>`;
      linkTerms(el);
      el.querySelectorAll("[data-ex]").forEach((b) => b.addEventListener("click", () => openExample(b.dataset.ex)));
      return;
    }

    const si = state.ex.step;
    const step = ex.steps[si];
    const curStreet = STREETS.indexOf(step.street);
    const picked = state.ex.picked;
    const answered = picked !== null;
    const isLast = si === ex.steps.length - 1;
    const okList = step.ok || [];

    const tracker = STREETS.map((s, i) => `<span class="st ${i < curStreet ? "done" : i === curStreet ? "now" : ""}">${STREET_LABEL[s]}</span>`).join(`<span class="st-sep">›</span>`);
    const history = ex.steps.slice(0, si).map((s) => `<li><b>${STREET_LABEL[s.street]}:</b> Du: ${esc(s.options[s.answer])}. ${s.next}</li>`).join("");

    const btns = step.options.map((o, i) => {
      let cls = "btn choice";
      if (answered) cls += i === step.answer ? " correct" : okList.includes(i) && i === picked ? " okay" : i === picked ? " wrong" : " dim";
      return `<button class="${cls}" data-opt="${i}" ${answered ? "disabled" : ""}><kbd>${i + 1}</kbd>${esc(o)}</button>`;
    }).join("");

    let feedback = "";
    if (answered) {
      const verdict = picked === step.answer ? ["ok", "Richtig"] : okList.includes(picked) ? ["meh", "Auch vertretbar"] : ["bad", "Nicht ganz"];
      const nextLabel = isLast ? "Zurück zu allen Beispielen" : `Weiter zum ${STREET_LABEL[ex.steps[si + 1].street]}`;
      feedback = `
        <div class="feedback ${verdict[0]}">
          <h3>${verdict[1]}${picked === step.answer ? "" : ` – am besten: ${esc(step.options[step.answer])}`}</h3>
          <p>${step.why}</p>
          <p><b>${isLast ? "Ergebnis" : "So geht es weiter"}:</b> ${step.next}</p>
        </div>
        <button class="btn primary ex-continue">${nextLabel} <kbd>Enter</kbd></button>`;
    }

    el.innerHTML = `
      <div class="ex-head">
        <button class="btn ghost-sm" id="ex-back">← Alle Beispiele</button>
        <div>
          <h2>${ex.title}</h2>
          <p class="muted small">Entscheidung ${si + 1} von ${ex.steps.length} · ${spieler(ex.players)} · du sitzt im ${ex.hero}</p>
        </div>
      </div>
      <div class="tracker" aria-label="Wo wir in der Hand sind">${tracker}</div>
      <div class="ex-layout">
        <div class="ex-left">
          ${sceneHTML(ex, step)}
          <div class="ex-hero">
            <div class="ex-hero-cards">
              <div class="ex-box-label">Deine Karten</div>
              <div class="hand">${ex.heroCards.map((c) => cardHTML(c)).join("")}</div>
            </div>
            <p class="ex-text ex-hand">${step.hand}</p>
          </div>
        </div>
        <div class="ex-right">
          ${history ? `<div class="ex-box"><div class="ex-box-label">Bisher</div><ul class="ex-text">${history}</ul></div>` : ""}
          <div class="ex-box now"><div class="ex-box-label">Jetzt: ${STREET_LABEL[step.street]}</div><ul class="ex-text">${step.log.map((l) => `<li>${l}</li>`).join("")}</ul></div>
          <p class="spot ex-prompt">${step.prompt}</p>
          <div class="choices">${btns}</div>
          ${feedback}
        </div>
      </div>`;
    linkTerms(el);

    $("#ex-back").addEventListener("click", () => { state.ex = null; store.set("example", null); renderExamples(); });
    el.querySelectorAll("[data-opt]").forEach((b) => b.addEventListener("click", () => pickExample(Number(b.dataset.opt))));
    const cont = $(".ex-continue", el);
    if (cont) cont.addEventListener("click", continueExample);
  }

  function pickExample(i) {
    if (!state.ex || state.ex.picked !== null) return;
    const ex = window.EXAMPLES.find((e) => e.id === state.ex.id);
    if (i >= ex.steps[state.ex.step].options.length) return;
    state.ex.picked = i;
    renderExamples();
    const fb = $("#tab-examples .feedback");
    if (fb && fb.getBoundingClientRect().bottom > window.innerHeight) fb.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function continueExample() {
    const ex = window.EXAMPLES.find((e) => e.id === state.ex.id);
    if (state.ex.step >= ex.steps.length - 1) { state.ex = null; store.set("example", null); }
    else state.ex = { id: ex.id, step: state.ex.step + 1, picked: null };
    renderExamples();
    window.scrollTo(0, 0);
  }

  document.addEventListener("keydown", (e) => {
    if (state.tab !== "examples" || !state.ex || /^(SELECT|INPUT)$/.test(e.target.tagName)) return;
    if (state.ex.picked === null && /^[1-4]$/.test(e.key)) pickExample(Number(e.key) - 1);
    else if (state.ex.picked !== null && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); continueExample(); }
  });

  // ---------- Glossar ----------
  function renderGlossary() {
    window.GLOSS.render($("#tab-glossary"), state.glossFocus);
    state.glossFocus = null;
  }
  window.GLOSS.onOpen = (id) => { state.glossFocus = id; setTab("glossary"); };

  // ---------- Fortschritt ----------
  function statFor(mode) {
    return state.stats[mode] || (state.stats[mode] = { correct: 0, total: 0, streak: 0, best: 0, misses: [] });
  }

  function recordResult(mode, ok, q) {
    const s = statFor(mode);
    s.total++;
    if (ok) { s.correct++; s.streak++; s.best = Math.max(s.best, s.streak); }
    else {
      s.streak = 0;
      if (q.kind === "preflop") {
        s.misses.unshift({ hand: q.hand, spot: q.opener ? `${q.hero} gegen ${q.opener}` : `${q.hero} eröffnet`, n: q.n, picked: q.picked, answer: q.answer });
        s.misses = s.misses.slice(0, 15);
      }
    }
    store.set("stats", state.stats);
  }

  function renderStats() {
    const el = $("#tab-stats");
    const rows = Object.entries(QUIZ_MODES).map(([k, m]) => {
      const s = statFor(k);
      const acc = s.total ? Math.round((s.correct / s.total) * 100) : 0;
      return `<div class="stat-card">
        <h3>${m.label}</h3>
        <div class="big">${s.total ? acc + " %" : "–"}</div>
        <div class="bar"><span style="width:${acc}%"></span></div>
        <p class="muted small">${s.correct} von ${s.total} richtig · beste Serie ${s.best}</p>
      </div>`;
    }).join("");
    const misses = ["rfi", "vsopen"].flatMap((k) => statFor(k).misses);
    el.innerHTML = `
      <div class="intro"><h2>Dein Fortschritt</h2><p>Wird nur in diesem Browser gespeichert.</p></div>
      <div class="stat-grid">${rows}</div>
      <h3 class="section-title">Letzte Preflop-Fehler</h3>
      ${misses.length ? `<table class="misses"><thead><tr><th>Hand</th><th>Situation</th><th>Tisch</th><th>Deine Wahl</th><th>Richtig</th></tr></thead><tbody>
        ${misses.map((m) => `<tr><td><b>${m.hand}</b></td><td>${m.spot}</td><td>${spieler(m.n)}</td><td>${ACTION_LABEL[m.picked]}</td><td><span class="tag a-${m.answer}">${ACTION_LABEL[m.answer]}</span></td></tr>`).join("")}
      </tbody></table>` : `<p class="muted">Noch keine Fehler.</p>`}
      <button class="btn ghost" id="reset">Fortschritt zurücksetzen</button>`;
    $("#reset").addEventListener("click", () => { state.stats = {}; store.set("stats", {}); renderStats(); });
  }

  // ---------- Start ----------
  const playersSel = $("#players");
  playersSel.value = String(state.players);
  playersSel.addEventListener("change", () => {
    state.players = Number(playersSel.value);
    store.set("players", state.players);
    render();
  });
  document.querySelectorAll(".tabs button").forEach((b) => b.addEventListener("click", () => setTab(b.dataset.tab)));
  setTab(state.tab);
})();
