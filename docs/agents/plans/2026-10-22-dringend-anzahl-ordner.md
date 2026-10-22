---
date: 2026-10-22T06:03:03+00:00
git_commit: ad366398bdfa80aec11e850658c95017836a5d27
branch: main
story: MUL-012
topic: "Dringend-Anzahl auf dem Ordner-Button"
tags: [plan, tasks, domain, announcements, folderbutton, folderspage]
status: done
---

# PLAN: MUL-012 — Dringend-Anzahl auf dem Ordner-Button

Heute zeigt der Ordner-Button nur die Zahl seiner Listen. Künftig zeigt er auch, wie
viele offene Aufgaben in all seinen Listen heute dringend sind. Die Form ist dieselbe wie
auf dem Listen-Button: eine Flamme mit der Zahl. Grundlage ist die Klärung vom
22.10.2026.

## Akzeptanzkriterien

- Enthält ein Ordner heute dringende offene Aufgaben, steht auf seinem Button unter dem
  Namen `3 Listen, 🔥 4`.
- Der Screenreader liest dann `Familie, 3 Listen, 4 dringend`.
- Ohne dringende Aufgaben sieht der Button aus wie heute und klingt auch so: sichtbar
  `3 Listen`, gesprochen `Familie, 3 Listen`. Ein Ordner ohne Listen heißt weiter nur
  `Familie`, ohne zweite Zeile.
- Gezählt werden offene Aufgaben aus allen Listen des Ordners, die heute dringend sind
  (Regel `isUrgentOn`). Dazu gehören als „dringend“ markierte Aufgaben, Aufgaben mit
  Stichtag, deren Vorlauf erreicht ist, überfällige und wiederkehrende Aufgaben.
  Erledigte Aufgaben zählen nicht. Verwaiste Aufgaben ohne Liste zählen ebenfalls nicht.
- Die Zahl am Ordner ist die Summe der Flammen-Zahlen auf seinen Listen-Buttons.
- Ändert sich der Bestand, etwa wenn eine Aufgabe auf einem anderen Gerät erledigt wird,
  passt sich die Zahl in der Ordnerübersicht ohne Neuladen an.

## Wesentliche Entscheidungen und Abwägungen

1. **Darstellung wie beim Listen-Button:** Es heißt `3 Listen, 🔥 4`. Steht die Zahl
   auf 0, fällt der Flammen-Teil ganz weg.
   - Warum: Die Form ist dieselbe wie auf dem Listen-Button und bleibt kurz.
   - Auswirkung: `FlameIcon` wird wiederverwendet.
2. **Zählregel wie auf der Dringend-Seite:** Gezählt werden offene Aufgaben mit
   `isUrgentOn(task, today)` aus `tasksOfFolder`.
   - Warum: So stimmen Ordner, Listen und der Dringend-Button überein.
   - Auswirkung: Weil die Ansicht vom heutigen Tag abhängt, braucht `FoldersPage`
     `today`, das in `FoldersArea` schon vorliegt.
3. **Fachliche Zusammenfassung:** Neu sind
   `FolderSummary = { lists: number; urgent: number }` und
   `folderSummaryOf(organizer, folderId, today)` in `domain/organizer.ts`. Beide werden
   test-getrieben entwickelt.
   - Warum: Das spiegelt `OpenTaskSummary` und `openTaskSummaryOfList`. Die Zählregel
     bleibt in der Domäne, die Komponente fragt sie nur ab.
   - Auswirkung: `listCountOfFolder` bleibt, der Löschdialog nutzt es weiter
     (`FoldersArea.tsx:394`).
4. **Ansagetext:** `folderSummaryLabel(summary)` in `domain/announcements.ts` liefert
   `3 Listen` oder `3 Listen, 4 dringend`. Für die Listenzahl nutzt es
   `listCountLabel`. Auch das wird test-getrieben entwickelt.
5. **Button-Aufbau wie beim Listen-Button:** Die sichtbare Zählzeile wird
   `aria-hidden`. Der Titel bekommt einen versteckten Text `, <folderSummaryLabel>`.
   - Warum: Die Flamme braucht eine gesprochene Entsprechung. Ein einziger versteckter
     Text ersetzt das bisherige versteckte Komma samt sichtbarem Zähltext, der heute
     mitgelesen wird.
   - Auswirkung: Die Props von `FolderButton` und `FoldersPage` wechseln von
     `listCount` auf `summary`.
6. **Icongröße:** `.folderButtonCount .buttonIcon` kommt zur bestehenden Regel für
   `.listButtonCount .buttonIcon` hinzu (`index.css:369`).

## Ausgangslage

```
FoldersArea.tsx:555 ──listCount(folderId)──▶ FoldersPage.tsx:24 ──listCount──▶ FolderButton.tsx:8
       │                                                                         │
       └── organizer.ts:35 listCountOfFolder()                                   └── announcements.ts:43 listCountLabel()
```

- `FolderButton.tsx:31-40`: Hinter dem Namen steht ein verstecktes Komma, darunter der
  sichtbare Zähltext. Beides wird vorgelesen.
- `ListButton.tsx:26-41`: Das ist das Vorbild. Im Titel steht der versteckte Text, die
  sichtbare Zeile ist `aria-hidden` und enthält `FlameIcon`.
- `organizer.ts:91` `tasksOfFolder`: alle Aufgaben aus den Listen des Ordners.
- `organizer.ts:75` `openTaskSummaryOfList`: zählt offene und dringende Aufgaben einer
  Liste.
- `FoldersArea.test.tsx:481-488`: prüft die Namen `Familie, 3 Listen`,
  `Familie, 1 Liste` und `Familie`.

## Zielbild

```
Vorher                                    Nachher
┌────────────────────────────┬──────┐     ┌────────────────────────────┬──────┐
│ Familie                    │      │     │ Familie                    │      │
│ 3 Listen                   │  ->  │     │ 3 Listen, 🔥 4             │  ->  │
└────────────────────────────┴──────┘     └────────────────────────────┴──────┘
„Familie, 3 Listen“                       „Familie, 3 Listen, 4 dringend“

┌────────────────────────────┬──────┐     ┌────────────────────────────┬──────┐
│ Garten                     │      │     │ Garten                     │      │
│ 2 Listen                   │  ->  │     │ 2 Listen                   │  ->  │
└────────────────────────────┴──────┘     └────────────────────────────┴──────┘
„Garten, 2 Listen“                        „Garten, 2 Listen“ (unverändert)

┌────────────────────────────┬──────┐     ┌────────────────────────────┬──────┐
│ Arbeit                     │  ->  │     │ Arbeit                     │  ->  │
└────────────────────────────┴──────┘     └────────────────────────────┴──────┘
„Arbeit“                                  „Arbeit“ (unverändert)
```

Datenfluss:

```
FoldersArea ──summary(folderId) = folderSummaryOf(organizer, folderId, today)──▶ FoldersPage ──summary──▶ FolderButton
                                                                                                      └── folderSummaryLabel(summary)
```

## Abstraktionen und Wiederverwendung

- `src/tasks/domain`
  - `organizer.ts` – neu sind `FolderSummary` und `folderSummaryOf`. Genutzt werden
    `listCountOfFolder`, `tasksOfFolder`, `isOpen` und `isUrgentOn`.
  - `organizer.test.ts` – neu `describe('folderSummaryOf')`
  - `announcements.ts` – neu `folderSummaryLabel`, das `listCountLabel` nutzt
  - `announcements.test.ts` – Tests für `folderSummaryLabel`
- `src/tasks/ui`
  - `FolderButton.tsx` – Prop `summary: FolderSummary`, Aufbau wie in `ListButton`,
    `FlameIcon`
  - `FoldersPage.tsx` – Prop `summary: (folderId: FolderId) => FolderSummary` statt
    `listCount`
  - `FoldersArea.tsx` – übergibt `folderSummaryOf(organizer, folderId, today)`
  - `FoldersArea.test.tsx` – neue und erweiterte Fälle
- `src/index.css` – Icongröße in `.folderButtonCount`

## Logging und Beobachtbarkeit

Keine Änderungen.

## Umsetzung

Abhängigkeiten: keine

Der Ordner-Button zeigt die Zahl der heute dringenden offenen Aufgaben, sichtbar mit
Flamme und für den Screenreader als Text.

**Aufgaben**:

- [x] Test-getrieben `FolderSummary` und `folderSummaryOf` in
  `src/tasks/domain/organizer.ts`. Die Tests kommen in `organizer.test.ts` unter
  `describe('folderSummaryOf')` und nutzen die vorhandenen Fixtures (`familie`,
  `garten`, `arbeit`, `haushalt`, `beete` …) mit `today = '2026-10-10'`:
  - Ein Ordner ohne Listen ergibt `{ lists: 0, urgent: 0 }`.
  - Die dringenden offenen Aufgaben werden über alle Listen des Ordners summiert.
    Erledigte dringende Aufgaben zählen nicht.
  - Eine Aufgabe mit Stichtag zählt erst, wenn ihr Vorlauf erreicht ist. Eine
    überfällige zählt, eine „Irgendwann“-Aufgabe nicht.
  - Eine dringende Aufgabe in einer Liste eines anderen Ordners oder in einer
    verwaisten Liste zählt nicht.
  - `urgent` ist gleich der Summe von `openTaskSummaryOfList(…).urgent` über
    `listsOfFolder`.
  ```ts
  export type FolderSummary = {
    lists: number
    urgent: number
  }

  export function folderSummaryOf(
    organizer: Organizer,
    folderId: FolderId,
    today: CalendarDay,
  ): FolderSummary {
    return {
      lists: listCountOfFolder(organizer, folderId),
      urgent: tasksOfFolder(organizer, folderId)
        .filter(isOpen)
        .filter((task) => isUrgentOn(task, today)).length,
    }
  }
  ```
- [x] Test-getrieben `folderSummaryLabel` in `src/tasks/domain/announcements.ts`.
  Die Tests in `announcements.test.ts` als `it.each`:
  - `{ lists: 1, urgent: 0 }` → `1 Liste`
  - `{ lists: 3, urgent: 0 }` → `3 Listen`
  - `{ lists: 3, urgent: 1 }` → `3 Listen, 1 dringend`
  - `{ lists: 3, urgent: 4 }` → `3 Listen, 4 dringend`
  ```ts
  export function folderSummaryLabel({ lists, urgent }: FolderSummary): string {
    if (urgent === 0) return listCountLabel(lists)
    return `${listCountLabel(lists)}, ${urgent} dringend`
  }
  ```
  `FolderSummary` wird wie `OpenTaskSummary` als Typ aus `./organizer` importiert.
- [x] Zuerst die Komponententests in `FoldersArea.test.tsx` schreiben, sie schlagen
  dann fehl. Den bestehenden `it.each` bei Zeile 481 (`names the folder button after
  its lists`) um einen Aufgaben-Parameter erweitern und um diese Fälle ergänzen. Der
  Helfer `task(id, list, urgent, completions)` liegt bei Zeile 44.
  - `[haushalt, wocheneinkauf]` mit zwei dringenden Aufgaben in `haushalt` und einer
    in `wocheneinkauf` → `Familie, 2 Listen, 3 dringend`
  - `[haushalt]` mit einer dringenden erledigten Aufgabe (`completions: [5]`) und
    einer „Irgendwann“-Aufgabe → `Familie, 1 Liste`
  - Die bisherigen drei Fälle ohne Aufgaben bleiben unverändert.
- [x] Test in `FoldersArea.test.tsx`: Ein Ordner mit dringenden Aufgaben zeigt im
  Button genau ein `svg` in `.folderButtonCount`, und `.folderButtonCount` ist
  `aria-hidden="true"`. Ein Ordner mit Listen, aber ohne dringende Aufgaben hat kein
  `svg` in `.folderButtonCount`.
- [x] Test in `FoldersArea.test.tsx`: Die Übersicht zeigt `Familie, 1 Liste,
  1 dringend`. Danach kommt die Aufgabe per
  `act(() => client.arrivesFromElsewhere({ tasks: [task('Müll', haushalt, true, [5])] }))`
  als erledigt von einem anderen Gerät. Anschließend heißt der Button `Familie, 1 Liste`.
- [x] `src/tasks/ui/FolderButton.tsx` umbauen. Die Prop `listCount` wird durch
  `summary: FolderSummary` ersetzt, der Aufbau folgt `ListButton`:
  ```tsx
  const hasLists = summary.lists > 0

  <span className="folderButtonName">
    <span className="folderButtonTitle">
      {folder.name}
      {hasLists && (
        <span className="visuallyHidden">, {folderSummaryLabel(summary)}</span>
      )}
    </span>
    {hasLists && (
      <span className="folderButtonCount" aria-hidden="true">
        {listCountLabel(summary.lists)}
        {summary.urgent > 0 && (
          <>
            , <FlameIcon /> {summary.urgent}
          </>
        )}
      </span>
    )}
  </span>
  ```
  `folderButtonCount` bleibt ein eigener Block unter dem Titel
  (`.folderButtonName` ist eine Flex-Spalte). Das bisherige `{' '}` vor der Zählzeile
  entfällt, weil die Ansage jetzt aus dem versteckten Text kommt.
- [x] `src/tasks/ui/FoldersPage.tsx`: Die Prop `listCount: (folderId: FolderId) => number`
  wird zu `summary: (folderId: FolderId) => FolderSummary`. Der Aufruf lautet
  `summary={summary(folder.id)}`.
- [x] `src/tasks/ui/FoldersArea.tsx:555-563`: Übergeben wird jetzt
  `summary={(folderId) => folderSummaryOf(organizer, folderId, today)}`. Danach wird
  der Import von `listCountOfFolder` noch für den Löschdialog bei Zeile 394 gebraucht.
- [x] `src/index.css:369`: `.folderButtonCount .buttonIcon` kommt in die Selektorliste
  der Icon-Regel (`display: inline-block; width: 1em; height: 1em;
  vertical-align: -0.125em`).
- [x] Die gesamte Testsuite nach weiteren Erwartungen an Ordner-Button-Namen absuchen.
  Dazu gehören `e2e/` und `button('Familie')`. Wo Ordner dringende Aufgaben enthalten,
  werden die Erwartungen angepasst. Exakte Namen wie `button('Familie')` passen nur noch
  auf Ordner ohne Listen. Für Ordner mit Listen gelten sie schon heute nicht und
  bleiben damit, wie sie sind. `openFolder` und `buttonNamedFirst` matchen nur den
  Anfang des Namens. Die bekannte Stelle `e2e/lists.spec.ts:39` (`Familie, 1 Liste`,
  ohne Aufgaben) bleibt gültig.

**Automatisierte Verifikation**:

- [x] `npx vitest run src/tasks/domain/organizer.test.ts src/tasks/domain/announcements.test.ts`
  läuft grün.
- [x] `npx vitest run src/tasks/ui` läuft grün, einschließlich der neuen Fälle in
  `FoldersArea.test.tsx`.
- [x] `npm run test && npm run test:rules` läuft grün, mit Architekturtest
  `test/domainLayerBoundary.test.ts` und `test/icons.test.ts`.
- [x] `npm run lint` läuft ohne Befunde.
- [x] `npm run build` läuft durch, die Typprüfung eingeschlossen.

**Manuelle Verifikation**:

- [x] Auf dem iPhone unter iOS-VoiceOver liest der Ordner-Button
  „Familie, 3 Listen, 4 dringend, Taste“. Die Flamme sitzt im Hell- wie im Dunkelmodus
  auf Höhe der Schrift, wie auf dem Listen-Button.

## Notizen zur Umsetzung

Hier während der Umsetzung Rückmeldungen, Probleme und Entscheidungen festhalten.

## Verweise

- `docs/agents/plans/2026-10-10-dringend-seite.md` – Zählregel der Dringend-Seite
- `docs/agents/plans/2026-10-10-listen.md` – Listen-Button mit offen und dringend
- `src/tasks/ui/ListButton.tsx` – Vorbild für den Aufbau
