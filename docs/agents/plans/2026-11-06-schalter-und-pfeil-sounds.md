---
date: 2026-11-06T09:42:04.204316+00:00
git_commit: b83db64619d56f969d7abcaf6d14af5af5883400
branch: main
story: MUL-016
topic: "Töne für Schalter, Auswahl und Pfeile"
tags: [plan, shared-ui, sound, settings, task-form, deadline-stepper]
status: ready
---

# PLAN: MUL-016 — Töne für Schalter, Auswahl und Pfeile

Zu den Tönen aus MUL-014 und MUL-015 kommen drei weitere:
- `activate.wav` und `deactivate.wav` erklingen bei Schaltern, Radios und Checkboxen.
- `arrow.wav` erklingt bei den Pfeilen des Stichtags.

Grundlage ist die Klärung vom 06.11.2026.

## Akzeptanzkriterien

- Die Schalter „Dunkelmodus“ und „Animationen“ in den Einstellungen spielen beim
  Einschalten `activate.wav` und beim Ausschalten `deactivate.wav`.
- Der Schalter „Sounds“ ist in beide Richtungen zu hören:
  - Beim Ausschalten erklingt noch `deactivate.wav`.
  - Beim Einschalten erklingt sofort `activate.wav`, obwohl die Sounds vorher aus waren.
- Die Checkbox „Wiederkehrend“ im Aufgabenformular spielt beim Anhaken `activate.wav`
  und beim Abhaken `deactivate.wav`.
- Das Radio „Fälligkeit“ (Dringend / Stichtag / Irgendwann) spielt beim Wechsel der
  Option `activate.wav`. Ein Tipp auf die schon gewählte Option bleibt still.
- `arrow.wav` erklingt beim Stichtag (Tag, Monat, Jahr) bei jedem Schritt:
  - über die Pfeile ▲ und ▼
  - über die Pfeiltasten ↑ und ↓ auf dem Feld
  - auch an der Jahresgrenze 2000/2099, an der sich der Wert nicht ändert

  Andere Tasten auf dem Feld bleiben still.
- Alle drei Töne erklingen auch ohne Animation:
  - bei „Animationen“ aus
  - bei „Bewegung reduzieren“
  - in Browsern ohne View-Transition-Typen

  Bei „Sounds“ aus sind sie stumm. Einzige Ausnahme ist der Schalter „Sounds“ selbst.
- Unverändert bleiben:
  - der Filter „offen / erledigt“, der weiter blättert
  - Navigation und alle Buttons aus MUL-015
  - die Auswahllisten (Rhythmus, Dringend ab, Liste und Ordner)
- Je Tipp erklingt höchstens ein Ton.
- `activate.wav`, `deactivate.wav` und `arrow.wav` sind eingecheckt und liegen im
  Precache. Fehlt eine Datei oder lässt sie sich nicht laden, bleibt nur dieser Ton
  still, ohne Fehler und ohne Ansage.

## Wesentliche Entscheidungen und Abwägungen

1. **activate und deactivate nur für Elemente mit Checkbox-Optik:** Gemeint sind die
   Schalter, das Radio und die Checkbox, also alles mit `className="checkboxLook"`. Die
   Filter-Buttons sind technisch Toggle-Buttons (`aria-pressed`), bleiben aber beim
   Blättergeräusch.
   - Warum: Der Filter gilt seit MUL-015 als Navigation, und die Einträge gleiten.
   - Auswirkung: `StatusFilterButtons.tsx` und `FoldersArea.switchFilter` bleiben
     unangetastet.
2. **Drei neue Aktionstöne:** `SoundEffect` wird um `'activate' | 'deactivate' | 'arrow'`
   erweitert. Damit gehören sie automatisch zu `ActionSound` und laufen über `playSound`
   aus `usePageSlide()`. Sie spielen also unabhängig von der Animation und hängen nur am
   Schalter „Sounds“.
   - Warum: Sie melden eine Aktion, kein Umblättern. Das ist dasselbe Muster wie bei
     `confirm` und `refuse` (MUL-015, Entscheidung 3).
   - Auswirkung: `SoundUrls = Record<SoundEffect, string>` erzwingt die drei neuen URLs
     in `main.tsx` über den Typprüfer. Der Adapter `webAudioSoundEffects.ts` lädt sie
     ohne Änderung mit.
3. **Der Schalter „Sounds“ ist an der Stummschaltung vorbei hörbar:**
   - `PageSlideSettings` bekommt `playEvenWhenMuted`, `PageSlide` bekommt
     `playSoundEvenWhenMuted(sound: ActionSound)`.
   - Der `PageSlideProvider` reicht `playEvenWhenMuted` ungeprüft an
     `soundEffects.play` weiter.
   - `SettingsEntry` bekommt das Merkmal `audibleWhenMuted?: boolean`, das in
     `SignedInApp` nur der Eintrag „Sounds“ setzt.
   - Warum: Beim Einschalten ist `sounds` im Provider noch `false`. Der Ton muss vor dem
     Umschalten und unabhängig vom Zustand spielen.
   - Auswirkung: Die Schaltlogik liegt einmal in `SettingsPage`. `SignedInApp` markiert
     nur den Eintrag.
4. **Der Ton folgt dem neuen Zustand:**
   - Schalter und Checkbox spielen `activate`, wenn sie eingeschaltet werden, und
     `deactivate`, wenn sie ausgeschaltet werden.
   - Das Radio spielt in `onChange` immer `activate`. Ein Tipp auf die gewählte Option
     löst kein `onChange` aus und bleibt deshalb still.
   - Der Ton wird **vor** dem Umschalten gespielt.
   - Warum: Beim Sounds-Schalter spielt der Ton so noch mit dem alten Provider. Alle
     Elemente folgen derselben Reihenfolge.
5. **`arrow` sitzt im `DeadlineStepper`, nicht im `SpinButton`:** `DeadlineField` hüllt
   `onStep` in einen Handler ein, der zuerst `playSound('arrow')` spielt und dann
   `onStep(step)` aufruft. ▲, ▼ und die Pfeiltasten des `SpinButton` laufen alle über
   diesen Handler.
   - Warum: `SpinButton` bleibt ein generischer Baustein in `shared/ui` und weiß nichts
     von Klängen.
   - Auswirkung: Jeder Schritt spielt einen Ton, auch an der Jahresgrenze.

## Ausgangslage

```
main.tsx:20  createWebAudioSoundEffects({ pageTurn, confirm, refuse })
App ── <PageSlideProvider animations sounds soundEffects>       src/App.tsx:66
         play(effect) = sounds && soundEffects.play(effect)    PageSlideProvider.tsx:24
         └─ createPageSlide({ animations, play })              pageSlide.ts:53
              playSound(sound: ActionSound) ─► play(sound)     pageSlide.ts:92
```

| Element | Ort | heute |
|---|---|---|
| Schalter Dunkelmodus, Animationen, Sounds (`role="switch"`) | `SettingsPage.tsx:40`, Einträge in `SignedInApp.tsx:65` | still |
| Radio „Fälligkeit“ | `TaskFormPage.tsx:139` | still |
| Checkbox „Wiederkehrend“ | `RepeatFields.tsx:28` | still |
| ▲ und ▼ beim Stichtag | `DeadlineStepper.tsx:43`, `:63` | still |
| Pfeiltasten ↑ und ↓ auf dem Feld | `SpinButton.tsx:29` über `onStep` | still |
| Filter „offen / erledigt“ | `StatusFilterButtons.tsx:22` | blättert (`FoldersArea.tsx:122`) |

- `public/sounds/activate.wav` (51 KB), `deactivate.wav` (59 KB) und `arrow.wav`
  (67 KB) liegen vor, sind aber nicht eingecheckt. `wav` steht schon in den
  `globPatterns` (`vite.config.ts:49`).
- Der Jahresschritt bleibt an der Grenze stehen (`calendarDay.ts:92`). Tag und Monat
  laufen im Kreis.
- Der Test `App.test.tsx:693` „stays silent once sounds are turned off“ erwartet heute
  `['pageTurn']`. Künftig kommt beim Ausschalten `deactivate` dazu.

## Zielbild

```
main.tsx  createWebAudioSoundEffects({ pageTurn, confirm, refuse,
                                       activate, deactivate, arrow })

PageSlideProvider
  createPageSlide({
    animations,
    play:              (effect) => sounds && soundEffects.play(effect),
    playEvenWhenMuted: (effect) => soundEffects.play(effect),
  })
  PageSlide.playSound(sound)              ─► play
  PageSlide.playSoundEvenWhenMuted(sound) ─► playEvenWhenMuted

SettingsPage  onChange ─► toggle(entry)
                sound = entry.enabled ? 'deactivate' : 'activate'
                entry.audibleWhenMuted ? playSoundEvenWhenMuted(sound) : playSound(sound)
                entry.onToggle()

TaskFormPage  Radio onChange    ─► playSound('activate'); change({ dueKind })
RepeatFields  Checkbox onChange ─► playSound(checked ? 'activate' : 'deactivate'); onRepeatsChange(checked)
DeadlineField step(step)        ─► playSound('arrow'); onStep(step)
                ├─ ▲ onClick → step(1),  ▼ onClick → step(-1)
                └─ <SpinButton onStep={step}>
```

Was man hört:

```
Tipp                                Sounds an,     Sounds an,     Sounds aus
                                    Animation an   Animation aus
Schalter Dunkelmodus/Animationen    (de)activate   (de)activate   –
Schalter Sounds ausschalten         deactivate     deactivate     (nicht möglich)
Schalter Sounds einschalten         (nicht mögl.)  (nicht mögl.)  activate
Radio Fälligkeit wechseln           activate       activate       –
Checkbox Wiederkehrend              (de)activate   (de)activate   –
▲ / ▼ / ↑ / ↓ beim Stichtag         arrow          arrow          –
Filter offen / erledigt             page-turn      –              –
```

## Abstraktionen und Wiederverwendung

- `public/sounds`
  - `activate.wav`, `deactivate.wav`, `arrow.wav`: werden eingecheckt
- `src/shared/sound`
  - `soundEffects.ts`
    - `SoundEffect = 'pageTurn' | 'confirm' | 'refuse' | 'activate' | 'deactivate' | 'arrow'`
    - `ActionSound` bleibt `Exclude<SoundEffect, 'pageTurn'>`
  - `webAudioSoundEffects.ts`, `inMemorySoundEffects.ts`: ohne Änderung
- `src/shared/ui`
  - `pageSlide.ts`
    - `PageSlideSettings.playEvenWhenMuted: (effect: SoundEffect) => void`
    - `PageSlide.playSoundEvenWhenMuted: (sound: ActionSound) => void`
    - `ANIMATED_WITHOUT_SOUND` bekommt `playEvenWhenMuted: () => {}`
  - `PageSlideProvider.tsx`: reicht `playEvenWhenMuted` ungeprüft an `soundEffects.play`
    weiter
  - `SettingsPage.tsx`
    - `SettingsEntry.audibleWhenMuted?: boolean`
    - lokale Funktion `toggle(entry)` nach dem Zielbild
    - Den Namen der Ton-Auswahl als sprechende Funktion fassen, etwa
      `switchSoundFor(enabled)`
  - `SpinButton.tsx`: ohne Änderung
- `src/tasks/ui`
  - `TaskFormPage.tsx`: Das Radio spielt `activate`. `playSound` ist dort schon
    vorhanden (`TaskFormPage.tsx:50`).
  - `RepeatFields.tsx`: holt `playSound` über `usePageSlide()` und spielt
    `activate` oder `deactivate`
  - `DeadlineStepper.tsx`: `DeadlineField` holt `playSound` über `usePageSlide()` und
    hüllt `onStep` in `step` ein
- `src/SignedInApp.tsx`: Der Eintrag `sounds` bekommt `audibleWhenMuted: true`.
- `src/main.tsx`: drei neue URLs
- Tests verwenden wieder: `createInMemorySoundEffects`, `installFakeViewTransitions`,
  `renderAppHearing` (`App.test.tsx:643`), `renderFoldersArea` mit `Hearing` sowie
  `soundsOfTapping` in `FoldersAreaSound.test.tsx`. `stepButtonOf` aus
  `FoldersAreaDeadline.test.tsx:66` dient als Muster für das Antippen von ▲ und ▼.

## Logging und Beobachtbarkeit

Keine Änderungen.

## Umsetzung

### Phase 1: Töne der Schalter in den Einstellungen

Abhängigkeiten: keine

Diese Phase erweitert den Port um drei Töne und vertont die drei Schalter. Der Schalter
„Sounds“ ist dabei in beide Richtungen zu hören.

**Aufgaben**:
- [x] `public/sounds/activate.wav`, `deactivate.wav` und `arrow.wav` mit einchecken.
- [x] `soundEffects.ts`: `SoundEffect` um `'activate' | 'deactivate' | 'arrow'`
  erweitern.
- [x] `main.tsx`: die URLs `activate: \`${soundsPath}/activate.wav\``, `deactivate` und
  `arrow` ergänzen.
- [x] Test zuerst: `src/shared/ui/pageSlide.test.tsx`
  - `plays an action sound even when muted`: `createPageSlide` bekommt ein
    aufzeichnendes `playEvenWhenMuted`. `playSoundEvenWhenMuted('activate')` landet
    dort und nicht in `play`, und es wird keine Richtung protokolliert.
  - Den bestehenden Aufruf `createPageSlide({ animations, play: soundEffects.play })`
    (`pageSlide.test.tsx:11`) um `playEvenWhenMuted` ergänzen.
- [x] `pageSlide.ts` und `PageSlideProvider.tsx` nach dem Zielbild erweitern.
- [x] Test zuerst: `src/App.test.tsx`, Block „App sound“. Jeder Fall öffnet die
  Einstellungen mit `slideByClicking('Einstellungen')` und prüft `played()` ab dort.
  - `plays the deactivate and activate sounds when switching dark mode`: Der
    In-Memory-Client startet mit `darkMode = true`. Zweimal „Dunkelmodus“ ergibt
    deshalb `['pageTurn', 'deactivate', 'activate']`.
  - `plays the switch sounds for animations even while animations are turned off`:
    „Animationen“ aus und wieder an ergibt `['pageTurn', 'deactivate', 'activate']`.
  - `plays the deactivate sound when turning sounds off`: Der bestehende Fall
    `stays silent once sounds are turned off` wird angepasst. Er erwartet jetzt
    `['pageTurn', 'deactivate']`. Das anschließende Blättern zu „Ordner“ bleibt still,
    und `storedSounds()` ist `false`.
  - `plays the activate sound when turning sounds on`: mit
    `createInMemoryAppearanceClient({ sounds: false })`. Einstellungen öffnen bleibt
    still, „Sounds“ einschalten ergibt `['activate']`.
  - `keeps the other switches silent once sounds are turned off`: mit
    `sounds: false` bleibt „Dunkelmodus“ umschalten bei `[]`.
- [x] `SettingsPage.tsx`: `audibleWhenMuted` und `toggle(entry)`. `onChange` ruft
  `toggle(entry)` statt `entry.onToggle` auf.
- [x] `SignedInApp.tsx`: Der Eintrag `sounds` bekommt `audibleWhenMuted: true`.

**Automatisierte Verifikation**:
- [x] `pageSlide.test.tsx` und `App.test.tsx` laufen grün.
- [x] `npm run test && npm run test:rules` läuft grün.
- [x] `npm run lint` läuft fehlerfrei.
- [x] `npm run build` läuft fehlerfrei. `dist/sw.js` enthält `sounds/activate.wav`,
  `sounds/deactivate.wav` und `sounds/arrow.wav`.

**Manuelle Verifikation** (iPhone, installierte PWA):
- [ ] „Dunkelmodus“ ein- und ausschalten: Es erklingen `activate` und `deactivate`.
- [ ] „Animationen“ aus und wieder ein: Beide Töne sind zu hören.
- [ ] „Sounds“ aus: Es erklingt noch `deactivate`, danach ist alles still.
- [ ] „Sounds“ wieder ein: Es erklingt sofort `activate`.
- [ ] Stummschalter auf lautlos: Alle Töne sind still.

### Phase 2: Töne im Aufgabenformular

Abhängigkeiten: Phase 1 (Typ und URLs)

Diese Phase vertont das Radio „Fälligkeit“, die Checkbox „Wiederkehrend“ und die Pfeile
des Stichtags.

**Aufgaben**:
- [x] Test zuerst: `src/tasks/ui/FoldersAreaSound.test.tsx`, neuer Abschnitt zum
  Aufgabenformular. Er öffnet das Formular über „Aufgabe anlegen“ in der Liste und
  nutzt `soundsOfTapping`.
  - `plays the activate sound when choosing another due kind`: „Stichtag“ ergibt
    `['activate']`, „Irgendwann“ ergibt `['activate']`.
  - `stays silent when tapping the due kind already chosen`: ein zweiter Tipp auf
    „Irgendwann“ ergibt `[]`.
  - `plays the activate and deactivate sounds for Wiederkehrend`: Nach „Stichtag“
    ergibt das Anhaken `['activate']` und das Abhaken `['deactivate']`.
  - `plays the arrow sound for each step button`: ▲ bei „Tag“ und ▼ bei „Monat“ ergeben
    je `['arrow']`. Die Buttons sind `aria-hidden`, also wie in
    `FoldersAreaDeadline.test.tsx:66` über den Text in der `.deadlineField`-Spalte
    finden.
  - `plays the arrow sound for each arrow key`: Fokus auf den Spinbutton „Jahr“,
    `{ArrowUp}` und `{ArrowDown}` ergeben `['arrow', 'arrow']`. `{ArrowLeft}` ergibt
    `[]`.
  - `plays the arrow sound even at the last year`: Eine bestehende Aufgabe mit
    Stichtag im Jahr 2099 bearbeiten. ▲ bei „Jahr“ ergibt `['arrow']`, und das Jahr
    bleibt 2099.
  - `plays the form sounds while animations are turned off`: mit
    `animations: false` ergeben Radio, Checkbox und ▲ der Reihe nach
    `['activate']`, `['activate']` und `['arrow']`.
- [x] `TaskFormPage.tsx`: Das Radio spielt in `onChange` erst `playSound('activate')`
  und ruft dann `change({ dueKind })` auf.
- [x] `RepeatFields.tsx`: `onChange` spielt `activate` oder `deactivate` nach
  `event.target.checked` und ruft dann `onRepeatsChange` auf.
- [x] `DeadlineStepper.tsx`: `DeadlineField` bekommt `step(step)` mit `playSound('arrow')`
  vor `onStep(step)`. ▲, ▼ und `SpinButton.onStep` nutzen `step`.

**Automatisierte Verifikation**:
- [x] `FoldersAreaSound.test.tsx` läuft grün.
- [x] `FoldersAreaDeadline.test.tsx`, `FoldersAreaRecurring.test.tsx`,
  `UrgentArea.test.tsx` und `SpinButton.test.tsx` laufen unverändert grün.
- [x] `npm run test && npm run test:rules` läuft grün.
- [x] `npm run lint` läuft fehlerfrei.
- [x] `npm run build` läuft fehlerfrei.

**Manuelle Verifikation** (iPhone, installierte PWA):
- [ ] Aufgabe anlegen, „Stichtag“ wählen: Es erklingt `activate`. Ein erneuter Tipp
  bleibt still.
- [ ] „Wiederkehrend“ an- und abhaken: Es erklingen `activate` und `deactivate`.
- [ ] ▲ und ▼ bei Tag, Monat und Jahr: Jeder Tipp spielt `arrow`. Schnelles Tippen
  klingt nicht abgehackt.
- [ ] Filter „offen / erledigt“: Es blättert wie bisher.

## Notizen zur Umsetzung

- Auf Wunsch des Nutzers wurden beide Phasen am Stück umgesetzt, committet und
  gepusht. Die manuelle Prüfung beider Phasen auf dem iPhone steht noch aus.
- Die Auswahl zwischen activate und deactivate liegt in
  `src/shared/ui/toggleSound.ts` (`toggleSoundFor(turnedOn)`). `SettingsPage` und
  `RepeatFields` nutzen sie gemeinsam, statt sie doppelt zu führen. Deshalb gibt es
  kein lokales `switchSoundFor` in `SettingsPage`.
- Die Fixture in `webAudioSoundEffects.test.ts` (`SOUND_URLS`, `SOUND_BYTES`) musste
  um die drei neuen Töne ergänzt werden, weil `SoundUrls` ein `Record` über
  `SoundEffect` ist. Der Plan hatte diese Stelle nicht aufgeführt.
- Der Test für den Sounds-Schalter heißt jetzt `plays the deactivate sound when
  turning sounds off and stays silent after`.
- `npm run test:rules` braucht Java im `PATH`. Lokal liefert es mise
  (`corretto-21`).

## Verweise

- Vorgängerplan mit `confirm` und `refuse`:
  `docs/agents/plans/2026-11-06-bestaetigen-abbrechen-sounds.md` (MUL-015)
- Port, Adapter und Schalter: `docs/agents/plans/2026-11-06-animationen-und-sounds.md`
  (MUL-014)
