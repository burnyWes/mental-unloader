---
date: 2026-10-13T11:28:58+00:00
git_commit: 3bea6273e618995f0fb284d2336f2b1c07a4211e
branch: main
story: MUL-010
topic: "Offen/erledigt-Filter für Listen"
tags: [plan, tasks, domain, organizer, folderpage, focus, announcements]
status: ready
---

# PLAN: MUL-010 — Offen/erledigt-Filter für Listen

Die Ordnerseite filtert ihre Listen nach offen und erledigt, so wie es die Listenseite
schon mit Aufgaben tut. Eine Liste ist automatisch erledigt, wenn alle ihre Aufgaben
erledigt sind. Sie wird automatisch wieder offen, wenn eine Aufgabe wieder geöffnet wird
oder eine neue hinzukommt. Grundlage ist die Klärung vom 13.10.2026.

MUL-009 ist vergeben (Farb-Feinschliff, entfallen), deshalb trägt dieser Plan MUL-010.

## Akzeptanzkriterien

- Die Ordnerseite zeigt unter der Überschrift die Filterknöpfe `offen (n)` und
  `erledigt (m)`. Die Zähler zählen **Listen**. Kommt man aus der Ordnerübersicht, ist
  „offen“ gewählt.
- Eine Liste ist **erledigt**, wenn sie mindestens eine Aufgabe hat und keine davon offen
  ist. Eine **leere Liste ist offen**. Eine Liste mit einer wiederkehrenden Aufgabe ist
  nie erledigt, denn wiederkehrende Aufgaben bleiben offen.
- Der Status wird nicht gespeichert, sondern aus den Aufgaben abgeleitet. Eine neue
  Aufgabe, eine wieder geöffnete Aufgabe oder eine hineinverschobene offene Aufgabe macht
  die Liste sofort wieder offen, auch wenn das auf einem anderen Gerät geschieht. Löscht
  oder verschiebt man die letzte offene Aufgabe, ist die Liste ohne eigene Ansage
  erledigt.
- Beide Filter sind nach Name sortiert. Ein Listenknopf unter „erledigt“ hat keinen
  Zusatz, denn ohne offene Aufgaben zeigt `ListButton` ohnehin keinen Zähler.
- Leertexte: keine Listen im Ordner → „Noch keine Listen.“, „offen“ leer →
  „Keine offenen Listen.“, „erledigt“ leer → „Noch keine Liste erledigt.“.
- „Zurück“ aus einer Liste führt in den Filter, in den die Liste **jetzt** gehört, und
  der Fokus liegt auf ihrem Knopf.
- Nach dem Anlegen einer Liste ist „offen“ gewählt, und der Fokus liegt wie bisher auf
  der neuen Liste. Nach dem Löschen einer Liste bleibt der Filter gewählt, in dem sie
  stand, und der Fokus folgt der nachrückenden Liste in diesem Filter.
- Wird die **letzte offene Aufgabe** einer Liste erledigt, lautet die Ansage
  „Fenster putzen erledigt. Liste Umzug erledigt.“. Das gilt in der Liste und auf der
  Dringend-Seite. Das Wieder-Öffnen wird nicht angesagt.
- Die Ordnerübersicht bleibt unverändert und zählt weiter alle Listen.
- axe meldet auf der Ordnerseite in beiden Filtern keine Verstöße.

## Wesentliche Entscheidungen und Abwägungen

1. **Der Status wird abgeleitet:** `isListCompleted(organizer, listId)` in
   `src/tasks/domain/organizer.ts`. Es gibt kein Feld in Firestore.
   - Warum: „Automatisch erledigt“ und „automatisch wieder offen“ gelten so ohne
     Synchronisation und ohne Konflikte zwischen Geräten.
   - Auswirkung: Port, Firestore-Adapter, In-Memory-Client und `firestore.rules` bleiben
     unverändert. Es gibt keine Migration.
2. **Eine leere Liste ist offen** (Frage 1).
3. **Wiederkehrende Aufgaben halten die Liste offen** (Frage 2). Die Regel steckt schon
   in `isOpen` (`src/tasks/domain/task.ts:157`).
4. **Es gibt einen gemeinsamen Filtertyp:** `TaskFilterKind` wird zu `StatusFilter`,
   `TaskFilterButtons` zu `StatusFilterButtons`. Listen- und Ordnerseite nutzen beides.
   - Warum: Knöpfe und Optik sind gleich, so gibt es keinen doppelten Code.
   - Auswirkung: Die bestehenden Aufrufer werden nur umbenannt (`foldersAreaPage.ts`,
     `FoldersArea.tsx`, `ListPage.tsx`, `TaskRow.tsx`).
5. **Der Filter steckt im Seitenzustand `'folder'`** (`filter: StatusFilter`). Die
   Unterseiten der Liste tragen keinen Ordnerfilter mit. Beim Rückweg wird der Filter
   über `listFilterOf(organizer, listId)` neu berechnet (Frage 4). Das entspricht
   `filterOf` bei Aufgaben (`src/tasks/ui/foldersAreaPage.ts:163`).
6. **Es gibt einen neuen Fokuszustand `returningList { id }`** in `FolderPageFocus`.
   Er fokussiert den Listenknopf über das vorhandene `useFocusOnArrival`, so wie
   `arrivingList`.
7. **Anlegen und Löschen:** Nach dem Anlegen ist „offen“ gewählt, denn eine neue Liste ist
   leer. Beim Löschen wird der Filter der Liste vor dem Entfernen bestimmt, und
   `followingList.removedAt` zählt die Position **innerhalb dieses Filters**.
8. **Ordner bearbeiten, Liste anderswo gelöscht:** Zurück geht es nach „offen“ mit dem
   Fokus auf der Überschrift. Den Filter durch die Ordner-Bearbeitung durchzureichen
   lohnt nicht.
9. **Die Ansage entscheidet die Domäne:** `completesList(organizer, task)` ist wahr, wenn
   die Aufgabe offen ist, nicht wiederkehrt und die einzige offene ihrer Liste ist.
   `TaskFlow.complete` prüft das **vor** `organizer.completeTask`, weil Firestore den
   neuen Stand erst später liefert. Danach hängt es `listCompletedAnnouncement(name)` an
   (Frage 5).
10. **Die Ordnerübersicht bleibt unverändert** (Frage 6).

## Ausgangslage

```
FoldersArea (Zustand: FoldersAreaPage)
 ├─ 'folder' { id, focus } ─────► FolderPage        kein Filter, alle Listen nach Name
 │                                 └─ ListButton    "Einkauf   3 offen, 🔥 1"
 └─ 'list' { id, folderId, filter, focus } ─► ListPage
                                   ├─ TaskFilterButtons  | offen (n) || erledigt (m) |
                                   └─ TaskRow …

ListPage "Zurück" ──► showFolder(folderId)   → Fokus Überschrift
```

- `List = { id, name, folderId }` (`src/tasks/domain/list.ts:5`), die Liste hat keinen
  Status.
- `listsOfFolder` sortiert nach Name (`src/tasks/domain/organizer.ts:28`).
- `FolderPage` blendet beim Löschen die entfernte Liste aus (`withoutRemovedList`) und
  führt den Fokus über `useFocusAfterRemoval` und `useFocusOnArrival`
  (`src/tasks/ui/FolderPage.tsx`).
- Die Ansage beim Erledigen entsteht in `completedAnnouncementOf`
  (`src/tasks/ui/TaskFlow.tsx:86`). `TaskFlow` wird von `FoldersArea` und `UrgentArea`
  gemeinsam genutzt.

Ordnerseite vorher:

```
|Navigation            |
< Zurück
Haushalt         [/][+]
-----------------------
 ---------------------
( Einkauf  3 offen, 🔥1 >
 ---------------------
 ---------------------
( Garten   2 offen     >
 ---------------------
 ---------------------
( Umzug                >
 ---------------------
```

## Zielbild

Ordnerseite nachher, Filter „offen“:

```
|Navigation            |
< Zurück
Haushalt         [/][+]
-----------------------
| offen (2) || erledigt (1) |
 ---------------------
( Einkauf  3 offen, 🔥1 >
 ---------------------
 ---------------------
( Garten   2 offen     >
 ---------------------
```

Filter „erledigt“:

```
| offen (2) || erledigt (1) |
 ---------------------
( Umzug                >
 ---------------------
```

Zustand und Rückweg:

```
'folder' { id, filter, focus }
   │  onOpenList
   ▼
'list' …  ──"Zurück"──► showFolder(folderId,
                                   listFilterOf(organizer, list.id),
                                   { kind: 'returningList', id: list.id })
```

Ansage beim Erledigen:

```
TaskFlow.complete()
  closesList = completesList(organizer, task)      ← vor completeTask
  onLeave('completed'); organizer.completeTask(…)
  announce(completedAnnouncementOf(task, today)
           + (closesList ? ' ' + listCompletedAnnouncement(list.name) : ''))
```

## Abstraktionen und Wiederverwendung

- `src/tasks/domain`
  - `organizer.ts`
    - `isListCompleted(organizer, listId)`: neu, `tasks.length > 0 && !tasks.some(isOpen)`
    - `completesList(organizer, task)`: neu
  - `announcements.ts`
    - `listCompletedAnnouncement(name)`: neu, `Liste ${name} erledigt.`
- `src/tasks/ui`
  - `foldersAreaPage.ts`
    - `TaskFilterKind` → `StatusFilter`
    - `FolderPageFocus` bekommt `{ kind: 'returningList'; id: ListId }`
    - `FoldersAreaPage`/`ShownFoldersAreaPage` `'folder'` bekommen `filter: StatusFilter`
    - `folderPageAfterListVanished` setzt `filter: 'open'`
    - `listsShownIn(filter, organizer, folderId)`: neu, analog zu `tasksShownIn`
    - `listFilterOf(organizer, listId)`: neu
  - `TaskFilterButtons.tsx` → `StatusFilterButtons.tsx` (`StatusFilterButtons`)
  - `FolderPage.tsx`: Filterknöpfe, Leertexte, `returningList`-Fokus
  - `FoldersArea.tsx`: `showFolder(id, filter, focus)`, Rückweg, Löschen, Filterwechsel
  - `ListPage.tsx`, `TaskRow.tsx`: nur Umbenennung
  - `TaskFlow.tsx`: `complete` mit Listen-Ansage
- Wiederverwendet werden `useFocusOnArrival`, `useFocusAfterRemoval`,
  `withoutRemovedList`, die CSS-Klasse `.taskFilter`, `isOpen`, `isRecurring` und
  `tasksOfList`.

## Umsetzung

### Phase 1: Filter auf der Ordnerseite

Abhängigkeiten: keine

Die Ordnerseite filtert ihre Listen nach abgeleitetem Status, zählt sie auf den Knöpfen
und führt den Rückweg in den passenden Filter.

**Aufgaben**:
- [x] Test zuerst: `src/tasks/domain/organizer.test.ts` um `isListCompleted` erweitern.
  Leere Liste → `false`. Nur erledigte Aufgaben → `true`. Eine offene Aufgabe → `false`.
  Wiederkehrende Aufgabe mit Erledigungen → `false`. Aufgaben anderer Listen zählen nicht.
- [x] `isListCompleted` in `src/tasks/domain/organizer.ts` umsetzen:
  ```ts
  export function isListCompleted(organizer: Organizer, listId: ListId): boolean {
    const tasks = tasksOfList(organizer, listId)
    return tasks.length > 0 && !tasks.some(isOpen)
  }
  ```
- [x] Umbenennung `TaskFilterKind` → `StatusFilter` in `foldersAreaPage.ts` und allen
  Aufrufern (`FoldersArea.tsx`, `ListPage.tsx`, `TaskRow.tsx`, `TaskFilterButtons.tsx`).
- [x] `src/tasks/ui/TaskFilterButtons.tsx` per `git mv` zu `StatusFilterButtons.tsx`,
  Komponente zu `StatusFilterButtons`, Props-Typ zu `StatusFilterButtonsProps`. Das
  Markup bleibt gleich (`role="group"`, `aria-label="Filter"`, `aria-pressed`).
- [x] Test zuerst: neue Datei `src/tasks/ui/foldersAreaPage.test.ts` für
  `listsShownIn` (filtert und sortiert nach Name, nur Listen des Ordners) und
  `listFilterOf` (`'completed'` für eine erledigte, sonst `'open'`).
- [x] In `foldersAreaPage.ts`:
  ```ts
  export function listsShownIn(
    filter: StatusFilter,
    organizer: Organizer,
    folderId: FolderId,
  ): readonly List[] {
    return listsOfFolder(organizer, folderId).filter(
      (list) => isListCompleted(organizer, list.id) === (filter === 'completed'),
    )
  }

  export function listFilterOf(organizer: Organizer, listId: ListId): StatusFilter {
    return isListCompleted(organizer, listId) ? 'completed' : 'open'
  }
  ```
- [x] `FolderPageFocus` um `{ kind: 'returningList'; id: ListId }` erweitern.
  `'folder'` in `FoldersAreaPage` und `ShownFoldersAreaPage` bekommt
  `filter: StatusFilter`. `folderPageAfterListVanished` gibt `filter: 'open'` mit.
  Der Fall `'folder'` in `resolveFoldersAreaPage` reicht den Filter über `...page`
  schon weiter.
- [x] `FolderPage.tsx`: Die Props `lists` werden zu
  `listsByFilter: Record<StatusFilter, readonly List[]>`, dazu kommen `filter` und
  `onFilter`. `withoutRemovedList` gilt nur für den gewählten Filter, wie `rowsOf` in
  `ListPage`. Die Zähler kommen aus den gefilterten Listen. Unter der Kopfzeile stehen
  `StatusFilterButtons`. Die Leertexte stehen in einer Konstanten nach dem Muster von
  `EMPTY_FILTER_TEXTS` in `ListPage.tsx`:
  ```ts
  const EMPTY_FILTER_TEXTS: Record<StatusFilter, string> = {
    open: 'Keine offenen Listen.',
    completed: 'Noch keine Liste erledigt.',
  }
  ```
  Haben beide Filter null Listen, gilt „Noch keine Listen.“. `useFocusOnArrival`
  erwartet die Id aus `arrivingList` **oder** `returningList`, dafür gibt es eine
  benannte Funktion `awaitedList(focus)`.
- [x] `FoldersArea.tsx`:
  - `showFolder(id, filter = 'open', focus = FOLDER_HEADING_FOCUS)`.
  - `'folder'` rendert `FolderPage` mit
    `listsByFilter={{ open: listsShownIn('open', …), completed: listsShownIn('completed', …) }}`,
    `filter={shown.filter}` und
    `onFilter={(filter) => showFolder(shown.folder.id, filter)}`.
  - Der Rückweg von `'list'` (`onBack`) wird zu
    `showFolder(shown.folder.id, listFilterOf(organizer, shown.list.id), { kind: 'returningList', id: shown.list.id })`.
  - `deleteList`: `filter = listFilterOf(organizer, list.id)` und
    `removedAt = listsShownIn(filter, organizer, list.folderId).indexOf(list)`, dann
    `showFolder(list.folderId, filter, { kind: 'followingList', … })`.
  - `createList` bleibt bei `'open'` mit `arrivingList`. Die Aufrufe aus der
    Ordner-Bearbeitung (`edit`, `createList` zurück) bleiben beim Standard `'open'`.
- [x] Test zuerst: neue Datei `src/tasks/ui/FoldersAreaListFilter.test.tsx` mit den
  Helfern aus `foldersAreaHarness.tsx`:
  - Ordner mit offener, erledigter und leerer Liste: „offen (2)“ zeigt die offene und
    die leere nach Name, „erledigt (1)“ zeigt die erledigte.
  - Eine Liste mit wiederkehrender, schon erledigter Aufgabe steht unter „offen“.
  - Leertexte „Keine offenen Listen.“, „Noch keine Liste erledigt.“ und
    „Noch keine Listen.“.
  - Die letzte Aufgabe in der Liste erledigen, dann „Zurück“: „erledigt“ ist gedrückt,
    und der Fokus liegt auf dem Listenknopf.
  - In einer erledigten Liste eine Aufgabe anlegen, dann „Zurück“: „offen“ ist gedrückt,
    und der Fokus liegt auf dem Listenknopf.
  - In einer erledigten Liste eine Aufgabe wieder öffnen, dann „Zurück“: „offen“.
  - Wird eine Aufgabe anderswo wieder geöffnet (`client.arrivesFromElsewhere` mit der
    Aufgabe ohne Erledigungen, in `act`), wandert die Liste auf der Ordnerseite unter
    „erledigt“ nach „offen“, ohne Navigation.
  - Eine erledigte Liste aus dem Filter „erledigt“ heraus löschen: „erledigt“ bleibt
    gewählt, und der Fokus folgt der nachrückenden erledigten Liste.
  - Beim Betreten aus der Ordnerübersicht ist „offen“ gewählt.
  - axe ohne Verstöße in beiden Filtern.
- [x] Bestehende Tests in `FoldersArea.test.tsx`, `FoldersAreaTasks.test.tsx`,
  `FoldersAreaDeadline.test.tsx` und `FoldersAreaRecurring.test.tsx` an Stellen
  anpassen, die heute nach „Zurück“ den Fokus auf der Überschrift erwarten, oder an
  denen sich Erwartungen zu „Noch keine Listen.“ durch den Filter ändern. Die
  Erwartungen werden aktualisiert, nicht gelöscht.

**Automatisierte Verifikation**:
- [x] `npm run test`: die neuen Tests in `organizer.test.ts`, `foldersAreaPage.test.ts`
  und `FoldersAreaListFilter.test.tsx` sind grün, und alle bestehenden Tests ebenso.
- [x] `npm run test:rules` läuft unverändert grün.
- [x] `npm run lint`, inklusive Architekturgrenze, läuft ohne Befund.
- [x] `npm run build` läuft durch.
- [x] `git grep -n "TaskFilterKind\|TaskFilterButtons" src` findet nichts mehr.

**Manuelle Verifikation**:
- [ ] Auf dem iPhone mit VoiceOver: Ordner öffnen, die letzte Aufgabe einer Liste
  erledigen, „Zurück“. VoiceOver landet auf der Liste unter „erledigt“, und die Knöpfe
  lesen sich als „offen (n)“ und „erledigt (m)“, gedrückt oder nicht gedrückt.
- [ ] Zwei Geräte: Auf Gerät A eine Aufgabe einer erledigten Liste wieder öffnen. Auf
  Gerät B springt die Liste ohne Neuladen von „erledigt“ nach „offen“.

### Phase 2: Ansage „Liste … erledigt.“

Abhängigkeiten: Phase 1

Wer die letzte offene Aufgabe einer Liste erledigt, hört auch, dass die Liste erledigt
ist.

**Aufgaben**:
- [x] Test zuerst: `organizer.test.ts` um `completesList` erweitern. Sie ist wahr bei der
  einzigen offenen, nicht wiederkehrenden Aufgabe, auch wenn es daneben erledigte
  Aufgaben gibt. Sie ist falsch, wenn es weitere offene Aufgaben gibt, wenn die Aufgabe
  wiederkehrt oder wenn sie schon erledigt ist.
- [x] `completesList` in `organizer.ts`:
  ```ts
  export function completesList(organizer: Organizer, task: Task): boolean {
    if (!isOpen(task) || isRecurring(task)) return false
    return tasksOfList(organizer, task.listId)
      .filter(isOpen)
      .every((each) => each.id === task.id)
  }
  ```
- [x] Test zuerst: `announcements.test.ts`, `listCompletedAnnouncement('Umzug')` ergibt
  `'Liste Umzug erledigt.'`.
- [x] `listCompletedAnnouncement` in `announcements.ts` neben den übrigen
  Listen-Ansagen.
- [x] `TaskFlow.complete`: `completesList(organizer, task)` **vor**
  `organizer.completeTask` auswerten. Die Ansage baut eine benannte Funktion
  `completionAnnouncementOf(task, list, closesList, today)`, die
  `completedAnnouncementOf` und gegebenenfalls `listCompletedAnnouncement(list.name)`
  mit Leerzeichen verbindet.
- [x] Test zuerst: in `FoldersAreaListFilter.test.tsx` die letzte offene Aufgabe
  erledigen → Ansage „Fenster putzen erledigt. Liste Umzug erledigt.“. Bei einer
  weiteren offenen Aufgabe bleibt es bei „Fenster putzen erledigt.“.
- [x] Test zuerst: in `UrgentArea.test.tsx` die letzte offene, dringende Aufgabe einer
  Liste auf der Dringend-Seite erledigen → Ansage mit „Liste … erledigt.“.

**Automatisierte Verifikation**:
- [x] `npm run test`: die neuen Fälle in `organizer.test.ts`, `announcements.test.ts`,
  `FoldersAreaListFilter.test.tsx` und `UrgentArea.test.tsx` sind grün, und alle
  bestehenden Tests ebenso.
- [x] `npm run lint` läuft ohne Befund.
- [x] `npm run build` läuft durch.

**Manuelle Verifikation**:
- [ ] Auf dem iPhone mit VoiceOver auf der Dringend-Seite die letzte offene Aufgabe einer
  Liste erledigen. Zu hören ist „… erledigt. Liste … erledigt.“.

## Notizen zur Umsetzung

- Testhelfer `filterButtonNamed` und `openCompletedList` liegen in
  `foldersAreaHarness.tsx`. Bestehende Tests, die eine Liste mit nur erledigten
  Aufgaben öffnen, gehen jetzt über den Filter „erledigt“.
- Ansagen enden mit einem Leerzeichen ohne Breite (`announcementText`), deshalb prüft
  der Test „nur die Aufgabe“ per `not.toHaveTextContent('Liste')` statt mit einem
  verankerten Ausdruck.

## Verweise

- `docs/notes.txt`, Abschnitt „TODO-Liste-Seite“ (offen/erledigt-Filter mit Anzahl)
- `docs/agents/plans/2026-10-10-listen.md`: Ordnerseite und Listenknöpfe (MUL-004)
- `docs/agents/plans/2026-10-10-aufgaben.md`: Aufgabenfilter, `filterOf` (MUL-005)
- `docs/agents/plans/2026-10-10-wiederkehrend.md`: `isOpen` und wiederkehrende
  Aufgaben (MUL-008)
