// Poker-Glossar: Daten, der Glossar-Tab und Tooltips für Fachbegriffe im Text.
(function () {
  // `match` ist eine Regex-Quelle dafür, wie der Begriff im Fließtext vorkommt.
  // `cs` = Groß-/Kleinschreibung beachten (z. B. BB vs. bb, CO, SB).
  const TERMS = [
    // ---- Sitze & Position ----
    { id: "position", term: "Position", cat: "Sitze & Position", match: "Positionen|Position", def: "Wo du relativ zum Dealer-Button sitzt. Das bestimmt, wann du handelst. Später handeln ist besser, weil du zuerst siehst, was die anderen tun." },
    { id: "ip", term: "In Position (IP) / Ohne Position (OOP)", cat: "Sitze & Position", match: "in Position|ohne Position|IP|OOP", def: "In Position heißt: Du handelst nach dem Flop auf jeder Straße nach deinem Gegner. Ohne Position (out of position) handelst du zuerst und hast weniger Informationen." },
    { id: "btn", term: "BTN (Button)", cat: "Sitze & Position", match: "BTN|Button", def: "Der Dealer-Platz, markiert mit einer „D“-Scheibe. Er handelt nach dem Flop auf jeder Straße als Letzter und ist deshalb der profitabelste Platz." },
    { id: "sb", term: "SB (Small Blind)", cat: "Sitze & Position", match: "SB|Small Blind", def: "Der Platz links vom Button. Setzt vor dem Austeilen einen Pflichteinsatz von einem halben Big Blind. Handelt nach dem Flop als Erster." },
    { id: "bb-seat", term: "BB (Big Blind)", cat: "Sitze & Position", match: "BB|Big Blind", def: "Zwei Plätze links vom Button. Setzt einen Pflichteinsatz von einem Big Blind. Handelt vor dem Flop als Letzter und schließt damit die Preflop-Runde ab." },
    { id: "utg", term: "UTG (Under the Gun)", cat: "Sitze & Position", match: "UTG(?:\\+[12])?", def: "Der erste Spieler, der vor dem Flop handelt, links vom Big Blind. „Under the Gun“ (unter Beschuss), weil alle anderen noch nach dir handeln. UTG+1 und UTG+2 sind die nächsten Plätze." },
    { id: "lj", term: "LJ (Lojack)", cat: "Sitze & Position", match: "LJ|Lojack", def: "Drei Plätze vor dem Button. Beginn der mittleren Position an Tischen mit 7+ Spielern." },
    { id: "hj", term: "HJ (Hijack)", cat: "Sitze & Position", match: "HJ|Hijack", def: "Zwei Plätze vor dem Button." },
    { id: "co", term: "CO (Cutoff)", cat: "Sitze & Position", match: "CO|Cutoff", def: "Der Platz direkt vor dem Button. Zweitbester Platz; er „schneidet“ dem Button die Chance ab, die Blinds zu stehlen." },
    { id: "ep", term: "Frühe / mittlere / späte Position", cat: "Sitze & Position", match: "früher Position|frühen Position|früh|mittlerer Position|mittleren Position|später Position|späten Position|spät", def: "Früh = die ersten Plätze (UTG). Mittel = LJ/HJ. Spät = CO und BTN. Je später die Position, desto mehr Hände kannst du spielen." },
    { id: "blinds", term: "Blinds", cat: "Sitze & Position", match: "Blinds", def: "Die zwei Pflichteinsätze (Small Blind und Big Blind), die vor dem Austeilen gesetzt werden, damit es immer etwas zu gewinnen gibt." },
    { id: "heads-up", term: "Heads-up (HU)", cat: "Sitze & Position", match: "Heads-up|HU", def: "Nur zwei Spieler. Der Button setzt den Small Blind, handelt vor dem Flop als Erster und danach als Letzter." },
    { id: "6max", term: "6-max / Full Ring", cat: "Sitze & Position", match: "6-max|Full Ring|9-max", def: "6-max ist ein Tisch mit höchstens 6 Spielern, Full Ring (9-max) hat 9. Weniger Spieler bedeuten breitere Ranges." },

    // ---- Aktionen ----
    { id: "fold", term: "Passen (Fold)", cat: "Aktionen", match: "Passen|passt|passen|Fold|folden|gefoldet|foldet", def: "Deine Karten wegwerfen und aus der Hand aussteigen. Du verlierst, was du schon gesetzt hast, aber nichts mehr." },
    { id: "call", term: "Mitgehen (Call)", cat: "Aktionen", match: "Mitgehen|mitgehen|mitgeht|Call|callen|Callen|Flat-Call|Cold Call", def: "Den aktuellen Einsatz bezahlen, ohne zu erhöhen. Ein „Cold Call“ oder „Flat-Call“ ist ein Call auf eine Erhöhung, wenn du selbst noch nichts investiert hast." },
    { id: "raise", term: "Erhöhen (Raise)", cat: "Aktionen", match: "Erhöhen|erhöhen|erhöht|Erhöhung|Raise|Raises", def: "Mehr setzen als der aktuelle Einsatz. Gegner müssen dann den höheren Betrag bezahlen oder passen." },
    { id: "open", term: "Eröffnen / Open-Raise (RFI)", cat: "Aktionen", match: "Open-Raise|RFI|eröffnen|eröffnet|Eröffnung|Opener|Open", def: "Als erster Spieler vor dem Flop erhöhen, nachdem alle vor dir gepasst haben. RFI = „Raise First In“." },
    { id: "limp", term: "Limpen", cat: "Aktionen", match: "Limpen|limpen|Limp", def: "Vor dem Flop nur den Big Blind bezahlen statt zu erhöhen. In GTO-Strategie meist ein Fehler (außer manchmal aus dem Small Blind)." },
    { id: "3bet", term: "3-Bet", cat: "Aktionen", match: "3-Bets?|3-betten|3-Betting", def: "Die erste Re-Raise vor dem Flop. (Der Big Blind ist Einsatz 1, das Open-Raise Einsatz 2, die Re-Raise Einsatz 3.)" },
    { id: "4bet", term: "4-Bet", cat: "Aktionen", match: "4-Bets?|4-betten", def: "Eine Re-Raise auf eine 3-Bet." },
    { id: "squeeze", term: "Squeeze", cat: "Aktionen", match: "Squeeze|squeezen", def: "Eine 3-Bet, nachdem jemand erhöht und ein anderer Spieler mitgegangen ist. Der Caller wird in der Mitte „ausgequetscht“." },
    { id: "cbet", term: "C-Bet (Continuation Bet)", cat: "Aktionen", match: "C-Bets?|Continuation Bets?", def: "Eine Bet auf dem Flop durch den Spieler, der vor dem Flop zuletzt erhöht hat; er „setzt“ seine Aggression „fort“. Beispiel: Du eröffnest, der BB geht mit, der Flop kommt und du setzt." },
    { id: "bet", term: "Bet / Setzen", cat: "Aktionen", match: "Bets|Bet|setzen|setzt|Einsatz", def: "Chips in den Pot legen, wenn auf dieser Straße noch niemand gesetzt hat." },
    { id: "check", term: "Check / Schieben", cat: "Aktionen", match: "Checks?|checken|checkt", def: "Weitergeben, ohne zu setzen. Nur erlaubt, wenn auf dieser Straße noch niemand gesetzt hat." },
    { id: "checkraise", term: "Check-Raise", cat: "Aktionen", match: "Check-Raise", def: "Erst checken und dann erhöhen, nachdem ein Gegner gesetzt hat." },
    { id: "steal", term: "Steal (Blinds stehlen)", cat: "Aktionen", match: "Steal|stehlen", def: "Aus später Position erhöhen, vor allem um die Blinds kampflos zu gewinnen." },
    { id: "defend", term: "Verteidigen (Defend)", cat: "Aktionen", match: "verteidigen|verteidigt|Verteidigung|Defend", def: "Weiterspielen (mitgehen oder erhöhen) statt zu passen, wenn jemand setzt oder erhöht – vor allem aus den Blinds." },
    { id: "shove", term: "All-in / Shove", cat: "Aktionen", match: "All-in|Shove", def: "Alle deine Chips setzen." },

    // ---- Hände & Karten ----
    { id: "notation", term: "Hand-Notation (AKs, AKo, 77)", cat: "Hände & Karten", match: "", def: "A = Ass, K = König, Q = Dame, J = Bube, T = Zehn. „s“ = suited (gleiche Farbe), „o“ = offsuit (verschiedene Farben), zwei gleiche Ränge = Pocket Pair. „77+“ heißt 77 und jedes höhere Paar. „ATs+“ heißt ATs, AJs, AQs, AKs. „A5s-A2s“ heißt A5s, A4s, A3s, A2s." },
    { id: "suited", term: "Suited / Offsuit", cat: "Hände & Karten", match: "suited|offsuit", def: "Suited = beide Karten haben dieselbe Farbe (z. B. A♥K♥), das hilft beim Flush. Offsuit = verschiedene Farben." },
    { id: "pair", term: "Pocket Pair (Paar)", cat: "Hände & Karten", match: "Pocket Pairs?|kleine Paare|kleinen Paare|mittlere Paare|Paare|Paar", def: "Zwei Startkarten mit demselben Rang, z. B. 7♣7♦." },
    { id: "broadway", term: "Broadway", cat: "Hände & Karten", match: "Broadways?|Broadway-Karten", def: "Karten ab der Zehn aufwärts (T, J, Q, K, A). „Suited Broadways“ sind Hände wie KQs oder QJs." },
    { id: "connectors", term: "Suited Connectors", cat: "Hände & Karten", match: "Suited Connectors|Connectors|verbunden|verbundene|verbundenen", def: "Karten gleicher Farbe mit benachbartem Rang, z. B. 8♠7♠. Sie machen Straights und Flushes und spielen sich nach dem Flop gut." },
    { id: "kicker", term: "Kicker", cat: "Hände & Karten", match: "Kickers?", def: "Deine zweite Karte, wenn du mit der ersten ein Paar triffst. Mit AK auf einem Board mit Ass ist der K dein Kicker; er entscheidet gegen ein anderes Ass." },
    { id: "dominated", term: "Dominiert", cat: "Hände & Karten", match: "dominiert|dominierte|dominierten", def: "Wenn deine Hand eine Karte mit einer besseren Hand teilt, z. B. KT gegen KQ. Oft trefft ihr beide den König und du verlierst mit dem schlechteren Kicker." },
    { id: "wheel", term: "Wheel", cat: "Hände & Karten", match: "Wheel|Wheel-Straights?", def: "Die niedrigste Straße: A-2-3-4-5. Hände wie A5s können sie machen." },
    { id: "combos", term: "Kombos", cat: "Hände & Karten", match: "Kombos?|Kombinationen", def: "Wie viele konkrete Kartenkombinationen eine Handklasse hat. Ein Paar hat 6, eine suited Hand 4, eine offsuit Hand 12 – von insgesamt 1.326 Starthänden." },
    { id: "nuts", term: "Die Nuts", cat: "Hände & Karten", match: "Nut-Flush|Nuts", def: "Die bestmögliche Hand auf dem aktuellen Board." },
    { id: "toppair", term: "Top Pair / Overpair", cat: "Hände & Karten", match: "Top Pair|Overpair", def: "Top Pair: Du paarst die höchste Karte auf dem Board, z. B. du hältst A♠K♦ und der Flop bringt A♥7♣2♦. Overpair: Dein Pocket Pair ist höher als jede Board-Karte, z. B. QQ auf 9-6-2." },
    { id: "bottompair", term: "Zweites Paar / Bottom Pair", cat: "Hände & Karten", match: "zweites Paar|zweiten Paar|Bottom Pair", def: "Zweites Paar: Du paarst die zweithöchste Board-Karte, z. B. du hältst 8♠4♦ auf K-8-3. Bottom Pair: Du paarst die niedrigste Board-Karte, z. B. 3♠2♦ auf K-8-3. Beide schlagen nur schwächere Hände." },
    { id: "twopair", term: "Zwei Paare", cat: "Hände & Karten", match: "Zwei Paaren?", def: "Zwei verschiedene Paare, z. B. du hältst A♠K♦ und auf dem Board liegen ein Ass und ein König." },
    { id: "set", term: "Set", cat: "Hände & Karten", match: "Sets?", def: "Drilling mit einem Pocket Pair: Du hast 7♣7♦ und auf dem Board liegt eine 7." },

    // ---- Board & Straßen ----
    { id: "preflop", term: "Preflop / Postflop", cat: "Board & Straßen", match: "Preflop|Postflop", def: "Preflop = die Setzrunde, nachdem du deine zwei Karten bekommen hast, aber vor den Gemeinschaftskarten. Postflop = alles danach." },
    { id: "flop", term: "Flop / Turn / River", cat: "Board & Straßen", match: "Flop|Turn|River", def: "Die Gemeinschaftskarten: Der Flop sind die ersten drei, der Turn die vierte, der River die fünfte. Jede hat eine eigene Setzrunde." },
    { id: "street", term: "Straße (Street)", cat: "Board & Straßen", match: "Straßen|Straße|Street", def: "Eine Setzrunde: Preflop, Flop, Turn oder River." },
    { id: "board", term: "Board", cat: "Board & Straßen", match: "Boards?", def: "Die offenen Gemeinschaftskarten, die jeder nutzen kann." },
    { id: "texture", term: "Board-Textur: trocken / nass", cat: "Board & Straßen", match: "Board-Textur|trocken|trockenen|trockene|nass|nassen|nasse", def: "Trockene Boards bieten kaum Straights oder Flushes (z. B. ein Flop K♠7♦2♣). Nasse Boards bieten viele (z. B. ein Flop 9♥8♥7♣). Die Textur bestimmt, wie oft du setzen solltest." },
    { id: "rainbow", term: "Rainbow / Two-Tone / Monotone", cat: "Board & Straßen", match: "Rainbow|Two-Tone|Monotone", def: "Rainbow = alle Farben verschieden (kein Flush-Draw). Two-Tone = zwei Karten einer Farbe (Flush-Draw möglich). Monotone = alle in einer Farbe." },
    { id: "paired", term: "Gepaartes Board", cat: "Board & Straßen", match: "gepaarte Boards?|gepaarten Boards?", def: "Ein Board mit zwei Karten desselben Rangs, z. B. ein Flop K-K-5." },
    { id: "showdown", term: "Showdown", cat: "Board & Straßen", match: "Showdown", def: "Wenn am River nicht mehr gesetzt wird und die verbliebenen Spieler ihre Karten zeigen, um den Gewinner zu ermitteln." },

    // ---- Mathe ----
    { id: "bb", term: "bb (Big Blinds)", cat: "Mathe", match: "bb", cs: true, def: "Kleingeschriebenes bb ist die Einheit für Einsätze und Stacks. „100bb“ heißt ein Stack von 100 Big Blinds; „auf 2,5bb eröffnen“ heißt auf 2,5 Big Blinds erhöhen." },
    { id: "pot", term: "Pot", cat: "Mathe", match: "Pots?", def: "Alle Chips, die in dieser Hand bisher gesetzt wurden. Einsätze werden oft als Anteil am Pot angegeben, z. B. „50 % Pot“." },
    { id: "equity", term: "Equity", cat: "Mathe", match: "Equity", def: "Dein Anteil am Pot, wenn jetzt alle Karten ausgeteilt würden – also deine Gewinnchance gegen die Hände, die der Gegner haben kann. 40 % Equity heißt, du gewinnst im Schnitt 40 % der Fälle." },
    { id: "realize", term: "Equity realisieren", cat: "Mathe", match: "realisieren|realisiert", def: "Deine Equity tatsächlich einsammeln. Hände ohne Position oder schwer spielbare Hände müssen oft vor dem Showdown passen und „realisieren“ weniger als ihre rohe Equity." },
    { id: "potodds", term: "Pot Odds", cat: "Mathe", match: "Pot Odds|Preis", def: "Der Preis für einen Call: wie viel du einzahlst im Verhältnis zu dem, was du gewinnen kannst. Daraus folgt, wie viel Equity du für einen profitablen Call brauchst." },
    { id: "outs", term: "Outs", cat: "Mathe", match: "Outs", def: "Karten im Deck, die deine Hand zur wahrscheinlich besten machen. Ein Flush-Draw hat 9 Outs (13 Karten einer Farbe minus die 4, die du siehst)." },
    { id: "draw", term: "Draw / Flush-Draw", cat: "Mathe", match: "Flush-Draws?|Draws?", def: "Eine Hand, die noch nicht fertig ist, sich aber verbessern kann, z. B. vier Karten zu einem Flush." },
    { id: "backdoor", term: "Backdoor-Draw", cat: "Mathe", match: "Backdoor-Flush-Draws?|Backdoor-Draws?|Backdoors?", def: "Ein Draw, der zwei passende Karten braucht: Turn und River. Beispiel: Du hältst A♥5♥ und auf dem Flop liegt ein Herz. Dann brauchst du noch zwei Herz für den Flush. Schwach, aber gegen kleine Bets oft genug zum Weiterspielen." },
    { id: "oesd", term: "Open-Ended Straight Draw (OESD)", cat: "Mathe", match: "Open-Ended Straight Draw|Open-Ender|OESD", def: "Vier Karten in Folge, die an beiden Enden ergänzt werden können, z. B. du hältst 8-7 und der Flop bringt 6-5-K (eine 9 oder eine 4 macht deine Straße). 8 Outs." },
    { id: "gutshot", term: "Gutshot", cat: "Mathe", match: "Gutshot(?: Straight Draw)?", def: "Ein Straight-Draw, der genau einen Rang in der Mitte braucht, z. B. du hältst 9-8 und der Flop bringt 6-5-K: Nur eine 7 macht deine Straße. 4 Outs." },
    { id: "overcards", term: "Overcards", cat: "Mathe", match: "Overcards", def: "Startkarten, die höher sind als jede Karte auf dem Board. Jede bringt etwa 3 Outs auf ein Paar." },
    { id: "mdf", term: "MDF (Minimum Defense Frequency)", cat: "Mathe", match: "MDF|Mindestverteidigungsfrequenz", def: "Der Anteil deiner Hände, mit dem du gegen eine Bet weiterspielen musst, damit der Gegner nicht mit beliebigen Karten profitabel bluffen kann. MDF = Pot ÷ (Pot + Bet). Die Prozente beziehen sich auf die Hände, die du an dieser Stelle noch hältst, nicht auf alle Starthände." },
    { id: "rake", term: "Rake", cat: "Mathe", match: "Rake", def: "Die Gebühr, die Casino oder Pokerseite von jedem Pot einbehält." },
    { id: "ante", term: "Ante", cat: "Mathe", match: "Antes?", def: "Ein kleiner Pflichteinsatz jedes Spielers, häufig in Turnieren. Antes machen den Pot größer, also werden die Ranges breiter. Diese App geht von keinen Antes aus." },

    // ---- Strategie ----
    { id: "gto", term: "GTO (Game Theory Optimal)", cat: "Strategie", match: "GTO", cs: true, def: "Spieltheoretisch optimale Strategie, die nicht ausgenutzt werden kann: Selbst wenn Gegner sie kennen würden, könnten sie sich durch eine andere Strategie nicht verbessern." },
    { id: "solver", term: "Solver", cat: "Strategie", match: "Solvers?|Solver-Strategie", def: "Software, die GTO-Strategien berechnet. Die Charts in dieser App sind vereinfachte Versionen von Solver-Ergebnissen." },
    { id: "exploit", term: "Exploit (Ausnutzen)", cat: "Strategie", match: "Exploits?|exploitativ|ausnutzen|ausgenutzt", def: "Bewusst von GTO abweichen, um die Fehler eines bestimmten Gegners auszunutzen, z. B. mehr bluffen gegen jemanden, der zu oft passt." },
    { id: "range", term: "Range", cat: "Strategie", match: "Ranges?", def: "Alle Hände, die ein Spieler in einer bestimmten Situation haben kann. Du denkst an deine ganze Range, nicht nur an die Hand, die du hältst – Gegner sehen deine Karten ja nicht." },
    { id: "range-adv", term: "Range-Vorteil", cat: "Strategie", match: "Range-Vorteils?", def: "Wenn deine Range auf diesem Board insgesamt stärker ist als die des Gegners. Beispiel: Du erhöhst vor dem Flop, der Big Blind geht mit, und der Flop bringt A-7-2. Starke Ass-Hände wie AA, AK und AQ hättest du vor dem Flop erhöht, also hältst du hier viel öfter ein Ass als dein Gegner." },
    { id: "pfr", term: "Preflop-Raiser", cat: "Strategie", match: "Preflop-Raisers?|Raisers?", def: "Der Spieler, der vor dem Flop (zuletzt) erhöht hat. Seine Range ist meist stärker als die des Callers, deshalb macht er nach dem Flop oft die C-Bet." },
    { id: "nut-adv", term: "Nut-Vorteil", cat: "Strategie", match: "Nut-Vorteils?", def: "Wenn du mehr der allerbesten Hände (Sets, Straights, die Nuts) haben kannst als dein Gegner. Damit kannst du groß setzen, weil der Gegner nur wenige Hände hat, die dich schlagen." },
    { id: "initiative", term: "Initiative", cat: "Strategie", match: "Initiative", def: "Der letzte Aggressor sein (wer zuletzt gesetzt oder erhöht hat). Wer die Initiative hat, macht meist die C-Bet." },
    { id: "value", term: "Value-Bet", cat: "Strategie", match: "Value-Bets?|für Value|Value", def: "Eine Bet mit einer starken Hand, weil schlechtere Hände mitgehen werden." },
    { id: "overbet", term: "Overbet", cat: "Strategie", match: "Overbets?", def: "Eine Bet, die größer ist als der Pot, z. B. 8bb in einen Pot von 5,5bb. Overbets kommen aus polarisierten Ranges: sehr starke Hände oder Bluffs. Gegen sie spielt man nur mit starken Händen weiter." },
    { id: "bluff", term: "Bluff / Semi-Bluff", cat: "Strategie", match: "Bluffs?|bluffen|blufft|Semi-Bluff", def: "Eine Bet mit einer schwachen Hand, damit bessere Hände passen. Ein Semi-Bluff ist ein Bluff mit einem Draw, der sich noch verbessern kann." },
    { id: "bluffcatcher", term: "Bluff-Catcher", cat: "Strategie", match: "Bluff-Catchers?", def: "Eine mittlere Hand, die nur Bluffs schlägt. Mit ihr zu callen ist nur richtig, wenn der Gegner oft genug blufft." },
    { id: "polarized", term: "Polarisiert / Merged", cat: "Strategie", match: "polarisiert|polarisierte|polarisierten|Merged", def: "Eine polarisierte Range besteht aus sehr starken Händen plus Bluffs, ohne Mittelfeld (meist mit großen Bets). Eine „merged“ Range enthält auch mittlere Hände (meist mit kleinen Bets)." },
    { id: "balance", term: "Balance", cat: "Strategie", match: "Balance|ausbalanciert", def: "Value-Hände und Bluffs im richtigen Verhältnis mischen, damit Gegner nicht einfach immer callen oder immer passen können." },
    { id: "indifferent", term: "Indifferenz", cat: "Strategie", match: "Indifferenz|indifferent", def: "Wenn Callen und Passen dem Gegner gleich viel bringen. Gute Einsatzgrößen und Bluff-Anteile machen Gegner indifferent – dann schlägt dich keine Reaktion." },
    { id: "blocker", term: "Blocker", cat: "Strategie", match: "Blockers?|blockiert|blockieren", def: "Eine Karte in deiner Hand, die bestimmte Hände beim Gegner unwahrscheinlicher macht. Hältst du das A♠ auf einem Board mit drei Pik, kann er den Nut-Flush nicht haben." },
    { id: "showdown-value", term: "Showdown-Value", cat: "Strategie", match: "Showdown-Value", def: "Eine Hand, die ohne weitere Bets beim Showdown gewinnen kann, z. B. ein mittleres Paar. Solche Hände checken oft lieber, statt zu bluffen." },
  ];

  const byId = Object.fromEntries(TERMS.map((t) => [t.id, t]));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // Abkürzungen (nur Großbuchstaben/Ziffern) werden case-sensitiv gesucht, Wörter nicht.
  const isAbbrev = (p) => /^[A-Z0-9+]+$/.test(p.replace(/\(\?:.*?\)\??/g, "").replace(/\\/g, ""));
  const matchers = TERMS.filter((t) => t.match)
    .flatMap((t) => t.match.split("|").map((p) => ({ id: t.id, src: p, cs: t.cs ?? isAbbrev(p) })))
    .sort((a, b) => b.src.length - a.src.length);
  // Längere Muster zuerst, damit „Nut-Vorteil“ vor „Nuts“ und „Flush-Draw“ vor „Draw“ greift.
  const W = "\\wäöüÄÖÜß";
  const build = (list, flags) => new RegExp(`(?<![${W}-])(${list.map((m) => m.src).join("|")})(?![${W}-])`, flags);
  const csRe = build(matchers.filter((m) => m.cs), "g");
  const ciRe = build(matchers.filter((m) => !m.cs), "gi");

  function idFor(text) {
    for (const m of matchers) {
      if (new RegExp("^(?:" + m.src + ")$", m.cs ? "" : "i").test(text)) return m.id;
    }
    return null;
  }

  // Markiert das erste Vorkommen jedes Begriffs in `root` (ohne Buttons, Links, Chips usw.).
  function linkify(root) {
    if (!root) return;
    const seen = new Set();
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        return n.parentElement.closest("button, a, .term, .tag, kbd, .formula, .grid, .seat, h3") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      },
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      const text = node.nodeValue;
      const hits = [];
      for (const re of [csRe, ciRe]) {
        re.lastIndex = 0;
        let m;
        while ((m = re.exec(text))) hits.push({ i: m.index, s: m[0] });
      }
      hits.sort((a, b) => a.i - b.i || b.s.length - a.s.length);
      let pos = 0;
      const frag = document.createDocumentFragment();
      for (const h of hits) {
        if (h.i < pos) continue;
        const id = idFor(h.s);
        if (!id || seen.has(id)) continue;
        seen.add(id);
        frag.append(text.slice(pos, h.i));
        const span = document.createElement("span");
        span.className = "term";
        span.tabIndex = 0;
        span.dataset.term = id;
        span.textContent = h.s;
        frag.append(span);
        pos = h.i + h.s.length;
      }
      if (pos === 0) continue;
      frag.append(text.slice(pos));
      node.replaceWith(frag);
    }
  }

  // ---- schwebender Tooltip ----
  const tip = document.createElement("div");
  tip.className = "term-tip";
  tip.setAttribute("role", "tooltip");
  document.body.appendChild(tip);
  let pinned = null;

  function showTip(el) {
    const t = byId[el.dataset.term];
    if (!t) return;
    tip.innerHTML = `<b>${esc(t.term)}</b><p>${esc(t.def)}</p><button class="tip-more" data-goto="${t.id}">Im Glossar öffnen →</button>`;
    tip.classList.add("show");
    const r = el.getBoundingClientRect();
    const w = tip.offsetWidth, h = tip.offsetHeight;
    const left = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), window.innerWidth - w - 8);
    let top = r.bottom + 8;
    if (top + h > window.innerHeight - 8) top = r.top - h - 8;
    tip.style.left = left + "px";
    tip.style.top = Math.max(8, top) + "px";
  }
  function hideTip() { if (!pinned) tip.classList.remove("show"); }
  function closeTip() { pinned = null; tip.classList.remove("show"); }

  document.addEventListener("mouseover", (e) => { const t = e.target.closest(".term"); if (t && !pinned) showTip(t); });
  document.addEventListener("mouseout", (e) => { if (e.target.closest(".term") && !tip.contains(e.relatedTarget)) hideTip(); });
  tip.addEventListener("mouseleave", hideTip);
  document.addEventListener("focusin", (e) => { const t = e.target.closest(".term"); if (t) showTip(t); });
  document.addEventListener("click", (e) => {
    const goto = e.target.closest("[data-goto]");
    if (goto) { closeTip(); window.GLOSS.onOpen(goto.dataset.goto); return; }
    const t = e.target.closest(".term");
    if (t) { pinned = pinned === t ? null : t; if (pinned) showTip(t); else hideTip(); return; }
    if (!tip.contains(e.target)) closeTip();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeTip(); });
  window.addEventListener("scroll", closeTip, { passive: true });

  // ---- Glossar-Tab ----
  const slug = (c) => "cat-" + c.normalize("NFD").replace(/[^\w]+/g, "-");

  function render(el, focusId) {
    const cats = [...new Set(TERMS.map((t) => t.cat))];
    el.innerHTML = `
      <div class="intro">
        <h2>Glossar</h2>
        <p>Alle Begriffe der App in einfachem Deutsch. Überall in der App zeigen <span class="term-demo">unterstrichene Wörter</span> ihre Erklärung, wenn du mit der Maus darüberfährst oder sie antippst.</p>
      </div>
      <input id="gloss-search" class="search" type="search" placeholder="Begriff suchen, z. B. C-Bet, Equity, UTG …" autocomplete="off">
      <nav class="gloss-cats">${cats.map((c) => `<a href="#${slug(c)}" class="chip">${c}</a>`).join("")}</nav>
      ${cats.map((c) => `
        <section class="gloss-cat" id="${slug(c)}">
          <h3 class="section-title">${c}</h3>
          <dl class="gloss">${TERMS.filter((t) => t.cat === c).map((t) => `
            <div class="gloss-item" id="g-${t.id}" data-search="${esc((t.term + " " + t.def).toLowerCase())}">
              <dt>${esc(t.term)}</dt><dd>${esc(t.def)}</dd>
            </div>`).join("")}
          </dl>
        </section>`).join("")}
      <p class="muted" id="gloss-empty" hidden>Keine passenden Begriffe.</p>`;

    const input = el.querySelector("#gloss-search");
    input.addEventListener("input", () => {
      const q = input.value.trim().toLowerCase();
      let any = false;
      el.querySelectorAll(".gloss-cat").forEach((sec) => {
        let vis = 0;
        sec.querySelectorAll(".gloss-item").forEach((it) => { const ok = !q || it.dataset.search.includes(q); it.hidden = !ok; if (ok) vis++; });
        sec.hidden = vis === 0;
        any = any || vis > 0;
      });
      el.querySelector("#gloss-empty").hidden = any;
    });
    el.querySelectorAll(".gloss-cats a").forEach((a) => a.addEventListener("click", (e) => {
      e.preventDefault();
      el.querySelector(a.getAttribute("href")).scrollIntoView({ behavior: "smooth" });
    }));

    if (focusId) {
      const item = el.querySelector("#g-" + focusId);
      if (item) {
        item.scrollIntoView({ block: "center" });
        item.classList.add("flash");
      }
    }
  }

  window.GLOSS = { TERMS, byId, linkify, render, onOpen: () => {} };
})();
