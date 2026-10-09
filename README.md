# GTO Trainer

Eine kleine statische Web-App zum Lernen der GTO-Grundlagen für No-Limit Hold'em (auf Deutsch).

## Starten

Doppelklick auf `index.html`, oder den Ordner bereitstellen (`python -m http.server`) und http://localhost:8000 öffnen. Kein Build-Schritt und keine Abhängigkeiten nötig.

## Inhalt

- **Lernen**: neun kurze Lektionen: GTO-Grundidee, Position, Open-Raise, Spiel gegen eine Eröffnung, Pot Odds, MDF und Bluff-Anteil, C-Bets nach Board-Textur, Blocker, Range nach dem Flop sortieren.
- **Beispiele**: sechs Hände, Straße für Straße durchgespielt. Jeder Schritt zeigt Tisch, Board-Karten, deine Karten, Pot und Spielverlauf. Du entscheidest, danach kommt die Erklärung. Jede Lektion verlinkt auf eine passende Beispielhand.
- **Ranges**: 13×13-Charts zum Eröffnen und gegen eine Eröffnung (3-Bet / Mitgehen / Passen). Ein Klick auf eine Hand erklärt, warum sie so gespielt wird. Die Ansicht „Nach dem Flop“ zeigt die BB-Range gegen eine Button-Eröffnung auf einem gewählten Flop, eingefärbt nach Handstärke-Gruppe, mit Anteil pro Gruppe und Vergleich zur MDF.
- **Training & Quiz**:
  - *Eröffnen oder Passen*: zufälliger Platz und zwei Karten. Hände werden nahe der Range-Grenze gezogen, damit du keine klaren Folds übst.
  - *Gegen eine Eröffnung*: zufälliger Eröffner und zufälliger eigener Platz.
  - *Flop: Weiterspielen?*: Du bist BB gegen eine C-Bet des Buttons in einer von sieben Größen (1/4 Pot bis 1,5× Pot). Erst ordnest du deine Hand in eine von sechs Gruppen ein, dann entscheidest du Weiterspielen oder Passen. Danach siehst du die Aufteilung deiner ganzen Range auf diesem Flop.
  - *River: Bluffen?*: Du bist am Button, alle fünf Karten liegen, der BB checkt. Du wählst Value-Bet, Bluff oder Checken. Die Auflösung zeigt, wie sich deine Range auf diesem River aufteilt, wie viele Bluffs du für die Balance brauchst und ob genug verpasste Draws da sind.
  - *Pot Odds & MDF*: generierte Rechenfragen zu benötigter Equity, MDF, Bluff-Anteil und Outs.
  - *Konzepte*: Multiple-Choice-Fragen zur GTO-Theorie.
- **Glossar**: 81 Fachbegriffe mit Suche. Begriffe in Lektionen, Situationsbeschreibungen und Erklärungen sind unterstrichen und zeigen beim Darüberfahren oder Antippen ihre Definition.
- **Fortschritt**: Trefferquote, Serien und letzte Preflop-Fehler, gespeichert im `localStorage`.

Die Spielerzahl (2–9) oben verändert alle Charts und Übungen. Eröffnungs-Ranges richten sich danach, **wie viele Spieler nach dir noch handeln**, deshalb decken dieselben Charts jede Tischgröße ab.

## Annahmen

Die Charts sind vereinfachte Annäherungen an Solver-Strategien für **Cash Games mit 100bb ohne Antes**. Sie zeigen die Form guter Strategie, sind aber keine exakten Solver-Ergebnisse. Die Charts gegen eine Eröffnung sind nach Eröffner (frühe / mittlere / späte Position) und eigenem Platz (in Position / SB / BB) gruppiert. Die Flop-Gruppen sind eine vereinfachte Faustregel (bis 1/2 Pot spielen Gruppen 1–5 weiter, bis Pot Gruppen 1–4, gegen Overbets Gruppen 1–3). Am River gilt: Top Pair oder besser ist eine Value-Bet, mittlere Hände und Ass-hoch checken, verpasste Draws bluffen, Hände ohne Draw geben auf. Als River-Range zählt vereinfacht die ganze Button-Eröffnung.

## Dateien

- `ranges.js`: Range-Parser, Positionsmodell und Chart-Daten (ohne DOM, läuft auch in Node)
- `content.js`: Lektionen und Konzeptfragen
- `postflop.js`: Flop-Handstärke (sechs Gruppen), River-Kategorien (Value / Showdown-Value / verpasster Draw / nichts) und Aufteilung einer Range auf einem Board (ohne DOM, läuft auch in Node)
- `examples.js`: Beispielhände (Karten, Pot, Verlauf, Antworten, Erklärungen)
- `glossary.js`: Glossar-Daten, Glossar-Tab und Begriffs-Tooltips
- `app.js`: Oberfläche, Quiz-Logik und Statistik
- `test-ranges.js`: `node test-ranges.js` prüft Parser, Chart-Größen, Verschachtelung, Beispielhände, Flop-Gruppen und River-Kategorien
