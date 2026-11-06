---
date: 2026-11-06T07:07:19.421062+00:00
git_commit: bc932f8c0986b7806ec55cf6ac1ee384268ddbff
branch: main
story: MUL-014
topic: "Schalter für Animationen und Sounds, Blättergeräusch beim Gleiten"
tags: [plan, shared-ui, appearance, sound, settings, view-transitions, pwa]
status: ready
---

# PLAN: MUL-014 — Schalter für Animationen und Sounds, Blättergeräusch beim Gleiten

Bei jedem Gleiten aus MUL-013 soll ein Blättergeräusch zu hören sein. In den
Einstellungen kommen unter „Dunkelmodus“ zwei Schalter dazu: einer für die Animationen,
einer für die Sounds. Steht der Stummschalter des iPhones auf lautlos, bleibt das
Geräusch aus. Grundlage ist die Klärung vom 06.11.2026.

## Akzeptanzkriterien

- Unter „Dunkelmodus“ stehen die zwei Schalter „Animationen“ und „Sounds“. Beide sind
  standardmäßig an und werden je Gerät im `localStorage` gespeichert.
- Steht „Animationen“ auf aus, wechseln Seiten, Bereiche und Filter sofort, ohne
  Gleiten.
- Bei jedem Gleiten, das tatsächlich abläuft, ertönt das Blättergeräusch genau einmal,
  sofern „Sounds“ an ist. Das gilt für Seiten-, Bereichs- und Filterwechsel.
- Läuft keine Animation, ertönt auch kein Geräusch. Das betrifft:
  - den Schalter „Animationen“ auf aus
  - „Bewegung reduzieren“
  - Browser ohne View-Transition-Typen
  - einen Klick auf den Filter oder Bereich, der schon gewählt ist
- Der Schalter „Sounds“ bleibt bedienbar und behält seinen Wert, auch wenn
  „Animationen“ aus ist.
- Steht der Stummschalter des iPhones auf lautlos, ist kein Geräusch zu hören. Laufende
  Musik wird durch das Geräusch nicht unterbrochen.
- Die Sounddatei liegt unter `public/sounds/page-turn.wav` und wird offline aus dem
  Cache gespielt. Fehlt sie oder lässt sie sich nicht laden, bleibt es still, ohne
  Fehler und ohne Ansage.

## Wesentliche Entscheidungen und Abwägungen

1. **Ton bei allen drei Gleitarten:** Seite, Bereich und Filter.
   - Warum: Jedes Gleiten ist ein sichtbares „Umblättern“.
   - Auswirkung: Der Ton entsteht an der einen zentralen Stelle `slide()` in
     `pageSlide.ts`.
2. **Ton nur zusammen mit Animation (Variante A):** Ohne Animation gibt es keinen Ton.
   Der Schalter „Sounds“ wird dabei nicht ausgegraut.
   - Warum: Der Wunsch lautete „jedes Mal, wenn eine Seitenanimation abläuft“.
   - Auswirkung: Es braucht keinen `disabled`-Zustand für `SettingsEntry`.
3. **`PageSlideProvider` und `usePageSlide()` statt freier Funktionen:**
   `createPageSlide(settings)` baut `slidePage`, `slideForward`, `slideBack` und
   `slideItems`. Der Provider stellt das Ergebnis per Context bereit.
   - Warum: Die Abhängigkeit von den Schaltern ist sichtbar, es gibt keinen globalen
     Zustand, und Tests können Werte und Fakes hineingeben.
   - Auswirkung: In `FoldersArea`, `TaskFlow`, `UrgentArea` und `SignedInApp` holt
     `const { … } = usePageSlide()` die Funktionen. Die Aufrufstellen bleiben gleich.
     Ohne Provider gilt „Animation an, kein Ton“, also das heutige Verhalten. Deshalb
     laufen alle bestehenden Komponententests ohne Provider weiter.
4. **`AppearanceClient` erweitern:** Neu sind `readAnimations`/`writeAnimations` und
   `readSounds`/`writeSounds` mit den Schlüsseln `animations` und `sounds`. Ein fehlender
   oder unbekannter Wert gilt als an.
   - Warum: Das sind Einstellungen des Geräts wie der Dunkelmodus. So gibt es keinen
     zweiten Adapter, Fake und Hook für zwei Schalter.
   - Auswirkung: `useAppearance` liefert zusätzlich `animations`, `toggleAnimations`,
     `sounds` und `toggleSounds`.
5. **Port `PageTurnSound { play(): void }` mit Web-Audio-Adapter:** Der Adapter setzt
   `navigator.audioSession.type = 'ambient'`, sofern vorhanden. Er lädt und dekodiert
   die Datei einmal beim Start und spielt sie bei `play()` über eine
   `AudioBufferSourceNode`.
   - Warum: Den Zustand des Stummschalters kann eine Web-App nicht auslesen. In der
     Sitzungsart `ambient` schaltet iOS den Ton selbst stumm und mischt ihn zu laufender
     Musik, statt diese zu unterbrechen. Web Audio spielt ohne merkliche Verzögerung.
   - Auswirkung: Ob der Stummschalter wirklich greift, lässt sich nur auf dem echten
     iPhone prüfen. Das steht unter manueller Verifikation. Einen angehaltenen
     `AudioContext` setzt `play()` per `resume()` fort. Das klappt, weil jedes Gleiten
     aus einem Tippen entsteht und iOS Audio erst nach einer Nutzergeste erlaubt.
6. **Fehlertoleranz:** Fehlt `AudioContext`, schlägt `fetch` fehl, liefert der Server
   keinen 2xx-Status oder scheitert das Dekodieren, bleibt `play()` stumm. Es gibt dann
   keinen Fehler, keine Ansage und kein Logging.
7. **Datei und Cache:** Die Datei liegt unter `public/sounds/page-turn.wav`. Ihre URL
   entsteht aus `import.meta.env.BASE_URL`, weil die App unter `/mental-unloader/`
   läuft. In `vite.config.ts` kommt `wav` in die `globPatterns` von Workbox.
8. **Überlagerung:** Bei schnellem Tippen startet jedes `play()` eine eigene Quelle.
   Die Geräusche dürfen sich kurz überlagern.

## Ausgangslage

```
App ── useAppearance(appearanceClient) ─► { darkMode, toggleDarkMode }
 └─ SignedInApp
     ├─ settingsEntries: [Dunkelmodus]                      src/SignedInApp.tsx:66
     ├─ selectArea → slidePage(direction, …)                src/SignedInApp.tsx:89
     ├─ UrgentArea   import { slideForward }                src/tasks/ui/UrgentArea.tsx:2
     ├─ FoldersArea  import { slideBack, slideForward,      src/tasks/ui/FoldersArea.tsx:3
     │                         slideItems, directionBetween }
     │    └─ switchFilter(from, to, action) auf Modulebene  src/tasks/ui/FoldersArea.tsx:84
     └─ TaskFlow     import { slideBack, slideForward }     src/tasks/ui/TaskFlow.tsx:3

pageSlide.ts: freie Funktionen, alle über slide(type, action)   src/shared/ui/pageSlide.ts:24
  ├─ kein ViewTransition.types / prefers-reduced-motion ─► action()
  └─ sonst document.startViewTransition({ update: () => flushSync(action), types })
```

- `AppearanceClient` (`src/shared/appearance/appearanceClient.ts`) kennt nur
  `readDarkMode`/`writeDarkMode`. Der `localStorage`-Adapter fängt einen gesperrten
  Speicher per `try/catch` ab. Der Fake `createInMemoryAppearanceClient(darkMode)` hat
  `storedDarkMode()`.
- `SettingsPage` rendert `SettingsEntry`-Toggles als `role="switch"`
  (`src/shared/ui/SettingsPage.tsx:61`).
- Workbox legt `js,css,html,svg,png,webmanifest` im Cache ab (`vite.config.ts:50`).

## Zielbild

```
main.tsx
 ├─ appearanceClient = createLocalStorageAppearanceClient()
 └─ pageTurnSound    = createWebAudioPageTurnSound(`${BASE_URL}sounds/page-turn.wav`)

App ── useAppearance ─► { darkMode, animations, sounds, toggle… }
 └─ <PageSlideProvider animations sounds pageTurnSound>
      └─ SignedInApp, UrgentArea, FoldersArea, TaskFlow
           const { slideForward, slideBack, slidePage, slideItems } = usePageSlide()

createPageSlide({ animations, onSlide })
  slide(type, action)
    ├─ !animations ─────────────────┐
    ├─ kein ViewTransition.types ───┼─► action()                (kein Ton)
    ├─ prefers-reduced-motion ──────┘
    └─ sonst ─► onSlide()                                       (→ sounds && play())
               document.startViewTransition({ update, types })
```

Einstellungen vorher und nachher:

```
vorher                          nachher
┌──────────────────────┐        ┌──────────────────────┐
│ [✓]  [📁]  [⚙]       │        │ [✓]  [📁]  [⚙]       │
│ Einstellungen        │        │ Einstellungen        │
│ Dunkelmodus      [✓] │        │ Dunkelmodus      [✓] │
│                      │        │ Animationen      [✓] │
│ [Abmelden]           │        │ Sounds           [✓] │
└──────────────────────┘        │                      │
                                │ [Abmelden]           │
                                └──────────────────────┘
```

## Abstraktionen und Wiederverwendung

- `src/shared/appearance`
  - `appearanceClient.ts`: `AppearanceClient` um `readAnimations`, `writeAnimations`,
    `readSounds` und `writeSounds` erweitern
  - `localStorageAppearanceClient.ts`: `storedValue`/`store` nehmen den Schlüssel als
    Parameter. Neu sind `ANIMATIONS_KEY = 'animations'` und `SOUNDS_KEY = 'sounds'`.
  - `inMemoryAppearanceClient.ts`: Signatur
    `createInMemoryAppearanceClient({ darkMode = true, animations = true, sounds = true } = {})`,
    dazu `storedAnimations()` und `storedSounds()`
  - `useAppearance.ts`: `animations`, `toggleAnimations`, `sounds` und `toggleSounds`
- `src/shared/ui`
  - `pageSlide.ts`
    - `PageSlideSettings = { animations: boolean; onSlide: () => void }`
    - `PageSlide = { slidePage, slideForward, slideBack, slideItems }`
    - `createPageSlide(settings = ANIMATED_WITHOUT_SOUND): PageSlide`
    - `directionBetween` bleibt eine freie Funktion. Die freien Exporte
      `slidePage`, `slideForward`, `slideBack` und `slideItems` entfallen.
  - `PageSlideProvider.tsx` (neu): `PageSlideProvider` und `usePageSlide()`. Der Context
    hat als Standard `createPageSlide()`.
- `src/shared/sound` (neu)
  - `pageTurnSound.ts`: Port `PageTurnSound { play(): void }`
  - `inMemoryPageTurnSound.ts`: Fake mit `plays(): number`
  - `webAudioPageTurnSound.ts`: Adapter
    `createWebAudioPageTurnSound(soundUrl, audioEnvironment = browserAudioEnvironment())`.
    `AudioEnvironment` bündelt `createContext`, `fetch` und `audioSession`, damit der
    Integrationstest ohne Browser läuft.
- `src/testSupport/fakeViewTransitions.ts`: wird unverändert wiederverwendet

Skizze von `pageSlide.ts`:

```ts
export type PageSlideSettings = {
  animations: boolean
  onSlide: () => void
}

export type PageSlide = {
  slidePage: (direction: SlideDirection, action: () => void) => void
  slideForward: (action: () => void) => void
  slideBack: (action: () => void) => void
  slideItems: (direction: SlideDirection, action: () => void) => void
}

const ANIMATED_WITHOUT_SOUND: PageSlideSettings = {
  animations: true,
  onSlide: () => {},
}

export function createPageSlide(
  settings: PageSlideSettings = ANIMATED_WITHOUT_SOUND,
): PageSlide {
  function slide(type: SlideTransitionType, action: () => void) {
    if (
      !settings.animations ||
      !supportsTypedViewTransitions() ||
      prefersReducedMotion()
    ) {
      action()
      return
    }
    settings.onSlide()
    document.startViewTransition({
      update: () => flushSync(action),
      types: [type],
    })
  }

  const slidePage = (direction: SlideDirection, action: () => void) =>
    slide(direction, action)

  return {
    slidePage,
    slideForward: (action) => slidePage('forward', action),
    slideBack: (action) => slidePage('back', action),
    slideItems: (direction, action) =>
      slide(ITEMS_TRANSITION_TYPES[direction], action),
  }
}
```

Die Prüfung `!settings.animations` steht vorn. So wird bei abgeschalteter Animation
weder `ViewTransition` noch `matchMedia` angefasst.

Skizze des Providers:

```tsx
const PageSlideContext = createContext<PageSlide>(createPageSlide())

export function PageSlideProvider({ animations, sounds, pageTurnSound, children }) {
  const pageSlide = useMemo(
    () =>
      createPageSlide({
        animations,
        onSlide: () => {
          if (sounds) pageTurnSound.play()
        },
      }),
    [animations, sounds, pageTurnSound],
  )
  return <PageSlideContext value={pageSlide}>{children}</PageSlideContext>
}

export function usePageSlide(): PageSlide {
  return useContext(PageSlideContext)
}
```

Skizze des Adapters:

```ts
export function createWebAudioPageTurnSound(
  soundUrl: string,
  audioEnvironment: AudioEnvironment = browserAudioEnvironment(),
): PageTurnSound {
  audioEnvironment.useAmbientAudioSession()
  const context = audioEnvironment.createContext()
  let buffer: AudioBuffer | null = null
  void loadBuffer(audioEnvironment, context, soundUrl).then((loaded) => {
    buffer = loaded
  })

  return {
    play() {
      if (context === null || buffer === null) return
      if (context.state === 'suspended') void context.resume().catch(() => {})
      const source = context.createBufferSource()
      source.buffer = buffer
      source.connect(context.destination)
      source.start()
    },
  }
}
```

`loadBuffer` liefert `null` bei fehlendem Context, Netzwerkfehler, Status außerhalb von
2xx oder Fehler beim Dekodieren. `browserAudioEnvironment()` liefert `null` als Context,
wenn `AudioContext` fehlt. `useAmbientAudioSession()` setzt `type = 'ambient'` nur, wenn
`'audioSession' in navigator` gilt. Der Typ von `navigator.audioSession` fehlt in
`lib.dom.d.ts`. Er wird daher als schmales lokales Interface im Adapter beschrieben,
ohne `any`.

## Logging und Beobachtbarkeit

Keine Änderungen.

## Umsetzung

### Phase 1: Schalter „Animationen“

Abhängigkeiten: keine

Diese Phase stellt das Gleiten auf den Provider um und liefert den Schalter
„Animationen“. Danach lässt sich das Gleiten in den Einstellungen abschalten.

**Aufgaben**:
- [x] Test zuerst: `src/shared/appearance/localStorageAppearanceClient.test.ts`
  erweitern. Der Helfer `storageHolding` hält dafür Werte je Schlüssel.
  - `reads remembered animations as turned off`
  - `reads nothing remembered for animations as turned on`
  - `remembers animations turned off`, mit `{ [ANIMATIONS_KEY]: 'false' }`
  - `stays usable for animations while the storage is blocked`
- [x] `appearanceClient.ts`, `localStorageAppearanceClient.ts` und
  `inMemoryAppearanceClient.ts` um `animations` erweitern. Der Fake bekommt die
  Options-Signatur. Die Aufrufer in `src/App.test.tsx:373` und
  `src/shared/appearance/useAppearance.test.tsx:31` werden auf `{ darkMode }`
  umgestellt.
- [x] Test zuerst: `useAppearance.test.tsx`, Fall `toggles the animations and remembers
  them`
- [x] `useAppearance.ts`: `animations` und `toggleAnimations`
- [x] Test zuerst: `src/shared/ui/pageSlide.test.tsx` auf `createPageSlide()` umstellen.
  Die bestehenden Fälle bleiben inhaltlich gleich. Neu:
  - `runs the action at once when animations are turned off`: mit installiertem Fake
    und `createPageSlide({ animations: false, onSlide })`. Es wird keine Richtung
    protokolliert, und `onSlide` wird nicht aufgerufen.
  - `reports each slide that animates`: `onSlide` wird je `slideForward`/`slideItems`
    einmal aufgerufen.
  - `does not report a slide when reduced motion is preferred`
- [x] `src/shared/ui/pageSlide.ts` nach der Skizze umbauen.
- [x] `src/shared/ui/PageSlideProvider.tsx` nach der Skizze anlegen. In Phase 1 ist
  `pageTurnSound` noch nicht da: Der Provider bekommt nur `animations`, und `onSlide`
  ist leer. Phase 2 ergänzt `sounds` und `pageTurnSound`.
- [x] `FoldersArea.tsx`, `TaskFlow.tsx`, `UrgentArea.tsx` und `SignedInApp.tsx` auf
  `usePageSlide()` umstellen. `switchFilter` in `FoldersArea.tsx:84` bekommt
  `slideItems` als Parameter, weil es auf Modulebene liegt und keinen Hook rufen darf.
- [x] Test zuerst: `src/App.test.tsx`
  - `shows the animations switch below dark mode, turned on`: Reihenfolge der Schalter
    `['Dunkelmodus', 'Animationen']`
  - `stops sliding once animations are turned off`: mit installiertem Fake. Nach dem
    Ausschalten protokolliert ein Bereichswechsel keine weitere Richtung. Der Wechsel in
    die Einstellungen selbst ist noch `forward`.
    `appearanceClient.storedAnimations()` ist `false`.
  - `starts without sliding when animations were turned off before`
- [x] `App.tsx`: `SignedInApp` in `<PageSlideProvider animations={appearance.animations}>`
  einwickeln.
- [x] `SignedInApp.tsx`: Eintrag `{ kind: 'toggle', id: 'animations', label:
  'Animationen', … }` hinter „Dunkelmodus“

**Automatisierte Verifikation**:
- [x] `localStorageAppearanceClient.test.ts`, `useAppearance.test.tsx`,
  `pageSlide.test.tsx` und `App.test.tsx` laufen grün.
- [x] `FoldersAreaSlide.test.tsx`, `TaskFlowSlide.test.tsx` und `UrgentArea.test.tsx`
  laufen ohne inhaltliche Änderung grün, also ohne Provider.
- [x] `npm run test && npm run test:rules` läuft grün.
- [x] `npm run lint` läuft fehlerfrei.
- [x] `npm run build` läuft fehlerfrei.

**Manuelle Verifikation** (iPhone, installierte PWA):
- [ ] Unter „Dunkelmodus“ steht „Animationen“, eingeschaltet.
- [ ] Mit „Animationen“ aus wechseln Ordner, Liste, Filter und Bereiche sofort.
- [ ] Nach einem Neustart der App ist der Schalter noch aus.
- [ ] Wieder eingeschaltet gleitet alles wie vorher.

### Phase 2: Blättergeräusch und Schalter „Sounds“

Abhängigkeiten: Phase 1

Diese Phase liefert den Ton beim Gleiten und den Schalter „Sounds“. Danach blättert es
hörbar, und der Stummschalter lässt sich prüfen.

**Aufgaben**:
- [x] Test zuerst: `localStorageAppearanceClient.test.ts` analog zu Phase 1 für
  `sounds` und `SOUNDS_KEY` erweitern.
- [x] `appearanceClient.ts`, `localStorageAppearanceClient.ts` und
  `inMemoryAppearanceClient.ts` um `sounds` erweitern, dazu `storedSounds()`.
- [x] Test zuerst: `useAppearance.test.tsx`, Fall `toggles the sounds and remembers them`
- [x] `useAppearance.ts`: `sounds` und `toggleSounds`
- [x] `src/shared/sound/pageTurnSound.ts` (Port) und
  `src/shared/sound/inMemoryPageTurnSound.ts` (Fake mit `plays()`) anlegen.
- [x] Integrationstest: `src/shared/sound/webAudioPageTurnSound.test.ts` mit einem
  `AudioEnvironment` aus einfachen Objektliteralen (kein Mockito-artiges Mocking)
  - `asks for an ambient audio session so the silent switch mutes it`
  - `plays the loaded sound through the audio context`: Nach dem Laden startet `play()`
    eine Quelle mit dem dekodierten Puffer.
  - `resumes a suspended audio context when playing`
  - `stays silent while the sound is still loading`
  - `stays silent when the sound file is missing`: Status 404
  - `stays silent when the sound cannot be decoded`
  - `stays silent without web audio`: `createContext` liefert `null`
- [x] `src/shared/sound/webAudioPageTurnSound.ts` nach der Skizze umsetzen.
- [x] `PageSlideProvider.tsx`: `sounds` und `pageTurnSound` ergänzen, `onSlide` spielt
  bei `sounds` den Ton.
- [x] `App.tsx`: neue Prop `pageTurnSound: PageTurnSound`, die an den Provider geht.
  In `renderApp` (`src/App.test.tsx:33`) kommt sie als letzter Parameter mit
  `createInMemoryPageTurnSound()` als Standard hinzu.
- [x] Test zuerst: `src/App.test.tsx`
  - `shows the sounds switch below animations, turned on`: Reihenfolge
    `['Dunkelmodus', 'Animationen', 'Sounds']`
  - `plays the page turn sound once for each slide`: mit installiertem Fake. Bereich,
    Ordner öffnen und Filter wechseln ergibt `plays()` gleich 3.
  - `does not play the page turn sound when choosing the area already shown`
  - `stays silent once sounds are turned off`, dabei ist
    `appearanceClient.storedSounds()` `false`.
  - `stays silent while animations are turned off`: Sounds an, Animationen aus.
    `plays()` ist 0, und der Schalter „Sounds“ bleibt bedienbar und eingeschaltet.
  - `stays silent when reduced motion is preferred`
- [x] `SignedInApp.tsx`: Eintrag `{ kind: 'toggle', id: 'sounds', label: 'Sounds', … }`
  hinter „Animationen“
- [x] `main.tsx`: `createWebAudioPageTurnSound(`${import.meta.env.BASE_URL}sounds/page-turn.wav`)`
  erzeugen und an `App` übergeben.
- [x] `vite.config.ts`: `globPatterns` um `wav` ergänzen, also
  `'**/*.{js,css,html,svg,png,wav,webmanifest}'`.
- [x] `public/sounds/` anlegen. Der Nutzer legt die Datei `page-turn.wav` dort ab. Ist
  sie bei der Umsetzung noch nicht da, bleibt der Ordner mit `.gitkeep` bestehen. Die
  App bleibt dann still, wie in Entscheidung 6 beschrieben.

**Automatisierte Verifikation**:
- [x] `localStorageAppearanceClient.test.ts`, `useAppearance.test.tsx`,
  `webAudioPageTurnSound.test.ts` und `App.test.tsx` laufen grün.
- [x] `npm run test && npm run test:rules` läuft grün.
- [x] `npm run lint` läuft fehlerfrei.
- [x] `npm run build` läuft fehlerfrei. Liegt `page-turn.wav` vor, enthält
  `dist/sw.js` den Eintrag `sounds/page-turn.wav` im Precache.

**Manuelle Verifikation** (iPhone, installierte PWA, `page-turn.wav` vorhanden):
- [ ] Unter „Animationen“ steht „Sounds“, eingeschaltet.
- [ ] Ordner öffnen, Zurück, Filter wechseln und Bereich wechseln: Jedes Mal ertönt
  einmal das Blättergeräusch, gleichzeitig mit dem Gleiten.
- [ ] Ein Klick auf den bereits gewählten Filter oder Bereich bleibt still.
- [ ] „Sounds“ aus: Es gleitet ohne Ton. Nach einem Neustart der App ist der Schalter
  noch aus.
- [ ] „Animationen“ aus, „Sounds“ an: Es wechselt sofort und bleibt still.
- [ ] Stummschalter auf lautlos: Es gleitet ohne Ton. Stummschalter zurück: Der Ton ist
  wieder da.
- [ ] Mit laufender Musik, etwa Podcast oder Spotify, mischt sich das Geräusch dazu, ohne
  die Musik anzuhalten.
- [ ] Im Flugmodus nach einmaligem Laden der neuen Version ist der Ton weiterhin da.

## Notizen zur Umsetzung

- Auf Wunsch des Nutzers wurden beide Phasen am Stück umgesetzt und gemeinsam gepusht.
  Die manuelle Prüfung beider Phasen folgt auf dem iPhone.
- `switchFilter` liegt jetzt als innere Funktion in `FoldersArea` und nutzt
  `slideItems` aus `usePageSlide()`. Das ist lesbarer als ein zusätzlicher Parameter,
  und die Aufrufstellen bleiben gleich.
- Der Adapter kapselt den `AudioContext` hinter dem schmalen Typ
  `AudioOutput<Sound>` mit `isRunning`, `resume`, `decode` und `play`. Dazu kommt
  `AudioEnvironment<Sound>` mit `chooseAmbientAudioSession`, `createOutput` und
  `fetch`. So kommt der Test mit Objektliteralen aus, ohne Casts auf `AudioBuffer`.
  Testbar ist `createPageTurnSound(url, environment)`, für den Browser gibt es
  `createWebAudioPageTurnSound(url)`.
- `chooseAmbientAudioSession` heißt bewusst nicht `use…`, sonst schlägt
  `react-hooks/rules-of-hooks` an.
- `play()` setzt einen nicht laufenden Context auch dann fort, wenn der Ton noch lädt.
  Damit wird iOS-Audio schon beim ersten Tippen freigeschaltet. iOS kennt neben
  `suspended` auch `interrupted`, deshalb lautet die Prüfung `state === 'running'`.
- `public/sounds/page-turn.wav` (164 KB) hat der Nutzer bereitgestellt. Sie steht im
  Precache von `dist/sw.js`, insgesamt sind es 17 Einträge.
- Node kommt lokal über `fnm`, Java für `test:rules` über
  `mise exec java@corretto-21`.

## Verweise

- MDN Web Audio API `AudioBufferSourceNode`:
  https://developer.mozilla.org/docs/Web/API/AudioBufferSourceNode
- MDN `BaseAudioContext.decodeAudioData()`:
  https://developer.mozilla.org/docs/Web/API/BaseAudioContext/decodeAudioData
- W3C Audio Session (Editor's Draft): https://w3c.github.io/audio-session/
- WebKit Bug 264473 (Audio Session, Stummschalter):
  https://bugs.webkit.org/show_bug.cgi?id=264473
- WebKit Bug 237322 (Web Audio und Stummschalter):
  https://bugs.webkit.org/show_bug.cgi?id=237322
- Vite `public`-Ordner und `BASE_URL`:
  https://vite.dev/guide/assets#the-public-directory
- Verwandter Plan: `docs/agents/plans/2026-11-05-seitenwechsel-gleiten.md` (MUL-013)
