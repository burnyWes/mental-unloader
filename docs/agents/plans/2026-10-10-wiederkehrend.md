---
date: 2026-10-10T15:07:37+00:00
git_commit: 80438bca477fada5f2a71493f56f32c3deebda22
branch: main
story: MUL-008
topic: "Wiederkehrende Aufgaben"
tags: [plan, tasks, domain, calendarDay, firestore, taskform, taskrow, taskpage, focus]
status: done
---

# PLAN: MUL-008 — Wiederkehrende Aufgaben

Aufgaben mit 📅 Stichtag können wiederkehren (wöchentlich bis jährlich). Beim Erledigen
wandert der Stichtag weiter, die Aufgabe bleibt offen, und ihre Erledigungen werden als
Verlauf gesammelt. Grundlage sind die Entscheidungen 11 bis 18 und 23 des Gesamtplans
`docs/agents/plans/2026-10-08-gesamtplan.md` und die Klärungen vom 10.10.2026.

## Akzeptanzkriterien

- Bei 📅 Stichtag erscheint unter „Dringend ab“ der Schalter **„🔁 Wiederkehrend“** im
  Checkbox-Look, anfangs aus. Ist er angehakt, folgt die Auswahl **„Rhythmus“**
  (wöchentlich, monatlich, vierteljährlich, halbjährlich, jährlich), voreingestellt auf
  **monatlich**. Bei 🔥 und ☕ sind beide ausgeblendet.
- Eine offene wiederkehrende Aufgabe zeigt in der Zeile `📅 15.10. 🔁`. VoiceOver liest
  „Müll rausbringen, Stichtag 15. Oktober, monatlich“. Bei Überfälligem steht der Rhythmus
  hinter „überfällig seit …“.
- Die Übersicht zeigt „Wiederholung 🔁 monatlich“.
- Erledigen fragt „Müll rausbringen erledigen?“ und erklärt „Der nächste Stichtag ist der
  22. Oktober.“ (in einem anderen Jahr mit Jahreszahl).
- Der nächste Stichtag rückt vom **alten** Stichtag aus um mindestens einen Rhythmus vor,
  danach so lange weiter, bis er **nach heute** liegt. Der Anker-Tag bleibt dabei erhalten:
  31.01. → 28.02. → 31.03., 29.02.2028 jährlich → 28.02.2029 → … → 29.02.2032.
- Nach dem Erledigen bleibt die Aufgabe unter „offen“ an ihrem neuen Platz. Der Fokus
  liegt auf der Zeile, die jetzt an der alten Stelle steht, ohne andere Zeilen auf der
  Überschrift. Die Ansage lautet „Müll rausbringen erledigt, nächster Stichtag
  22. Oktober.“. Das gilt in der Liste und auf der Dringend-Seite. Erledigt man aus dem
  Filter „erledigt“ heraus, geht es dorthin zurück, und der Fokus liegt auf der Aufgabe.
- Unter „erledigt“ steht eine wiederkehrende Aufgabe nach der ersten Erledigung genau
  einmal: sichtbar „3× erledigt, zuletzt 10.10.“, gesprochen „3 mal erledigt, zuletzt am
  10. Oktober“. Die Filterzähler zählen Einträge, also zählt die Aufgabe in beiden
  Filtern je einmal.
- Die Übersicht zeigt „Verlauf 3× erledigt“ und darunter alle Erledigungen als Liste, die
  neueste zuerst, immer mit Jahr. Bei wiederkehrenden Aufgaben gibt es **nie** ↺.
- Schaltet man die Wiederholung ab (Haken weg oder Wechsel auf 🔥/☕), wird der Verlauf
  geleert, und die Aufgabe bleibt offen. Wird eine erledigte normale Aufgabe
  wiederkehrend, ist sie offen und zeigt „1× erledigt“.
- Bleibt der Stichtag beim Bearbeiten unverändert, bleibt auch der Anker-Tag erhalten.
  Ein geänderter Stichtag wird zum neuen Anker.
- Alles übersteht ein Neuladen (Firestore-Emulator), und axe meldet keine Verstöße.

## Wesentliche Entscheidungen und Abwägungen

1. **Die Wiederholung gehört zur Stichtag-Fälligkeit:**
   `{ kind: 'deadline'; deadline; urgentFrom; repetition: Repetition | null }` mit
   `Repetition = { rhythm: RepeatRhythm; anchorDay: number }`.
   - Warum: Die Regel „nur bei 📅“ steckt dann im Typ selbst. Eine 🔥- oder ☕-Aufgabe kann
     gar nicht wiederkehren (Gesamtplan, Entscheidung 8).
   - Auswirkung: Firestore speichert die neuen Felder `repeat` (Rhythmus) und `anchorDay`.
     Gelesen wird tolerant: Ein unbekannter Rhythmus bedeutet keine Wiederholung, ein
     fehlender oder ungültiger Anker den Tag des Stichtags.
2. **Der Anker ist der Tag im Monat (1–31), nicht ein ganzes Datum:**
   `addMonthsOnAnchor(day, months, anchorDay)` setzt den Tag auf
   `min(anchorDay, daysInMonth)`. Wöchentlich ignoriert den Anker.
   - Warum: Mehr braucht man für 31.01. → 28.02. → 31.03. und für den 29.02. bei
     jährlich nicht.
3. **Offen und erledigt werden getrennt:** `isOpen(task)` (wiederkehrend oder ohne
   Erledigung) und `hasCompletions(task)` ersetzen `isCompleted`. Dazu kommt
   `isRecurring(task)`.
   - Warum: Eine wiederkehrende Aufgabe steht in beiden Filtern (Gesamtplan,
     Entscheidung 13). Der Aufgaben-Plan (MUL-005, Entscheidung 9) hat genau diese
     Stelle dafür vorgesehen.
   - Auswirkung: `openTasksInOrder`, `completedTasksInOrder`, `openTaskSummaryOfList`,
     `urgentTasksOf` (über `openTasksInOrder`), `resolveTaskFlowStep` („wurde schon
     erledigt“ nur bei `!isOpen`) und `filterOf` ziehen nach. `filterOf(task, cameFrom)`
     gibt bei wiederkehrenden Aufgaben `cameFrom` zurück.
4. **Die Domäne rechnet den nächsten Stichtag:**
   `nextDeadlineAfter(deadline, repetition, today)`.
   - Auswirkung: Der Port wird zu `completeTask(id, at, nextDeadline: CalendarDay | null)`.
     Firestore schreibt `completions: arrayUnion(at)` und gegebenenfalls `deadline` in
     **einem** `updateDoc`. Erledigen zwei Geräte gleichzeitig, rechnen beide vom selben
     alten Stichtag aus. Das Ergebnis ist derselbe Stichtag mit zwei Einträgen im Verlauf.
5. **Der Verlauf wird über den Port geleert:**
   `changeTask(id, content, listId, completionsReset: boolean)`. Ob das nötig ist,
   entscheidet die Domänenfunktion `endsRepetition(previous: Due, next: Due)`.
   - Warum: Das Leeren ist eine fachliche Folge der Änderung. `completions: []` gibt es
     schon bei `reopenTask`.
6. **Der Anker bleibt beim Bearbeiten erhalten:** `dueAfterChange` übernimmt den alten
   `anchorDay`, wenn die vorige Fälligkeit wiederkehrend war, der Stichtag gleich bleibt
   **und** der Anker noch zum Stichtag passt
   (`min(anchorDay, daysInMonth) === dayOfMonthOf(deadline)`). Sonst gilt der Tag des
   gewählten Stichtags.
   - Warum: Eine Aufgabe auf 28.02. mit Anker 31 behielte ihren Anker sonst nicht, wenn
     man nur den Namen korrigiert. Das ist dasselbe Muster wie `urgentSince` in MUL-005
     (Entscheidung 8). Die Passprüfung verhindert einen veralteten Anker. Wöchentlich
     ignoriert den Anker, also stünde nach dem Wechsel von wöchentlich (Anker 3,
     Stichtag 24.10.) auf monatlich sonst der 03.11. statt des 24.11. an.
7. **Neuer Fokuszustand `followingPlace`:**
   `{ kind: 'followingPlace'; at: number; completedId: TaskId }` in `ListPageFocus` (und
   damit in `UrgentPageFocus`). Gesucht wird die Zeile an Position `at` in der
   Reihenfolge **ohne** `completedId`, ausgeblendet wird dabei nichts.
   - Warum: Die Aufgabe bleibt sichtbar. Weil sie beim Suchen nicht zählt, landet der
     Fokus auf der nachrückenden Zeile, egal ob der Firestore-Snapshot vor oder nach dem
     Fokussieren eintrifft. `followingTask` mit seinem Ausblenden bleibt für normale
     Aufgaben unverändert.
   - Auswirkung: `FoldersArea.leaveTask` und `focusAfterLeaving` wählen bei `completed`
     und wiederkehrender Aufgabe `followingPlace`.
8. **Ein zweites Erledigen wird nicht abgefangen.** Der Bestätigungstext rechnet den
   nächsten Stichtag live. Erledigt ein anderes Gerät die Aufgabe gleichzeitig, springt
   das genannte Datum weiter, und ein Bestätigen verschiebt erneut.
9. **Kein Abgleich von Vorlauf und Rhythmus.** Wöchentlich mit „1 Jahr vorher“ ist
   erlaubt, die Aufgabe ist dann dauerhaft dringend.
10. **Keine Regeländerung.** `firestore.rules` prüft keine Felder. Die neuen Werte
    sichert der tolerante Leser ab.
11. **Der Verlauf wird nicht gekürzt.** Die Übersicht zeigt alle Einträge.
12. **Erledigen aus dem Filter „erledigt“:** Eine wiederkehrende Aufgabe lässt sich auch
    aus der Erledigt-Ansicht über die Übersicht erledigen. Danach geht es zurück in
    **denselben Filter**, und der Fokus liegt auf ihrem Namen
    (`returningTask { id, button: 'open' }`). Die Zeile bleibt sichtbar und rückt als
    zuletzt erledigt nach oben. `followingPlace` gilt nur, wenn man aus „offen“ kam.

## Ausgangslage

```
Task ─┬─ due: urgent{since} | deadline{deadline, urgentFrom} | someday
      └─ completions: number[]   erledigt ⇔ completions.length > 0   (task.ts:116)

TaskFlow.complete ─► organizer.completeTask(id, at) ─► updateDoc arrayUnion(at)
FoldersArea.leaveTask('completed') ─► Fokus followingTask{removedAt, removedId}
                                      └─ ListPage blendet removedId aus (useTaskRowFocus.ts:34)
```

- `task.ts:98-105`: `isCompleted`, `lastCompletion`.
- `taskOrder.ts:42-48`: offen/erledigt über `isCompleted`.
- `organizer.ts:59-72`: `openTaskSummaryOfList` über `isCompleted`.
- `foldersAreaPage.ts`: `TaskDraft`, `emptyTaskDraft`, `dueChoiceOf`, `filterOf`,
  `ListPageFocus`.
- `taskFlowStep.ts:56`: Rückfall „wurde schon erledigt“.
- `TaskFlow.tsx:48-66` `deadlineDraftOf`/`draftOf`, `:104-123` `save`/`complete`, `:192-200`
  Bestätigung.
- `FoldersArea.tsx:242-279`: `followingTask`, `leaveTask`.
- `urgentAreaPage.ts:75-108`: `focusAfterLeaving`.
- `useTaskRowFocus.ts`, `shared/ui/useFocusAfterRemoval.ts`: Fokuslogik der Zeilen.
- `TaskRow.tsx`, `TaskPage.tsx`, `TaskFormPage.tsx`: Zeile, Übersicht, Formular.
- `firestoreOrganizerClient.ts`: `toDeadlineDue`, `storedDueFields`, `removedDueFields`,
  `completeTask`, `changeTask`. `inMemoryOrganizerClient.ts:89-102` ist der Fake.
- `calendarDay.ts:108`: `subtractMonths` kürzt schon auf das Monatsende.

## Zielbild

**Formular** (Stichtag gewählt, Wiederkehrend angehakt):

```
Fälligkeit
 🔥 Dringend   [ ]
 📅 Stichtag   [✓]
 ☕ Irgendwann [ ]

Stichtag
 | ▲|| ▲ || ▲  |
 |15||Okt||2026|
 | ▼|| ▼ || ▼  |

Dringend ab
 |1 Woche vorher      ▾|

 🔁 Wiederkehrend  [✓]

Rhythmus
 |monatlich           ▾|

        |💾 Speichern|
```

**Zeilen:**

```
offen                               erledigt
╭──────────────────┬─────╮          ╭────────────────────────╮
│ Müll rausbringen │  ✓  │          │ Müll rausbringen       │
│ 📅 15.10. 🔁     │     │          │ 3× erledigt, zuletzt   │
╰──────────────────┴─────╯          │ 10.10.                 │
„Müll rausbringen, Stichtag         ╰────────────────────────╯
 15. Oktober, monatlich“            „Müll rausbringen, 3 mal erledigt,
                                     zuletzt am 10. Oktober“
```

**Übersicht vorher → nachher:**

```
vorher                               nachher (wiederkehrend)
|‹ Zurück|                           |‹ Zurück|
Müll rausbringen                     Müll rausbringen
Fälligkeit  📅 Stichtag 15. Oktober 2026 Fälligkeit   📅 Stichtag 22. Oktober 2026
Dringend ab 1 Woche vorher           Dringend ab  1 Woche vorher
Liste       Familie › Haushalt       Wiederholung 🔁 wöchentlich
Erledigt    10. Oktober              Liste        Familie › Haushalt
                                     Verlauf      3× erledigt
   | ✓/↺ || ✎ || 🗑 |                              • 10. Oktober 2026
                                                  • 3. Oktober 2026
                                                  • 26. September 2026

                                        | ✓ || ✎ || 🗑 |
```

Bei normalen Aufgaben bleibt die Übersicht wie heute.

**Bestätigung:**

```
|‹ Zurück|
Müll rausbringen erledigen?

Der nächste Stichtag ist der 22. Oktober.

      |Erledigen||Abbrechen|
```

**Fokus nach dem Erledigen** (wöchentlich, 15.10. → 22.10.):

```
vorher                         nachher
1  Müll rausbringen  15.10. ✓  1  Blumen gießen      18.10. ✓  ◄ Fokus (at = 0 ohne Müll)
2  Blumen gießen     18.10. ✓  2  Müll rausbringen   22.10. ✓
3  Steuer            30.10. ✓  3  Steuer             30.10. ✓
```

**Ablauf:**

```
TaskFlow.complete
  ├─ next = nextDeadlineOf(task, today)        (Domäne, null bei normalen Aufgaben)
  ├─ onLeave('completed')                       → followingPlace bzw. followingTask
  ├─ organizer.completeTask(id, at, next)       → updateDoc {completions: arrayUnion(at),
  │                                                         deadline: next}
  └─ announce(recurringTaskCompletedAnnouncement | taskCompletedAnnouncement)
```

## Abstraktionen und Wiederverwendung

- `src/tasks/domain`
  - `calendarDay.ts`: neu `addMonthsOnAnchor(day, months, anchorDay)` und
    `dayOfMonthOf(day)`. `withDayCutToMonth` wird wiederverwendet.
  - `repetition.ts` (neu):
    - `REPEAT_RHYTHMS`, `RepeatRhythm`, `DEFAULT_REPEAT_RHYTHM = 'monthly'`,
      `isRepeatRhythm`
    - `Repetition = { rhythm; anchorDay }`, `repetitionStartingOn(deadline, rhythm)`
    - `nextDeadlineAfter(deadline, repetition, today)`
  - `task.ts`:
    - `Due` deadline um `repetition` erweitert
    - `DueChoice` um `repeats: boolean` und `rhythm` erweitert
    - `dueAfterChange` mit Anker-Erhalt
    - neu `isRecurring`, `isOpen`, `hasCompletions` (ersetzt `isCompleted`),
      `completionsNewestFirst`, `nextDeadlineOf(task, today)`,
      `endsRepetition(previous, next)`
  - `taskOrder.ts`, `organizer.ts`: nutzen `isOpen` und `hasCompletions`.
  - `announcements.ts`:
    - `REPEAT_RHYTHM_LABELS` (wöchentlich …)
    - `recurringTaskCompletionExplanation(next, today)`
    - `recurringTaskCompletedAnnouncement(name, next, today)`
    - `completionCountLabel(count)` („3 mal erledigt“), `shortCompletionCountOf(count)`
      („3× erledigt“)
    - `recurringCompletedLabel(count, lastAt)` für die gesprochene Zeile
- `src/tasks/api`
  - `organizerClient.ts`: `completeTask(id, at, nextDeadline)`,
    `changeTask(id, content, listId, completionsReset)`.
  - `firestoreOrganizerClient.ts`, `inMemoryOrganizerClient.ts`: Felder `repeat` und
    `anchorDay`, tolerantes Lesen, neue Signaturen.
- `src/tasks/ui`
  - `RepeatIcon.tsx` (neu): 🔁 als SVG wie `CalendarIcon`, `aria-hidden`.
  - `RepeatFields.tsx` (neu): Schalter „Wiederkehrend“ (`input type="checkbox"
    className="checkboxLook"`, Aufbau wie die Fälligkeits-Labels) und
    `<select id="repeatRhythm">` „Rhythmus“, Aufbau wie `UrgencyLeadSelect`.
  - `foldersAreaPage.ts`:
    - `TaskDraft` um `repeats` und `rhythm` erweitert
    - `emptyTaskDraft`, `dueChoiceOf` angepasst
    - `filterOf(task, cameFrom)`
    - `ListPageFocus` um `followingPlace` erweitert
  - `TaskFormPage.tsx`: `RepeatFields` unter `UrgencyLeadSelect`.
  - `TaskFlow.tsx`: `draftOf` mit Wiederholung, `save` mit `completionsReset`, `complete`
    mit `nextDeadlineOf`, Bestätigungstext je nach Art der Aufgabe.
  - `taskFlowStep.ts`: Rückfall nur bei `!isOpen`.
  - `TaskRow.tsx`:
    - 🔁 und gesprochener Rhythmus in `DeadlineTaskName`
    - Erledigt-Zeile wiederkehrender Aufgaben über `RecurringCompletedTaskName`
    - Die Wahl zwischen offener und erledigter Darstellung trifft künftig der Aufrufer
      über die Prop `shownAs: TaskFilterKind`, weil eine wiederkehrende Aufgabe in beiden
      Filtern erscheint. `ListPage` gibt `filter` weiter, `UrgentPage` immer `'open'`.
  - `TaskPage.tsx`: Zeilen „Wiederholung“ und „Verlauf“, nie ↺ bei wiederkehrenden
    Aufgaben.
  - `useTaskRowFocus.ts`: `focusKeysOf(shownIds, focus)` lässt bei `followingPlace` die
    `completedId` weg. `useFocusAfterRemoval` bekommt diese Schlüssel und `at` als
    `removedBeforeMount`. `withoutRemovedTask` bleibt nur für `followingTask`.
  - `FoldersArea.tsx`: `leaveTask('completed')` wählt bei wiederkehrenden Aufgaben
    `followingPlace`. `filterOf` bekommt den bisherigen Filter.
  - `urgentAreaPage.ts`: `focusAfterLeaving('completed')` ebenso.
- `e2e`
  - `organizer.ts`: Hilfen `createRecurringTask` und `recurringRowName`.
  - `recurring.spec.ts` (neu).

## Logging und Beobachtbarkeit

Keine Änderungen. Schreibfehler laufen wie bisher über `onFailure(WRITE_FAILED)`.

## Umsetzung

### Phase 1: Wiederkehrende Aufgabe anlegen und anzeigen

Abhängigkeiten: keine

Eine Aufgabe mit 📅 lässt sich als wiederkehrend speichern und bearbeiten. Zeile und
Übersicht zeigen den Rhythmus, und alles übersteht ein Neuladen. Das Erledigen verhält
sich in dieser Phase noch wie bei normalen Aufgaben.

**Aufgaben**:
- [x] `calendarDay.test.ts` / `calendarDay.ts`: `dayOfMonthOf` und
  `addMonthsOnAnchor(day, months, anchorDay)` test-getrieben.
  - Fälle: 31.01. + 1 mit Anker 31 → 28.02. (29.02. im Schaltjahr), 28.02. + 1 mit Anker
    31 → 31.03., 30.11. + 3 mit Anker 30 → 28.02., 29.02.2028 + 12 mit Anker 29 →
    28.02.2029, Jahreswechsel 15.11. + 3 → 15.02. des Folgejahres.
- [x] `repetition.test.ts` / `repetition.ts`: `REPEAT_RHYTHMS`
  (`weekly`, `monthly`, `quarterly`, `halfYearly`, `yearly`), `isRepeatRhythm`,
  `DEFAULT_REPEAT_RHYTHM`, `repetitionStartingOn(deadline, rhythm)` (Anker = Tag des
  Stichtags).
- [x] `task.test.ts` / `task.ts`:
  - `Due` deadline mit `repetition: Repetition | null`
  - `DueChoice` mit `repeats` und `rhythm`
  - `dueAfterChange`:
    - ohne `repeats` → `repetition: null`
    - mit `repeats` und neuem Stichtag → Anker = Tag des Stichtags
    - mit `repeats`, gleichem Stichtag und vorher wiederkehrend → alter Anker bleibt
      (28.02., Anker 31)
    - Rhythmuswechsel bei gleichem Stichtag → alter Anker bleibt, neuer Rhythmus
    - gleicher Stichtag, aber Anker passt nicht mehr (Anker 3, Stichtag 24.10.) →
      Anker 24
  - `isRecurring` test-getrieben
- [x] Alle `kind: 'deadline'`-Literale in Tests bekommen `repetition: null`:
  - `App.test.tsx:133`
  - `organizer.test.ts:134,205`
  - `task.test.ts:67,120,141`
  - `taskOrder.test.ts:12`
  - `urgency.test.ts:18`
  - `FoldersAreaDeadline.test.tsx:33,192,303,417`
  - `UrgentArea.test.tsx:41`

  Die `TaskDraft`- und `DueChoice`-Literale in `taskFlowStep.test.ts:26` und
  `task.test.ts:73` (`chosen()`) bekommen `repeats` und `rhythm`.
- [x] `FoldersArea.tsx:220` (Anlegen über `dueAfterChange(null, …)`) übernimmt
  `repeats` und `rhythm` über `dueChoiceOf`. Getestet wird das über den Bereichstest
  zum Anlegen.
- [x] `announcements.ts`: `REPEAT_RHYTHM_LABELS` (wöchentlich, monatlich,
  vierteljährlich, halbjährlich, jährlich), Test, dass jeder Rhythmus einen Text hat.
- [x] `organizerClient.ts` bleibt in dieser Phase unverändert. `NewTask` und
  `TaskContent` tragen die Wiederholung über `due`.
- [x] `firestoreOrganizerClient.ts`:
  - `storedDueFields` schreibt `repeat` und `anchorDay`, wenn `repetition` gesetzt ist
  - `removedDueFields` löscht beide mit
  - `toDeadlineDue` liest tolerant: `isRepeatRhythm(stored.repeat)`, sonst `null`;
    `anchorDay` als ganze Zahl 1–31, sonst `dayOfMonthOf(deadline)`
- [x] `foldersAreaPage.ts`:
  - `TaskDraft` um `repeats: boolean` und `rhythm: RepeatRhythm` erweitert
  - `emptyTaskDraft` setzt `repeats: false` und `rhythm: DEFAULT_REPEAT_RHYTHM`
  - `dueChoiceOf` reicht beides durch
- [x] `TaskFlow.tsx`: `deadlineDraftOf` übernimmt `repeats` und `rhythm` aus der Aufgabe,
  sonst gelten die Voreinstellungen.
- [x] `RepeatIcon.tsx`: SVG mit zwei Kreispfeilen im Stil von `CalendarIcon.tsx`.
- [x] `RepeatFields.tsx` mit `TaskFormPage.tsx`: Nur bei `dueKind === 'deadline'` und
  unterhalb von `UrgencyLeadSelect` erscheint der Schalter
  `<label><RepeatIcon/><span>Wiederkehrend</span><input type="checkbox"
  className="checkboxLook"/></label>`. Ist `repeats` gesetzt, folgt
  `<label htmlFor="repeatRhythm">Rhythmus</label><select id="repeatRhythm">`. Die CSS
  der Fälligkeits-Labels in `index.css` wird für den Schalter wiederverwendet.
- [x] `TaskRow.tsx`: In `DeadlineTaskName` (offen und überfällig) zeigt die Detailzeile
  hinter dem Datum `<RepeatIcon/>`. Der versteckte Text bekommt
  `, ${REPEAT_RHYTHM_LABELS[rhythm]}` direkt hinter Stichtag bzw. „überfällig seit …“
  und vor „, dringend“.
- [x] `e2e/organizer.ts`: `recurringRowName(name, spokenDay, rhythmLabel)`.
- [x] `TaskPage.tsx`: Bei `repetition !== null` folgt hinter „Dringend ab“ die Zeile
  `<dt>Wiederholung</dt><dd><RepeatIcon/> monatlich</dd>`.
- [x] `FoldersAreaDeadline.test.tsx` (oder eine neue `FoldersAreaRecurring.test.tsx`
  nach demselben Muster, `foldersAreaHarness.tsx`):
  - Schalter erscheint nur bei 📅, Rhythmus nur bei Haken
  - Voreinstellung monatlich
  - Anlegen speichert `repetition` (Anker = Tag des Stichtags)
  - Zeilenname mit Rhythmus
  - Übersicht zeigt „Wiederholung“
  - Bearbeiten zeigt Haken und Rhythmus vorbelegt
  - Speichern ohne Datumsänderung behält den Anker
  - axe ohne Verstöße auf dem Formular mit Rhythmus
- [x] `e2e/recurring.spec.ts`: „keeps a recurring task after a reload“. Eine
  wiederkehrende Aufgabe wird angelegt, die Seite neu geladen, und Zeilenname sowie
  „Wiederholung“ auf der Übersicht stimmen.

**Automatisierte Verifikation**:
- [x] `npm run test` grün (Unit-, Bereichs- und Architekturtests)
- [x] `npm run test:rules` grün
- [x] `npm run lint` und `npm run build` laufen durch
- [x] `npx playwright test e2e/recurring.spec.ts` grün

### Phase 2: Wiederkehrend erledigen

Abhängigkeiten: Phase 1

Erledigen schiebt den Stichtag weiter, die Aufgabe bleibt offen und sammelt ihren
Verlauf. Der Fokus folgt der Stelle, und Abschalten der Wiederholung leert den Verlauf.

**Aufgaben**:
- [x] `repetition.test.ts` / `repetition.ts`: `nextDeadlineAfter(deadline, repetition,
  today)` test-getrieben. Erst ein Schritt, dann so lange, bis das Ergebnis `> today`
  ist. Monatsschritte rechnen immer vom Anker aus.
  - wöchentlich, vor dem Stichtag erledigt: 15.10. (heute 10.10.) → 22.10.
  - am Stichtag: 10.10. (heute 10.10.) → 17.10.
  - überfällig: 01.10. (heute 20.10.) → 22.10.
  - monatlich mit Anker 31: 31.01. → 28.02. → 31.03.
  - vierteljährlich über den Jahreswechsel: 30.11. → 28.02. bzw. 29.02.
  - halbjährlich: 31.08. → 28.02.
  - jährlich am 29.02.2028 → 28.02.2029, nach vier Jahren wieder 29.02.2032
  - lange überfällig (monatlich, Stichtag vor 14 Monaten) → erster Monatsanker nach
    heute
- [x] `task.test.ts` / `task.ts`:
  - `hasCompletions` (ersetzt `isCompleted`, alle Aufrufer umstellen)
  - `isOpen(task) = isRecurring(task) || !hasCompletions(task)`
  - `completionsNewestFirst(task)`
  - `nextDeadlineOf(task, today): CalendarDay | null`
  - `endsRepetition(previous: Due, next: Due)`: war wiederkehrend und ist es nicht mehr
- [x] `taskOrder.test.ts` / `taskOrder.ts`: `openTasksInOrder` filtert mit `isOpen`,
  `completedTasksInOrder` mit `hasCompletions`. Neu getestet: Eine wiederkehrende
  Aufgabe mit Erledigung steht in beiden.
- [x] `organizer.test.ts` / `organizer.ts`: `openTaskSummaryOfList` mit `isOpen`.
  Getestet wird, dass eine wiederkehrende Aufgabe mit Erledigung als offen zählt. Die
  Dringend-Sicht (`urgentTasksOf`) enthält sie, solange ihr Vorlauf erreicht ist.
- [x] `announcements.test.ts` / `announcements.ts`:
  - `recurringTaskCompletionExplanation(next, today)` → „Der nächste Stichtag ist der
    22. Oktober.“, im anderen Jahr „… der 5. Januar 2027.“
  - `recurringTaskCompletedAnnouncement(name, next, today)` → „Müll rausbringen erledigt,
    nächster Stichtag 22. Oktober.“
  - `recurringCompletedLabel(count, lastAt)` → „3 mal erledigt, zuletzt am 10. Oktober“
    (1 → „1 mal erledigt, …“)
  - `shortCompletionCountOf(count)` → „3× erledigt“
- [x] `organizerClient.ts`:
  - `completeTask(id, at, nextDeadline: CalendarDay | null)`
  - `changeTask(id, content, listId, completionsReset: boolean)`
  - `useOrganizer.ts` reicht beides durch
- [x] `inMemoryOrganizerClient.ts`:
  - `completeTask` setzt bei `nextDeadline` zusätzlich `due.deadline`
  - `changeTask` leert bei `completionsReset` die `completions`
- [x] `firestoreOrganizerClient.ts`:
  - `completeTask` schreibt `{ completions: arrayUnion(at), deadline: nextDeadline }` in
    einem `updateDoc`, `deadline` nur bei `nextDeadline !== null`
  - `changedStoredTask` setzt bei `completionsReset` `completions: []`
- [x] `foldersAreaPage.ts`:
  - `filterOf(task, cameFrom)`: wiederkehrend → `cameFrom`, sonst wie bisher über
    `hasCompletions`
  - `ListPageFocus` um `{ kind: 'followingPlace'; at: number; completedId: TaskId }`
    erweitert
- [x] `useTaskRowFocus.ts`:
  - `focusKeysOf(shownIds, focus)` entfernt bei `followingPlace` die `completedId`
  - `useFocusAfterRemoval(focusKeys, heading, at)`
  - `awaitedButton` gibt für `followingPlace` `null` zurück
  - `withoutRemovedTask` bleibt nur für `followingTask`
  - Test in `urgentAreaPage.test.ts` oder in den Bereichstests: Der Fokus liegt auf der
    nachrückenden Zeile, auch wenn der Snapshot erst nach dem ersten Rendern eintrifft.
    Dafür hält der In-Memory-Fake die Snapshots mit `holdBackSnapshots()` /
    `releaseSnapshots()` zurück (`inMemoryOrganizerClient.ts:12-13`, Muster in
    `FoldersAreaTasks.test.tsx:223`).
- [x] `FoldersArea.tsx`:
  - `leaveTask('completed')` bei `isRecurring(task)` und Filter „offen“:
    `showList(list, folder.id, 'open', { kind: 'followingPlace', at, completedId })`.
    `at` stammt aus `tasksShownIn('open', …)` vor dem Schreiben.
  - Bei Filter „erledigt“ (Entscheidung 12):
    `showList(list, folder.id, 'completed', { kind: 'returningTask', id, button: 'open' })`
  - `back` und `deleted` nutzen `filterOf(task, shownPage.filter)`
- [x] `urgentAreaPage.ts` / `urgentAreaPage.test.ts`: `focusAfterLeaving` bei
  `completed` und wiederkehrender Aufgabe →
  `followingPlace { at: stillShown ? currentPlace : openedAt, completedId }`.
- [x] `taskFlowStep.ts` / `taskFlowStep.test.ts`: Der Rückfall `alreadyCompleted` greift
  nur bei `!isOpen(task)`. Eine wiederkehrende Aufgabe mit Erledigung bleibt auf der
  Bestätigung.
- [x] `TaskFlow.tsx`:
  - `complete` berechnet `next = nextDeadlineOf(task, today)` und ruft
    `completeTask(id, at, next)` auf. Die Ansage kommt bei `next !== null` über
    `recurringTaskCompletedAnnouncement`.
  - Die Bestätigung erklärt bei wiederkehrenden Aufgaben mit
    `recurringTaskCompletionExplanation`.
  - `save` berechnet `completionsReset = endsRepetition(task.due, due)` und übergibt es
    an `changeTask`.
- [x] `TaskRow.tsx`:
  - Neue Prop `shownAs: TaskFilterKind` ersetzt die Weiche über `lastCompletion`
  - Bei `'completed'` und wiederkehrender Aufgabe rendert `RecurringCompletedTaskName`:
    sichtbar `3× erledigt, zuletzt 10.10.` (`aria-hidden`), gesprochen
    `, ${recurringCompletedLabel(count, last)}`
  - `ListPage` übergibt `filter`, `UrgentPage` übergibt `'open'`
- [x] `TaskPage.tsx`: Bei wiederkehrenden Aufgaben
  - entfällt die Zeile „Erledigt“
  - gibt es bei mindestens einer Erledigung `<dt>Verlauf</dt><dd>3× erledigt
    <ul>…</ul></dd>`. Jeder Eintrag aus `completionsNewestFirst` wird mit
    `fullDayOf(calendarDayOf(new Date(at)))` geschrieben („10. Oktober 2026“), es gibt
    keine neue Datumsfunktion.
  - ist der erste Knopf immer ✓ „Erledigen“
- [x] Bereichstests (`FoldersAreaRecurring.test.tsx`, `UrgentArea.test.tsx`):
  - Bestätigung nennt den nächsten Stichtag
  - nach dem Bestätigen: neuer Stichtag in der Zeile, die Aufgabe unter „offen“ an
    neuer Position, Fokus auf der nachrückenden Zeile (bzw. Überschrift, wenn sie die
    einzige ist), Ansage mit nächstem Stichtag
  - Zähler „offen (n)“ und „erledigt (1)“
  - Erledigt-Zeile „3 mal erledigt, zuletzt am …“
  - Übersicht mit Verlauf, neueste zuerst, ohne „Wieder öffnen“
  - Haken bei „Wiederkehrend“ entfernen → Verlauf leer, Aufgabe offen, nicht unter
    „erledigt“
  - Wechsel auf ☕ → ebenso
  - erledigte normale Aufgabe wiederkehrend machen → offen und „1 mal erledigt“
  - Stichtag einer wiederkehrenden Aufgabe mit Verlauf ändern → Verlauf bleibt, neuer
    Anker
  - aus „erledigt“ heraus erledigen → zurück unter „erledigt“, Fokus auf ihrem Namen,
    Zeile ganz oben
  - Dringend-Seite: Erledigen entfernt die Aufgabe, wenn der neue Vorlauf nicht erreicht
    ist, der Fokus liegt auf der nachrückenden Zeile, der Badge sinkt; bei dauerhaft
    dringender Aufgabe (wöchentlich, „1 Monat vorher“) bleibt sie stehen
  - axe ohne Verstöße auf Übersicht mit Verlauf und auf der Erledigt-Ansicht
- [x] `e2e/recurring.spec.ts`: „moves the deadline when a recurring task is completed“.
  Eine wöchentliche Aufgabe wird angelegt und erledigt, die Zeile zeigt den Stichtag eine
  Woche später, und nach einem Neuladen stehen „erledigt (1)“ und der Verlauf auf der
  Übersicht.

**Automatisierte Verifikation**:
- [x] `npm run test` grün (Unit-, Bereichs- und Architekturtests)
- [x] `npm run test:rules` grün
- [x] `npm run lint` und `npm run build` laufen durch
- [x] `npx playwright test` grün (alle E2E-Specs, auch `tasks`, `deadline`, `urgent`)
- [x] `grep -rn "isCompleted" src` liefert keine Treffer mehr

**Manuelle Verifikation**:
- [x] Am iPhone mit VoiceOver eine monatliche Aufgabe anlegen, erledigen und prüfen:
  Bestätigung und Ansage nennen den nächsten Stichtag, der Fokus landet auf der
  nachrückenden Zeile, und der Verlauf wird verständlich vorgelesen.
- [x] Am iPhone prüfen, ob 🔁 in Zeile und Formular gut erkennbar ist und die Zeile
  „3× erledigt, zuletzt …“ nicht umbricht oder abgeschnitten wird.

## Notizen zur Umsetzung

Hier während der Umsetzung Rückmeldungen, Probleme und Entscheidungen festhalten.

- `repetition.ts` hat zusätzlich `isAnchorDay` (tolerantes Lesen des Ankers im
  Firestore-Adapter) und `isAnchoredOn` (Passprüfung aus Entscheidung 6) bekommen, damit
  beide Regeln in der Domäne liegen.
- `task.ts` exportiert `repetitionOf(due)`; `isRecurring` und `endsRepetition` bauen
  darauf auf.
- Die Übersicht spricht „3 mal erledigt“ und zeigt „3× erledigt“ (sichtbar und
  gesprochen getrennt, wie in der Zeile).
- 🔁 ist das Lucide-Motiv „repeat“ (zwei Pfeile im Kreislauf), damit es sich vom
  Einzelpfeil ↺ (`ReopenIcon`) klar unterscheidet.
- Das Sinken des Badges ist über `urgentTasksOf` abgedeckt; der Bereichstest der
  Dringend-Seite prüft das Verschwinden der Zeile.

## Verweise

- Gesamtplan: `docs/agents/plans/2026-10-08-gesamtplan.md` (Entscheidungen 8, 11–18, 23)
- Aufgaben: `docs/agents/plans/2026-10-10-aufgaben.md` (Entscheidungen 8, 9; Fokus
  `followingTask`, Restfall `removedId`)
- Stichtag: `docs/agents/plans/2026-10-10-stichtag.md`
- Dringend-Seite: `docs/agents/plans/2026-10-10-dringend-seite.md` (`focusAfterLeaving`)
