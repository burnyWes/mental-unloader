---
date: 2026-11-06T09:17:52.595527+00:00
git_commit: aabee8285a3e8112a07942b9f144cf69913d70ee
branch: main
story: MUL-015
topic: "Töne für Bestätigen und Abbrechen"
tags: [plan, shared-ui, sound, confirmation, forms, view-transitions]
status: ready
---

# PLAN: MUL-015 — Töne für Bestätigen und Abbrechen

Zum Blättergeräusch aus MUL-014 kommen zwei Töne dazu. `confirm.wav` ertönt, wenn eine
Aktion bestätigt wird, `refuse.wav` beim Abbrechen und bei abgelehnter Eingabe. Beide
hängen am Schalter „Sounds“. Navigation und Filter bleiben beim Blättergeräusch. Dabei
wird auch ein Fehler behoben: Bei laufender Animation geht heute die Meldung zu
ungültiger Eingabe verloren. Grundlage ist die Klärung vom 06.11.2026.

## Akzeptanzkriterien

- Die Bestätigen-Buttons der Rückfragen spielen `confirm.wav` statt des
  Blättergeräuschs:
  - „Löschen“ für Ordner, Liste und Aufgabe
  - „Erledigen“
  - „Abmelden“
- „Abbrechen“ auf einer Rückfrage spielt `refuse.wav` statt des Blättergeräuschs.
- „Zurück“ auf einer Rückfrage und in den Formularen blättert wie bisher.
- „Wieder öffnen“ auf der Aufgabenseite spielt `confirm.wav`.
- „Speichern“ mit gültiger Eingabe spielt in allen fünf Formularen `confirm.wav` statt
  des Blättergeräuschs. Die Formulare sind Ordner anlegen, Ordner bearbeiten, Liste
  anlegen, Liste bearbeiten und Aufgabe anlegen oder bearbeiten.
- „Speichern“ mit ungültiger Eingabe gleitet nicht. Ungültig heißt: Name leer oder zu
  lang, Beschreibung zu lang. Fehlermeldung, Ansage und Fokus erscheinen wie ohne
  Animation, und es ertönt `refuse.wav`. Das gilt auch bei eingeschalteten Animationen.
- Je Tipp ertönt höchstens ein Ton.
- `confirm.wav` und `refuse.wav` spielen auch ohne Animation:
  - bei „Animationen“ aus
  - bei „Bewegung reduzieren“
  - in Browsern ohne View-Transition-Typen

  Bei „Sounds“ aus sind sie stumm.
- Navigation, Filter, Öffnen, Stift, Plus, Mülleimer, der Haken in der Zeile, die
  Zurück-Buttons der Detailseiten, Stepper, Schalter, „Anmelden“ und „Neue Version
  laden“ verhalten sich unverändert.
- `confirm.wav` und `refuse.wav` liegen im Precache. Fehlt eine Datei oder lässt sie
  sich nicht laden, bleibt nur dieser Ton still, ohne Fehler und ohne Ansage.

## Wesentliche Entscheidungen und Abwägungen

1. **Einteilung der Buttons:**
   - confirm: Bestätigen auf der Rückfrage, „Speichern“ und „Wieder öffnen“
   - refuse: nur „Abbrechen“ auf der Rückfrage
   - Alle Zurück-Buttons gelten als Navigation. Buttons, die nur die Rückfrage öffnen,
     bekommen keinen eigenen Ton. Dazu zählen der Mülleimer, der Haken in der Zeile und
     „Erledigen“ auf der Aufgabenseite.
   - Warum: Nur echte Entscheidungen bekommen einen eigenen Ton.
   - Auswirkung: „Zurück“ und „Abbrechen“ auf der Rückfrage rufen beide `onCancel` auf,
     melden aber unterschiedliche Töne. Siehe Entscheidung 6.
2. **Ersetzen statt überlagern:** Je Tipp gibt es genau einen Ton. Gleitet ein
   Bestätigen oder Abbrechen, ersetzt dessen Ton das Blättergeräusch.
   - Warum: Die Rückmeldung ist eindeutig, und zwei Töne zugleich klingen matschig.
   - Auswirkung: `slideBack(action, sound)` bekommt den Ton als Parameter, Standard ist
     `'pageTurn'`.
3. **confirm und refuse sind unabhängig von der Animation** und hängen nur am Schalter
   „Sounds“. Das Blättergeräusch bleibt an die Animation gebunden (MUL-014,
   Entscheidung 2).
   - Warum: Die beiden Töne melden eine Aktion, kein Umblättern. „Wieder öffnen“ gleitet
     nie.
   - Auswirkung: `slide()` spielt einen Aktionston vor der Prüfung auf Animation.
     Buttons ohne Gleiten nutzen `playSound` aus `usePageSlide()`.
4. **Ungültiges Speichern spielt refuse:** Das Formular zeigt die Meldung und spielt
   `refuse.wav`.
   - Warum: Man hört sofort, dass nicht gespeichert wurde.
   - Auswirkung: `NameFormPage` und `TaskFormPage` spielen den Ton im `catch`.
5. **Prüfung vor dem Gleiten (Fehlerbehebung):** `createName` und `createDescription`
   laufen in `onSave`, bevor `slideBack` aufgerufen wird. Die Funktionen danach bekommen
   bereits geprüfte Werte.
   - Warum: Bei laufender Animation läuft die Aktion erst im `update` der View
     Transition (`pageSlide.ts:68`). Ein dort geworfenes `InvalidName` erreicht das
     `try/catch` in `NameFormPage.save` (`NameFormPage.tsx:37`) und
     `TaskFormPage.save` nie. Die Folgen heute: Es blättert, aber es erscheint keine
     Meldung, und das Formular bleibt stehen.
   - Auswirkung: Die Signaturen von `createFolder`, `renameFolder`, `createList`,
     `saveList`, `createTask` und `TaskFlow.save` ändern sich.
6. **`ConfirmationPage.onCancel(sound)`:** „Abbrechen“ ruft `onCancel('refuse')` auf,
   „Zurück“ ruft `onCancel('pageTurn')` auf. Die Aufrufer reichen den Wert an
   `slideBack` weiter.
   - Warum: Der Ton steht sichtbar an der Aufrufstelle, und der Ablauf der Rückfrage
     wird nicht doppelt beschrieben.
7. **Port `SoundEffects { play(effect) }` mit einem `AudioContext` für alle drei
   Dateien:** `SoundEffect = 'pageTurn' | 'confirm' | 'refuse'`. Er ersetzt
   `PageTurnSound` samt Adapter, Fake und Test.
   - Warum: Ein einziger Context ist für iOS günstiger, und der erste Tipp schaltet alle
     Töne frei.
   - Auswirkung: Die drei Dateien werden unabhängig geladen. Eine fehlende Datei macht
     nur ihren eigenen Ton stumm.

## Ausgangslage

```
main.tsx
 └─ pageTurnSound = createWebAudioPageTurnSound(…/sounds/page-turn.wav)
App ── useAppearance ─► { animations, sounds }
 └─ <PageSlideProvider animations sounds pageTurnSound>     src/App.tsx:66
      └─ createPageSlide({ animations, onSlide })           src/shared/ui/PageSlideProvider.tsx:20
           slide(type, action)                              src/shared/ui/pageSlide.ts:62
             ├─ keine Animation ─► action()            (kein Ton)
             └─ sonst ─► onSlide() → sounds && play()  (Blättergeräusch)
                        startViewTransition({ update: flushSync(action) })
```

Wer heute welchen Button bedient:

| Button | Aufrufer | heute |
|---|---|---|
| Bestätigen, Rückfrage Ordner löschen | `FoldersArea.tsx:435` | `slideBack(() => deleteFolder(…))` |
| Bestätigen, Rückfrage Liste löschen | `FoldersArea.tsx:598` | `slideBack(() => deleteList(…))` |
| Bestätigen, Rückfrage Aufgabe erledigen oder löschen | `TaskFlow.tsx:253`, `:264` | `slideBack(complete)`, `slideBack(remove)` |
| Bestätigen, Rückfrage Abmelden | `SignedInApp.tsx:160` | `onSignOut` ohne Gleiten |
| Abbrechen und Zurück auf der Rückfrage | `ConfirmationPage.tsx:24`, `:35` | beide `onCancel`, beim Aufrufer `slideBack` |
| Speichern Ordner, Liste, Aufgabe anlegen | `FoldersArea.tsx:350`, `:461`, `:554` | `slideBack(() => create…(draft))` |
| Speichern Ordner, Liste, Aufgabe bearbeiten | `FoldersArea.tsx:406`, `:570`, `TaskFlow.tsx:233` | `slideBack(() => …(draft))` |
| Wieder öffnen | `TaskFlow.tsx:205` | `reopen` ohne Gleiten |

- Die Dateien `public/sounds/confirm.wav` (40 KB) und `refuse.wav` (44 KB) liegen vor,
  sind aber noch nicht eingecheckt. `wav` steht schon in den `globPatterns`
  (`vite.config.ts:49`).
- Die Komponententests der Bereiche (`foldersAreaHarness.tsx`) laufen ohne Provider.
  Der Standard-Context ist „Animation an, kein Ton“.

## Zielbild

```
main.tsx
 └─ soundEffects = createWebAudioSoundEffects({
        pageTurn: …/sounds/page-turn.wav,
        confirm:  …/sounds/confirm.wav,
        refuse:   …/sounds/refuse.wav })

App ── <PageSlideProvider animations sounds soundEffects>
         play(effect) = sounds && soundEffects.play(effect)
         └─ createPageSlide({ animations, play })
              slideBack(action, sound = 'pageTurn')
              slide(type, action, sound):
                ├─ sound ≠ 'pageTurn' ─► play(sound)       (immer)
                ├─ keine Animation    ─► action()
                ├─ sound = 'pageTurn' ─► play('pageTurn')  (nur mit Animation)
                └─ startViewTransition(…)
              playSound(sound: ActionSound) ─► play(sound)
```

Aufrufstellen danach:

```
ConfirmationPage  Bestätigen ─► onConfirm()
                  Abbrechen  ─► onCancel('refuse')
                  Zurück     ─► onCancel('pageTurn')

FoldersArea       onConfirm={() => slideBack(() => deleteFolder(folder), 'confirm')}
                  onCancel={(sound) => slideBack(() => setPage(…), sound)}
                  onSave={() => {
                    const name = createName(shown.draftName)       ← wirft vor dem Gleiten
                    slideBack(() => createFolder(name), 'confirm')
                  }}

NameFormPage /    catch InvalidName | InvalidDescription
TaskFormPage        ─► Meldung, Ansage, Fokus + playSound('refuse')

TaskFlow          onReopen={() => { playSound('confirm'); reopen() }}
SignedInApp       onConfirm={() => { playSound('confirm'); onSignOut() }}
```

Was die Nutzerin oder der Nutzer hört:

```
Tipp                              Sounds an,      Sounds an,      Sounds aus
                                  Animation an    Animation aus
Navigation / Filter / Öffnen      page-turn       –               –
Zurück (überall)                  page-turn       –               –
Bestätigen / Speichern (gültig)   confirm         confirm         –
Wieder öffnen                     confirm         confirm         –
Abbrechen                         refuse          refuse          –
Speichern (ungültig)              refuse          refuse          –
```

## Abstraktionen und Wiederverwendung

- `src/shared/sound`
  - `soundEffects.ts` (neu, ersetzt `pageTurnSound.ts`)
    ```ts
    export type SoundEffect = 'pageTurn' | 'confirm' | 'refuse'
    export type ActionSound = Exclude<SoundEffect, 'pageTurn'>
    export interface SoundEffects {
      play(effect: SoundEffect): void
    }
    ```
  - `inMemorySoundEffects.ts` (neu, ersetzt `inMemoryPageTurnSound.ts`)
    - `RecordingSoundEffects = SoundEffects & { played(): readonly SoundEffect[] }`
    - `createInMemorySoundEffects()`
  - `webAudioSoundEffects.ts` (umbenannt aus `webAudioPageTurnSound.ts`)
    - `AudioOutput<Sound>` und `AudioEnvironment<Sound>` bleiben unverändert.
    - `SoundUrls = Record<SoundEffect, string>`
    - `createSoundEffects(urls, environment)`: Die Funktion wählt einmal die
      `ambient`-Sitzung, legt einmal den Output an und lädt jede URL mit `loadSound`
      in eine `Map<SoundEffect, Sound>`. `play(effect)` setzt einen Output fort, der
      nicht läuft, und spielt den Ton, wenn er geladen ist.
    - `createWebAudioSoundEffects(urls)` für den Browser
  - `webAudioSoundEffects.test.ts` (umbenannt aus `webAudioPageTurnSound.test.ts`)
- `src/shared/ui`
  - `pageSlide.ts`
    - `PageSlideSettings = { animations: boolean; play: (effect: SoundEffect) => void }`.
      `play` ersetzt `onSlide`.
    - `PageSlide.slideBack(action, sound?: SoundEffect)`
    - `PageSlide.playSound(sound: ActionSound)`
    - Standard: `ANIMATED_WITHOUT_SOUND = { animations: true, play: () => {} }`
  - `PageSlideProvider.tsx`: Die Prop `pageTurnSound` heißt jetzt `soundEffects`, und
    `play` prüft `sounds`.
  - `ConfirmationPage.tsx`
    - `CancelSound = Extract<SoundEffect, 'refuse' | 'pageTurn'>`
    - `onCancel: (sound: CancelSound) => void`
  - `src/testSupport/fakeViewTransitions.ts` wird unverändert wiederverwendet.
- `src/tasks/ui`
  - `FoldersArea.tsx`
    - Neue Signaturen: `createFolder(name)`, `renameFolder(folder, name)`,
      `createList(folder, name)`, `saveList(shownDraft, name)` und
      `createTask(shownPage, name, description)`, jeweils mit geprüften Strings.
    - Die Aufrufer der Rückfragen geben `'confirm'` an oder reichen den `sound` weiter.
  - `TaskFlow.tsx`
    - `save(shownStep, name, description)`
    - Die Rückfragen bekommen `'confirm'` und den weitergereichten `sound`.
    - `onReopen` spielt `confirm`.
  - `NameFormPage.tsx`, `TaskFormPage.tsx`: `playSound('refuse')` im `catch`
  - `foldersAreaHarness.tsx`: Optional `soundEffects` und `animations`. Sind sie
    gesetzt, kommt `FoldersArea` in einen `PageSlideProvider` mit `sounds`. Ohne sie
    bleibt alles wie bisher.
- `src/SignedInApp.tsx`: Die Rückfrage zum Abmelden nutzt `playSound('confirm')` und
  `onCancel(sound)`.

## Logging und Beobachtbarkeit

Keine Änderungen.

## Umsetzung

### Phase 1: Töne auf den Rückfragen und bei „Wieder öffnen“

Abhängigkeiten: keine

Diese Phase verallgemeinert den Port auf drei Töne und vertont alle Rückfragen sowie
„Wieder öffnen“. Danach hört man auf den Rückfragen den passenden Ton.

**Aufgaben**:
- [x] `public/sounds/confirm.wav` und `public/sounds/refuse.wav` mit einchecken.
- [x] Integrationstest zuerst: `webAudioPageTurnSound.test.ts` wird zu
  `webAudioSoundEffects.test.ts`. Die Fälle laufen gegen `createSoundEffects` mit drei
  URLs, der Fake-`fetch` antwortet je URL mit eigenen Bytes. Neue oder angepasste
  Fälle:
  - `asks for an ambient audio session so the silent switch mutes it`
  - `creates a single audio output for all sounds`: `createOutput` wird genau einmal
    aufgerufen.
  - `plays each loaded sound through the audio output`: `play('confirm')` und
    `play('refuse')` spielen ihre jeweiligen dekodierten Puffer.
  - `resumes an audio output that is not running when playing`
  - `stays silent while the sound is still loading`
  - `keeps the other sounds when one sound file is missing`: `refuse` antwortet mit
    404. `play('refuse')` bleibt still, `play('confirm')` spielt.
  - `stays silent when a sound cannot be fetched` und `… cannot be decoded`
  - `stays silent without web audio`
- [x] `soundEffects.ts`, `inMemorySoundEffects.ts` und `webAudioSoundEffects.ts`
  anlegen. `pageTurnSound.ts`, `inMemoryPageTurnSound.ts` und
  `webAudioPageTurnSound.ts` samt Test entfernen.
- [x] Test zuerst: `src/shared/ui/pageSlide.test.tsx`
  - Die bestehenden Fälle `reports each slide that animates` und
    `does not report a slide when reduced motion is preferred` umstellen auf
    `play` mit `'pageTurn'`.
  - `plays the given sound instead of the page turn when sliding back`:
    `slideBack(action, 'confirm')` spielt nur `['confirm']` und protokolliert `back`.
  - `plays the given sound even when animations are turned off`: mit
    `animations: false` spielt `slideBack(action, 'refuse')` `['refuse']`, und die
    Aktion läuft sofort.
  - `plays the given sound even when reduced motion is preferred`
  - `plays an action sound without sliding`: `playSound('confirm')` spielt
    `['confirm']` und protokolliert keine Richtung.
- [x] `pageSlide.ts` nach dem Zielbild umbauen, `PageSlideProvider.tsx` auf
  `soundEffects` und `play` umstellen.
- [x] Test zuerst: `src/shared/ui/ConfirmationPage.test.tsx`
  - `it.each(['Abbrechen', 'Zurück'])` ersetzen durch:
    - `cancels with Abbrechen and the refuse sound`: `onCancel` mit `'refuse'`
    - `cancels with Zurück and the page turn sound`: `onCancel` mit `'pageTurn'`
- [x] `ConfirmationPage.tsx`: `CancelSound` und `onCancel(sound)`
- [x] `FoldersArea.tsx`
  - `confirmDeletion` und `confirmListDeletion` bekommen
    `onConfirm={() => slideBack(…, 'confirm')}` und
    `onCancel={(sound) => slideBack(…, sound)}`.
- [x] `TaskFlow.tsx`
  - `confirmCompletion` und `confirmDeletion` bekommen dasselbe Muster.
  - `onReopen={() => { playSound('confirm'); reopen() }}`
- [x] `SignedInApp.tsx`
  - `onConfirm={() => { playSound('confirm'); onSignOut() }}`
  - `onCancel={(sound) => slideBack(() => setConfirmingSignOut(false), sound)}`
- [x] `App.tsx`: Die Prop heißt `soundEffects: SoundEffects`. `main.tsx` erzeugt
  `createWebAudioSoundEffects` mit den drei URLs aus `import.meta.env.BASE_URL`.
- [x] `foldersAreaHarness.tsx`: Optionen `soundEffects` und `animations` (siehe
  Abstraktionen). `renderFoldersArea` bekommt dafür ein optionales viertes Argument
  `{ soundEffects, animations }`.
- [x] Test zuerst: `src/tasks/ui/FoldersAreaSound.test.tsx` (neu, mit installiertem
  `installFakeViewTransitions` und `createInMemorySoundEffects`)
  - `plays the confirm sound instead of the page turn when deleting a folder`: Ordner
    öffnen, Stift, Löschen, Löschen. `played()` endet auf `['…', 'confirm']`, und der
    letzte Schritt enthält kein `pageTurn`.
  - `plays the confirm sound when deleting a list`
  - `plays the refuse sound when cancelling a deletion`
  - `plays the page turn when leaving a confirmation with Zurück`
  - `plays the confirm sound when confirming the completion of a task`, ausgelöst über
    den Haken der Zeile. Der Haken selbst spielt `pageTurn`.
  - `plays the confirm sound when deleting a task`
  - `plays the refuse sound when cancelling the completion of a task`
  - `plays the confirm sound when reopening a task`: Es gibt kein Gleiten, also auch
    kein `pageTurn`.
  - `plays the confirm and refuse sounds while animations are turned off`: mit
    `animations: false` gibt es für Löschen bestätigen und Abbrechen genau
    `['confirm']` beziehungsweise `['refuse']` und keine Richtung.
  - `keeps the page turn for filters and opening`: Filterwechsel und Ordner öffnen
    spielen nur `pageTurn`.
- [x] Test zuerst: `src/App.test.tsx`, Block „App sound“ auf
  `createInMemorySoundEffects` umstellen. Aus `plays()` wird
  `played().filter((effect) => effect === 'pageTurn').length` oder ein direkter
  Vergleich der Liste. Neu:
  - `plays the confirm sound when signing out`
  - `plays the refuse sound when cancelling the sign out`, ohne `pageTurn` für diesen
    Schritt
  - `stays silent on confirmation once sounds are turned off`
  - `plays the confirm sound when reduced motion is preferred`, im Block
    „App sound with reduced motion“

**Automatisierte Verifikation**:
- [x] `webAudioSoundEffects.test.ts`, `pageSlide.test.tsx`,
  `ConfirmationPage.test.tsx`, `FoldersAreaSound.test.tsx` und `App.test.tsx` laufen
  grün.
- [x] `FoldersAreaSlide.test.tsx`, `TaskFlowSlide.test.tsx` und `UrgentArea.test.tsx`
  laufen grün. Die Richtungen bleiben unverändert.
- [x] `grep -rn "PageTurnSound\|pageTurnSound" src` findet nichts mehr.
- [x] `npm run test && npm run test:rules` läuft grün.
- [x] `npm run lint` läuft fehlerfrei.
- [x] `npm run build` läuft fehlerfrei. `dist/sw.js` enthält `sounds/confirm.wav` und
  `sounds/refuse.wav` im Precache.

**Manuelle Verifikation** (iPhone, installierte PWA):
- [ ] Ordner löschen und bestätigen: Es ertönt nur `confirm`, kein Blättern. Das
  Gleiten läuft wie bisher.
- [ ] Aufgabe über den Haken erledigen: Der Haken blättert, „Erledigen“ spielt
  `confirm`.
- [ ] Löschen abbrechen: Es ertönt nur `refuse`. Mit „Zurück“ auf der Rückfrage
  blättert es.
- [ ] Erledigte Aufgabe „Wieder öffnen“: Es ertönt `confirm`.
- [ ] Abmelden bestätigen: Es ertönt `confirm`.
- [ ] „Animationen“ aus: Bestätigen und Abbrechen sind weiter zu hören, Navigation
  bleibt still.
- [ ] „Sounds“ aus: Alles ist still.
- [ ] Stummschalter auf lautlos: Auch `confirm` und `refuse` sind still.

### Phase 2: Töne beim Speichern, Prüfung vor dem Gleiten

Abhängigkeiten: Phase 1

Diese Phase prüft die Eingabe vor dem Gleiten und behebt damit die verlorene
Fehlermeldung. „Speichern“ spielt danach `confirm`, abgelehnte Eingabe spielt
`refuse`.

**Aufgaben**:
- [x] Test zuerst: `src/tasks/ui/FoldersAreaSlide.test.tsx`
  - `stays on the folder form with a failure when saving an empty name while sliding`:
    Ordner anlegen, leer speichern. Es kommt keine Richtung `back` dazu, der Fehlertext
    steht im Formular, die Ansage kommt, und das Namensfeld hat den Fokus.
  - `stays on the list form with a failure when saving an empty name while sliding`
  - `stays on the task form with a failure when saving an empty name while sliding`
    (Aufgabe anlegen)
  - `stays on the task form with a failure when the description is too long while sliding`
    (Aufgabe bearbeiten über `TaskFlow`)
- [x] `FoldersArea.tsx`: Prüfung vor dem Gleiten in allen fünf `onSave`, nach dem
  Muster
  ```tsx
  onSave={() => {
    const name = createName(shown.draftName)
    slideBack(() => createFolder(name), 'confirm')
  }}
  ```
  `createFolder`, `renameFolder`, `createList`, `saveList` und `createTask` bekommen die
  geprüften Werte und rufen `createName` und `createDescription` nicht mehr selbst auf.
- [x] `TaskFlow.tsx`: `onSave` prüft Name und Beschreibung und ruft dann
  `slideBack(() => save(shownStep, name, description), 'confirm')` auf.
- [x] Test zuerst: `src/tasks/ui/FoldersAreaSound.test.tsx`
  - `plays the confirm sound instead of the page turn when saving a folder`
  - `plays the confirm sound when saving a list, a new task and an edited task`
  - `plays the refuse sound when saving an empty name`, ohne `pageTurn` und ohne
    Richtung
  - `plays the refuse sound when saving a too long description`
  - `plays the confirm and refuse sounds on save while animations are turned off`
  - `keeps the page turn when leaving a form with Zurück`
- [x] `NameFormPage.tsx` und `TaskFormPage.tsx`: Im `catch` der bekannten Fehler wird
  `playSound('refuse')` aus `usePageSlide()` gespielt. Unbekannte Fehler werden wie
  bisher weitergeworfen.

**Automatisierte Verifikation**:
- [x] `FoldersAreaSlide.test.tsx`, `TaskFlowSlide.test.tsx` und
  `FoldersAreaSound.test.tsx` laufen grün.
- [x] Die bestehenden Tests zu Fehlermeldungen in `FoldersArea.test.tsx` und
  `FoldersAreaTasks.test.tsx` laufen unverändert grün (ohne Provider).
- [x] `npm run test && npm run test:rules` läuft grün.
- [x] `npm run lint` läuft fehlerfrei.
- [x] `npm run build` läuft fehlerfrei.

**Manuelle Verifikation** (iPhone, installierte PWA, Animationen an):
- [ ] Ordner anlegen und speichern: Es ertönt nur `confirm`, das Gleiten läuft wie
  bisher.
- [ ] Ordner mit leerem Namen speichern: Das Formular bleibt stehen, die Fehlermeldung
  erscheint, und es ertönt `refuse`.
- [ ] Aufgabe bearbeiten und speichern: Es ertönt `confirm`.
- [ ] „Zurück“ aus einem Formular: Es blättert.

## Notizen zur Umsetzung

- Auf Wunsch des Nutzers wurden beide Phasen am Stück umgesetzt, committet und
  gepusht. Die manuelle Prüfung beider Phasen folgt auf dem iPhone.
- Der Fehler aus Entscheidung 5 ist durch die neuen Tests in
  `FoldersAreaSlide.test.tsx` belegt. Vor der Änderung warf `finishPendingUpdates`
  `InvalidName: empty` aus dem Update der View Transition.
- Der Test für „Bewegung reduzieren“ in `App.test.tsx` prüft `refuse` über „Abbrechen“
  beim Abmelden und heißt deshalb `plays the refuse sound when reduced motion is
  preferred`.
- `renderFoldersArea` hat als viertes Argument ein optionales `Hearing`
  (`soundEffects`, `animations`). Nur dann liegt `FoldersArea` in einem
  `PageSlideProvider`.
- Der Precache enthält jetzt `confirm.wav` und `refuse.wav`.
  Die während der Umsetzung neu abgelegten Dateien `activate.wav` und
  `deactivate.wav` gehören nicht zu diesem Plan und wurden nicht eingecheckt. Ein
  Build aus einem Arbeitsstand, in dem sie liegen, nimmt sie trotzdem in den Precache
  auf.

## Verweise

- Vorgängerplan mit Port, Adapter und Schaltern:
  `docs/agents/plans/2026-11-06-animationen-und-sounds.md` (MUL-014)
- Gleiten der Seiten: `docs/agents/plans/2026-11-05-seitenwechsel-gleiten.md` (MUL-013)
- MDN `ViewTransition.updateCallbackDone` (ein Fehler im `update` lehnt das Promise ab):
  https://developer.mozilla.org/docs/Web/API/ViewTransition/updateCallbackDone
- MDN Web Audio API `AudioBufferSourceNode`:
  https://developer.mozilla.org/docs/Web/API/AudioBufferSourceNode
