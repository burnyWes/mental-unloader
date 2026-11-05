---
date: 2026-11-05T15:25:47.835869+00:00
git_commit: 9956052a243c490401256dbf17f4aae561d495dc
branch: main
story: MUL-013
topic: "Seitenwechsel gleiten seitlich"
tags: [plan, shared-ui, foldersarea, urgentarea, taskflow, css, view-transitions]
status: done
---

# PLAN: MUL-013 — Seitenwechsel gleiten seitlich

Wechselt man innerhalb eines Bereichs auf eine tiefere Seite, etwa einen Ordner, eine
Liste oder ein Formular, gleitet die alte Seite nach links hinaus. Die neue kommt dabei
von rechts herein. Beim Zurückgehen läuft es genau andersherum. Grundlage ist die
Klärung vom 05.11.2026.

## Akzeptanzkriterien

- Öffnet man innerhalb eines Bereichs eine tiefere Seite, gleitet die alte Seite nach
  links hinaus und die neue kommt von rechts herein. Tiefere Seiten sind Ordner, Liste,
  Aufgabe, ein Formular über `+` oder Stift und eine Rückfrage wie „Löschen?“ oder
  „Erledigen?“.
- Zurück, Abbrechen, Speichern, Löschen und Erledigen führen zur flacheren Seite. Dabei
  gleitet die alte Seite nach rechts hinaus und die neue kommt von links herein.
- Die Bewegung dauert 350 ms mit `ease-out`. Beide Seiten bewegen sich gleichzeitig.
- Kommt die obere Navigationsleiste auf beiden Seiten vor, steht sie still. Kommt sie
  nur auf einer der beiden vor, gleitet sie mit der Seite. Die untere Leiste
  (`BottomBar`) gleitet immer mit.
- Ohne Animation bleiben:
  - Tippen in Formularen und die Auswahl in Formularfeldern
  - der Filter „offen/erledigt“
  - der Bereichswechsel über die obere Leiste
  - „Wieder öffnen“ auf der Aufgabenseite, weil man dabei auf derselben Seite bleibt
  - der automatische Rücksprung, wenn etwas auf einem anderen Gerät gelöscht wurde
  - Anmelden und Abmelden
- Ist „Bewegung reduzieren“ eingeschaltet (`prefers-reduced-motion: reduce`), wechselt
  die Seite sofort wie heute. Dasselbe gilt für Browser ohne View-Transition-Typen.
- Fokus und Ansagen verhalten sich genau wie heute. Es gibt insbesondere keine
  „… wurde auf einem anderen Gerät gelöscht“-Ansage nach eigenem Löschen.

## Wesentliche Entscheidungen und Abwägungen

1. **Variante A, alle Wechsel innerhalb eines Bereichs gleiten:** Das gilt auch für
   Formulare und Rückfragen.
   - Warum: In der App ist jede Seite eine Vollbildseite mit „Zurück“. Das Verhalten
     soll einheitlich sein.
   - Auswirkung: Jeder navigierende Handler in `FoldersArea`, `TaskFlow`, `UrgentArea`
     und bei der Abmelde-Rückfrage in `SignedInApp` wird eingewickelt.
2. **Bereichswechsel ohne Animation:** Reiter sind keine Ebenen.
   - Warum: Das Gleiten soll nur „tiefer hinein / wieder heraus“ bedeuten.
   - Auswirkung: `selectArea` in `SignedInApp` bleibt unverändert.
3. **Browser-API statt Bibliothek und statt Reacts `<ViewTransition>`:** Es wird
   `document.startViewTransition({ update, types: [direction] })` verwendet. Im
   `update` steckt `flushSync(action)`.
   - Warum: Die Browser-API ruft `update` erst nach dem Bild der alten Seite auf, also
     einen Frame später. Mit Reacts `startTransition` würde nur `setPage` zurückgestellt,
     die Datenänderung des `OrganizerClient` aber nicht. Der Ordner wäre dann schon weg,
     während die Seite noch auf ihn zeigt. `resolveFoldersAreaPage` meldete daraufhin
     `vanished: 'folder'`, und die App sagte fälschlich „anderswo gelöscht“
     (`src/tasks/ui/FoldersArea.tsx:128`).
   - Auswirkung: Eingewickelt wird immer die **ganze Aktion**, also Seitenwechsel,
     Datenänderung und Ansage zusammen. So bleibt die heutige Reihenfolge erhalten.
4. **Ausdrückliche Richtung je Handler statt Tiefenberechnung:** Es gibt
   `slideForward(action)` und `slideBack(action)`.
   - Warum: `TaskFlow` ist in zwei Bereiche eingebettet und hat eigene Schritte. Eine
     Tiefe über alle Komponenten hinweg wäre aufwendiger als die Angabe am Aufruf.
   - Auswirkung: Was nicht eingewickelt ist, animiert auch nicht. Tippen, Filter und
     Reiter brauchen deshalb keine Sonderbehandlung. Eingewickelt wird nur am
     **Einstieg** eines Klicks, nie verschachtelt. Beispiel: `TaskFlow` wickelt seinen
     Handler ein, der `onLeave` aufruft, während `leaveTask` in den Bereichen
     uneingewickelt bleibt.
5. **Feature-Erkennung über `ViewTransition.prototype.types`:** Gleiten gibt es nur,
   wenn die View-Transition-Typen verfügbar sind (Safari 18.2+, Chrome 125+).
   - Warum: Safari 18.0 und 18.1 kennen `startViewTransition`, aber nicht die
     Options-Form. Dort würde `update` nicht ausgeführt und die Seite nicht wechseln.
   - Auswirkung: Ältere Browser wechseln sofort ohne Animation.
6. **Bewegung reduzieren in JS prüfen:** Ist `matchMedia('(prefers-reduced-motion:
   reduce)')` gesetzt, wird gar keine Transition gestartet.
   - Warum: Sonst wären Taps trotzdem 350 ms lang blockiert, nur ohne sichtbare
     Bewegung.
   - Auswirkung: Playwright läuft mit `reducedMotion: 'reduce'`. So warten die
     E2E-Klicks nicht auf Animationen.
7. **Feste Navigationsleiste per `view-transition-name: navigationBar`:** Gibt es sie
   alt und neu, wird sie ohne Animation getauscht. Gibt es sie nur auf einer Seite
   (`:only-child`), bekommt sie dieselbe Gleitbewegung wie die Seite.
   - Auswirkung: Die Änderung betrifft nur CSS. `NavigationBar.tsx` bleibt, wie er ist.
8. **350 ms, `ease-out`, beide Seiten gleichzeitig.**

## Ausgangslage

Es gibt keinen Router. Jeder Bereich hält seine Seite als Zustand und rendert per
`switch`. Ein `setPage` baut die alte Seite sofort ab und die neue auf.

```
SignedInApp (activeArea, confirmingSignOut)              src/SignedInApp.tsx:56
 ├─ UrgentArea   page: overview | task                   src/tasks/ui/UrgentArea.tsx:41
 │    └─ TaskFlow  step: overview | edit | confirm…      src/tasks/ui/TaskFlow.tsx:136
 ├─ FoldersArea  page: overview → folder → list → task   src/tasks/ui/FoldersArea.tsx:96
 │               + create, edit, confirmDeletion, createList,
 │                 editList, confirmListDeletion, createTask
 │    └─ TaskFlow
 └─ SettingsPage → ConfirmationPage „Abmelden?“
```

- Die Navigationsleiste ist `sticky` und wird je Seite über die Prop `navigation`
  mitgerendert. Formulare, Rückfragen und die Aufgabenseite haben stattdessen „Zurück“
  und eine feste `BottomBar`.
- Erscheint eine Seite, setzt sie den Fokus per `useEffect` (`useHeadingFocus`,
  `useFocusOnArrival`, `useFocusAfterRemoval`).
- Aktionen mit Datenänderung wechseln heute **zuerst** die Seite und ändern **danach**
  die Daten, etwa `deleteFolder`, `deleteList` und `TaskFlow.remove`/`complete`. Die
  Seite zeigt dann schon nicht mehr auf das gelöschte Element.

## Zielbild

```
 Klick ──► slideForward(action) / slideBack(action)          src/shared/ui/pageSlide.ts
              │
              ├─ kein ViewTransition.types  ─┐
              ├─ prefers-reduced-motion     ─┼─► action()            (sofort, wie heute)
              │                              ┘
              └─ sonst ─► document.startViewTransition({
                              update: () => flushSync(action),
                              types: ['forward' | 'back'] })
                                   │
                     CSS: html:active-view-transition-type(forward)
                          ::view-transition-old(root)  → slideOutToLeft
                          ::view-transition-new(root)  → slideInFromRight
                          (back: slideOutToRight / slideInFromLeft)
```

Der Ablauf am Beispiel „Ordner öffnen“ und „Zurück“:

```
 forward (Ordner öffnen)              back (Zurück)
 ┌────────┐┌────────┐                ┌────────┐┌────────┐
 │[✓][📁][⚙]│[✓][📁][⚙]│ steht still   │[✓][📁][⚙]│[✓][📁][⚙]│ steht still
 ├────────┤├────────┤                ├────────┤├────────┤
 │ Ordner ││Familie │                │Familie ││ Ordner │
 │  ◄──── ││ ◄────  │                │ ────►  ││ ────►  │
 └────────┘└────────┘                └────────┘└────────┘
   alt raus  neu rein                   alt raus  neu rein
   nach links von rechts                nach rechts von links
```

Für Liste → „Aufgabe anlegen“ gilt: Die Navigationsleiste gibt es nur auf der alten
Seite. Sie gleitet deshalb mit der alten Seite nach links hinaus. Die untere Leiste mit
„Speichern“ kommt mit der neuen Seite von rechts herein.

## Abstraktionen und Wiederverwendung

- `src/shared/ui`
  - `pageSlide.ts` (neu)
    - `SlideDirection` = `'forward' | 'back'`
    - `slidePage(direction, action)`: Feature-Erkennung, Reduced-Motion-Prüfung,
      `startViewTransition` mit `flushSync`
    - `slideForward(action)`, `slideBack(action)`: kurze Formen für die Aufrufer
  - `pageSlide.test.ts` (neu): Verhalten mit und ohne Unterstützung sowie bei
    reduzierter Bewegung
- `src/testSupport`
  - `fakeViewTransitions.ts` (neu): `installFakeViewTransitions()` stellt
    `document.startViewTransition`, `ViewTransition.prototype.types` und
    `window.matchMedia` als Fake bereit. Das Ergebnis hat `directions()` mit den
    protokollierten Richtungen und `finishPendingUpdates()`, das die zurückgehaltenen
    `update`-Callbacks in `act` ausführt. `uninstall()` räumt per `afterEach` auf.
    Ohne Installation bleibt jsdom wie heute, und alle bestehenden Tests laufen
    unverändert sofort.
- `src/index.css`: Keyframes, Regeln für `::view-transition-*` und
  `view-transition-name` auf `.navigationBar`
- `src/tasks/ui/FoldersArea.tsx`, `src/tasks/ui/TaskFlow.tsx`,
  `src/tasks/ui/UrgentArea.tsx`, `src/SignedInApp.tsx`: navigierende Handler einwickeln
- `playwright.config.ts`: `use.reducedMotion: 'reduce'`

Skizze des Helfers:

```ts
import { flushSync } from 'react-dom'

export type SlideDirection = 'forward' | 'back'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

function supportsTypedViewTransitions(): boolean {
  return (
    typeof ViewTransition !== 'undefined' && 'types' in ViewTransition.prototype
  )
}

function prefersReducedMotion(): boolean {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches
}

export function slidePage(direction: SlideDirection, action: () => void) {
  if (!supportsTypedViewTransitions() || prefersReducedMotion()) {
    action()
    return
  }
  document.startViewTransition({
    update: () => flushSync(action),
    types: [direction],
  })
}
```

Die Reihenfolge der Prüfungen ist wichtig. jsdom kennt weder `ViewTransition` noch
`matchMedia`, deshalb muss die Feature-Erkennung zuerst kommen.

Skizze des CSS:

```css
.navigationBar {
  view-transition-name: navigationBar;
}

::view-transition-group(navigationBar) {
  animation: none;
}

::view-transition-old(navigationBar):not(:only-child) {
  display: none;
}

::view-transition-new(navigationBar):not(:only-child) {
  animation: none;
}

::view-transition-old(root),
::view-transition-new(root),
::view-transition-old(navigationBar):only-child,
::view-transition-new(navigationBar):only-child {
  animation-duration: 350ms;
  animation-timing-function: ease-out;
  animation-fill-mode: both;
  mix-blend-mode: normal;
}

html:active-view-transition-type(forward)::view-transition-old(root),
html:active-view-transition-type(forward)::view-transition-old(navigationBar):only-child {
  animation-name: slideOutToLeft;
}
/* new → slideInFromRight; back: slideOutToRight / slideInFromLeft */

@keyframes slideOutToLeft { to { transform: translateX(-100%); } }
@keyframes slideInFromRight { from { transform: translateX(100%); } }
@keyframes slideOutToRight { to { transform: translateX(100%); } }
@keyframes slideInFromLeft { from { transform: translateX(-100%); } }
```

Die Kommentarzeile in der Skizze dient nur dem Plan. Im echten CSS stehen alle vier
Regeln ausgeschrieben, ohne Kommentar.

## Logging und Beobachtbarkeit

Keine Änderungen.

## Umsetzung

### Phase 1: Gleiten auf den Hauptebenen im Ordner-Bereich

Abhängigkeiten: keine

Diese Phase liefert den Helfer, das CSS und die vier Hauptebenen. Danach gleiten
Übersicht ↔ Ordner ↔ Liste ↔ Aufgabe beim Öffnen und bei „Zurück“ bereits sichtbar.

**Aufgaben**:
- [x] `src/testSupport/fakeViewTransitions.ts` anlegen mit `installFakeViewTransitions()`
  und dem Schalter `reducedMotion` (Standard `false`). Der Fake hält jeden
  `update`-Callback zurück, bis `finishPendingUpdates()` aufgerufen wird, und
  protokolliert `types[0]` als Richtung. Mit `uninstall()` werden alle gesetzten Globals
  zurückgenommen.
- [x] Test zuerst: `src/shared/ui/pageSlide.test.ts`
  - `runs the action at once when view transitions are unsupported`
  - `runs the action at once when reduced motion is preferred`, mit installiertem Fake
    und `reducedMotion: true`: keine Richtung protokolliert
  - `slides forward by running the action inside the transition update`: Die Aktion ist
    vor `finishPendingUpdates()` noch nicht gelaufen und danach genau einmal. Die
    protokollierte Richtung ist `forward`.
  - `slides back with the back transition type`
- [x] `src/shared/ui/pageSlide.ts` nach der Skizze umsetzen.
- [x] `src/index.css`: `view-transition-name` auf `.navigationBar`, die Regeln für
  `::view-transition-*` und die vier Keyframes nach der Skizze anlegen.
- [x] Test zuerst: `src/tasks/ui/FoldersAreaSlide.test.tsx` (neu, mit Fake und
  `renderFoldersArea`). Jeder Klick wird mit `finishPendingUpdates()` abgeschlossen.
  - `slides forward from the overview into a folder and back`: `['forward', 'back']`
  - `slides forward from a folder into a list and back`
  - `slides forward from a list into a task and back`
  - `does not slide when switching the status filter`: keine Richtung
  - `keeps focus behavior when sliding`: Nach „Zurück“ aus der Liste hat der
    Listen-Button den Fokus, wie in den bestehenden Fokus-Tests.
- [x] `src/tasks/ui/FoldersArea.tsx`: `onOpenFolder` (Übersicht), `onOpenList`
  (Ordner) und `onOpenTask` (Liste) mit `slideForward` einwickeln, `onBack` von Ordner
  und Liste mit `slideBack`. Die Methoden `showFolder`, `showList` usw. bleiben
  unverändert.
- [x] `src/tasks/ui/TaskFlow.tsx`: `TaskPage.onBack` als
  `() => slideBack(() => onLeave('back'))` umsetzen.
- [x] `playwright.config.ts`: `reducedMotion: 'reduce'` unter `use` ergänzen.

**Automatisierte Verifikation**:
- [x] `pageSlide.test.tsx` und `FoldersAreaSlide.test.tsx` laufen grün.
- [x] `npm run test && npm run test:rules` läuft grün, auch alle bestehenden Tests ohne
  Anpassung.
- [x] `npm run lint` läuft fehlerfrei.
- [x] `npm run build` läuft fehlerfrei, die Typprüfung kennt `ViewTransition`.
- [-] `npm run test:e2e` läuft grün. 23 von 25 sind grün. Die zwei roten Tests
  schlagen auch ohne diese Änderung fehl, siehe Notizen zur Umsetzung.

**Manuelle Verifikation** (iPhone, installierte PWA):
- [x] Ordner öffnen: Die Übersicht gleitet nach links hinaus, der Ordner kommt von
  rechts. Die obere Leiste steht dabei still.
- [x] „Zurück“ aus Liste und Ordner: Die Bewegung läuft genau andersherum.
- [x] Liste → Aufgabe öffnen: Die obere Leiste gleitet mit der Liste hinaus, die
  Aufgabenseite kommt samt unterer Leiste herein.
- [x] Das Tempo mit 350 ms fühlt sich richtig an.
- [x] Mit VoiceOver landet der Fokus nach jedem Wechsel wie bisher auf Überschrift oder
  Zeile.
- [x] Mit „Bewegung reduzieren“ wechselt die Seite sofort.

### Phase 2: Gleiten bei Formularen, Rückfragen, Aufgabenschritten, Dringend und Abmelden

Abhängigkeiten: Phase 1

Diese Phase wickelt alle übrigen navigierenden Handler ein. Wichtig ist dabei, dass
Aktionen mit Datenänderung vollständig im `update` laufen.

**Aufgaben**:
- [x] Test zuerst: `FoldersAreaSlide.test.tsx` erweitern.
  - `slides forward into the create folder form and back on save`, mit `['forward',
    'back']`
  - `slides through folder editing and deletion confirmation`: Stift ist `forward`,
    „Löschen“ ist `forward`, „Abbrechen“ ist `back`, „Löschen“ bestätigen ist `back`.
  - `deletes a folder only once the slide updates the page`: Vor
    `finishPendingUpdates()` sind die Rückfrage und die Daten unverändert. Danach ist
    die Übersicht zu sehen und es wurde `folderDeletedAnnouncement` angesagt, nicht
    `folderDeletedElsewhereAnnouncement`.
  - `deletes a list only once the slide updates the page`, nach demselben Muster mit
    `listDeletedAnnouncement`
  - `slides for list creation, list editing and task creation` (`forward`/`back`)
  - `does not slide while typing a name or choosing a folder`: keine Richtung
- [x] `src/tasks/ui/FoldersArea.tsx`: übrige Handler einwickeln.
  - `slideForward`: `onCreateFolder`, `FolderPage.onEdit`, `onCreateList`,
    `ListPage.onEdit`, `onCreateTask`, `onCompleteTask`, die beiden `onDelete` in
    `edit` und `editList`
  - `slideBack`: alle `onSave` (`createFolder`, `renameFolder`, `createList`,
    `saveList`, `createTask`), alle `onBack` der Formulare, alle `onCancel` und
    `onConfirm` (`deleteFolder`, `deleteList`)
  - Nicht einwickeln: `onNameChange`, `onDraftChange`, `FolderSelect.onChange`,
    `onFilter`, `followMovedTask`, `leaveTask`
- [x] Test zuerst: `src/tasks/ui/TaskFlowSlide.test.tsx` (neu, über
  `renderFoldersArea`).
  - `slides through editing a task`: Stift ist `forward`, „Speichern“ ist `back`,
    „Zurück“ aus dem Formular ist `back`.
  - `slides back to the list after confirming completion`: Erledigen-Knopf der Zeile
    ist `forward`, „Erledigen“ ist `back`. Vor dem Update ist die Aufgabe noch offen,
    danach erledigt mit der gewohnten Ansage.
  - `slides back to the list after confirming deletion`, ohne Ansage
    `taskDeletedElsewhereAnnouncement`
  - `does not slide when reopening a task`
- [x] `src/tasks/ui/TaskFlow.tsx`
  - `slideForward`: `onComplete`, `onEdit`, `onDelete`
  - `slideBack`: im Edit-Schritt `onSave` und `onBack`, `onConfirm` (`complete`,
    `remove`) und `onCancel` in beiden Rückfragen
  - Nicht einwickeln: `onReopen`, `onDraftChange`, `TaskListSelect.onChange`
- [x] Test zuerst: `src/tasks/ui/UrgentArea.test.tsx` erweitern, mit Fake.
  `slides forward into an urgent task and back`: Aufgabe öffnen ist `forward`,
  „Zurück“ ist `back`. Erledigen-Knopf ist `forward`, Bestätigen ist `back`.
- [x] `src/tasks/ui/UrgentArea.tsx`: `onOpenTask` und `onCompleteTask` mit
  `slideForward` einwickeln.
- [x] Test zuerst: `src/App.test.tsx` erweitern, mit Fake.
  `slides into the sign out confirmation and back on cancel`: `['forward', 'back']`.
  Bereichswechsel über die Leiste protokolliert keine Richtung.
- [x] `src/SignedInApp.tsx`: `onRequestSignOut` mit `slideForward` und `onCancel` mit
  `slideBack` einwickeln. `onConfirm` (Abmelden) und `selectArea` bleiben
  uneingewickelt.

**Automatisierte Verifikation**:
- [x] `FoldersAreaSlide.test.tsx`, `TaskFlowSlide.test.tsx`, `UrgentArea.test.tsx` und
  `App.test.tsx` laufen grün.
- [x] `npm run test && npm run test:rules` läuft grün.
- [x] `npm run lint` läuft fehlerfrei.
- [x] `npm run build` läuft fehlerfrei.
- [-] `npm run test:e2e` läuft grün. 23 von 25 sind grün. Es sind dieselben zwei
  Tests rot wie vor der Änderung.

**Manuelle Verifikation** (iPhone, installierte PWA):
- [x] `+` und Stift gleiten von rechts herein. Speichern und Zurück gleiten von links
  zurück, die untere Leiste mit „Speichern“ gleitet mit.
- [x] Beim Tippen in Formularen und beim Filterwechsel bewegt sich nichts.
- [x] Ordner löschen, Liste löschen, Aufgabe löschen und erledigen: Es wird nur die
  eigene Ansage gesprochen, keine „anderswo gelöscht“-Ansage.
- [x] Dringend → Aufgabe → Zurück gleitet. Der Wechsel zwischen den Reitern oben
  gleitet nicht.
- [x] Einstellungen → Abmelden → Abbrechen gleitet.

### Phase 3: Gleiten beim Filter- und Bereichswechsel

Abhängigkeiten: Phase 2

Nachtrag vom 05.11.2026, nachdem der Nutzer Phase 1 und 2 ausprobiert hat. Er hat zwei
Wünsche geändert:

- **Filter „offen/erledigt“:** Nur der Bereich unter den Filterknöpfen gleitet, also die
  Listen auf der Ordner-Seite und die Aufgaben auf der Listen-Seite. Überschrift,
  Filterknöpfe und obere Leiste stehen still. Die Richtung folgt der Lage der Knöpfe:
  Bei offen → erledigt gleitet die alte Liste nach links und die erledigten kommen von
  rechts, umgekehrt andersherum. Ein Klick auf den bereits gewählten Filter gleitet
  nicht. Dauer und Kurve sind wie bei den Seiten.
- **Bereichswechsel über die obere Leiste:** Er gleitet jetzt doch, und zwar nach der
  Reihenfolge der Knöpfe Dringend → Ordner → Einstellungen. Bei einem Wechsel nach
  rechts kommt die neue Seite von rechts, nach links von links. Die Leiste steht still.
  Ein Klick auf den aktuellen Bereich (zurück zu seiner Startseite) gleitet nicht.
  Damit ersetzt diese Phase Entscheidung 2 und die beiden Punkte „Filter“ und
  „Bereichswechsel“ unter „Ohne Animation bleiben“.

Entscheidungen:

1. **Eigene Transition-Typen für den Filter:** `itemsForward` und `itemsBack`. Bei
   diesen Typen bekommt `.filteredItems` den Namen `filteredItems` und gleitet, während
   `root` ohne Animation getauscht wird.
   - Warum: Der Name darf nur während eines Filterwechsels gesetzt sein. Sonst würde der
     Bereich beim Seitenwechsel als eigenes Element überblendet, statt mit der Seite zu
     gleiten.
   - Auswirkung: Die Regel lautet
     `html:active-view-transition-type(itemsForward, itemsBack) .filteredItems { view-transition-name: filteredItems }`.
2. **Richtung aus Positionen:** `directionBetween(from, to)` in `pageSlide.ts` liefert
   `'forward'`, `'back'` oder `null` bei gleicher Position. Positionen sind die
   Reihenfolge `STATUS_FILTER_ORDER` (`['open', 'completed']`) und die Reihenfolge der
   Bereiche in `areasWithUrgentCount`.
3. **Umschlag `.filteredItems`:** Ein `div` um Liste und Leertext in `FolderPage` und
   `ListPage`.

```
 offen → erledigt (Listen-Seite)
 ┌──────────────────────┐
 │ [✓]  [📁]  [⚙]       │  steht still
 │ Haushalt      [/][+] │  steht still
 │ | offen || erledigt | │  steht still (Zahlen wechseln sofort)
 │ ◄── Aufgaben ── ◄──  │  gleitet: offene raus nach links, erledigte von rechts
 └──────────────────────┘
```

**Aufgaben**:
- [x] Test zuerst: `src/shared/ui/pageSlide.test.tsx` erweitern.
  - `tells the direction between two positions` mit `forward`, `back` und `null`
  - `slides the items with their own transition type`: `slideItems('forward', …)`
    protokolliert `itemsForward`, `slideItems('back', …)` protokolliert `itemsBack`.
- [x] `src/shared/ui/pageSlide.ts`: `directionBetween` und `slideItems` ergänzen.
- [x] `src/index.css`: Name nur bei `itemsForward`/`itemsBack` setzen, `root` bei
  diesen Typen ohne Animation, `filteredItems` mit denselben Keyframes wie die Seiten.
- [x] Test zuerst: `src/tasks/ui/FoldersAreaSlide.test.tsx`. Der Test
  `does not slide when switching the status filter` wird ersetzt durch:
  - `slides the lists of a folder sideways when switching the status filter`:
    `['forward', 'itemsForward', 'itemsBack']`
  - `slides the tasks of a list sideways when switching the status filter`
  - `does not slide when choosing the filter already shown`
- [x] `src/tasks/ui/foldersAreaPage.ts`: `STATUS_FILTER_ORDER` ergänzen.
- [x] `src/tasks/ui/FoldersArea.tsx`: `onFilter` von Ordner- und Listen-Seite über
  `switchFilter(from, to, action)` laufen lassen.
- [x] `src/tasks/ui/FolderPage.tsx` und `src/tasks/ui/ListPage.tsx`: Umschlag
  `<div className="filteredItems">` um Liste und Leertext.
- [x] Test zuerst: `src/App.test.tsx`. Der Test `does not slide when switching areas`
  wird ersetzt durch:
  - `slides between the areas in the order of their buttons`: Dringend → Ordner →
    Einstellungen → Dringend ergibt `['forward', 'forward', 'back']`.
  - `does not slide when choosing the area already shown`
- [x] `src/SignedInApp.tsx`: `selectArea` gleitet nach `directionBetween` der Positionen
  in `areasWithUrgentCount`.

**Automatisierte Verifikation**:
- [x] `pageSlide.test.tsx`, `FoldersAreaSlide.test.tsx` und `App.test.tsx` laufen grün.
- [x] `npm run test && npm run test:rules` läuft grün.
- [x] `npm run lint` läuft fehlerfrei.
- [x] `npm run build` läuft fehlerfrei.

**Manuelle Verifikation** (iPhone, installierte PWA):
- [x] Filter offen → erledigt: Nur die Listen bzw. Aufgaben gleiten, erledigte kommen
  von rechts. Zurück auf offen läuft andersherum.
- [x] Dringend → Ordner → Einstellungen gleitet nach rechts, zurück nach links. Die
  obere Leiste steht still.

## Notizen zur Umsetzung

- `pageSlide.test.ts` heißt `pageSlide.test.tsx`. Nur das Vitest-Projekt `ui`
  (`*.test.tsx`) läuft in jsdom und hat damit `document` und `window`.
- `npm run test:e2e`: `lists.spec.ts` „moves a list to another folder“ und
  `urgent.spec.ts` „completes an urgent task on the urgent page and in its list“
  schlagen auch auf dem Stand vor MUL-013 (`9956052`) fehl. Gegenprobe per `git stash`
  am 05.11.2026. Beide sind als Bug in `docs/notes.txt` eingetragen.
- Phase 3: Der bestehende Test `does not slide when reopening a task` öffnet den Filter
  „erledigt“ und protokolliert jetzt zusätzlich `itemsForward`.
- Für `test:rules` und `test:e2e` braucht es Java im PATH (lokal über mise,
  `corretto-21`).

## Verweise

- MDN `Document.startViewTransition()`:
  https://developer.mozilla.org/docs/Web/API/Document/startViewTransition
- MDN `:active-view-transition-type()`:
  https://developer.mozilla.org/docs/Web/CSS/:active-view-transition-type
- MDN `prefers-reduced-motion`:
  https://developer.mozilla.org/docs/Web/CSS/@media/prefers-reduced-motion
- Playwright `reducedMotion`:
  https://playwright.dev/docs/api/class-testoptions#test-options-reduced-motion
- Verwandte Pläne: `docs/agents/plans/2026-10-10-ordner.md`,
  `docs/agents/plans/2026-10-10-aufgaben.md`
