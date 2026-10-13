---
date: 2026-10-13T12:02:50+00:00
git_commit: 38075e477b86aa75a5eec2f631394c84467b9407
branch: main
story: MUL-011
topic: "Icon für die Beschreibung einer Aufgabe"
tags: [plan, tasks, domain, announcements, taskrow, taskform, taskpage]
status: ready
---

# PLAN: MUL-011 — Icon für die Beschreibung einer Aufgabe

Die Beschreibung einer Aufgabe bekommt ein eigenes Icon (Lucide `file-text`, ein Blatt
mit Zeilen). Es steht im Aufgabenformular neben dem Label „Beschreibung“, auf der
Detailseite vor dem Beschreibungstext und in jeder Aufgabenzeile hinter dem Namen, sofern
die Aufgabe eine Beschreibung hat. Grundlage ist die Klärung vom 13.10.2026.

## Akzeptanzkriterien

- Im Aufgabenformular (Anlegen und Bearbeiten) steht links neben dem Label
  „Beschreibung“ das `DescriptionIcon`. Der zugängliche Name des Textfelds bleibt genau
  „Beschreibung“.
- Hat eine Aufgabe eine Beschreibung, steht das Icon in ihrer Zeile direkt hinter dem
  Namen. Das gilt für alle Fälligkeiten (dringend, Stichtag, überfällig, irgendwann),
  für offene und erledigte Aufgaben und auf der Listenseite wie auf der Dringend-Seite.
- Ohne Beschreibung gibt es kein Icon und keine Ansage. Eine Beschreibung aus reinen
  Leerzeichen ist nach dem Speichern leer (`createDescription` kürzt sie schon heute).
- Der Screenreader liest „, mit Beschreibung“ direkt nach dem Namen, also vor Stichtag,
  Rhythmus, „dringend“ oder „erledigt am …“. Beispiel:
  „Müll rausbringen, mit Beschreibung, dringend“.
- Auf der Detailseite steht das Icon vor der Beschreibung. Umbrochene Zeilen beginnen
  bündig unter dem Text, nicht unter dem Icon.
- Die Icons in `.taskRowDetail` bleiben unverändert. Die bestehenden SVG-Zählungen dort
  sind weiter gültig.

## Wesentliche Entscheidungen und Abwägungen

1. **Ort in der Zeile:** Das Icon steht in `.taskRowTitle` hinter dem Namen und nicht in
   der Detailzeile.
   - Warum: „Irgendwann“-Aufgaben haben keine Detailzeile. Am Titel erscheint das Icon
     bei jeder Fälligkeit und jedem Status an derselben Stelle.
   - Auswirkung: Alle fünf Titel-Varianten in `TaskRow` bekommen dieselbe Ergänzung.
     Sie wird als Komponente `DescriptionMark` herausgezogen.
2. **Ansage:** Ein versteckter Text „, mit Beschreibung“ folgt direkt auf den Namen.
   - Warum: Er trägt dieselbe Information wie das sichtbare Icon und steht an derselben
     Stelle. So machen es auch Flamme, Kalender und Wiederholung.
   - Auswirkung: Die zugänglichen Namen von Zeilen mit Beschreibung ändern sich.
     Bestehende Tests, die einen exakten Namen erwarten, werden angepasst.
3. **Fachliche Abfrage:** `hasDescription(task)` kommt in `domain/task.ts` und wird
   test-getrieben entwickelt.
   - Warum: Es ist dasselbe Muster wie bei `isRecurring`, `hasCompletions` und `isOpen`.
     Die Oberfläche fragt dann nicht selbst nach `description !== ''`.
   - Auswirkung: `TaskRow` und `TaskPage` benutzen das Prädikat.
4. **Icon:** Die neue Komponente `src/tasks/ui/DescriptionIcon.tsx` gibt Lucide
   `file-text` im Stil der übrigen Icons wieder.
5. **Auch auf der Dringend-Seite:** Das Icon sitzt in `TaskRow`, die Dringend-Seite
   bekommt es also ohne zusätzlichen Schalter mit.
6. **Detailseite:** `.taskDescription` wird ein Flex-Container mit dem Icon und einem
   Textblock, der `pre-wrap` umbricht.
   - Auswirkung: Der Test auf `textContent` von `.taskDescription` bleibt gültig, denn
     das SVG enthält keinen Text.

## Ausgangslage

```
TaskFormPage.tsx:114     <label htmlFor="description">Beschreibung</label>      (ohne Icon)
TaskPage.tsx:124         <p className="taskDescription">{task.description}</p>  (ohne Icon)
TaskRow.tsx              .taskRowTitle = Name + versteckte Ansage
                         .taskRowDetail = Icons/Datum (aria-hidden), fehlt bei „Irgendwann“
```

Die Titel-Varianten in `TaskRow.tsx`: `UrgentTaskName`, `DeadlineTaskName` (überfällig
und nicht überfällig), der `someday`-Zweig in `OpenTaskName`, `CompletedTaskName` und
`RecurringCompletedTaskName`.

## Zielbild

Aufgabenformular:

```
Vorher                          Nachher
Beschreibung                    📄 Beschreibung
┌──────────────────────┐        ┌──────────────────────┐
│                      │        │                      │
└──────────────────────┘        └──────────────────────┘
```

Aufgabenzeile (Liste und Dringend):

```
Vorher                               Nachher
┌──────────────────────────┬───┐     ┌──────────────────────────┬───┐
│ Müll rausbringen         │ ✓ │     │ Müll rausbringen 📄      │ ✓ │
│ 📅 Mo 13.10. 🔁          │   │     │ 📅 Mo 13.10. 🔁          │   │
└──────────────────────────┴───┘     └──────────────────────────┴───┘
┌──────────────────────────┬───┐     ┌──────────────────────────┬───┐
│ Fenster putzen           │ ✓ │     │ Fenster putzen 📄        │ ✓ │
└──────────────────────────┴───┘     └──────────────────────────┴───┘
Screenreader: „Müll rausbringen, mit Beschreibung, Stichtag Montag, 13. Oktober, wöchentlich“
```

Detailseite:

```
Vorher                          Nachher
← Zurück                        ← Zurück
Müll rausbringen                Müll rausbringen
Gelbe Tonne auch.               📄 Gelbe Tonne auch.
Und die blaue.                     Und die blaue.
Fälligkeit                      Fälligkeit
📅 Stichtag Mo, 13.10.          📅 Stichtag Mo, 13.10.
```

## Abstraktionen und Wiederverwendung

- `src/tasks/domain`
  - `task.ts` – neu `hasDescription(task: Task): boolean`
  - `task.test.ts` – `describe('hasDescription')`
  - `announcements.ts` – neu `export const WITH_DESCRIPTION_LABEL = 'mit Beschreibung'`
  - `announcements.test.ts` – Test für den Text
- `src/tasks/ui`
  - `DescriptionIcon.tsx` – neu, Lucide `file-text`, gleiche SVG-Attribute wie
    `RepeatIcon`
  - `TaskRow.tsx` – neu `DescriptionMark({ task })`, eingebaut in alle Titel-Varianten
  - `TaskFormPage.tsx` – Icon im Label „Beschreibung“
  - `TaskPage.tsx` – Icon und Textblock in `.taskDescription`
  - `FoldersAreaTasks.test.tsx`, `UrgentArea.test.tsx` – neue und angepasste Tests
- `src/index.css` – Icongrösse in `.taskRowTitle`, Flex-Layout für `.taskDescription`,
  Label mit Icon

## Logging und Beobachtbarkeit

Keine Änderungen.

## Umsetzung

Abhängigkeiten: keine

Das Beschreibungs-Icon im Formular, in der Aufgabenzeile und auf der Detailseite,
einschliesslich der Ansage für den Screenreader.

**Aufgaben**:

- [x] Test-getrieben `hasDescription` in `src/tasks/domain/task.ts`. Tests in
  `task.test.ts`: eine leere Beschreibung ergibt `false`, eine nicht leere `true`.
  ```ts
  export function hasDescription(task: Task): boolean {
    return task.description !== ''
  }
  ```
- [x] Test-getrieben `WITH_DESCRIPTION_LABEL = 'mit Beschreibung'` in
  `src/tasks/domain/announcements.ts`, Test in `announcements.test.ts`.
- [x] `src/tasks/ui/DescriptionIcon.tsx` anlegen. Gleicher Rahmen wie `RepeatIcon`
  (`className="buttonIcon"`, `viewBox="0 0 24 24"`, Strich 2, `aria-hidden`,
  `focusable="false"`), Pfade von Lucide `file-text`:
  ```tsx
  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
  <path d="M14 2v4a2 2 0 0 0 2 2h4" />
  <path d="M10 9H8" />
  <path d="M16 13H8" />
  <path d="M16 17H8" />
  ```
- [x] Zuerst die Komponententests für die Zeile in `FoldersAreaTasks.test.tsx` schreiben
  (fehlschlagend):
  - Eine Aufgabe mit Beschreibung zeigt in `.taskRowTitle` genau ein `svg` und heisst
    `Müll rausbringen, mit Beschreibung, dringend`.
  - Eine Aufgabe ohne Beschreibung hat kein `svg` in `.taskRowTitle`, und ihr Name
    enthält kein „mit Beschreibung“.
  - Eine „Irgendwann“-Aufgabe mit Beschreibung heisst `Keller aufräumen, mit
    Beschreibung` und zeigt das Icon.
  - Eine erledigte Aufgabe mit Beschreibung (Filter „erledigt“) heisst
    `…, mit Beschreibung, erledigt am …`.
  - Eine Aufgabe mit Stichtag und Beschreibung: Die SVG-Zahl in `.taskRowDetail` bleibt
    unverändert, und der Name beginnt mit `…, mit Beschreibung, Stichtag`.
- [x] In `TaskRow.tsx` die Komponente `DescriptionMark` einführen. Sie gibt nur bei
  `hasDescription(task)` etwas aus:
  ```tsx
  function DescriptionMark({ task }: { task: Task }) {
    if (!hasDescription(task)) return null
    return (
      <>
        {' '}
        <DescriptionIcon />
        <span className="visuallyHidden">, {WITH_DESCRIPTION_LABEL}</span>
      </>
    )
  }
  ```
  Sie steht in jeder Titel-Variante direkt hinter dem Namen und vor der übrigen
  versteckten Ansage: in `UrgentTaskName` (Prop von `name` auf `task` umstellen), in
  beiden Zweigen von `DeadlineTaskName`, im `someday`-Zweig von `OpenTaskName`, in
  `CompletedTaskName` und in `RecurringCompletedTaskName`.
- [x] Bestehende Tests anpassen, die den exakten Namen einer Zeile mit Beschreibung
  prüfen. Bekannt sind `FoldersAreaTasks.test.tsx:206` und `:507`, beide werden zu
  `'Müll rausbringen, mit Beschreibung, dringend'`. Danach die ganze Testsuite nach
  weiteren Treffern absuchen. `buttonNamedFirst` matcht ohnehin nur den Anfang
  (`^name(,|$)`) und bleibt gültig.
- [x] In `UrgentArea.test.tsx` einen Test ergänzen: Eine dringende Aufgabe mit
  Beschreibung zeigt auf der Dringend-Seite das Icon in `.taskRowTitle`, und ihr Name
  enthält „mit Beschreibung“.
- [x] Test im Formular-Block von `FoldersAreaTasks.test.tsx`: Das Label des Feldes
  „Beschreibung“ enthält ein `svg`. `screen.getByLabelText('Beschreibung')` findet das
  Feld weiterhin (über das bestehende `descriptionField()`).
- [x] In `TaskFormPage.tsx` das Label erweitern:
  ```tsx
  <label htmlFor="description" className="labelWithIcon">
    <DescriptionIcon /> Beschreibung
  </label>
  ```
- [x] Test in „task overview and editing“: Auf der Detailseite enthält
  `.taskDescription` genau ein `svg`. Der bestehende Test auf `textContent`
  (`FoldersAreaTasks.test.tsx:400`) bleibt unverändert grün.
- [x] In `TaskPage.tsx` die Beschreibung umbauen und `hasDescription` benutzen:
  ```tsx
  {hasDescription(task) && (
    <div className="taskDescription">
      <DescriptionIcon />
      <p>{task.description}</p>
    </div>
  )}
  ```
  `white-space: pre-wrap` und `overflow-wrap` wandern auf das innere `p`.
- [x] CSS in `src/index.css`:
  - `.taskRowTitle .buttonIcon` in die bestehende 1em-Regel aufnehmen (neben
    `.taskRowDetail .buttonIcon`).
  - `.labelWithIcon { display: flex; align-items: center; gap: 0.5rem; }`
  - `.taskDescription { display: flex; gap: 0.5rem; align-items: flex-start; }` und
    `.taskDescription p { margin: 0; flex: 1; min-width: 0; white-space: pre-wrap;
    overflow-wrap: anywhere; }`. Das Icon bekommt `flex: none` und eine kleine
    Verschiebung nach unten, damit es auf Höhe der ersten Textzeile steht. Der Abstand
    nach unten bleibt so wie bisher beim `p`.
- [x] Die Barrierefreiheitstests mit axe für Formular, Liste und Detailseite bleiben
  grün.

**Automatisierte Verifikation**:

- [x] `hasDescription`- und `WITH_DESCRIPTION_LABEL`-Tests laufen grün.
- [x] Die neuen Zeilentests (Liste und Dringend), der Formulartest und der Test der
  Detailseite laufen grün.
- [x] Die bestehenden SVG-Zählungen in `FoldersAreaDeadline.test.tsx` und
  `FoldersAreaRecurring.test.tsx` laufen unverändert grün.
- [x] `npm run test && npm run test:rules`
- [x] `npm run lint`
- [x] `npm run build`

**Manuelle Verifikation**:

- [ ] Auf dem Handy: Das Icon sitzt neben „Beschreibung“ im Formular auf einer Linie mit
  dem Text.
- [ ] In einer Liste stehen Aufgaben mit und ohne Beschreibung untereinander. Das Icon
  sitzt hinter dem Namen, auch wenn ein langer Name umbricht. Die Detailzeile ist
  unverändert.
- [ ] Auf der Detailseite mit mehrzeiliger Beschreibung beginnen die Folgezeilen bündig
  unter dem Text. Das Icon steht auf Höhe der ersten Zeile.
- [ ] Hell- und Dunkelmodus: Das Icon hat die Textfarbe.

## Notizen zur Umsetzung

- Der Abstand zwischen Name und Icon in der Zeile entsteht per CSS (`margin-left` an
  `.taskRowTitle .buttonIcon`) statt durch ein Leerzeichen. Ein Leerzeichen hätte den
  zugänglichen Namen zu „Müll rausbringen , mit Beschreibung“ verfälscht.

## Verweise

- Lucide-Icon `file-text`: https://lucide.dev/icons/file-text
- Muster für Icons: `src/tasks/ui/RepeatIcon.tsx`
- Muster für versteckte Ansagen in der Zeile: `src/tasks/ui/TaskRow.tsx`
  (`SpokenRhythm`, `ShownRhythm`)
- Vorheriger Plan: `docs/agents/plans/2026-10-13-listen-filter.md`
