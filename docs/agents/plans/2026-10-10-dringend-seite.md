---
date: 2026-10-10T14:10:54+00:00
git_commit: 8962603366f84ef05e865c9add25b62121cf9001
branch: main
story: MUL-007
topic: "Dringend-Seite: Sammelansicht aller dringenden Aufgaben mit Herkunft, Badge und Tageswechsel"
tags: [plan, aufgaben, dringend, navigation, badge, voiceover, fokus, e2e]
status: ready
---

# PLAN: MUL-007 — Dringend-Seite

Siebter Teilplan des Gesamtplans `docs/agents/plans/2026-10-08-gesamtplan.md` (Entscheidungen
19-22, Zeile 262). Die Startseite „Dringend“ ist bisher ein Platzhalter. Künftig sammelt sie alle
offenen Aufgaben aus allen Ordnern und Listen, die heute dringend sind: 🔥 immer, 📅 ab erreichtem
Vorlauf. Jede Zeile nennt ihre Herkunft „Ordner › Liste“. Von der Seite aus lassen sich Aufgaben
öffnen, bearbeiten und erledigen. Die Navigation zeigt die Anzahl als Badge. Nach Mitternacht und
nach der Rückkehr aus dem Hintergrund rechnet die App mit dem neuen Tag.

Vorlagen:

- MUL-005 (`docs/agents/plans/2026-10-10-aufgaben.md`, Entscheidung 4): `TaskFlow` wurde dafür
  herausgelöst, dass die Dringend-Seite dieselben Seiten öffnen kann.
- MUL-006 (`docs/agents/plans/2026-10-10-stichtag.md`, Entscheidung 1): Die Dringend-Regel
  `isUrgentOn` steht fertig in der Domäne.

Die Startseite ist bereits „Dringend“ (`src/SignedInApp.tsx:39`). Entscheidung 22 des Gesamtplans
ist damit erfüllt.

## Akzeptanzkriterien

- **Inhalt der Dringend-Seite:**
  - alle offenen Aufgaben, für die `isUrgentOn(task, today)` gilt, aus allen Ordnern und Listen
  - Aufgaben, deren Liste oder Ordner fehlt (Waisen), erscheinen nicht.
  - Sortierung wie „offen“ in der Liste: 🔥 nach `since`, dann 📅 nach Stichtag (Überfälliges
    steht damit vorn), bei Gleichstand nach `createdAt`, dann nach ID. Listen- und
    Ordnergrenzen spielen keine Rolle.
  - kein Filter, kein ✎ und kein +, kein Zurück-Knopf
  - Ist nichts dringend, steht „Nichts Dringendes.“ da.
- **Zeile:** dieselbe `TaskRow` wie in der Liste, mit einer dritten Zeile „Ordner › Liste“.
  Diese ist sichtbar und `aria-hidden`. Gesprochen wird sie über versteckten Text.

  | Lage | sichtbar | zugänglicher Name des Namensknopfs |
  |---|---|---|
  | 🔥 | „🔥 dringend“ / „Familie › Haushalt“ | „Müll rausbringen, dringend, Familie, Haushalt“ |
  | 📅 Vorlauf erreicht | „📅 17.10. 🔥“ / „Auto › Wartung“ | „Reifen wechseln, Stichtag 17. Oktober, dringend, Auto, Wartung“ |
  | 📅 überfällig | „📅 08.10. überfällig“ / „Auto › Wartung“ | „Reifen wechseln, überfällig seit 8. Oktober, Auto, Wartung“ |

  Der ✓-Knopf heißt wie in der Liste „<Name> erledigen“. Die Zeilen der Listen-Seite bleiben
  unverändert und haben keine Herkunftszeile.
- **Bedienung:** Der Name öffnet die Übersichtsseite, ✓ die Erledigen-Bestätigung. Das ist
  dieselbe `TaskFlow` wie aus der Liste, mit Bearbeiten, Verschieben, Löschen und Wieder öffnen.
  Erledigen auf der Dringend-Seite erledigt die Aufgabe auch in ihrer Liste.
- **Rückkehr zur Dringend-Seite:**
  - „Zurück“ von der Übersicht: Fokus auf den Namen der Aufgabe
  - „Abbrechen“ der Erledigung, die von der Zeile aus begonnen wurde: Fokus auf ihr ✓
  - erledigt oder gelöscht:
    - Fokus auf die Zeile, die jetzt an derselben Stelle steht
    - Ist die Seite leer, liegt der Fokus auf der Überschrift.
    - Die Ansagen sind wie bisher „Aufgabe X erledigt.“ bzw. „Aufgabe X gelöscht.“
  - Die Aufgabe ist beim Zurückkehren nicht mehr dringend (etwa auf ☕ umgestellt oder Stichtag
    verschoben):
    - Fokus auf die Zeile an der Stelle, an der die Aufgabe beim Öffnen stand, sonst auf die
      Überschrift
    - Ansage „<Name> ist nicht mehr dringend.“
  - Bleibt sie dringend, rutscht durch Bearbeiten aber an eine andere Stelle, liegt der Fokus
    auf ihrem Namen an der neuen Stelle.
  - Wurde die geöffnete Aufgabe, ihre Liste oder ihr Ordner auf einem anderen Gerät gelöscht:
    zurück zur Dringend-Seite, Fokus auf die Überschrift, Ansage „Aufgabe X wurde gelöscht.“
- **Badge am Dringend-Knopf der Navigation:**
  - Die Zahl ist die der Zeilen der Dringend-Seite.
  - Ein Kreis rechts oben am Icon, gefüllt mit `--accentLine`, die Zahl in `--surface` und fett.
  - Bei 0 gibt es keinen Badge im DOM, ab 100 steht „99+“ da.
  - Der Badge ist `aria-hidden`. Der Knopf heißt „Dringend, 3 Aufgaben“, „Dringend, 1 Aufgabe“
    bzw. „Dringend“.
  - Er ist in allen Bereichen mit Navigation sichtbar: Dringend, Ordner, Liste, Einstellungen.
- **Tageswechsel:** Dringend-Seite, Badge, Listen-Knöpfe, Zeilen und Übersicht rechnen mit dem
  neuen Kalendertag, und zwar ohne Eingabe:
  - um Mitternacht
  - sobald die App aus dem Hintergrund zurückkommt (`visibilitychange` auf `visible`, `pageshow`)
- **axe** meldet keine Verstöße:
  - auf der leeren Dringend-Seite
  - auf der Dringend-Seite mit 🔥-, 📅- und überfälliger Zeile
  - an der Navigation mit Badge
- **Playwright** gegen Auth- und Firestore-Emulator, nur per Tastatur, belegt:
  1. Eine 🔥-Aufgabe anlegen.
  2. Der Navigationsknopf heißt „Dringend, 1 Aufgabe“.
  3. Auf der Dringend-Seite steht die Zeile mit Herkunft.
  4. Dort erledigen: „Nichts Dringendes.“, der Knopf heißt wieder „Dringend“, und in der Liste
     steht die Aufgabe unter „erledigt (1)“.

## Wesentliche Entscheidungen und Abwägungen

1. **`UrgentArea` als eigener Bereich neben `FoldersArea`.** Ihr Seitenzustand ist
   `overview | task`, und sie nutzt `TaskFlow` unverändert.
   - Warum: „Zurück“ führt immer zur Dringend-Seite, nicht in die Liste. `FoldersArea` bleibt
     unberührt.
   - Auswirkung:
     - Die reine Auflösung steht in `urgentAreaPage.ts`, nach dem Muster von
       `resolveFoldersAreaPage`.
     - `TaskFlow.onMoved` wird optional. `UrgentArea` braucht es nicht, weil sie die Aufgabe nur
       über ihre ID findet.
2. **Domänenfunktion `urgentTasksOf(organizer, today)`** in `organizer.ts`. Sie liefert
   `readonly UrgentTask[]` mit `UrgentTask = { task; list; folder }`: sortiert wie „offen“, nur
   dringende Aufgaben, ohne Waisen.
   - Warum: Seite und Badge zählen garantiert dasselbe, und die Regel ist ohne Rendering testbar.
   - Auswirkung: Der Badge ist `urgentTasksOf(organizer, today).length`.
3. **`TaskRow` bekommt die optionale Prop `origin?: { folderName: string; listName: string }`.**
   Gibt es sie, folgt eine dritte Zeile `.taskRowOrigin` (`aria-hidden`), und der versteckte Text
   im Titel wird um „, Ordner, Liste“ ergänzt.
   - Warum: Eine Zeilenkomponente für beide Seiten. Sichtbarer und gesprochener Text bleiben
     getrennt, wie in MUL-005 (Entscheidung 10).
   - Auswirkung:
     - Die gesprochene Herkunft muss **hinter** der Fälligkeit stehen.
     - Bei 🔥 liegt der Text „dringend“ heute sichtbar und gesprochen in `.taskRowDetail`. Mit
       Herkunft würde er sonst nach dem versteckten Titeltext gelesen.
     - Deshalb wird der versteckte Herkunftstext als letztes Kind **innerhalb des Knopfs** hinter
       allen Zeilen angehängt, nicht im Titel. Er lautet `<span class="visuallyHidden">,
       Familie, Haushalt</span>`.
     - Die Reihenfolge im zugänglichen Namen ist damit für alle drei Fälligkeiten richtig.
4. **Fokuslogik der Zeilen wird geteilt.** `awaitedButton`, `withoutRemovedTask`,
   `openButtonKey`/`completeButtonKey` und `keepOpenButton` aus `ListPage.tsx:24-112` ziehen in
   den Hook `useTaskRowFocus(rows, focus, heading)` in `src/tasks/ui/useTaskRowFocus.ts`.
   - Warum: Die Dringend-Seite braucht genau dieselben Fokusregeln (`returningTask`,
     `followingTask`). Doppelter Code würde auseinanderlaufen.
   - Auswirkung:
     - `ListPage` wird darauf umgestellt, ohne Verhaltensänderung. Abgesichert ist das über die
       bestehenden `FoldersAreaTasks.test.tsx`.
     - Der Fokus-Typ heißt weiter `ListPageFocus` und bleibt in `foldersAreaPage.ts`.
     - Die Dringend-Seite nutzt ihn ohne `arrivingTask`.
5. **`NavigationBar`: `Area` bekommt optional `badge?: { count: number; label: string }`.**
   - `label` ist der vollständige zugängliche Name des Knopfs.
   - Die sichtbare Zahl ergibt sich aus `count`, ab 100 als „99+“.
   - Bei `count === 0` gibt es keinen Badge, und das `aria-label` ist `area.label`.
   - Warum: `shared` bleibt fachfrei und kennt das Wort „Aufgabe“ nicht.
   - Auswirkung:
     - `SignedInApp` baut `areas` je Render.
     - `urgentAreaLabel(count)` in `announcements.ts` liefert „Dringend“ bzw. „Dringend, “ +
       `taskCountLabel(count)`.
6. **`useToday(now)` in `src/tasks/ui/useToday.ts`, einmal in `SignedInApp` aufgerufen.**
   - Hält `today` als Zustand.
   - Stellt einen Timer auf die nächste lokale Mitternacht und nach dem Auslösen neu.
   - Prüft bei `visibilitychange` (sichtbar) und `pageshow` erneut.
   - Setzt den Zustand nur, wenn sich der Tag geändert hat.
   - Warum: iOS friert Timer im Hintergrund ein. Ohne Auslöser zeigt die App morgens den Stand
     von gestern, bis man tippt.
   - Auswirkung:
     - `today` wird Prop von `UrgentArea`, `FoldersArea` und `TaskFlow`, die es nicht mehr
       selbst aus `now()` bilden.
     - `now` bleibt für Zeitstempel (`createdAt`, Erledigung).
     - Der Hook liegt in `tasks/ui`, weil `CalendarDay` zur `tasks`-Domäne gehört.
7. **Position beim Öffnen merken.** Die `task`-Seite der `UrgentArea` trägt `openedAt`, den Index
   der Zeile beim Öffnen.
   - Warum: Ist die Aufgabe beim Zurückkehren nicht mehr auf der Seite, gibt es keinen
     aktuellen Index mehr.
   - Auswirkung:
     - Erledigt und gelöscht nutzen den aktuellen Index, solange die Aufgabe noch auf der Seite
       steht. `onLeave` kommt vor dem Schreiben (MUL-005, Entscheidung 4).
     - Sonst gilt `openedAt`.
8. **„Anderswo gelöscht“ wird nicht weiter unterschieden.** Fehlen Aufgabe, Liste oder Ordner,
   folgt die Ansage `taskDeletedElsewhereAnnouncement(lastKnownTaskName)`.
   - Warum: Beim Löschen einer Liste oder eines Ordners verschwinden ihre Aufgaben im selben
     Batch mit. Die Snapshots der Sammlungen können aber nacheinander eintreffen. Aus Sicht der
     Dringend-Seite ist in jedem Fall die Aufgabe weg.

## Ausgangslage

```
App ─► SignedInApp ── activeArea ──┬─ 'urgent'   → UrgentPage (Platzhalter „Nichts Dringendes.“)
       │ useOrganizer(client)      ├─ 'folders'  → FoldersArea (today = calendarDayOf(now()))
       │ AREAS (const)             │                 └─ TaskFlow (today = calendarDayOf(now()))
       │ NavigationBar             └─ 'settings' → SettingsPage
```

- `src/SignedInApp.tsx:14-18`: `AREAS` ist konstant, ohne Badge. Z. 72-73: `UrgentPage` bekommt
  nur `navigation`.
- `src/tasks/ui/UrgentPage.tsx:8-24`: Platzhalter.
- `src/shared/ui/NavigationBar.tsx:3-7, 25-32`: `Area` mit `id`, `label` und `icon`. Der Knopf
  hat `aria-label={area.label}`.
- `src/tasks/domain/urgency.ts:30-41`: `isUrgentOn`.
- `src/tasks/domain/taskOrder.ts:41-43`: `openTasksInOrder`.
- `src/tasks/domain/organizer.ts:35-37, 77-79`: `folderOfList`, `listOfTask`.
- `src/tasks/domain/announcements.ts:88-90, 108-110, 119`: `taskCountLabel`,
  `taskDeletedElsewhereAnnouncement`, `taskCompletedAnnouncement`.
- `src/tasks/ui/ListPage.tsx:24-112`: Fokuslogik der Zeilen.
- `src/tasks/ui/TaskRow.tsx:27-39`: 🔥-Zeile. Der Text „dringend“ ist sichtbar und gesprochen,
  das Komma davor versteckt.
- `src/tasks/ui/TaskFlow.tsx:74-81, 95`: Props und die eigene Bildung von `today`.
- `src/tasks/ui/FoldersArea.tsx:91, 241-278`: eigenes `today`, Muster für `followingTask` und
  `leaveTask`.
- `src/tasks/ui/foldersAreaHarness.tsx`: fester Zeitpunkt `TENTH_OF_OCTOBER_MORNING`, Helfer
  `heading`, `button`, `buttonNamedFirst` und `announced`.
- `src/App.test.tsx:123-127`: prüft „Nichts Dringendes.“.
- `src/index.css:56-103`: `.navigationBar`. Z. 337-435: `.taskRow*`.
- `e2e/organizer.ts`: `createTask(page, name, { urgent })`, `taskRowName`.
  `e2e/keyboard.ts:pressButton` sucht mit `exact: true`.

## Zielbild

```
App ─► SignedInApp
       │ organizer = useOrganizer(client)
       │ today     = useToday(now)                         ◄ Mitternacht, visibilitychange, pageshow
       │ urgent    = urgentTasksOf(organizer, today)
       │ areas     = [Dringend + badge{count, label}, Ordner, Einstellungen]
       ├─ 'urgent'   → UrgentArea(organizer, urgent, today, now)
       │                ├─ overview → UrgentPage(rows = urgent, focus)  ─ TaskRow(origin)
       │                └─ task     → TaskFlow(today)  ── onLeave → overview + Fokus/Ansage
       ├─ 'folders'  → FoldersArea(today, now) ─ TaskFlow(today)
       └─ 'settings' → SettingsPage
```

```
src/
  SignedInApp.tsx                 useToday, urgentTasksOf, areas mit badge, UrgentArea
  shared/ui/
    NavigationBar.tsx (+ Test)    Area.badge, Kreis, aria-label
  tasks/
    domain/
      organizer.ts (+ Test)       UrgentTask, urgentTasksOf
      announcements.ts (+ Test)   taskNoLongerUrgentAnnouncement, urgentAreaLabel
    ui/
      useToday.ts (+ Test)        neu
      useTaskRowFocus.ts          neu, aus ListPage herausgelöst
      ListPage.tsx                nutzt useTaskRowFocus
      TaskRow.tsx                 + origin
      UrgentPage.tsx              Zeilen, Fokus, leer
      urgentAreaPage.ts (+ Test)  neu: Seitenzustand und reine Auflösung
      UrgentArea.tsx              neu
      UrgentArea.test.tsx         neu
      TaskFlow.tsx                today als Prop, onMoved optional
      FoldersArea.tsx             today als Prop
      foldersAreaHarness.tsx      today übergeben
  index.css                       .taskRowOrigin, .navigationBadge
e2e/
  organizer.ts                    urgentRowName, openUrgent
  urgent.spec.ts                  neu
```

### Oberflächen

Dringend-Seite, vorher und nachher:

```
Vorher                                  Nachher
┌─────────────────────────────────┐     ┌─────────────────────────────────┐
│ [☑]      [📁]       [⚙]         │     │ [☑ ③]    [📁]       [⚙]         │
├─────────────────────────────────┤     ├─────────────────────────────────┤
│ Dringend                   (h1) │     │ Dringend                   (h1) │
│                                 │     │ ╭───────────────────────┬─────╮ │
│ Nichts Dringendes.              │     │ │ Müll rausbringen      │  ✓  │ │
│                                 │     │ │ 🔥 dringend           │     │ │
│                                 │     │ │ Familie › Haushalt    │     │ │
│                                 │     │ ╰───────────────────────┴─────╯ │
│                                 │     │ ╭───────────────────────┬─────╮ │
│                                 │     │ │ Reifen wechseln       │  ✓  │ │
│                                 │     │ │ 📅 08.10. überfällig  │     │ │
│                                 │     │ │ Auto › Wartung        │     │ │
│                                 │     │ ╰───────────────────────┴─────╯ │
│                                 │     │ ╭───────────────────────┬─────╮ │
│                                 │     │ │ Zahnarzt              │  ✓  │ │
│                                 │     │ │ 📅 15.10. 🔥          │     │ │
│                                 │     │ │ Familie › Termine     │     │ │
│                                 │     │ ╰───────────────────────┴─────╯ │
└─────────────────────────────────┘     └─────────────────────────────────┘
```

Leer: wie vorher, und die Navigation zeigt keinen Badge.

Markup einer Zeile mit Herkunft:

```
<button class="taskRowName">
  <span class="taskRowTitle">Zahnarzt<span class="visuallyHidden">, Stichtag 15. Oktober, dringend</span></span>
  <span class="taskRowDetail" aria-hidden="true"><CalendarIcon/> 15.10. <FlameIcon/></span>
  <span class="taskRowOrigin" aria-hidden="true">Familie › Termine</span>
  <span class="visuallyHidden">, Familie, Termine</span>
</button>
```

`.taskRowOrigin`: `font-size: 1rem`, `font-weight: normal`, umbrechend, ohne eigene Farbe.

Navigation mit Badge:

```
╔═══════════════╗╔═══════════════╗╔═══════════════╗
║      ☑ ⓷     ║║      📁       ║║      ⚙        ║
╚═══════════════╝╚═══════════════╝╚═══════════════╝

<button aria-label="Dringend, 3 Aufgaben" aria-current="page">
  <ChecklistIcon/>
  <span class="navigationBadge" aria-hidden="true">3</span>
</button>
```

`.navigationBadge`:

- `min-width: 1.5rem`, `height: 1.5rem`, `border-radius: 0.75rem`, `padding: 0 0.25rem`
- `background-color: var(--accentLine)`, `color: var(--surface)`, `font-weight: bold`,
  `font-size: 0.875rem`, `line-height: 1.5rem`
- `margin-left: 0.25rem` neben dem Icon im Flex-Knopf, `align-self: flex-start` (rechts oben)
- Kontrast: `#FF9933` auf `#000000` ergibt 9,3:1, `#0066CC` auf `#FFFFFF` 5,6:1. Beides prüft
  der Paletten-Test über `['--surface', '--accentLine']`.

## Abstraktionen und Wiederverwendung

- `src/tasks/domain/organizer.ts`:
  ```ts
  export type UrgentTask = { task: Task; list: List; folder: Folder }

  export function urgentTasksOf(organizer: Organizer, today: CalendarDay): readonly UrgentTask[]
  ```
  Die Funktion nimmt `openTasksInOrder(organizer.tasks)`, filtert mit `isUrgentOn` und ergänzt
  `listOfTask` und `folderOfList`. Einträge ohne Liste oder Ordner fallen weg.
- `src/tasks/domain/announcements.ts`:
  - `taskNoLongerUrgentAnnouncement(name)` → „Reifen wechseln ist nicht mehr dringend.“
  - `urgentAreaLabel(count)` → „Dringend“ bei 0, sonst „Dringend, “ + `taskCountLabel(count)`
  - `URGENT_AREA_NAME = 'Dringend'` wird von `urgentAreaLabel` und `SignedInApp` gemeinsam
    genutzt.
- `src/shared/ui/NavigationBar.tsx`:
  ```ts
  export type AreaBadge = { count: number; label: string }
  export type Area<Id extends string> = { id: Id; label: string; icon: ReactNode; badge?: AreaBadge }
  const MAXIMUM_SHOWN_BADGE_COUNT = 99
  ```
  - `aria-label`: bei `count > 0` ist es `badge.label`, sonst `area.label`.
  - Sichtbar ist `count` bzw. `99+`.
- `src/tasks/ui/useToday.ts`:
  ```ts
  export function useToday(now: () => Date): CalendarDay
  ```
  - Zustand: `calendarDayOf(now())`.
  - Effekt: `setTimeout` auf `millisecondsUntilNextMidnight(now())`, danach neu stellen.
  - `document` hört auf `visibilitychange` (nur bei `visibilityState === 'visible'`), `window`
    auf `pageshow`.
  - Aufräumen beim Unmount.
  - `millisecondsUntilNextMidnight` steht als kleine reine Funktion in derselben Datei. Die
    nächste lokale Mitternacht ist `new Date(y, m, d + 1)`, gerechnet in Ortszeit, damit sie zu
    `calendarDayOf` passt.
  - `refresh` setzt `calendarDayOf(now())`. React überspringt das Rendern bei gleichem Wert
    (Text).
- `src/tasks/ui/useTaskRowFocus.ts`:
  ```ts
  export function useTaskRowFocus(
    shownTasks: readonly Task[],          // schon ohne den entfernten Eintrag
    focus: ListPageFocus,
    heading: RefObject<HTMLHeadingElement | null>,
  ): { openButton: (id: TaskId) => Ref<HTMLButtonElement>; completeButton: (id: TaskId) => Ref<HTMLButtonElement> }
  export function withoutRemovedTask(tasks: readonly Task[], focus: ListPageFocus): readonly Task[]
  ```
  Er bündelt `useFocusAfterRemoval` und `useFocusOnArrival` wie heute in `ListPage`.
- `src/tasks/ui/TaskRow.tsx`:
  - `TaskOrigin = { folderName: string; listName: string }`, Prop `origin?: TaskOrigin`
  - Mit `origin` folgen die Herkunftszeile und der versteckte Sprechtext als letzte Kinder des
    Namensknopfs.
- `src/tasks/ui/urgentAreaPage.ts`:
  ```ts
  export type UrgentPageFocus = Exclude<ListPageFocus, { kind: 'arrivingTask' }>
  export type UrgentAreaPage =
    | { kind: 'overview'; focus: UrgentPageFocus }
    | { kind: 'task'; id: TaskId; entry: TaskFlowEntry; openedAt: number }
  export type ShownUrgentAreaPage =
    | { kind: 'overview'; focus: UrgentPageFocus }
    | { kind: 'task'; task: Task; list: List; folder: Folder; entry: TaskFlowEntry; openedAt: number }
  export function resolveUrgentAreaPage(page, organizer): { shown: ShownUrgentAreaPage; vanished: boolean }
  export function focusAfterLeaving(
    task: Task, urgent: readonly UrgentTask[], openedAt: number,
    reason: TaskFlowLeaveReason,
  ): { focus: UrgentPageFocus; noLongerUrgent: boolean }
  ```
  `focusAfterLeaving` ist eine reine Funktion und entscheidet so:

  | Grund | Aufgabe noch auf der Seite | Fokus | `noLongerUrgent` |
  |---|---|---|---|
  | `back` | ja | `returningTask` mit `button: 'open'` | nein |
  | `cancelled` | ja | `returningTask` mit `button: 'complete'` | nein |
  | `back` / `cancelled` | nein | `followingTask` mit `removedAt: openedAt` | ja |
  | `completed` / `deleted` | ja | `followingTask` mit aktuellem Index | nein |
  | `completed` / `deleted` | nein | `followingTask` mit `removedAt: openedAt` | nein |

  `removedId` ist immer `task.id`.
- `src/tasks/ui/UrgentPage.tsx`: Props `navigation`, `urgentTasks`, `today`, `focus`, `onOpenTask`
  und `onCompleteTask`. Die Zeilen sind `withoutRemovedTask` über `urgentTasks`, angezeigt als
  `ul.folderList` mit `TaskRow origin=…`.
- `src/tasks/ui/UrgentArea.tsx`:
  - Props `organizer`, `urgentTasks`, `navigation`, `announce`, `today`, `now`.
  - Zustand `UrgentAreaPage`.
  - Merkt sich `lastKnownTaskName` wie `FoldersArea`, damit nach dem Verschwinden angesagt
    werden kann.
  - `leaveTask(shown, reason)` ruft `focusAfterLeaving` auf, setzt die Übersicht und sagt bei
    `noLongerUrgent` `taskNoLongerUrgentAnnouncement` an.
  - Erledigt und gelöscht sagt `TaskFlow` selbst an.
- `src/tasks/ui/TaskFlow.tsx`: Props `today: CalendarDay` (neu) und `onMoved?: (list: List) =>
  void`. Die eigene Bildung von `today` entfällt.
- Die Ansagen aus `TaskFlow` (erledigt, gelöscht, gespeichert, verschoben) gelten auf der
  Dringend-Seite unverändert.

## Logging und Beobachtbarkeit

Es gibt kein Logging. Neu ist eine Ansage über die Live-Region: „<Name> ist nicht mehr
dringend.“ Der Badge spricht über den Namen des Navigationsknopfs. Ändert sich die Zahl, wird das
nicht angesagt. VoiceOver liest den Namen beim nächsten Fokus auf den Knopf.

## Umsetzung

### Phase 1: Dringend-Seite mit Herkunft, Öffnen und Erledigen

Abhängigkeiten: keine

Am Ende dieser Phase zeigt die Startseite alle dringenden Aufgaben mit Herkunft. Man kann sie
öffnen, bearbeiten, erledigen und löschen und landet mit sinnvollem Fokus wieder auf der
Dringend-Seite. Der Tag wird in dieser Phase noch je Render aus `now()` gebildet.

**Aufgaben**:

- [x] `src/tasks/domain/organizer.test.ts` und `organizer.ts` (test-getrieben, heute
  `'2026-10-10'`): `urgentTasksOf`
  - liefert 🔥 und 📅 mit erreichtem Vorlauf (auch überfällig, auch „sofort“) aus zwei Ordnern
    und mehreren Listen, jeweils mit `list` und `folder`
  - lässt ☕, 📅 ohne erreichten Vorlauf und erledigte Aufgaben weg
  - sortiert über Listen hinweg: 🔥 älteres `since` zuerst, dann 📅 nach Stichtag, Gleichstand
    nach `createdAt`
  - lässt eine Aufgabe ohne Liste und eine Aufgabe, deren Liste keinen Ordner hat, weg
  - ein leerer Organizer ergibt `[]`
- [x] `src/tasks/domain/announcements.test.ts` und `announcements.ts` (test-getrieben):
  - `taskNoLongerUrgentAnnouncement('Reifen wechseln')` → „Reifen wechseln ist nicht mehr
    dringend.“
- [x] `src/tasks/ui/useTaskRowFocus.ts` aus `ListPage.tsx` herauslösen und `ListPage` darauf
  umstellen. Die bestehenden Tests in `FoldersAreaTasks.test.tsx` und `FoldersAreaDeadline.test.tsx`
  bleiben unverändert grün.
- [x] `src/tasks/ui/TaskRow.tsx`: Prop `origin` mit Herkunftszeile und Sprechtext nach dem Markup
  im Zielbild. `.taskRowOrigin` in `src/index.css`.
- [x] `src/tasks/ui/urgentAreaPage.test.ts` und `urgentAreaPage.ts` (test-getrieben, rein):
  - `resolveUrgentAreaPage`:
    - `overview` wird unverändert durchgereicht.
    - `task` mit vorhandener Aufgabe, Liste und Ordner ergibt `shown.kind === 'task'` samt
      `list` und `folder`, mit `vanished: false`.
    - Fehlt die Aufgabe, ihre Liste oder deren Ordner, ergibt das je
      `{ shown: overview mit heading, vanished: true }`.
  - `focusAfterLeaving`: alle Zeilen der Tabelle aus *Abstraktionen*, darunter `back` nach
    Umstellung auf ☕ mit `openedAt: 1` → `followingTask` mit `removedAt: 1` und
    `noLongerUrgent: true`.
- [x] `src/tasks/ui/UrgentPage.tsx` auf Zeilen umbauen (Props wie in *Abstraktionen*). Leer
  bleibt „Nichts Dringendes.“.
- [x] `src/tasks/ui/TaskFlow.tsx`: `onMoved` wird optional (`onMoved?.(targetList)`).
- [x] `src/tasks/ui/UrgentArea.tsx` neu nach *Abstraktionen*. Der Tag in dieser Phase ist
  `calendarDayOf(now())`.
- [x] `src/SignedInApp.tsx`: `UrgentArea` statt `UrgentPage`, mit `organizer`, `urgentTasks`,
  `announce` und `now`. `urgentTasks` wird je Render über `urgentTasksOf(organizer,
  calendarDayOf(now()))` gebildet.
- [x] `src/tasks/ui/UrgentArea.test.tsx` (neu, test-getrieben, heute = 10.10.2026,
  `TENTH_OF_OCTOBER_MORNING` und die Helfer aus `foldersAreaHarness.tsx`). Eine kleine eigene
  Harness-Funktion `renderUrgentArea(folders, lists, tasks)` im Test baut `useOrganizer`,
  `urgentTasksOf`, `UrgentArea` und `Announcer` zusammen.
  - Ohne dringende Aufgaben: Überschrift „Dringend“ fokussiert, „Nichts Dringendes.“, keine
    Filter-Gruppe, keine Knöpfe „Liste bearbeiten“ oder „Aufgabe anlegen“.
  - Zeilen aus „Familie › Haushalt“ (🔥, ☕) und „Auto › Wartung“ (📅 08.10. „1 Woche
    vorher“, 📅 15.10. „1 Woche vorher“, 📅 20.10. „1 Woche vorher“):
    - Reihenfolge und Namen der Namensknöpfe: „Müll rausbringen, dringend, Familie, Haushalt“,
      „Reifen wechseln, überfällig seit 8. Oktober, Auto, Wartung“, „Ölwechsel, Stichtag
      15. Oktober, dringend, Auto, Wartung“
    - ☕ und 📅 20.10. fehlen.
    - Die dritte Zeile zeigt „Familie › Haushalt“ und ist `aria-hidden`.
  - Name antippen: Die Übersicht „Müll rausbringen“ erscheint. „Zurück“ führt zur
    Dringend-Seite, mit Fokus auf „Müll rausbringen, dringend, Familie, Haushalt“.
  - ✓ „Müll rausbringen erledigen“ → „Erledigen“:
    - `storedTasks` hat eine Erledigung.
    - Die Ansage lautet „Aufgabe Müll rausbringen erledigt.“
    - Der Fokus liegt auf der Zeile „Reifen wechseln, …“, die jetzt an Stelle 0 steht.
  - ✓ → „Abbrechen“: Der Fokus liegt auf „Müll rausbringen erledigen“.
  - Letzte Zeile erledigen: Der Fokus liegt auf der neuen letzten Zeile. Ist sie die einzige
    gewesen, liegt er auf der Überschrift, und „Nichts Dringendes.“ steht da.
  - Öffnen → „Bearbeiten“ → „Irgendwann“ → „Speichern“ → „Zurück“:
    - Die Ansage lautet „Müll rausbringen ist nicht mehr dringend.“
    - Der Fokus liegt auf der Zeile, die jetzt an Stelle 0 steht.
  - Öffnen → „Bearbeiten“ → Stichtag 09.10. statt 15.10. bei „Ölwechsel“ → „Speichern“ →
    „Zurück“: Der Fokus liegt auf „Ölwechsel, überfällig seit 9. Oktober, Auto, Wartung“ an der
    neuen Stelle, ohne Ansage „nicht mehr dringend“.
  - Öffnen → „Löschen“ → „Löschen“: Die Aufgabe ist weg, und die Ansage lautet „Aufgabe
    Müll rausbringen gelöscht.“
  - Öffnen → „Bearbeiten“ → Liste „Auto › Wartung“ → „Speichern“: Die Übersicht bleibt offen,
    und „Zurück“ zeigt die Zeile mit Herkunft „Auto, Wartung“.
  - Die geöffnete Aufgabe wird über `client` entfernt (anderes Gerät): Die Dringend-Seite
    erscheint, die Überschrift ist fokussiert, und die Ansage lautet „Aufgabe Müll rausbringen
    wurde gelöscht.“ Dasselbe gilt, wenn nur ihre Liste entfernt wird.
  - axe meldet keine Verstöße auf der leeren Seite und auf der Seite mit den drei Zeilen.
- [x] `src/App.test.tsx`: Der Starttest prüft weiter Überschrift und „Nichts Dringendes.“ bei
  leerem Organizer. Neu: Ein Organizer mit einer 🔥-Aufgabe zeigt deren Zeile mit Herkunft auf
  der Startseite.
- [x] `e2e/organizer.ts`:
  - `urgentRowName(name, folderName, listName)` → „Müll rausbringen, dringend, Familie, Haushalt“
  - `openUrgent(page, badgeLabel = 'Dringend')`: `pressButton(page, badgeLabel)`, Überschrift
    „Dringend“ fokussiert
- [x] `e2e/urgent.spec.ts` (neu, nur per Tastatur, `beforeEach`: `prepareEmulators()`):
  1. Ordner „Familie“ mit Liste „Haushalt“ anlegen und öffnen.
  2. `createTask(page, 'Müll rausbringen', { urgent: true })`
  3. `openUrgent(page)`: Die Zeile `urgentRowName(…)` ist sichtbar.
  4. Den Knopf „Müll rausbringen erledigen“ fokussieren, Enter, dann `pressButton(page,
     'Erledigen')`.
  5. Erwartet werden die Überschrift „Dringend“ fokussiert und „Nichts Dringendes.“.
  6. `openFolders`, `openFolder('Familie')`, `openList('Haushalt')`, `pressButton('erledigt
     (1)')`: Die Zeile „Müll rausbringen, erledigt …“ ist sichtbar. Das Datum ist nicht Teil der
     Prüfung, gesucht wird mit Regex `^Müll rausbringen, erledigt`.

**Automatisierte Verifikation**:

- [x] `npm run test` läuft grün, einschließlich `organizer.test.ts`, `announcements.test.ts`,
  `urgentAreaPage.test.ts`, `UrgentArea.test.tsx`, `App.test.tsx`, der unveränderten
  `FoldersAreaTasks.test.tsx` und `FoldersAreaDeadline.test.tsx` und
  `test/domainLayerBoundary.test.ts`
- [x] `npm run test:rules` läuft grün
- [x] `npm run test:e2e` läuft grün mit `urgent.spec.ts` und allen bisherigen Abläufen
- [x] `npm run lint`, `npm run format:check` und `npm run build` laufen grün
- [x] `grep -rn "awaitedButton" src/tasks/ui/ListPage.tsx` liefert nichts

### Phase 2: Badge in der Navigation und Tageswechsel

Abhängigkeiten: Phase 1

Die Navigation zeigt die Zahl der dringenden Aufgaben. Die App rechnet nach Mitternacht und nach
der Rückkehr aus dem Hintergrund ohne Eingabe mit dem neuen Tag.

**Aufgaben**:

- [x] `src/shared/ui/NavigationBar.test.tsx` (neu) und `NavigationBar.tsx` (test-getrieben):
  - ohne `badge` bzw. mit `count: 0`: Knopf „Dringend“, kein `.navigationBadge` im DOM
  - `count: 3`, `label: 'Dringend, 3 Aufgaben'`: Knopf mit genau diesem Namen. Der Badge zeigt
    „3“, ist `aria-hidden` und hat die Klasse `navigationBadge`.
  - `count: 100`: Der Badge zeigt „99+“, der Name bleibt `label`.
  - `aria-current` bleibt unverändert.
  - axe meldet keine Verstöße mit Badge.
- [x] `.navigationBadge` in `src/index.css` nach dem Zielbild.
- [x] `src/tasks/domain/announcements.test.ts` und `announcements.ts` (test-getrieben):
  `URGENT_AREA_NAME` und `urgentAreaLabel` mit 0 → „Dringend“, mit 1 → „Dringend, 1 Aufgabe“,
  mit 3 → „Dringend, 3 Aufgaben“.
- [x] `test/palette.test.ts`: `['--surface', '--accentLine']` in `TEXT_ON_ITS_BACKGROUND`
  aufnehmen (Badge-Zahl auf Badge-Fläche, mindestens 4,5:1).
- [x] `src/tasks/ui/useToday.test.tsx` und `useToday.ts` (test-getrieben, `vi.useFakeTimers()`,
  veränderliche Uhr `let moment = new Date(2026, 9, 10, 23, 59)`):
  - Der Startwert ist `'2026-10-10'`.
  - Uhr auf 11.10., 00:00 stellen und `vi.advanceTimersByTime` bis über Mitternacht: Ergebnis
    `'2026-10-11'`.
  - Der Timer wird neu gestellt, und die nächste Mitternacht schaltet auf `'2026-10-12'`.
  - Uhr vorstellen ohne Timer, dann `visibilitychange` mit `visibilityState === 'visible'`
    (über `Object.defineProperty(document, 'visibilityState', …)`): Der neue Tag kommt an.
  - `pageshow` auf `window`: Der neue Tag kommt an.
  - Bei `visibilityState === 'hidden'` ändert sich nichts.
  - Nach dem Unmount löst kein Timer mehr aus (`vi.getTimerCount() === 0`).
  - `millisecondsUntilNextMidnight(new Date(2026, 9, 10, 23, 59))` → `60_000`
- [x] `src/tasks/ui/TaskFlow.tsx`: `today` als Prop, `calendarDayOf(now())` entfällt.
- [x] `src/tasks/ui/FoldersArea.tsx`: `today` als Prop, Z. 91 entfällt.
  `foldersAreaHarness.tsx` übergibt `today={calendarDayOf(TENTH_OF_OCTOBER_MORNING)}`.
- [x] `src/tasks/ui/UrgentArea.tsx`: `today` als Prop. Die Harness in `UrgentArea.test.tsx`
  übergibt ihn.
- [x] `src/SignedInApp.tsx`:
  - `const today = useToday(now)`
  - `urgentTasks = urgentTasksOf(organizer, today)`
  - `areas` je Render, mit `badge: { count: urgentTasks.length, label:
    urgentAreaLabel(urgentTasks.length) }` am Dringend-Eintrag
  - `today` an `UrgentArea` und `FoldersArea`
  - `URGENT_AREA_NAME` als `label` des Eintrags
- [x] `src/App.test.tsx`:
  - `renderApp` bekommt einen optionalen Parameter `now` (Standard
    `() => TENTH_OF_OCTOBER_MORNING`), damit der Tageswechsel-Test eine veränderliche Uhr
    übergeben kann.
  - mit einer 🔥- und einer 📅-Aufgabe mit erreichtem Vorlauf: Der Knopf heißt „Dringend,
    2 Aufgaben“ und behält den Namen im Bereich „Ordner“.
  - Nach dem Erledigen auf der Dringend-Seite heißt er „Dringend, 1 Aufgabe“.
  - Bei leerem Organizer heißt er „Dringend“, ohne Badge im DOM. Die bestehenden Tests mit
    `name: 'Dringend'` bleiben so gültig.
  - Tageswechsel: Eine 📅-Aufgabe mit Stichtag 18.10. und „1 Woche vorher“ ist am 10.10. nicht
    dringend. Die veränderliche `now` wird auf den 11.10. gestellt, dann folgt
    `visibilitychange`. Danach heißt der Knopf „Dringend, 1 Aufgabe“, und die Zeile steht auf der
    Dringend-Seite.
- [x] `e2e/urgent.spec.ts` ergänzen:
  - Nach `createTask(… urgent)` heißt der Navigationsknopf „Dringend, 1 Aufgabe“
    (`openUrgent(page, 'Dringend, 1 Aufgabe')`).
  - Nach dem Erledigen heißt er wieder „Dringend“.

**Automatisierte Verifikation**:

- [x] `npm run test` läuft grün, einschließlich `NavigationBar.test.tsx`, `useToday.test.tsx`,
  `App.test.tsx`, `UrgentArea.test.tsx`, aller `FoldersArea*.test.tsx` und
  `test/palette.test.ts`
- [x] `npm run test:rules` läuft grün
- [x] `npm run test:e2e` läuft grün mit allen Abläufen
- [x] `npm run lint`, `npm run format:check` und `npm run build` laufen grün
- [x] `grep -n "calendarDayOf(now())" src/tasks/ui/FoldersArea.tsx src/tasks/ui/TaskFlow.tsx
  src/tasks/ui/UrgentArea.tsx src/SignedInApp.tsx` liefert nichts

**Manuelle Verifikation** (nach dem Push auf `main`, nur auf ausdrückliche Anweisung):

- [ ] Mit VoiceOver auf dem iPhone:
  - Die Startseite liest „Müll rausbringen, dringend, Familie, Haushalt“ in dieser Reihenfolge.
  - Der Navigationsknopf liest „Dringend, 1 Aufgabe“.
  - Nach dem Erledigen landet der Fokus auf der nächsten Zeile.
- [ ] Ohne VoiceOver:
  - Der Badge sitzt rechts oben am Dringend-Icon und ist im Dunkel- und im Hellmodus gut
    lesbar.
  - Die Herkunftszeile bricht bei langen Namen sauber um.
- [ ] Tageswechsel: Die App am Abend mit einer 📅-Aufgabe offen lassen, deren Vorlauf am nächsten
  Tag beginnt. Am Morgen die App aus dem Hintergrund holen: Badge und Dringend-Seite zeigen die
  Aufgabe, ohne dass man tippt.
- [ ] Auf iPhone A eine Aufgabe auf 🔥 stellen: Der Badge auf iPhone B zählt hoch.

## Notizen zur Umsetzung

Hier während der Umsetzung Rückmeldungen, Probleme und Entscheidungen festhalten.

- Der bekannte Bug „followingTask blendet removedId aus“ (`docs/notes.txt`) gilt auf der
  Dringend-Seite genauso, weil sie dieselbe Fokuslogik nutzt. Er wird hier nicht behoben.
- Herkunft (Abweichung von Entscheidung 3): Der versteckte Sprechtext „, Familie, Haushalt“ steht
  nicht als eigenes Kind am Ende des Knopfs, sondern am Ende des zuletzt gesprochenen Elements:
  bei 🔥 in `.taskRowDetail` hinter „dringend“, bei 📅 im Titel hinter dem versteckten Text.
  Grund: Die Kinder des Flex-Knopfs sind Blöcke. Chromium setzt zwischen Blöcken ein Leerzeichen
  in den zugänglichen Namen, daraus wurde „dringend , Familie“ (im E2E-Test gesehen, jsdom zeigt
  das nicht). `.taskRowOrigin` ist damit vollständig `aria-hidden`.
- `withoutRemovedTask` nimmt eine Funktion für die Aufgaben-ID entgegen und `useTaskRowFocus`
  die IDs der Zeilen. So nutzen Listen-Seite (`Task`) und Dringend-Seite (`UrgentTask`) beide
  dieselbe Logik.
- Die Erledigt-Ansage lautet im Code „Müll rausbringen erledigt.“ (`taskCompletedAnnouncement`),
  nicht „Aufgabe … erledigt.“ wie im Plan. Die Tests folgen dem Code.
- Test „rutscht an eine andere Stelle“: Stichtag 07.10. statt 09.10. Mit 09.10. bliebe Ölwechsel
  hinter Reifen wechseln (08.10.) auf derselben Stelle 2, und der Test bewiese nichts.

## Verweise

- Gesamtplan: `docs/agents/plans/2026-10-08-gesamtplan.md` (Entscheidungen 15, 19-22, 28,
  Zeile 262)
- Vorgänger:
  - `docs/agents/plans/2026-10-10-aufgaben.md` (Entscheidungen 3, 4, 10)
  - `docs/agents/plans/2026-10-10-stichtag.md` (Entscheidung 1)
- Architektur: `.claude/skills/architecture/SKILL.md`
- Bestehender Code:
  - `src/SignedInApp.tsx`, `src/shared/ui/NavigationBar.tsx`
  - `src/tasks/domain/organizer.ts`, `urgency.ts`, `taskOrder.ts`, `announcements.ts`
  - `src/tasks/ui/UrgentPage.tsx`, `ListPage.tsx`, `TaskRow.tsx`, `TaskFlow.tsx`,
    `FoldersArea.tsx`, `foldersAreaHarness.tsx`
  - `src/index.css`, `test/palette.test.ts`
  - `e2e/organizer.ts`, `e2e/keyboard.ts`, `e2e/tasks.spec.ts`
- iOS friert Timer im Hintergrund ein, darum `visibilitychange`/`pageshow`:
  https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilitychange_event
