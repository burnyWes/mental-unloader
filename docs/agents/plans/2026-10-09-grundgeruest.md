---
date: 2026-10-09
git_commit: 94074bdd3be28853ff7f8e28df6fd43ea4ca270e
branch: main
story: MUL-001
topic: "Grundgerüst: leere App auf dem Home-Bildschirm"
tags: [plan, grundgeruest, pwa, navigation, dunkelmodus, github-pages, architekturtest]
status: done
---

# PLAN: MUL-001 — Grundgerüst: leere App auf dem Home-Bildschirm

Erster Teilplan des Gesamtplans `docs/agents/plans/2026-10-08-gesamtplan.md` (Zeile 256).
Ziel ist eine leere, aber vollständig bedienbare und ausgerollte App. Sie lässt sich auf
dem iPhone zum Home-Bildschirm hinzufügen, hat eine Navigation mit drei Bereichen und
einen Dunkelmodus-Schalter. Darunter liegen schon alle Werkzeuge und Prüfungen, auf denen
MUL-002 bis MUL-009 aufbauen.

Vorlage ist das Schwesterprojekt `..\Mahlzeitenplaner` (im Folgenden **MZP**). Wo der Plan
„aus MZP übernehmen“ sagt, wird die genannte Datei kopiert und nur an den beschriebenen
Stellen angepasst.

## Akzeptanzkriterien

- `npm run format:check`, `npm run lint`, `npm run test` und `npm run build` laufen
  grün, lokal wie im GitHub-Workflow.
- Ein Push auf `main` rollt die App nach `https://burnywes.github.io/mental-unloader/`
  aus.
- Die App lässt sich auf dem iPhone zum Home-Bildschirm hinzufügen. Dort heißt sie
  „Mental Unloader“, zeigt das Haken-Icon und startet ohne Browserleiste.
- Die App startet auf „Dringend“. Die oben fixierte Navigation hat drei Icon-Knöpfe
  (Dringend, Ordner, Einstellungen), die VoiceOver mit Namen vorliest. Der aktive Knopf
  ist gefüllt und als „aktuelle Seite“ ausgezeichnet.
- Nach jedem Bereichswechsel liegt der Fokus auf der Überschrift der Seite.
- Dringend und Ordner zeigen je eine Überschrift und einen Satz für den Leerzustand.
- Die Einstellungen enthalten den Schalter „Dunkelmodus“. Er ist ohne gespeicherten Wert
  an, wird pro Gerät gespeichert, wirkt vor dem ersten Zeichnen und folgt nicht der
  iOS-Systemeinstellung.
- Hell ist die exakte Farbumkehr von Dunkel. Ein Test prüft die Umkehr und die
  Mindestkontraste (Text 4,5:1, Linien 3:1).
- Ein Architekturtest weist Framework-Importe in `domain`, Zugriffe von `domain` auf
  `api`/`ui` und Zugriffe zwischen `tasks` und `shared/ui` in falscher Richtung
  maschinell ab.
- Eine neue Version wird mit „Neue Version laden“ angeboten und angesagt, aber nicht
  ungefragt geladen.
- axe meldet auf allen drei Seiten keine Verstöße.
- `.claude/projekt.md` und `README.md` beschreiben das tatsächliche Projekt.

## Wesentliche Entscheidungen und Abwägungen

1. **Schichten `domain/api/ui`** nach `.claude/skills/architecture/references/typescript.md`,
   wie in MZP.
   - Warum: Das ist die verbindliche Ausformung für React-Frontends. Die Begriffe
     `application/infrastructure` aus `CLAUDE.md` gelten für Backends.
   - Auswirkung: `eslint.config.js` und `test/domainLayerBoundary.test.ts` werden aus
     MZP übernommen und angepasst.
2. **Kontexte `tasks` und `shared` von Anfang an** (`contexts = ['tasks']`). Die
   Leerseiten liegen in `src/tasks/ui`.
   - Warum: Der Architekturtest hat sofort echte Ziele.
   - Auswirkung: Kein Umbau in MUL-003. Erst dort fällt die Entscheidung, ob Ordner und
     Listen einen eigenen Kontext bekommen.
3. **Leerseiten:** Überschrift und ein Satz („Nichts Dringendes.“, „Noch keine Ordner.“),
   noch ohne [+]. **Startseite ist Dringend** (Gesamtplan Nr. 22).
4. **Icons:** `ChecklistIcon` und `SettingsIcon` aus MZP, dazu ein neues `FolderIcon` im
   gleichen Strichstil (24×24, `stroke="currentColor"`, Strichstärke 2).
5. **Navigationsknöpfe:** alle mit hell-orangem Rahmen (`--accentLine`, 3 px), der aktive
   dunkel-orange gefüllt (`--accent`) mit `aria-current="page"`, die inaktiven in der
   Hintergrundfarbe (`--surface`). Die Sonderformen (runder Rand, spitz, Pfeilfeld)
   kommen ab MUL-003.
6. **Dunkel ist Standard:** Der Speicherschlüssel `darkMode` liefert ohne gespeicherten
   oder bei unbekanntem Wert `true`. Der CSS-Grundzustand `:root` ist dunkel, Hell steht
   unter `:root[data-dark-mode='false']`.
   - Warum: Das ist die Umkehr der MZP-Logik (dort ist `invertedColors` standardmäßig
     `false` und hell).
   - Auswirkung: Der Paletten-Test liest den ersten `:root`-Block als Dunkel-Palette, den
     zweiten als Hell-Palette.
7. **Statusleiste folgt `--surface`:** `html` und `body` haben `--surface` als
   Hintergrund, `theme-color` wird auf `--surface` nachgeführt (Dunkel `#000000`, Hell
   `#ffffff`), und `apple-mobile-web-app-status-bar-style` ist `default` wie in MZP.
   - Warum: Die Seite bleibt oben ruhig, und Orange bleibt den Knöpfen vorbehalten.
     `black` würde die Leiste der installierten App auch im Hellmodus schwarz lassen.
     Seit Safari 26 richtet sich die obere Leiste nach Berichten nach dem
     Seitenhintergrund statt nach `theme-color`
     (https://developer.apple.com/forums/thread/801239). Die Kombination aus MZP ist auf
     dem iPhone erprobt.
   - Auswirkung: Ob die Leiste in beiden Modi mitdreht, prüft Phase 2 und 3 manuell am
     iPhone. Nach einer Änderung der Apple-Meta-Angaben muss die App neu zum
     Home-Bildschirm hinzugefügt werden (https://bugs.webkit.org/show_bug.cgi?id=260508).
8. **Palette nur mit den Tokens, die MUL-001 braucht:**

   | Token | Rolle | Dunkel | Hell |
   |---|---|---|---|
   | `--surface` | Hintergrund | `#000000` | `#ffffff` |
   | `--ink` | Schrift, Checkbox-Kanten, Fokusrahmen | `#ffffff` | `#000000` |
   | `--accent` | Knopf-Fläche | `#803300` | `#7fccff` |
   | `--accentLine` | Knopf-Rahmen | `#ff9933` | `#0066cc` |
   | `--checkMark` | Haken | `#00ff33` | `#ff00cc` |
   | `--divider` | Trennlinien | `#333333` | `#cccccc` |

   - Warum: „Überfällig“ in Hell (`#009999` auf Weiß) erreicht nur etwa 3,5:1 und würde
     den Text-Kontrast von 4,5:1 verfehlen. Gebraucht wird der Farbton erst in MUL-006.
   - Auswirkung: Ein Bug-Eintrag in `docs/notes.txt` hält das für MUL-006 fest.
9. **App-Icon:** schwarzer Grund und ein hell-oranger Rand (`#ff9933`, 6 % der
   Kantenlänge breit). Der Rand ist ein abgerundetes Rechteck mit 22 % Radius und liegt
   **4 % vom Bildrand eingerückt**. Darin ein Kästchen nur aus linker und unterer Kante in
   Weiß und ein dicker grüner Haken (`#00ff33`), der oben rechts über das Kästchen
   hinausragt. Die maskierbare Variante hat keinen Rand und zeigt den Inhalt auf 80 %
   verkleinert. Jeder gezeichnete Punkt liegt dabei im Kreis mit r = 0,4 um die Mitte
   (sichere Zone).
   - Warum eingerückt: Die iOS-Maske ist eine Superellipse. Ein Rand direkt an der
     Bildkante würde an den Ecken diagonal angeschnitten (Maske etwa 9,3 % tief, Rand
     nur etwa 8,5 %).
10. **Ohne Firebase und ohne Playwright.** Anmeldung, Emulator und E2E folgen in MUL-002.
    Damit entfallen in `App` gegenüber MZP Session, Anmeldeseite, Speicherwarnung und
    Verbindungsansagen.
11. **Übernommen wie in MZP:** Werkzeug-Versionen aus `package.json`, Prettier-Stil
    (`semi: false`, `singleQuote: true`), Schriftgröße 18 px, Ziele mindestens 44 px,
    App-Update mit `registerType: 'prompt'`. `manifest.name` und `short_name` sind beide
    „Mental Unloader“ (Gesamtplan Nr. 33).
12. **GitHub Pages ist bereits eingerichtet:** Das Repo ist öffentlich, und als Quelle ist
    „GitHub Actions“ eingestellt (vom Nutzer bestätigt am 09.10.2026).

## Ausgangslage

Es gibt noch keinen Code. Vorhanden ist:

```
Mental-Unloader/
  .claude/          Skills, projekt.md (Stack/Befehle stehen auf "-")
  docs/
    agents/plans/2026-10-08-gesamtplan.md
    notes.txt
  .gitignore        nur .claude/settings.local.json und .idea/
  CLAUDE.md
  README.md         Kopierrest: beschreibt Einkaufsliste und Mahlzeiten
```

Der Remote `origin` ist `https://github.com/burnyWes/mental-unloader.git`, und `main`
entspricht `origin/main`. Lokal laufen Node 24.19 und npm 11.17.

## Zielbild

```
Mental-Unloader/
  .github/workflows/deploy.yml      format:check → lint → test → build → Pages
  index.html                        iOS-Meta, Skript vor dem ersten Zeichnen
  package.json, package-lock.json
  vite.config.ts                    base /mental-unloader/, VitePWA (Phase 3)
  vitest.config.ts                  Projekte unit (node) und ui (jsdom)
  eslint.config.js                  inkl. Schicht- und Kontextgrenzen
  tsconfig.json, tsconfig.app.json, tsconfig.node.json
  .prettierrc.json, .prettierignore
  public/                           .nojekyll, Icons, favicon.svg (Phase 3)
  scripts/generateIcons.mjs         (Phase 3)
  scripts/checkMarkMotif.mjs        (Phase 3) Koordinaten des Motivs
  test/
    domainLayerBoundary.test.ts
    palette.test.ts                 (Phase 2)
    icons.test.ts                   (Phase 3)
  src/
    main.tsx                        verdrahtet die Adapter
    App.tsx                         Bereiche, Navigation, Announcer, Update-Angebot
    App.test.tsx
    index.css
    tasks/
      ui/
        UrgentPage.tsx
        FoldersPage.tsx
        FolderIcon.tsx
    shared/
      ui/
        NavigationBar.tsx
        SettingsPage.tsx
        Announcer.tsx, useAnnouncer.ts, announcement.ts (+ Test)
        useHeadingFocus.ts
        ChecklistIcon.tsx, SettingsIcon.tsx
      appearance/                   (Phase 2)
      appUpdate/                    (Phase 3)
    testSupport/
      accessibility.ts, setupComponentTests.ts
```

Abhängigkeiten zur Laufzeit:

```
main.tsx ──► App.tsx ──► shared/ui (NavigationBar, SettingsPage, Announcer …)
   │            │──────► tasks/ui  (UrgentPage, FoldersPage)
   │            │──────► shared/appearance (useAppearance)  ◄── Port AppearanceClient
   │            └──────► shared/appUpdate  (useAppUpdate)   ◄── Port AppUpdateClient
   └──► Adapter: localStorageAppearanceClient, serviceWorkerAppUpdateClient
```

### Oberflächen

```
Dringend (Startseite)             Ordner                          Einstellungen
┌───────────────────────────┐     ┌───────────────────────────┐   ┌───────────────────────────┐
│ ╔═════╗ ┌─────┐ ┌─────┐   │     │ ┌─────┐ ╔═════╗ ┌─────┐   │   │ ┌─────┐ ┌─────┐ ╔═════╗   │
│ ║▓☑▓▓║ │ 📁  │ │  ⚙  │   │     │ │  ☑  │ ║▓📁▓║ │  ⚙  │   │   │ │  ☑  │ │ 📁  │ ║▓⚙▓▓║   │
│ ╚═════╝ └─────┘ └─────┘   │     │ └─────┘ ╚═════╝ └─────┘   │   │ └─────┘ └─────┘ ╚═════╝   │
├───────────────────────────┤     ├───────────────────────────┤   ├───────────────────────────┤
│ Dringend                  │     │ Ordner                    │   │ Einstellungen             │
│                           │     │                           │   │ ───────────────────────── │
│ Nichts Dringendes.        │     │ Noch keine Ordner.        │   │ Dunkelmodus          │ ✓  │
│                           │     │                           │   │                      └─── │
│                           │     │                           │   │ ───────────────────────── │
├───────────────────────────┤     ├───────────────────────────┤   ├───────────────────────────┤
│ (Live-Region)             │     │ (Live-Region)             │   │ (Live-Region)             │
└───────────────────────────┘     └───────────────────────────┘   └───────────────────────────┘
 ▓ = --accent gefüllt, aktiv          Rahmen aller Navigationsknöpfe: --accentLine, 3 px
```

Steht ein Update bereit, erscheint unten ein zusätzlicher Bereich
`[ Neue Version laden ]` (wie `.appUpdate` in MZP).

VoiceOver liest beim Start: „Dringend, Überschrift Ebene 1“. Auf der Navigation liest
es „Dringend, aktuelle Seite, Taste“, „Ordner, Taste“ und „Einstellungen, Taste“.

## Abstraktionen und Wiederverwendung

- `src/shared/ui/NavigationBar.tsx` – aus MZP 1:1. Bereiche werden generisch über
  `Area<Id>` übergeben.
- `src/shared/ui/SettingsPage.tsx` – aus MZP, verkleinert auf die Eintragsart `toggle`.
  Die Arten `page` und `choice` entfallen, bis sie gebraucht werden. Die Checkbox-Optik
  bekommt der Schalter über die Klasse `checkboxLook`.
- `src/shared/ui/Announcer.tsx`, `useAnnouncer.ts`, `announcement.ts` – aus MZP 1:1,
  dazu `announcement.test.ts`.
- `src/shared/ui/useHeadingFocus.ts` – aus MZP 1:1.
- `src/shared/appearance/*` – aus MZP, **umbenannt und umgedreht**:
  - `AppearanceClient` mit `readDarkMode(): boolean` und
    `writeDarkMode(darkMode: boolean): void`
  - `DARK_MODE_KEY = 'darkMode'`. Nur der gespeicherte Wert `'false'` ergibt `false`,
    alles andere (auch `null` und gesperrter Speicher) ergibt `true`.
  - `useAppearance` liefert `{ darkMode, toggleDarkMode }`, setzt
    `document.documentElement.dataset.darkMode` und schreibt `--surface` in
    `meta[name="theme-color"]`.
- `src/shared/appUpdate/*` – aus MZP 1:1.
- `src/testSupport/*` – aus MZP 1:1.
- `test/palette.test.ts` – aus MZP. Angepasst werden der Speicherschlüssel,
  `dataset.darkMode`, der Selektor `[data-dark-mode='false']` und die Kontrastpaare.
- `test/domainLayerBoundary.test.ts` – aus MZP. Probe-Pfade werden auf `tasks` und
  `shared` umgestellt, die Fälle mit dem zweiten Kontext entfallen.
- `scripts/generateIcons.mjs` – aus MZP. Rasterung und PNG-Ausgabe bleiben, das Motiv
  `renderShoppingListIcon` wird durch `renderCheckMarkIcon` ersetzt, und zusätzlich
  entsteht `favicon.svg`.

## Logging und Beobachtbarkeit

Kein Logging. Nutzersichtbare Rückmeldungen laufen über die Live-Region (`Announcer`),
in MUL-001 nur die Ansage „Neue Version verfügbar. Der Knopf dafür steht ganz unten.“

## Umsetzung

### Phase 1: Lauffähige App mit Navigation, ausgerollt

Abhängigkeiten: keine

Am Ende dieser Phase läuft die App mit drei Bereichen unter
`https://burnywes.github.io/mental-unloader/`. Werkzeuge, Architekturgrenze und Workflow
stehen. Die Farben sind vorläufig: Dunkel-Palette ohne Umschalter und ohne
Paletten-Test, beides folgt in Phase 2.

**Aufgaben**:

- [x] `package.json` anlegen (`name: "mental-unloader"`, `private`, `type: "module"`).
  Abhängigkeiten und Versionen kommen aus MZP, **ohne** `firebase`,
  `@firebase/rules-unit-testing`, `firebase-tools`, `@playwright/test` und (bis Phase 3)
  `vite-plugin-pwa`. Skripte: `dev`, `build` (`tsc -b && vite build`), `preview`,
  `lint`, `format`, `format:check`, `test`, `test:watch`. Danach `npm install`, damit
  `package-lock.json` entsteht.
- [x] `tsconfig.json`, `tsconfig.app.json` und `tsconfig.node.json` aus MZP übernehmen.
  In `tsconfig.app.json` steht unter `types` vorerst nur `vite/client`. In
  `tsconfig.node.json` enthält `include` nur `vite.config.ts`, `vitest.config.ts` und
  `test/**/*.ts`.
- [x] `.prettierrc.json` und `.prettierignore` aus MZP 1:1 übernehmen (ignoriert unter
  anderem `.claude`, `docs`, `public/*.png`, `CLAUDE.md` und `README.md`).
- [x] `.gitignore` erweitern um `node_modules/`, `dist/`, `dev-dist/`, `build/`,
  `coverage/`, `.env`, `.env.*`, `!.env.example`, `.DS_Store`, `Thumbs.db` und `*.local`.
  Die vorhandenen Zeilen bleiben stehen.
- [x] `vite.config.ts`: `base: '/mental-unloader/'` und `plugins: [react()]`.
- [x] `vitest.config.ts` aus MZP 1:1 übernehmen (Projekte `unit` und `ui`).
- [x] `eslint.config.js` aus MZP übernehmen und `const contexts = ['tasks']` setzen. Die
  Ausnahmen für `e2e/**` entfallen.
- [x] `test/domainLayerBoundary.test.ts` übernehmen und auf diese Probe-Pfade umstellen:
  `src/tasks/domain/boundaryProbe.ts`, `src/tasks/ui/boundaryProbe.ts`,
  `src/tasks/api/boundaryProbe.ts`, `src/shared/domain/boundaryProbe.ts` und
  `src/shared/ui/boundaryProbe.ts`. Fälle:
  - `react` und `firebase/firestore` in `tasks/domain` werden abgewiesen
  - `../api/…`, `../../shared/ui/…` und `../../shared/appearance/…` in `tasks/domain`
    werden abgewiesen
  - `../ui/…` in `tasks/api` wird abgewiesen, `../domain/…` in `tasks/api` ist erlaubt
  - `../../tasks/…` in `shared/ui` und `shared/domain` wird abgewiesen
  - `react` in `tasks/ui` ist erlaubt, `../../shared/ui/useHeadingFocus` in `tasks/ui`
    ist erlaubt, `../../shared/domain/…` in `tasks/domain` ist erlaubt
- [x] `src/testSupport/accessibility.ts` und `setupComponentTests.ts` aus MZP übernehmen.
- [x] `src/shared/ui/announcement.ts`, `announcement.test.ts`, `useAnnouncer.ts`,
  `Announcer.tsx` und `useHeadingFocus.ts` aus MZP übernehmen.
- [x] `src/shared/ui/NavigationBar.tsx`, `ChecklistIcon.tsx` und `SettingsIcon.tsx` aus
  MZP übernehmen.
- [x] `src/tasks/ui/FolderIcon.tsx` neu anlegen: ein Ordner mit Lasche im Strichstil von
  `ChecklistIcon` (`className="buttonIcon"`, `aria-hidden`, `focusable="false"`):
  ```tsx
  <path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  ```
- [x] `src/tasks/ui/UrgentPage.tsx` mit `navigation: ReactNode` als Prop: `<main
  className="page pageBelowNavigation">`, `h1` „Dringend“ mit `useHeadingFocus` und
  `tabIndex={-1}`, darunter `<p>Nichts Dringendes.</p>`.
- [x] `src/tasks/ui/FoldersPage.tsx`, gleich aufgebaut, mit „Ordner“ und
  „Noch keine Ordner.“
- [x] `src/shared/ui/SettingsPage.tsx` aus MZP, reduziert auf die Eintragsart `toggle`.
  Das Prop `onOpenEntry` und die Klasse `mealRow` entfallen. Props sind `navigation` und
  `entries`. In Phase 1 wird die Seite mit leerer Eintragsliste gerendert, die leere
  `ul` entfällt dann, und es bleibt nur die Überschrift.
- [x] `src/App.tsx` mit Bereichen, Navigation und Announcer:
  ```tsx
  const AREAS = [
    { id: 'urgent', label: 'Dringend', icon: <ChecklistIcon /> },
    { id: 'folders', label: 'Ordner', icon: <FolderIcon /> },
    { id: 'settings', label: 'Einstellungen', icon: <SettingsIcon /> },
  ] as const satisfies readonly Area<string>[]
  ```
  Startzustand ist `'urgent'`. Die Bereichsseiten werden mit `key={activeArea}`
  gerendert, damit `useHeadingFocus` bei jedem Wechsel neu greift. `<Announcer>` steht
  immer im Dokument.
- [x] `src/main.tsx`: `createRoot(...).render(<StrictMode><App /></StrictMode>)` mit
  `import './index.css'`.
- [x] `index.html` nach MZP-Vorbild: `lang="de"`, `viewport-fit=cover`,
  `<title>Mental Unloader</title>`, `<meta name="color-scheme" content="dark light">`,
  `theme-color` `#000000`. Das
  Skript vor dem ersten Zeichnen, Icons und die Apple-Meta-Angaben folgen in Phase 2
  und 3.
- [x] `src/index.css` aus MZP übernehmen, nur mit den Regeln, die jetzt gebraucht
  werden:
  - `html` und `body` mit `--surface` als Hintergrund
  - `.page`, `.pageBelowNavigation`, `.navigationBar*`
  - `button` mit `font`, `min-height: 44px` und Rahmen
  - `:focus-visible`, `.announcer`, `.pageHeader`, `h1:focus-visible`, `.buttonIcon`

  Die MZP-Regel für `input, select, textarea` mit `--fieldBorder` entfällt, weil es
  außer der Checkbox keine Eingabefelder gibt. Dazu kommt der erste `:root`-Block mit
  `color-scheme: dark` und **allen sechs** Dunkel-Werten aus Entscheidung 8 (einschließlich
  `--divider` für die Unterkante der Navigation und die Live-Region). Navigation nach
  Entscheidung 5, wobei `border-color: var(--ink)` aus der MZP-Regel für den aktiven
  Knopf ausdrücklich **entfällt**:
  ```css
  .navigationBar button {
    background-color: var(--surface);
    border: 3px solid var(--accentLine);
    color: var(--ink);
  }
  .navigationBar button[aria-current='page'] {
    background-color: var(--accent);
  }
  ```
- [x] `src/App.test.tsx` (test-getrieben, vor `App.tsx`). Alle Fälle rendern über eine
  Hilfsfunktion `renderApp()` wie in MZP. In Phase 2 und 3 bekommt sie Voreinstellungen
  für die neuen Pflicht-Props, damit die bestehenden Fälle unverändert bleiben:
  - startet auf der Überschrift „Dringend“ und zeigt „Nichts Dringendes.“
  - die Navigation heißt „Bereiche“ und hat die Knöpfe „Dringend“, „Ordner“,
    „Einstellungen“
  - „Dringend“ trägt zu Beginn `aria-current="page"`, nach Klick auf „Ordner“ trägt
    „Ordner“ es
  - nach Klick auf „Ordner“ hat die Überschrift „Ordner“ den Fokus, und „Noch keine
    Ordner.“ ist sichtbar
  - nach Klick auf „Einstellungen“ hat die Überschrift „Einstellungen“ den Fokus
  - die Live-Region (`role="status"`) ist vom ersten Rendern an im Dokument
  - `accessibilityViolations` ist für Dringend, Ordner und Einstellungen jeweils leer
- [x] `public/.nojekyll` anlegen (leer).
- [x] `.github/workflows/deploy.yml` aus MZP 1:1 übernehmen.
- [x] `.claude/projekt.md` ausfüllen:
  - `Stack: TypeScript, React 19, Vite 8, vite-plugin-pwa, Firebase/Firestore, GitHub Pages`
  - Befehle: `Test: npm run test`, `Lint: npm run lint`, `Format: npm run format`,
    `Build: npm run build`
  - Fachliche Kontexte: `- **tasks** — Ordner, Listen und Aufgaben des Haushalts mit
    Fälligkeit, Wiederholung und der Sammelsicht aller dringenden Aufgaben.`
- [x] `README.md` neu schreiben, im Aufbau wie MZP:
  - ein Satz zum Zweck (Aufgaben-App des Haushalts für das iPhone als PWA)
  - die Adresse `https://burnywes.github.io/mental-unloader/`
  - Verweise auf `CLAUDE.md`, `.claude/projekt.md`, `docs/notes.txt` und den Gesamtplan
  - der Arbeitsablauf (`/grill-me` … `/commit`)
  - die npm-Befehle `dev`, `test`, `lint`, `format` und `build`
  - Der Abschnitt „Firebase absichern“ folgt in MUL-002.

**Automatisierte Verifikation**:

- [x] `npm run format:check` läuft grün
- [x] `npm run lint` läuft grün
- [x] `npm run test` läuft grün, einschließlich `test/domainLayerBoundary.test.ts` und
  `src/App.test.tsx`
- [x] `npm run build` läuft grün, und `dist/index.html` verweist auf Assets unter
  `/mental-unloader/`

**Manuelle Verifikation**:

- [x] Nach dem Push auf `main` ist der Workflow „Deploy to GitHub Pages“ grün, und
  `https://burnywes.github.io/mental-unloader/` zeigt in Safari auf dem iPhone die
  Dringend-Seite.
- [x] Mit VoiceOver lassen sich alle drei Bereiche über die Navigation erreichen. Nach
  jedem Wechsel liest VoiceOver die Überschrift vor.

### Phase 2: Farben und Dunkelmodus

Abhängigkeiten: Phase 1

Die vollständige Palette mit maschinell gesicherter Umkehr, die Checkbox-Optik und der
Schalter „Dunkelmodus“, der pro Gerät gespeichert wird und vor dem ersten Zeichnen wirkt.

**Aufgaben**:

- [x] `test/palette.test.ts` aus MZP übernehmen und anpassen (test-getrieben, vor dem
  CSS):
  - `adapter` liest `src/shared/appearance/localStorageAppearanceClient.ts`, und die
    Schlüsselsuche sucht nach `DARK_MODE_KEY = '…'`
  - `TEXT_ON_ITS_BACKGROUND = [['--ink', '--accent'], ['--ink', '--surface']]`
  - `LINES_AGAINST_THEIR_GROUND = [['--ink', '--surface'], ['--accentLine', '--surface'],
    ['--checkMark', '--surface']]`. Das Paar Knopf-Rahmen auf Knopf-Fläche ist bewusst
    nicht dabei: Es erreicht in Dunkel nur etwa 2,6:1. Der Rahmen grenzt den Knopf gegen
    den Hintergrund ab, nicht gegen die eigene Fläche.
  - Der Test „applies the stored preference before the first paint“ erwartet
    `localStorage.getItem('darkMode')`, `dataset.darkMode` und
    `[data-dark-mode='false']`.
  - Der Test „inverts every colour“ benennt die Paletten als `dark` (erster Block) und
    `light` (zweiter Block).
- [x] `src/index.css`: zweiter Block `:root[data-dark-mode='false']` mit
  `color-scheme: light` und den sechs Hell-Werten aus Entscheidung 8.
- [x] `src/index.css`: Checkbox-Optik als wiederverwendbare Klasse `checkboxLook`, nach
  `.itemList input[type='checkbox']` in MZP. Nur linke und untere Kante (`--ink`,
  3 px), 40×40 px, und im angehakten Zustand ein Haken in `--checkMark`
  (`::before`, 15×29 px, 5 px, `rotate(45deg)`). Dazu `.itemList`, `.itemList li` mit
  Trennlinien in `--divider`, `.itemList label` (`display: flex`, `align-items: center`,
  `gap`, `min-height: 44px`) und `.settingsToggle` aus MZP.
- [x] `src/shared/appearance/appearanceClient.ts`: `DeviceStorage` und
  `AppearanceClient` mit `readDarkMode()` und `writeDarkMode()`.
- [x] `src/shared/appearance/localStorageAppearanceClient.test.ts` aus MZP übernehmen
  und umdrehen (test-getrieben):
  - gespeichertes `'false'` ergibt aus
  - gespeichertes `'true'` ergibt an
  - unbekannter Wert ergibt an
  - nichts gespeichert ergibt an
  - schreibt `'true'` bzw. `'false'`
  - ohne Speicher und bei Lese- oder Schreibsperre bleibt der Schalter an und es wird
    nichts geworfen
- [x] `src/shared/appearance/localStorageAppearanceClient.ts` mit
  `DARK_MODE_KEY = 'darkMode'` und `readDarkMode: () => storedValue(storage) !== 'false'`.
- [x] `src/shared/appearance/inMemoryAppearanceClient.ts` mit `darkMode = true` als
  Voreinstellung und `storedDarkMode()`.
- [x] `src/shared/appearance/useAppearance.test.tsx` aus MZP übernehmen und anpassen
  (test-getrieben):
  - die Statusleiste übernimmt `--surface` der Palette
  - nach dem Umschalten steht `dataset.darkMode` auf `'false'`, und die Statusleiste
    übernimmt den hellen `--surface`
  - ohne Palette bleibt die Statusleiste unberührt
- [x] `src/shared/appearance/useAppearance.ts` mit `{ darkMode, toggleDarkMode }`. Es
  setzt `document.documentElement.dataset.darkMode = String(darkMode)` und liest
  `--surface` für `meta[name="theme-color"]`.
- [x] `src/App.tsx`: neues Prop `appearanceClient: AppearanceClient`, `useAppearance`
  aufrufen und der Einstellungsseite den Eintrag übergeben:
  ```tsx
  { kind: 'toggle', id: 'darkMode', label: 'Dunkelmodus',
    enabled: appearance.darkMode, onToggle: appearance.toggleDarkMode }
  ```
- [x] `src/shared/ui/SettingsPage.tsx`: Einträge als `ul.itemList` und den Schalter als
  `<input type="checkbox" role="switch" className="checkboxLook">` in
  `label.settingsToggle` rendern.
- [x] `src/main.tsx`: `createLocalStorageAppearanceClient()` übergeben.
- [x] `index.html`: Skript vor dem ersten Zeichnen ergänzen:
  ```html
  <script>
    try {
      document.documentElement.dataset.darkMode =
        localStorage.getItem('darkMode') !== 'false'
    } catch (storageBlocked) {
      document.documentElement.dataset.darkMode = 'true'
    }
  </script>
  ```
- [x] `src/App.test.tsx` ergänzen:
  - ohne gespeicherten Wunsch steht `dataset.darkMode` auf `'true'`
  - ein Gerät mit gespeichertem `false` startet hell
  - der Schalter „Dunkelmodus“ (`role="switch"`) ist zu Beginn an
  - nach einem Tipp ist er aus, `storedDarkMode()` liefert `false`, und
    `dataset.darkMode` steht auf `'false'`
  - axe meldet auf den Einstellungen mit Schalter keine Verstöße
- [x] `docs/notes.txt` unten unter TODO anhängen:
  `b Farbe "Ueberfaellig" im Hellmodus (#009999 auf Weiss) hat nur ca. 3,5:1 Kontrast, Text braucht 4,5:1 - in MUL-006 klaeren`

**Automatisierte Verifikation**:

- [x] `npm run test` läuft grün, einschließlich `test/palette.test.ts`,
  `localStorageAppearanceClient.test.ts`, `useAppearance.test.tsx` und
  `src/App.test.tsx`
- [x] `npm run lint`, `npm run format:check` und `npm run build` laufen grün

**Manuelle Verifikation**:

- [x] Auf dem iPhone in Safari startet die App dunkel, auch wenn iOS auf Hell steht.
  Nach dem Ausschalten von „Dunkelmodus“ wird sie hell. Ob die obere Leiste mitdreht,
  hält diese Prüfung nur fest; verbindlich ist die Prüfung der installierten App in
  Phase 3.
- [x] Nach einem Neuladen bleibt die gewählte Darstellung erhalten, ohne kurz in der
  anderen aufzublitzen.
- [x] VoiceOver liest den Schalter als „Dunkelmodus, Schalter, ein“ bzw. „aus“.

### Phase 3: Installierbare PWA

Abhängigkeiten: Phase 2

Die App wird installierbar, zeigt das Haken-Icon und bietet neue Versionen an.

**Aufgaben**:

- [x] `vite-plugin-pwa` als Entwicklungsabhängigkeit ergänzen (Version wie in MZP), in
  `tsconfig.app.json` unter `types` `vite-plugin-pwa/client` ergänzen und das Skript
  `"icons": "node scripts/generateIcons.mjs"` aufnehmen.
- [x] `test/icons.test.ts` (test-getrieben):
  - `public/icon-192.png`, `icon-512.png`, `icon-maskable-512.png` und
    `apple-touch-icon.png` existieren und haben laut PNG-Kopf (IHDR, Breite und Höhe ab
    Byte 16) 192, 512, 512 und 180 Pixel Kantenlänge
  - `apple-touch-icon.png` ist deckend (Farbtyp 2)
  - `public/favicon.svg` existiert
  - jeder Punkt von `MOTIF` (aus `scripts/checkMarkMotif.mjs`) liegt, um
    `contentScale: 0.8` verkleinert und um die Strichbreite erweitert, im Kreis mit
    r = 0,4 um die Mitte (sichere Zone des maskierbaren Icons)
- [x] `scripts/generateIcons.mjs` aus MZP übernehmen:
  - Die Farben werden durch `BACKGROUND = [0x00, 0x00, 0x00]`,
    `FRAME = [0xff, 0x99, 0x33]`, `BOX = [0xff, 0xff, 0xff]` und
    `CHECK = [0x00, 0xff, 0x33]` ersetzt.
  - `renderShoppingListIcon` wird durch `renderCheckMarkIcon({ size,
    cornerRadiusRatio, contentScale, framed })` ersetzt: Hintergrund, bei `framed` ein
    Rahmenring (äußeres abgerundetes Rechteck in `FRAME`, inneres in `BACKGROUND`),
    Kästchenkanten links und unten als `paintPolyline` in `BOX` und der Haken als
    dicke `paintPolyline` in `CHECK`, die oben rechts über das Kästchen hinausragt.
  - `iconsToGenerate`: 192, 512 und 180 (deckend) jeweils mit `framed: true`; der
    Rahmenring ist 4 % eingerückt, 6 % breit und hat 22 % Radius (Entscheidung 9). Die
    maskierbare Variante hat `framed: false`, `cornerRadiusRatio: 0` und
    `contentScale: 0.8`.
  - Die Koordinaten von Kästchen und Haken stehen als Konstante `MOTIF` in einer eigenen
    Datei `scripts/checkMarkMotif.mjs`, aus der das Skript sie importiert. So kann
    `test/icons.test.ts` sie prüfen. Damit `tsc -b` den Import aus dem Test auflöst,
    bekommt `tsconfig.node.json` `"allowJs": true` und `scripts/checkMarkMotif.mjs` in
    `include`.
  - Zusätzlich schreibt das Skript `public/favicon.svg` mit demselben Motiv als SVG
    (`role="img"`, `aria-label="Mental Unloader"`).
- [x] `npm run icons` ausführen und die erzeugten Dateien einchecken.
- [x] `vite.config.ts`: `VitePWA` nach MZP mit:
  - `registerType: 'prompt'`, `injectRegister: null`,
    `includeAssets: ['favicon.svg', 'apple-touch-icon.png']`
  - `manifest`: `name` und `short_name` „Mental Unloader“, `description`
    „Aufgaben des Haushalts“, `lang: 'de'`, `start_url` und `scope` auf dem Basis-Pfad,
    `display: 'standalone'`, `orientation: 'portrait'`, `theme_color` und
    `background_color` `#000000` und die drei Icons wie in MZP
  - `workbox.globPatterns` wie in MZP
- [x] `index.html`: `apple-mobile-web-app-capable` `yes`, `apple-mobile-web-app-title`
  „Mental Unloader“, `apple-mobile-web-app-status-bar-style` `default` (Entscheidung 7),
  `<link rel="icon" type="image/svg+xml" href="/favicon.svg">` und
  `<link rel="apple-touch-icon" href="/apple-touch-icon.png">`.
- [x] `src/shared/appUpdate/appUpdateClient.ts`, `inMemoryAppUpdateClient.ts`,
  `serviceWorkerAppUpdateClient.ts`, `useAppUpdate.ts` und `AppUpdateOffer.tsx` aus MZP
  1:1 übernehmen. `.appUpdate` kommt aus MZP in `src/index.css`.
- [x] `src/App.tsx`: neues Prop `appUpdateClient: AppUpdateClient`. Es ruft
  `useAppUpdate(appUpdateClient, announce)` auf und rendert `<AppUpdateOffer>` unter der
  Seite, wenn ein Update bereitsteht.
- [x] `src/main.tsx`: `createServiceWorkerAppUpdateClient()` übergeben.
- [x] `src/App.test.tsx` ergänzen, mit den Fällen aus MZP:
  - ohne wartende Version wird nichts angeboten
  - eine wartende Version wird angeboten und angesagt („Neue Version verfügbar.“)
  - die Version wird erst nach dem Tipp auf „Neue Version laden“ geladen
- [x] `README.md`: den Abschnitt „Auf dem iPhone installieren“ ergänzen (Safari →
  Teilen → „Zum Home-Bildschirm“) und den Hinweis auf `npm run icons`.

**Automatisierte Verifikation**:

- [x] `npm run test` läuft grün, einschließlich `test/icons.test.ts` und der
  Update-Fälle in `src/App.test.tsx`
- [x] `npm run build` läuft grün, und `dist/` enthält `manifest.webmanifest` und `sw.js`
- [x] `dist/manifest.webmanifest` enthält `"name":"Mental Unloader"`,
  `"short_name":"Mental Unloader"` und `"start_url":"/mental-unloader/"`
- [x] `npm run lint` und `npm run format:check` laufen grün

**Manuelle Verifikation**:

- [x] In Safari auf dem iPhone über Teilen → „Zum Home-Bildschirm“ hinzufügen. Unter dem
  Icon steht „Mental Unloader“, und das Icon zeigt den grünen Haken mit hell-orangem
  Rand auf Schwarz. Der Rand ist auch **an den vier Ecken** vollständig und ohne
  schwarze Zwickel zur Maske sichtbar.
- [x] Vom Home-Bildschirm aus startet die App ohne Browserleiste, und die Dringend-Seite
  erscheint. Im Dunkelmodus ist die Statusleiste schwarz mit heller Schrift, nach dem
  Ausschalten von „Dunkelmodus“ weiß mit dunkler Schrift.
- [x] Nach einem weiteren Push auf `main` erscheint beim nächsten Öffnen „Neue Version
  laden“. VoiceOver sagt es an, und erst nach dem Tipp lädt die neue Version.

## Notizen zur Umsetzung

Hier während der Umsetzung Rückmeldungen, Probleme und Entscheidungen festhalten.

- Phase 1: Der Architekturtest prüft zusätzlich, dass `tasks/api` nicht auf `ui`
  zugreift und dass `tasks/domain` den gemeinsamen Domänenteil nutzen darf.
- Phase 2: Für die Barrierefreiheit der Einstellungen mit Schalter gibt es einen eigenen
  Testfall, der auch prüft, dass der Schalter wirklich da ist.
- Phase 3: `MOTIF` beschreibt Kästchen und Haken als Linienzüge in Bruchteilen der
  Kantenlänge (`points`, `thickness`). Der Rahmen der Icons mit 192 und 512 Pixeln hat
  außen 22 % Radius, innen 16 %. Der Hintergrund ist bei 192/512 mit 22 % gerundet,
  beim deckenden `apple-touch-icon.png` eckig.
- Nach der Abnahme: Die Knopf-Fläche `--accent` ist auf Wunsch des Nutzers in zwei
  Schritten dunkler geworden, über `#993d00` auf `#803300` statt `#b34700`, im
  Hellmodus als Umkehr `#7fccff` statt `#4cb8ff`. Weiße Schrift auf der Fläche erreicht
  damit etwa 8,8:1.

## Verweise

- Gesamtplan: `docs/agents/plans/2026-10-08-gesamtplan.md`
- Architektur: `.claude/skills/architecture/SKILL.md`,
  `.claude/skills/architecture/references/typescript.md`
- Vorlagen in MZP (`..\Mahlzeitenplaner`): `package.json`, `vite.config.ts`,
  `vitest.config.ts`, `eslint.config.js`, `tsconfig*.json`, `index.html`,
  `.github/workflows/deploy.yml`, `src/App.tsx`, `src/App.test.tsx`, `src/index.css`,
  `src/shared/ui/*`, `src/shared/appearance/*`, `src/shared/appUpdate/*`,
  `src/testSupport/*`, `test/palette.test.ts`, `test/domainLayerBoundary.test.ts`,
  `scripts/generateIcons.mjs`
- MZP-Pläne zu Farbumkehr und Checkbox: `docs/agents/plans/2026-09-18-farben-invertieren.md`,
  `2026-09-18-groessere-check-haken.md`, `2026-09-22-breitere-button-rahmen.md`
