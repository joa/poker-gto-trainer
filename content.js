// Lektionen und Konzeptfragen. Lektionen verweisen über `practice` auf einen Quiz-Modus.
window.LESSONS = [
  {
    id: "gto",
    title: "1. Was GTO eigentlich bedeutet",
    practice: "concepts",
    body: `
      <p><b>GTO</b> (Game Theory Optimal, spieltheoretisch optimal) ist eine Strategie, die nicht ausgenutzt werden kann: Selbst wenn dein Gegner sie genau kennen würde,
      könnte er durch eine andere Spielweise nichts gewinnen. GTO gewinnt nicht durch Tricks, sondern weil Gegner gegen diese Strategie Fehler machen.</p>
      <p>Drei Ideen tragen das meiste Gewicht:</p>
      <ul>
        <li><b>Ranges statt einzelner Hände.</b> Denk an alle Hände, die du in dieser Situation so spielen würdest, nicht nur an die eine, die du hältst.</li>
        <li><b>Balance.</b> Deine Bets enthalten sowohl Value-Hände als auch Bluffs, damit dein Gegner nicht einfach immer passen oder immer mitgehen kann.</li>
        <li><b>Indifferenz.</b> Gute Einsatzgrößen und Frequenzen machen die Bluff-Catcher deines Gegners indifferent zwischen Mitgehen und Passen.</li>
      </ul>
      <p class="tip">Echte Spieler sind selten perfekt. GTO ist deine Grundlage; du weichst nur davon ab, wenn du einen klaren Read auf einen Gegner hast.</p>`,
  },
  {
    id: "position",
    title: "2. Position: warum der Sitzplatz zählt",
    practice: "rfi",
    body: `
      <p>Die Plätze sind danach benannt, wann sie handeln. An einem Tisch mit 9 Spielern ist die Reihenfolge <b>UTG → UTG+1 → UTG+2 → LJ → HJ → CO → BTN → SB → BB</b>.
      Mit weniger Spielern fallen die frühesten Plätze weg: 6-max ist <b>UTG → HJ → CO → BTN → SB → BB</b>, und Heads-up gibt es nur noch BTN/SB gegen BB.</p>
      <p>Zwei Gründe, warum man in später Position mehr Hände spielt:</p>
      <ul>
        <li><b>Weniger Spieler nach dir.</b> Von UTG an einem 9er-Tisch können 8 Spieler eine starke Hand haben. Vom Button aus nur noch die Blinds.</li>
        <li><b>Nach dem Flop als Letzter handeln.</b> Der Button sieht auf jeder Straße, was alle anderen tun, bevor er entscheidet. Diese Information ist viel Geld wert.</li>
      </ul>
      <p>Deshalb richten sich die Eröffnungs-Ranges in dieser App danach, <b>wie viele Spieler nach dir noch handeln</b>. Ändere oben die Spielerzahl und beobachte, wie derselbe Platz breiter oder enger spielt.</p>`,
  },
  {
    id: "rfi",
    title: "3. Als Erster erhöhen (Open-Raise)",
    practice: "rfi",
    body: `
      <p>Wenn alle vor dir gepasst haben, ist GTO-Spiel fast immer <b>Erhöhen oder Passen</b>, nicht Limpen. Eine Erhöhung gewinnt die Blinds sofort, wenn alle passen, und gibt dir die Initiative.</p>
      <p>Ungefähre Eröffnungsfrequenzen im Cash Game mit 100bb:</p>
      <table class="mini-table">
        <tr><th>Platz</th><th>Spieler nach dir</th><th>Eröffnet</th></tr>
        <tr><td>9-max UTG</td><td>8</td><td>~11 %</td></tr>
        <tr><td>6-max UTG</td><td>5</td><td>~19 %</td></tr>
        <tr><td>HJ</td><td>4</td><td>~22 %</td></tr>
        <tr><td>CO</td><td>3</td><td>~30 %</td></tr>
        <tr><td>BTN</td><td>2</td><td>~49 %</td></tr>
        <tr><td>SB</td><td>1</td><td>~43 %</td></tr>
        <tr><td>Heads-up BTN</td><td>1</td><td>~79 %</td></tr>
      </table>
      <p><b>Warum suited und verbundene Hände vor offsuit Schrott kommen:</b> Suited Hände machen Flushes, verbundene Karten machen Straights, und beide
      realisieren ihre Equity gut. Eine Hand wie K9o sieht gut aus, ist aber oft <i>dominiert</i> (KT, KJ, KQ, AK schlagen sie deutlich) und wird deshalb nur aus später Position eröffnet.</p>
      <p>Eröffne standardmäßig auf <b>2,5bb</b> (2–2,5bb vom Button, etwa 3bb aus dem SB).</p>`,
  },
  {
    id: "vsopen",
    title: "4. Gegen eine Eröffnung: 3-Bet, Mitgehen oder Passen",
    practice: "vsopen",
    body: `
      <p>Wenn schon jemand erhöht hat, stell dir zwei Fragen: <b>Wie stark ist seine Range?</b> (Eröffnungen aus früher Position sind stark) und <b>Habe ich Position?</b></p>
      <ul>
        <li><b>3-Bet für Value</b> mit Händen, die die weiterspielenden Hände schlagen: QQ+ und AK gegen frühe Position, breiter gegen späte Eröffnungen.</li>
        <li><b>3-Bet als Bluff</b> mit Händen, die <i>Blocker</i> und Spielbarkeit haben. A5s–A4s blockieren AA/AK und können trotzdem Wheel-Straights und Nut-Flushes machen.</li>
        <li><b>Mitgehen</b> mit Händen, die sich postflop gut spielen, aber keinen großen Pot wollen: mittlere Paare, suited Broadways, Suited Connectors.</li>
        <li><b>Small Blind:</b> meistens 3-Bet oder Passen. Mitgehen ohne Position, während der BB noch handeln kann, kostet Geld.</li>
        <li><b>Big Blind:</b> Du hast schon 1bb investiert und bekommst deshalb einen guten Preis. Verteidige breit, besonders gegen den Button.</li>
      </ul>
      <p class="tip">Gegen eine Eröffnung aus früher Position spielst du deutlich enger. Deren Range ist stark, und Spieler nach dir können noch squeezen.</p>`,
  },
  {
    id: "potodds",
    title: "5. Pot Odds: der Preis für einen Call",
    practice: "math",
    body: `
      <p>Gegen eine Bet brauchst du für einen Call so viel Equity:</p>
      <p class="formula">benötigte Equity = Call ÷ (Pot nach deinem Call)</p>
      <p>Beispiel: Der Pot ist 10, der Gegner setzt 5. Du zahlst 5, um 10 + 5 + 5 = 20 zu gewinnen, brauchst also 5 ÷ 20 = <b>25 %</b> Equity.</p>
      <table class="mini-table">
        <tr><th>Einsatzgröße</th><th>Benötigte Equity</th></tr>
        <tr><td>25 % Pot</td><td>17 %</td></tr>
        <tr><td>33 % Pot</td><td>20 %</td></tr>
        <tr><td>50 % Pot</td><td>25 %</td></tr>
        <tr><td>75 % Pot</td><td>30 %</td></tr>
        <tr><td>100 % Pot</td><td>33 %</td></tr>
        <tr><td>150 % Pot</td><td>37,5 %</td></tr>
      </table>
      <p><b>2er- und 4er-Regel:</b> Multipliziere deine Outs auf dem Flop mit 4 (zwei Karten kommen noch, wenn du beide siehst) oder auf dem Turn mit 2, um deine Equity zu schätzen.
      Ein Flush-Draw (9 Outs) hat auf dem Flop etwa 36 % und auf dem Turn etwa 18 %.</p>`,
  },
  {
    id: "mdf",
    title: "6. Minimum Defense Frequency (MDF)",
    practice: "math",
    body: `
      <p>Wenn du zu oft passt, kann dein Gegner mit beliebigen Karten profitabel setzen. Die <b>MDF</b> gibt an, mit welchem Anteil deiner Range du weiterspielen musst, um das zu verhindern:</p>
      <p class="formula">MDF = Pot ÷ (Pot + Bet)</p>
      <p>Gegen eine Pot-große Bet verteidigst du 50 %. Gegen eine halbe Pot-Bet 67 %. Gegen eine 33-%-Bet 75 %.</p>
      <p><b>Wichtig: Prozent wovon?</b> Die MDF bezieht sich auf die Hände, die du <i>an dieser Stelle noch hältst</i>, nicht auf alle Starthände.
      Beispiel: Der Big Blind verteidigt preflop gegen den Button etwa die Hälfte aller Starthände (siehe Ranges-Tab). Setzt der Button auf dem Flop den halben Pot, heißt MDF 67 %:
      Spiele mit 67 % dieser Hälfte weiter, also mit etwa einem Drittel aller Starthände. Auf jeder Straße wird deine Range kleiner, und die MDF gilt immer für den Rest.</p>
      <p>Das Spiegelbild für den Setzenden ist der <b>Bluff-Anteil</b> am River. Damit der Caller indifferent ist, sollte dieser Anteil deiner Bets aus Bluffs bestehen:</p>
      <p class="formula">Bluff-Anteil = Bet ÷ (Pot + 2 × Bet)</p>
      <p>Pot-große Bet → 33 % Bluffs (1 Bluff auf 2 Value-Bets). Halbe Pot-Bet → 25 % Bluffs.</p>
      <p class="tip">Die MDF geht davon aus, dass der Gegner mit allem bluffen könnte. Gegen Spieler, die selten bluffen, ist es richtig, öfter zu passen als die MDF vorgibt.</p>`,
  },
  {
    id: "cbet",
    title: "7. C-Bets und Board-Textur",
    practice: "concepts",
    body: `
      <p>Der Preflop-Raiser hat meist den <b>Range-Vorteil</b> (insgesamt mehr starke Hände) und oft auch den <b>Nut-Vorteil</b> (mehr der allerbesten Hände).
      Wie oft du eine C-Bet machst, hängt vom Flop ab. Die Beispiele unten (z. B. A-7-2) sind immer die drei offenen Flop-Karten in der Tischmitte, nicht deine Hand:</p>
      <ul>
        <li><b>Trockene, hohe Flops</b> (A-7-2 in drei Farben, K-8-3): Der Raiser hat viel mehr starke Hände. Oft und klein setzen (25–33 % Pot).</li>
        <li><b>Nasse, verbundene, niedrige Flops</b> (8-7-6 mit zwei Karten einer Farbe, 6-5-4): Der Caller trifft mehr. Öfter checken und größer setzen, wenn du setzt.</li>
        <li><b>Gepaarte Flops</b> (K-K-5): Kaum jemand trifft, also funktionieren kleine, häufige Bets gut.</li>
      </ul>
      <p><b>Größer setzen</b>, wenn du den Nut-Vorteil hast und dein Gegner viele Draws hat. <b>Kleiner setzen</b>, wenn du einen Range-Vorteil hast, aber wenige Hände einen großen Pot wollen.</p>
      <p class="tip">In Position kannst du öfter C-Bets machen als ohne Position, weil du auf späteren Straßen nie zuerst handeln musst.</p>`,
  },
  {
    id: "blockers",
    title: "8. Blocker und die Wahl der Bluffs",
    practice: "river",
    body: `
      <p>Ein <b>Blocker</b> ist eine Karte in deiner Hand, die bestimmte Hände beim Gegner unwahrscheinlicher macht.
      Hältst du das A♠ auf einem Board mit drei Pik, kann dein Gegner den Nut-Flush nicht haben.</p>
      <ul>
        <li><b>Gute Bluffs</b> blockieren die starken Call-Hände deines Gegners und blockieren <i>nicht</i> die Hände, mit denen er passt.</li>
        <li><b>Preflop:</b> 3-Bet-Bluffs mit Ax suited blockieren AA und AK – genau die Hände, die eine 4-Bet machen.</li>
        <li><b>River:</b> Verpasste Draws sind natürliche Bluffs, weil sie keinen Showdown-Value haben. Hände mit etwas Showdown-Value checken oft lieber.</li>
      </ul>
      <p><b>Am River sortierst du deine Hand in eine von vier Kategorien:</b></p>
      <table class="mini-table">
        <tr><th>Deine Hand</th><th>Beispiel</th><th>Aktion</th></tr>
        <tr><td>Stark (Top Pair oder besser)</td><td>A♠K♦ auf A-7-2-5-K</td><td>Value-Bet</td></tr>
        <tr><td>Mittel, mit Showdown-Value</td><td>8♠8♦ auf K-7-2-5-3, Ass-hoch</td><td>Checken</td></tr>
        <tr><td>Verpasster Draw</td><td>Q♠J♠ auf T♠9♦3♠4♥2♣</td><td>Bluff</td></tr>
        <tr><td>Nichts, kein Draw</td><td>Q♦4♣ auf K-9-7-3-2</td><td>Checken und aufgeben</td></tr>
      </table>
      <p><b>Wie viele Bluffs?</b> Bei einer Bet von 3/4 Pot sollten etwa 30 % deiner Bets Bluffs sein, also etwa 3 Bluffs auf 7 Value-Bets.
      Gibt es mehr verpasste Draws, bluffst du nicht mit allen. Gibt es zu wenige, bluffst du auch mit einigen Händen ohne Draw, am besten mit Blockern.</p>`,
  },
  {
    id: "flop",
    title: "9. Nach dem Flop: deine Range sortieren",
    practice: "postflop",
    body: `
      <p>Die Matrix zeigt, wie stark eine Hand <b>vor dem Flop</b> ist. Ab dem Flop zählt nur noch, <b>was deine Hand mit dem Board gemacht hat</b>.
      Die Reihenfolge kann sich komplett umdrehen:</p>
      <table class="mini-table">
        <tr><th>Flop 7♠ 6♦ 5♣</th><th>In der Matrix</th><th>Auf diesem Flop</th></tr>
        <tr><td>A♠K♦</td><td>ganz oben</td><td>nur Ass-hoch, sehr schwach</td></tr>
        <tr><td>9♥8♥</td><td>Mitte</td><td>Straße, fast die Nuts</td></tr>
        <tr><td>6♣5♥</td><td>Mitte</td><td>Zwei Paare</td></tr>
        <tr><td>8♣4♣</td><td>unten</td><td>Open-Ended Straight Draw</td></tr>
      </table>
      <p>Darum sortierst du deine Range nach dem Flop in <b>sechs Gruppen</b>, von stark nach schwach:</p>
      <ol>
        <li><b>Sehr stark:</b> Straße, Flush, Set, Drilling, Zwei Paare.</li>
        <li><b>Gutes Paar:</b> Top Pair, Overpair.</li>
        <li><b>Mittel:</b> zweites Paar, Pocket Pair unter der höchsten Board-Karte, Flush-Draw, Open-Ender.</li>
        <li><b>Schwaches Paar:</b> Bottom Pair, kleines Pocket Pair. Kann beim Showdown noch gewinnen.</li>
        <li><b>Schwacher Draw:</b> Gutshot, zwei Overcards, Ass-hoch, Backdoor-Flush-Draw. Gewinnt fast nur, wenn er sich verbessert.</li>
        <li><b>Nichts:</b> kein Paar, kein Draw.</li>
      </ol>
      <p><b>Faustregel gegen eine C-Bet:</b> Je größer die Bet, desto weniger Gruppen spielen weiter.</p>
      <table class="mini-table">
        <tr><th>Bet</th><th>MDF</th><th>Benötigte Equity</th><th>Spielt weiter</th></tr>
        <tr><td>1/4 bis 1/2 Pot</td><td>80–67 %</td><td>17–25 %</td><td>Gruppen 1–5, nur „Nichts“ passt</td></tr>
        <tr><td>2/3 Pot bis Pot</td><td>60–50 %</td><td>29–33 %</td><td>Gruppen 1–4, schwache Draws passen</td></tr>
        <tr><td>Overbet (mehr als Pot)</td><td>40 % bei 1,5× Pot</td><td>38 %</td><td>Gruppen 1–3, auch schwache Paare passen</td></tr>
      </table>
      <p><b>Warum Overbets anders sind:</b> Wer mehr als den Pot setzt, hat meist eine sehr starke Hand oder blufft. Die Range ist polarisiert.
      Ein schwaches Paar schlägt dann nur die Bluffs und zahlt sehr viel dafür, deshalb passt es.</p>
      <p>Wie viel deiner Range das ist, hängt vom Board ab. Auf trockenen, hohen Flops wie A-7-2 trifft der BB wenig und passt öfter, als die MDF sagt.
      Auf nassen, niedrigen Flops wie 8-7-6 trifft er viel und spielt mehr weiter. Probier es im Tab <b>Ranges</b> unter „Nach dem Flop“ aus.</p>
      <p class="tip">Diese Gruppen sind eine vereinfachte Faustregel. Solver mischen an den Grenzen und berücksichtigen mehr Details, aber die Richtung stimmt.</p>`,
  },
];

// Konzeptfragen (Multiple Choice). `answer` ist der Index der richtigen Antwort.
window.CONCEPT_QUESTIONS = [
  { q: "Warum werden Eröffnungs-Ranges zum Button hin breiter?", choices: ["Die Blinds sind immer schwache Spieler", "Weniger Spieler handeln noch nach dir und du hast nach dem Flop Position", "Man muss mehr Pots gewinnen, um den Rake zu schlagen", "GTO sagt, man soll im Laufe des Abends mehr Hände spielen"], answer: 1, why: "Weniger Gegner nach dir bedeuten eine geringere Chance, dass jemand eine starke Hand hält. Und wer nach dem Flop als Letzter handelt, realisiert mehr Equity." },
  { q: "Alle passen bis zu dir im Cutoff. Was ist die GTO-Standardaktion?", choices: ["Die meisten spielbaren Hände limpen", "Erhöhen oder Passen", "Immer auf 5bb erhöhen", "Mit suited Händen den Big Blind mitgehen"], answer: 1, why: "Ein Open-Raise gewinnt die Blinds sofort, wenn alle passen, und gibt dir die Initiative. Open-Limpen kommt in Solver-Strategien außerhalb des SB praktisch nicht vor." },
  { q: "Welche Hand ist der bessere 3-Bet-Bluff gegen eine Eröffnung aus dem Cutoff?", choices: ["K7o", "A5s", "Q4o", "72s"], answer: 1, why: "A5s blockiert AA und AK, floppt Nut-Flush-Draws und kann Wheel-Straights machen. Offsuit Schrott hat keine Blocker und spielt sich schlecht, wenn er gecallt wird." },
  { q: "Der Pot ist 100 und der Gegner setzt am River 100. Wie hoch ist deine MDF?", choices: ["33 %", "50 %", "67 %", "100 %"], answer: 1, why: "MDF = Pot ÷ (Pot + Bet) = 100 ÷ 200 = 50 %." },
  { q: "Du hast vor dem Flop erhöht, ein Gegner ist mitgegangen. Der Flop bringt A♠7♦2♣. Was ist der typische GTO-Plan?", choices: ["Fast immer checken", "Mit der ganzen Range groß setzen (Pot oder mehr)", "Klein und sehr häufig setzen", "Nur mit Sets setzen"], answer: 2, why: "Trockene Boards mit Ass begünstigen die Range des Raisers stark. Eine kleine, häufige C-Bet funktioniert, weil der Caller kaum starke Hände hat." },
  { q: "UTG erhöht vor dem Flop, der BB geht mit. Der Flop bringt 8♥7♥6♣. Wie spielt UTG (der Preflop-Raiser) meist weiter?", choices: ["Mit allem klein setzen", "Öfter checken; größer setzen, wenn er setzt", "Immer checken und passen", "Immer All-in gehen"], answer: 1, why: "Niedrige, verbundene Boards treffen die breite Verteidigungs-Range des BB stark. Der Raiser verliert den Range-Vorteil, checkt also öfter und setzt polarisiert und größer, wenn er setzt." },
  { q: "Warum spielt der Small Blind gegen eine Eröffnung meist 3-Bet oder Passen statt Mitgehen?", choices: ["Mitgehen ist gegen die Regeln", "Der SB ist ohne Position und der BB kann noch squeezen", "Der SB hat immer die beste Hand", "Passen ist immer kostenlos"], answer: 1, why: "Ein Cold Call aus dem SB spielt die ganze Hand ohne Position und lädt den BB zum Squeeze ein. Eine 3-Bet übernimmt die Initiative und gewinnt den Pot oft schon preflop." },
  { q: "Du hast auf dem Flop einen Flush-Draw (9 Outs) und siehst beide restlichen Karten. Wie hoch ist ungefähr deine Equity?", choices: ["9 %", "18 %", "36 %", "50 %"], answer: 2, why: "4er-Regel: 9 Outs × 4 ≈ 36 % bei zwei kommenden Karten." },
  { q: "Was bedeutet es, dass GTO „nicht ausnutzbar“ ist?", choices: ["Es gewinnt gegen jeden Gegner am meisten", "Gegner können sich nicht verbessern, indem sie ihre Strategie dagegen ändern", "Es verliert nie eine Hand", "Es blufft genau die Hälfte der Zeit"], answer: 1, why: "GTO ist ein Gleichgewicht: Keine Gegenstrategie schneidet dagegen besser ab. Gegen schwache Spieler holt es aber nicht den maximalen Gewinn heraus – dafür gibt es exploitative Anpassungen." },
  { q: "Bei einer Pot-großen Bet am River: Welcher Anteil deiner Bets sollte aus Bluffs bestehen?", choices: ["10 %", "25 %", "33 %", "50 %"], answer: 2, why: "Bluff-Anteil = Bet ÷ (Pot + 2·Bet) = 1 ÷ 3 ≈ 33 %. Damit sind die Bluff-Catcher des Callers indifferent." },
  { q: "Warum verteidigt der Big Blind mehr Hände als jeder andere Platz?", choices: ["Er hat schon 1bb investiert, also ist der Preis für einen Call gut", "Er handelt nach dem Flop als Erster", "Er hat immer die beste Hand", "Der Button hat nie starke Hände"], answer: 0, why: "Weil der BB schon 1bb im Pot hat, bekommt er sehr gute Pot Odds, und er schließt die Preflop-Runde ab." },
  { q: "Was ist der beste Grund für eine kleine C-Bet?", choices: ["Du hast einen großen Nut-Vorteil und der Gegner hat viele Draws", "Du hast einen Range-Vorteil, aber die meisten Hände wollen keinen großen Pot", "Du willst, dass der Gegner jedes Mal passt", "Du hast eine schwache Hand"], answer: 1, why: "Kleine Bets passen, wenn deine ganze Range vorne liegt, aber nicht polarisiert ist. Große Bets passen, wenn du die meisten Nuts hältst." },
  { q: "Gegen eine Bet von 50 % Pot: Wie viel Equity brauchst du für einen Call?", choices: ["20 %", "25 %", "33 %", "50 %"], answer: 1, why: "Du zahlst 0,5, um 1 + 0,5 + 0,5 = 2 zu gewinnen, also 0,5 ÷ 2 = 25 %." },
  { q: "Warum wird K9o aus früher Position gepasst, aber vom Button eröffnet?", choices: ["Sie ist nur Heads-up stark", "Früh droht sie gegen die starken Ranges nach dir dominiert zu werden; am Button sind nur noch die Blinds übrig", "Offsuit Hände werden immer gepasst", "Solver mögen keine Könige"], answer: 1, why: "K9o ist oft gegen KT+ und AK dominiert. Mit vielen Spielern nach dir hält oft jemand eine davon. Am Button haben die Blinds sie selten, und du hast Position." },
  { q: "Was ist ein „Blocker“?", choices: ["Eine kleine Bet, damit der Gegner nicht größer setzt", "Eine Karte in deiner Hand, die die Kombos bestimmter Hände beim Gegner verringert", "Ein Spieler, der immer mitgeht", "Eine Hand, die sich nicht verbessern kann"], answer: 1, why: "Eine Karte in deiner Hand fehlt in der Range des Gegners. Das A♠ auf einem Pik-Board entfernt zum Beispiel alle Nut-Flushes." },
  { q: "Am River mit einem verpassten Draw ohne Showdown-Value – was gilt meistens?", choices: ["Ein natürlicher Bluff-Kandidat", "Du solltest immer mitgehen", "Du solltest einen Check-Raise All-in machen", "Es ist eine Value-Bet"], answer: 0, why: "Verpasste Draws können beim Showdown nicht gewinnen, verlieren also nichts durch einen Bluff. Das macht sie zu idealen Bluffs, besonders mit guten Blockern." },
];
