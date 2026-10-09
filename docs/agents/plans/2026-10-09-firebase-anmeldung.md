---
date: 2026-10-09
git_commit: 10a08ca7279f9cb56eeab47d9df55672034fd2a4
branch: main
story: MUL-002
topic: "Firebase und Anmeldung: Login auf allen Geräten"
tags: [plan, firebase, auth, firestore-rules, emulator, playwright, abmelden, bestaetigungsseite]
status: ready
---

# PLAN: MUL-002 — Firebase und Anmeldung: Login auf allen Geräten

Zweiter Teilplan des Gesamtplans `docs/agents/plans/2026-10-08-gesamtplan.md` (Zeile 257).
Die App bekommt ein eigenes Firebase-Projekt mit einem einzigen Haushaltskonto, eine
Anmeldeseite, das Abmelden über eine Bestätigungsseite und die Firestore-Regeln samt
Regeltests. Dazu kommen die Emulatoren und eine Playwright-Grundlage. Die Anleitung zur
Einrichtung des Firebase-Projekts steht dauerhaft in der `README.md`.

Vorlage ist wieder das Schwesterprojekt `..\Mahlzeitenplaner` (im Folgenden **MZP**). Wo
der Plan „aus MZP übernehmen“ sagt, wird die genannte Datei kopiert und nur an den
beschriebenen Stellen angepasst.

## Akzeptanzkriterien

- Ohne Anmeldung zeigt die App die Anmeldeseite „Mental Unloader“ mit den Feldern E-Mail
  und Passwort und dem Knopf „Anmelden“. Der iOS-Passwortmanager kann beide Felder
  ausfüllen.
- Leere Felder, falsche Zugangsdaten, ein fehlendes Netz und zu viele Versuche erscheinen
  jeweils mit eigenem Text und werden angesagt. Dabei wird nicht verraten, ob E-Mail oder
  Passwort falsch war.
- Nach der Anmeldung erscheint die Dringend-Seite. Die Anmeldung bleibt über ein
  Neuladen und über einen Neustart der App erhalten.
- In den Einstellungen führt „Abmelden“ zu einer Bestätigungsseite. Dort ist die
  Navigation ausgeblendet, und die Knöpfe sind unten fixiert. „Abbrechen“ und „Zurück“
  führen zu den Einstellungen zurück. „Abmelden“ führt zur Anmeldeseite, und die
  Live-Region sagt „Abgemeldet.“ an.
- `firestore.rules` gibt `folders`, `lists` und `tasks` nur der Haushalts-UID frei,
  alles andere ist gesperrt. Regeltests belegen das. Sie laufen im Commit-Gate.
- Ein Playwright-Test gegen die Emulatoren belegt Anmelden, Fehlanmeldung, das Bleiben
  nach einem Neuladen und das Abmelden.
- Das echte Firebase-Projekt ist nach der README-Anleitung eingerichtet. Die
  Selbstregistrierung ist aus: Die curl-Probe liefert `ADMIN_ONLY_OPERATION`. Die Regeln
  sind ausgerollt, und die Anmeldung klappt auf den iPhones.
- Das neue Token `--failure` ist eine exakte Umkehr und besteht den Paletten-Test.
- axe meldet auf der Anmeldeseite, den Einstellungen und der Bestätigungsseite keine
  Verstöße.

## Wesentliche Entscheidungen und Abwägungen

1. **Zwei Phasen:** Zuerst wird alles gegen den Emulator gebaut, mit der Projekt-ID
   `demo-mental-unloader` und einer Platzhalter-UID. Danach wird das echte Projekt
   angeschlossen.
   - Warum: Aus der Konsole werden nur drei Werte gebraucht: die Web-App-Konfiguration,
     die Projekt-ID und die UID des Haushaltskontos. Alles andere kann der Agent ohne
     Wartezeit bauen.
   - Auswirkung: Phase 2 tauscht `firebaseConfig.ts`, legt `.firebaserc` an und ändert
     die Projekt-ID in `test:e2e` sowie die UID in `firestore.rules`. Phase 1 wird
     committet, aber **nicht gepusht**, bevor Phase 2 fertig ist. Sonst würde GitHub
     Pages eine Anmeldeseite ausrollen, die gegen das Demo-Projekt nicht funktioniert.
2. **Die Einrichtungsanleitung steht in der `README.md`** im Abschnitt „Firebase
   einrichten und absichern“. Phase 2 hakt die Schritte als Checkboxen ab.
   - Warum: Die Anleitung soll auch später auffindbar sein, etwa für neue Geräte, ein
     neues Passwort oder geänderte Regeln.
3. **Die Regeln geben `folders`, `lists` und `tasks` sofort frei.** Der
   Firestore-Client, der Offline-Speicher (`persistentLocalCache` mit Rückfall und
   Speicherwarnung) und die Verbindungsansagen kommen erst mit MUL-003.
   - Warum: Die Regeln stehen damit einmal vollständig und werden nur einmal von Hand
     ausgerollt. Code entsteht erst, wenn ihn ein Adapter braucht.
   - Auswirkung: `firebase.ts` initialisiert in MUL-002 nur App und Auth. Die E2E-Tests
     starten nur den Auth-Emulator.
4. **Abmelden über eine eigene Bestätigungsseite.** Sie besteht aus der allgemeinen
   `ConfirmationPage` und der `BottomBar` in `src/shared/ui`. Der Knopf „Abmelden“ steht
   in den Einstellungen unter der Liste und ist nicht fixiert.
   - Warum: Das Muster der Bestätigungsseite aus dem Gesamtplan (Nr. 23) entsteht
     einmal und wird in MUL-005 für Erledigen und Löschen wiederverwendet. Ein
     fixierter Knopf würde öfter versehentlich getroffen.
   - Auswirkung: Die `BottomBar` kommt **ohne** `useOnScreenKeyboard`, weil die
     Bestätigungsseite kein Eingabefeld hat. Die Tastaturerkennung folgt mit der ersten
     Formularseite.
5. **`AuthClient` bekommt `signOut()`.** Das ist neu gegenüber MZP, dort gibt es kein
   Abmelden. Es wird im Port, im Firebase-Adapter und im In-Memory-Fake ergänzt.
6. **Farben der Anmeldeseite:** Das neue Token `--failure` ist `#ff9999` (dunkel) bzw.
   `#006666` (hell). Eingabefelder haben einen Rahmen in `--ink` mit 2 px und kein
   eigenes Token. „Anmelden“ steht im Seitenfluss.
   - Warum: Der Kontrast liegt bei etwa 10,3:1 bzw. 6,8:1. Ein kräftigeres Rot wie
     `#ff6666` scheitert an der Umkehr: `#009999` auf Weiß erreicht nur etwa 3,5:1.
     „Anmelden“ ist nicht fixiert, weil beim Tippen die Bildschirmtastatur offen ist.
7. **Regeltests im Commit-Gate, E2E nur lokal.** In `.claude/projekt.md` steht dann
   `Test: npm run test && npm run test:rules`. Der GitHub-Workflow bleibt unverändert.
   - Warum: Die Regeln sind die eigentliche Sicherheitsgrenze. Etwa 15 s Emulatorstart
     pro Commit sind dafür vertretbar. E2E ist langsamer und hilft vor allem beim Umbau
     von Abläufen.
8. **`App` teilt sich wie in MZP auf:** `App` entscheidet nach der Session (lädt,
   abgemeldet, angemeldet). Die bisherige Bereichslogik zieht nach `SignedInApp` um.
   - Auswirkung: Nach einer erneuten Anmeldung startet die App wieder auf „Dringend“.
     Die Live-Region und das Update-Angebot bleiben in `App` und sind in jedem Zustand
     sichtbar.
9. **Die Anmeldung liegt in `src/shared/auth`** wie in MZP: Port, Adapter, Fake,
   Fehlertexte, `useSession` und `SignInPage`. Es entsteht kein neuer fachlicher
   Kontext. Die bestehenden Lint-Grenzen (`shared` darf nicht auf `tasks` zugreifen)
   gelten unverändert.
10. **Der Secret-Scan von `/commit` wird zweimal anschlagen, und das ist so gewollt:**
    - `apiKey` in `src/shared/auth/firebaseConfig.ts` ist bei Firebase öffentlich
      vorgesehen. Er benennt nur das Projekt, der Schutz kommt aus der Anmeldung und den
      Regeln (https://firebase.google.com/docs/projects/api-keys).
    - `password` in `e2e/emulatorHousehold.ts` gehört zu einem Konto, das nur im
      lokalen Emulator existiert.

    Beide Fundstellen werden beim Commit benannt und freigegeben. Das echte Passwort des
    Haushaltskontos steht **nirgends** im Repository.

## Ausgangslage

```
main.tsx ──► App(appearanceClient, appUpdateClient)
               ├─ NavigationBar + UrgentPage / FoldersPage / SettingsPage
               ├─ AppUpdateOffer
               └─ Announcer
```

- Es gibt kein `firebase`, kein `firebase-tools`, kein Playwright, keine `firebase.json`
  und keine `firestore.rules` (`package.json`).
- `src/App.tsx:30` rendert die Bereiche direkt, ohne Session.
- `src/shared/ui/SettingsPage.tsx:4` kennt nur die Eintragsart `toggle`.
- Die Palette (`src/index.css:1-24`) hat kein Token für Fehlertexte, und es gibt keine
  Regeln für Eingabefelder.
- `.gitignore` ignoriert `.env.*` ohne Ausnahme für `.env.emulator` und kennt keine
  Playwright- oder Firebase-Artefakte.
- `README.md:51` und der Plan MUL-001 (Zeile 382) kündigen den Abschnitt „Firebase
  absichern“ für MUL-002 an.
- Lokal laufen Java 21 (Corretto 21.0.9) und Node 24.19. Die Emulatoren laufen also.

## Zielbild

```
Mental-Unloader/
  firebase.json                     Emulatoren Firestore 8080, Auth 9099
  .firebaserc                       (Phase 2) Standardprojekt
  firestore.rules                   isHousehold(); folders, lists, tasks
  firestore.rules.test.ts
  vitest.rules.config.ts
  playwright.config.ts
  .env.emulator                     VITE_USE_EMULATORS=true
  e2e/
    emulatorHousehold.ts            Testkonto im Auth-Emulator anlegen
    keyboard.ts                     typeInto, pressButton, signIn
    session.spec.ts                 vier Abläufe
  src/
    main.tsx                        + createFirebaseAuthClient(auth)
    App.tsx                         Weiche nach Session
    App.test.tsx
    SignedInApp.tsx                 Bereiche, Einstellungen, Bestätigungsseite
    shared/
      auth/
        authClient.ts               Port: observeSession, signIn, signOut
        firebaseAuthClient.ts       Adapter
        inMemoryAuthClient.ts       Fake
        firebase.ts                 initializeApp, getAuth, Auth-Emulator
        firebaseConfig.ts
        credentials.ts (+ Test)
        signInFailure.ts (+ Test)
        useSession.ts
        SignInPage.tsx (+ Test)
      ui/
        ConfirmationPage.tsx (+ Test)
        BottomBar.tsx
        BackIcon.tsx
        SettingsPage.tsx            + onRequestSignOut, „Abmelden“
```

Ablauf zur Laufzeit:

```
               ┌──────────── loading ───► <p>Wird geladen.</p>
App ─ useSession(authClient) ─ signedOut ─► SignInPage ── signIn ──┐
               └──────────── signedIn ──► SignedInApp              │
                                            │                      ▼
                         Einstellungen ─► „Abmelden“         Firebase Auth
                                            ▼                (Emulator 9099)
                                      ConfirmationPage
                                       │           │
                                 Abbrechen      Abmelden ─► authClient.signOut()
                                       ▼                     announce('Abgemeldet.')
                                 Einstellungen               → Session signedOut
```

### Oberflächen

```
Anmeldeseite (ohne Navigation)       Beim Start, solange Firebase prüft
┌───────────────────────────┐        ┌───────────────────────────┐
│ Mental Unloader           │  h1    │ Wird geladen.             │
│                           │        │                           │
│ E-Mail                    │        └───────────────────────────┘
│ ┌───────────────────────┐ │
│ │haushalt@…             │ │  Rahmen --ink, 2 px
│ └───────────────────────┘ │
│ Passwort                  │
│ ┌───────────────────────┐ │
│ │••••••                 │ │
│ └───────────────────────┘ │
│ E-Mail oder Passwort      │  Fehlertext in --failure,
│ stimmt nicht.             │  zusätzlich angesagt
│ ╔═══════════════════════╗ │
│ ║       Anmelden        ║ │  im Fluss, nicht fixiert
│ ╚═══════════════════════╝ │
├───────────────────────────┤
│ (Live-Region)             │
└───────────────────────────┘
```

Einstellungen, vorher und nachher:

```
Vorher                                Nachher
┌───────────────────────────┐        ┌───────────────────────────┐
│ ┌─────┐ ┌─────┐ ╔═════╗   │        │ ┌─────┐ ┌─────┐ ╔═════╗   │
│ │  ☑  │ │ 📁  │ ║▓⚙▓▓║   │        │ │  ☑  │ │ 📁  │ ║▓⚙▓▓║   │
│ └─────┘ └─────┘ ╚═════╝   │        │ └─────┘ └─────┘ ╚═════╝   │
├───────────────────────────┤        ├───────────────────────────┤
│ Einstellungen             │        │ Einstellungen             │
│ ───────────────────────── │        │ ───────────────────────── │
│ Dunkelmodus          │ ✓  │        │ Dunkelmodus          │ ✓  │
│                      └─── │        │                      └─── │
│ ───────────────────────── │        │ ───────────────────────── │
│                           │        │ ╔═══════════════════════╗ │
│                           │        │ ║       Abmelden        ║ │
│                           │        │ ╚═══════════════════════╝ │
└───────────────────────────┘        └───────────────────────────┘
```

Bestätigungsseite:

```
┌───────────────────────────┐
│ ┌──────────┐              │
│ │ ‹ Zurück │              │   wirkt wie Abbrechen
│ └──────────┘              │
│ Abmelden?                 │   h1, bekommt den Fokus
│                           │
│ Auf diesem Gerät musst du │
│ dich danach mit E-Mail    │
│ und Passwort neu anmelden.│
│                           │
├───────────────────────────┤
│ ╔══════════╗ ╔══════════╗ │   BottomBar, unten fixiert
│ ║ Abmelden ║ ║Abbrechen ║ │
│ ╚══════════╝ ╚══════════╝ │
└───────────────────────────┘
```

VoiceOver liest beim Start ohne Anmeldung „Mental Unloader, Überschrift Ebene 1“. Auf der
Bestätigungsseite liest es „Abmelden?, Überschrift Ebene 1“.

## Abstraktionen und Wiederverwendung

- `src/shared/auth/`
  - `authClient.ts` – aus MZP, ergänzt um `signOut(): Promise<void>`.
  - `firebaseAuthClient.ts` – aus MZP, ergänzt um `signOut: () => signOut(auth)` aus
    `firebase/auth`.
  - `inMemoryAuthClient.ts` – aus MZP. `signOut` veröffentlicht
    `{ status: 'signedOut' }`.
  - `credentials.ts`, `credentials.test.ts`, `signInFailure.ts`,
    `signInFailure.test.ts` und `useSession.ts` – aus MZP 1:1.
  - `SignInPage.tsx` und `SignInPage.test.tsx` – aus MZP. Die Überschrift ist „Mental
    Unloader“ und bekommt per `useHeadingFocus` und `tabIndex={-1}` den Fokus.
  - `firebase.ts` – aus MZP, **reduziert auf App und Auth**: `initializeApp`, `getAuth`
    und bei `VITE_USE_EMULATORS === 'true'` `connectAuthEmulator(auth,
    'http://127.0.0.1:9099', { disableWarnings: true })`. Firestore, `storageWarning` und
    `waitForPendingWrites` entfallen bis MUL-003.
  - `firebaseConfig.ts` – in Phase 1 mit Demo-Werten, in Phase 2 mit den echten.
- `src/shared/ui/`
  - `BottomBar.tsx` – aus MZP **ohne** `useOnScreenKeyboard`:
    `<div className="bottomBar"><div className="bottomBarContent">{children}</div></div>`.
  - `ConfirmationPage.tsx` – neu und allgemein gehalten. Die Props sind `heading`,
    `explanation`, `confirmLabel`, `onConfirm` und `onCancel`.
  - `BackIcon.tsx` – neu, ein Winkel nach links im Strichstil von `SettingsIcon`
    (`<path d="M15 18l-6-6 6-6" />`).
  - `SettingsPage.tsx` – bekommt die neue Prop `onRequestSignOut` und rendert unter der Liste den
    Knopf „Abmelden“.
- `src/SignedInApp.tsx` – übernimmt `AREAS`, die Bereichsauswahl und die
  Einstellungseinträge aus `App.tsx`. Neu ist der Zustand der Bestätigungsseite.
- Aus MZP mit Anpassungen übernommen: `firestore.rules`, `firestore.rules.test.ts`,
  `firebase.json`, `vitest.rules.config.ts`, `playwright.config.ts`, `.env.emulator`,
  `e2e/emulatorHousehold.ts` (nur Konto anlegen und Emulator leeren) und
  `e2e/keyboard.ts` (nur `typeInto`, `pressButton` und `signIn`).

## Logging und Beobachtbarkeit

Kein Logging. Rückmeldungen laufen über die Live-Region:

- „Bitte E-Mail und Passwort eingeben.“ und die Texte aus `signInFailure.ts`
- „Abgemeldet.“ nach dem Abmelden

## Umsetzung

### Phase 1: Anmelden und Abmelden gegen den Emulator

Abhängigkeiten: keine

Am Ende dieser Phase funktionieren Anmelden und Abmelden vollständig gegen die
Emulatoren. Regeln, Regeltests, E2E und die README-Anleitung stehen. Die Phase wird
committet, aber **nicht gepusht** (Entscheidung 1).

**Aufgaben**:

- [x] `package.json`:
  - unter `dependencies` `firebase` `^12.19.0`
  - unter `devDependencies` `@firebase/rules-unit-testing` `^5.0.2`,
    `@playwright/test` `^1.63.0` und `firebase-tools` `^15.30.1` (Versionen wie in MZP)
  - neue Skripte:
    ```json
    "test:rules": "firebase emulators:exec --only firestore --project demo-mental-unloader \"vitest run --config vitest.rules.config.ts\"",
    "build:e2e": "vite build --mode emulator",
    "test:e2e": "firebase emulators:exec --only auth --project demo-mental-unloader \"npm run build:e2e && playwright test\""
    ```
  - danach `npm install` und `npx playwright install chromium`
- [x] `.gitignore` ergänzen um `!.env.emulator` (direkt unter `!.env.example`),
  `playwright-report/`, `test-results/`, `blob-report/`, `playwright/.cache/`,
  `.firebase/`, `firebase-debug.log`, `firestore-debug.log` und `ui-debug.log`.
- [x] `.prettierignore` um `blob-report` ergänzen. `playwright-report` und
  `test-results` stehen dort schon.
- [x] `tsconfig.node.json`: In `include` kommen `playwright.config.ts`,
  `vitest.rules.config.ts`, `firestore.rules.test.ts` und `e2e/**/*.ts` dazu.
- [x] `eslint.config.js`: Der Block mit den Node-Globals gilt zusätzlich für
  `e2e/**/*.ts` und `firestore.rules.test.ts`.
- [x] `firebase.json` aus MZP 1:1 (`singleProjectMode`, Firestore 8080, Auth 9099, UI
  aus, `firestore.rules`).
- [x] `firestore.rules` mit Platzhalter-UID:
  ```
  rules_version = '2';

  service cloud.firestore {
    match /databases/{database}/documents {
      function isHousehold() {
        return request.auth != null && request.auth.uid == 'household-uid-placeholder';
      }

      match /folders/{folderId} {
        allow read, write: if isHousehold();
      }

      match /lists/{listId} {
        allow read, write: if isHousehold();
      }

      match /tasks/{taskId} {
        allow read, write: if isHousehold();
      }

      match /{document=**} {
        allow read, write: if false;
      }
    }
  }
  ```
- [x] `vitest.rules.config.ts` aus MZP 1:1.
- [x] `firestore.rules.test.ts` nach MZP (test-getrieben, vor den Regeln). Die UID wird
  aus den Regeln gelesen (`householdUidFrom`), `projectId: 'demo-mental-unloader'`. Je
  Sammlung `folders`, `lists` und `tasks` (per `describe.each`):
  - der Haushalt darf schreiben, lesen und löschen
  - ein fremdes Konto darf weder lesen noch schreiben
  - ein Gast ohne Anmeldung darf weder lesen noch schreiben

  Dazu kommt ein Fall: Der Haushalt wird außerhalb der freigegebenen Sammlungen
  abgewiesen (`households/ours`).
- [x] `src/shared/auth/credentials.ts` und `credentials.test.ts` aus MZP 1:1.
- [x] `src/shared/auth/signInFailure.ts` und `signInFailure.test.ts` aus MZP 1:1.
- [x] `src/shared/auth/authClient.ts` aus MZP, ergänzt um `signOut(): Promise<void>`.
- [x] `src/shared/auth/inMemoryAuthClient.ts` aus MZP, ergänzt um
  `async signOut() { publish({ status: 'signedOut' }) }`.
- [x] `src/shared/auth/firebaseConfig.ts` mit Demo-Werten:
  ```ts
  export const firebaseConfig = {
    apiKey: 'demo-api-key',
    authDomain: 'demo-mental-unloader.firebaseapp.com',
    projectId: 'demo-mental-unloader',
  }
  ```
- [x] `src/shared/auth/firebase.ts` nach Abschnitt „Abstraktionen“: nur App und Auth,
  Auth-Emulator bei `VITE_USE_EMULATORS`.
- [x] `src/shared/auth/firebaseAuthClient.ts` aus MZP, ergänzt um
  `signOut: () => signOut(auth)`.
- [x] `src/shared/auth/useSession.ts` aus MZP 1:1.
- [x] `src/shared/auth/SignInPage.test.tsx` aus MZP (test-getrieben), dazu ein neuer
  Fall: Die Überschrift „Mental Unloader“ hat beim Erscheinen den Fokus.
- [x] `src/shared/auth/SignInPage.tsx` aus MZP: Überschrift „Mental Unloader“ mit
  `useHeadingFocus` und `tabIndex={-1}`. Ansonsten bleibt alles gleich: Felder in
  `p.field`, Fehlertext in `p#signInFailure.failure`, Knopf `type="submit"`.
- [x] `src/shared/ui/BackIcon.tsx` neu nach Abschnitt „Abstraktionen“.
- [x] `src/shared/ui/BottomBar.tsx` neu nach Abschnitt „Abstraktionen“.
- [x] `src/shared/ui/ConfirmationPage.test.tsx` (test-getrieben):
  - die Überschrift trägt `heading` und hat den Fokus
  - die Erklärung ist sichtbar
  - der Knopf mit `confirmLabel` ruft `onConfirm` auf
  - „Abbrechen“ und „Zurück“ rufen jeweils `onCancel` auf
  - auf der Seite gibt es keine Navigation
  - axe meldet keine Verstöße
- [x] `src/shared/ui/ConfirmationPage.tsx`:
  ```tsx
  <main className="page">
    <button type="button" className="backButton" onClick={onCancel}>
      <BackIcon /> Zurück
    </button>
    <h1 ref={headingRef} tabIndex={-1}>{heading}</h1>
    <p>{explanation}</p>
    <BottomBar>
      <button type="button" onClick={onConfirm}>{confirmLabel}</button>
      <button type="button" onClick={onCancel}>Abbrechen</button>
    </BottomBar>
  </main>
  ```
  Die `BottomBar` steht **innerhalb** von `<main>` wie in MZP
  (`src/meals/ui/AddSupplyPage.tsx:104-114`). Außerhalb einer Landmark meldet axe die
  Regel `region`. Die Ref aus `useHeadingFocus` heißt `headingRef`, damit sie sich von
  der Prop `heading` unterscheidet.
- [x] `src/shared/ui/SettingsPage.tsx`: neue Prop `onRequestSignOut: () => void`. Unter
  der Liste steht `<button type="button" className="signOutButton"
  onClick={onRequestSignOut}>Abmelden</button>`. Der Name grenzt die Prop vom
  tatsächlichen Abmelden ab (`onSignOut` in `SignedInApp`).
- [x] `src/index.css`:
  - im ersten `:root` die Tokens `--failure: #ff9999` und
    `--bottomBarHeight: calc(3rem + 1rem + 1px)`
  - im zweiten `:root` das Token `--failure: #006666`
  - `.field` und `.failure` aus MZP (`.failure` mit `color: var(--failure)`)
  - `input[type='email'], input[type='password']` mit `font: inherit`,
    `min-height: 44px`, `box-sizing: border-box`, `width: 100%`,
    `border: 2px solid var(--ink)`, `border-radius: 6px`, `padding: 0.5rem`,
    `background-color: var(--surface)` und `color: var(--ink)`
  - `.signOutButton` (`width: 100%`, `margin-top: 1.5rem`)
  - `.backButton` (`display: inline-flex`, `align-items: center`, `gap: 0.25rem`,
    `margin-bottom: 1rem`)
  - `.bottomBar`, `.bottomBarContent`, `.bottomBarContent button` sowie die
    `body:has(.bottomBar)`- und `html:has(.bottomBar)`-Regeln aus MZP, aber ohne
    `.bottomBarInFlow` und ohne die `:not(.bottomBarInFlow)`-Teile
- [x] `test/palette.test.ts`: `TEXT_ON_ITS_BACKGROUND` bekommt das Paar
  `['--failure', '--surface']`.
- [x] `src/SignedInApp.tsx`: übernimmt `AREAS`, `activeArea`, `navigation`,
  `settingsEntries` und `areaPage()` aus `App.tsx`. Die Props sind `appearance`
  (Ergebnis von `useAppearance`) und `onSignOut: () => void`. Der neue Zustand
  `confirmingSignOut` zeigt statt der Bereichsseite:
  ```tsx
  <ConfirmationPage
    heading="Abmelden?"
    explanation="Auf diesem Gerät musst du dich danach mit E-Mail und Passwort neu anmelden."
    confirmLabel="Abmelden"
    onConfirm={onSignOut}
    onCancel={() => setConfirmingSignOut(false)}
  />
  ```
  Nach „Abbrechen“ wird wieder der Bereich `settings` gezeigt. Die Einstellungsseite
  wird dabei neu eingehängt, sodass ihre Überschrift den Fokus bekommt.
- [x] `src/App.tsx`: neue Prop `authClient: AuthClient`. `useSession` entscheidet:
  - `loading` → `<p className="page">Wird geladen.</p>`
  - `signedOut` → `<SignInPage authClient={authClient} announce={announce} />`
  - `signedIn` → `<SignedInApp appearance={appearance} onSignOut={signOut} />`

  `signOut` ruft `authClient.signOut()` auf und sagt danach „Abgemeldet.“ an. Wirft der
  Aufruf, wird stattdessen „Abmelden fehlgeschlagen.“ angesagt (per `try/catch`, also
  ohne unbehandelte Ablehnung), und man bleibt angemeldet. `useAppearance`, `useAppUpdate`, `AppUpdateOffer` und
  `Announcer` bleiben in `App`.
- [x] `src/App.test.tsx` (test-getrieben):
  - `renderApp` bekommt als dritten Parameter `authClient`. Voreinstellung ist ein
    `createInMemoryAuthClient(household, { status: 'signedIn', userId: household.userId })`
    mit `const household = { email: 'haushalt@example.com', password: 'geheim',
    userId: 'household' }`, damit die bisherigen Fälle unverändert bleiben.
  - Der Client für „Wird geladen.“ ist ein Objektliteral. Sein `observeSession` meldet
    nie, `signIn` und `signOut` lösen nur auf.
  - Neue Fälle:
    - solange die Session nicht feststeht, steht „Wird geladen.“ da (`AuthClient`, das
      nie meldet)
    - abgemeldet erscheint die Anmeldeseite mit fokussierter Überschrift „Mental
      Unloader“ und ohne Navigation
    - nach der Anmeldung mit den richtigen Zugangsdaten hat die Überschrift „Dringend“
      den Fokus
    - Einstellungen → „Abmelden“ zeigt die Bestätigungsseite: Überschrift „Abmelden?“
      mit Fokus, keine Navigation
    - „Abbrechen“ führt zu den Einstellungen mit fokussierter Überschrift, und man bleibt
      angemeldet
    - „Zurück“ verhält sich wie „Abbrechen“
    - Bestätigen führt zur Anmeldeseite, und die Live-Region zeigt „Abgemeldet.“
    - schlägt das Abmelden fehl (Client, dessen `signOut` ablehnt), zeigt die
      Live-Region „Abmelden fehlgeschlagen.“
    - nach dem Abmelden und erneuten Anmelden steht die App wieder auf „Dringend“
    - axe meldet auf der Anmeldeseite und auf der Bestätigungsseite keine Verstöße
- [x] `src/main.tsx`: `authClient={createFirebaseAuthClient(auth)}` übergeben, mit
  `auth` aus `./shared/auth/firebase.ts`.
- [x] `.env.emulator` mit `VITE_USE_EMULATORS=true`.
- [x] `playwright.config.ts` aus MZP, mit `baseURL` und `webServer.url`
  `http://localhost:4173/mental-unloader/`.
- [x] `e2e/emulatorHousehold.ts`, reduziert aus MZP:
  - `household` (`haushalt@example.com`, Passwort nur für den Emulator)
  - `householdUid()` aus `firestore.rules`
  - `callEmulator`
  - `prepareEmulators()`: löscht alle Konten im Auth-Emulator und legt das Haushaltskonto
    mit der UID aus den Regeln an. Firestore wird nicht angefasst.

  `PROJECT` kommt aus `firebaseConfig.projectId`. Der Import lautet
  `../src/shared/auth/firebaseConfig.ts` **mit** Endung (`module: nodenext` in
  `tsconfig.node.json`, wie MZP `e2e/emulatorHousehold.ts:3`).
- [x] `e2e/keyboard.ts` mit `typeInto`, `pressButton` und `signIn` aus MZP.
- [x] `e2e/session.spec.ts` (`beforeEach`: `prepareEmulators()`), nur per Tastatur:
  - nach der Anmeldung ist die Überschrift „Dringend“ sichtbar
  - ein falsches Passwort zeigt „E-Mail oder Passwort stimmt nicht.“
  - nach `page.reload()` ist man noch angemeldet (Überschrift „Dringend“)
  - Einstellungen → Abmelden → Abmelden führt zur Überschrift „Mental Unloader“, und
    nach `page.reload()` steht dort weiterhin die Anmeldeseite
- [x] `.claude/projekt.md`: `Test: npm run test && npm run test:rules`.
- [x] `README.md`:
  - Befehle `test:rules`, `test:e2e` und den einmaligen Schritt
    `npx playwright install chromium` ergänzen
  - Hinweis: Regeltests und E2E brauchen Java 21 oder neuer
  - neuer Abschnitt **„Firebase einrichten und absichern“** mit den nummerierten
    Schritten unten. Jeder Schritt sagt, wo man klickt, was man einträgt und woran man
    erkennt, dass es geklappt hat:
    1. **Projekt anlegen:** https://console.firebase.google.com → „Projekt erstellen“.
       Name „Mental Unloader“, Projekt-ID möglichst `mental-unloader` (ist sie vergeben,
       die vorgeschlagene ID notieren). Google Analytics und Gemini aus. Tarif bleibt
       Spark (kostenlos).
    2. **Web-App registrieren:** Projektübersicht → Symbol `</>` („Web“). Spitzname
       „Mental Unloader“, Firebase Hosting **nicht** ankreuzen. Das angezeigte
       `firebaseConfig`-Objekt kopieren und dem Agenten geben (es ist öffentlich, siehe
       unten).
    3. **Anmeldeart aktivieren:** Build → Authentication → „Jetzt starten“ → Reiter
       „Anmeldemethode“ → „E-Mail-Adresse/Passwort“ → obersten Schalter aktivieren,
       „E-Mail-Link“ aus lassen → Speichern.
    4. **Haushaltskonto anlegen:** Authentication → Reiter „Nutzer“ → „Nutzer
       hinzufügen“. E-Mail des Haushalts und ein langes, generiertes Passwort eintragen
       und beides sofort in die Passwortmanager aller Geräte übernehmen. Die angezeigte
       **Nutzer-UID** kopieren und dem Agenten geben.
    5. **Selbstregistrierung abschalten:** Authentication → Reiter „Einstellungen“ →
       „Nutzeraktionen“ → Haken bei „Erstellen (Registrierung) aktivieren“ entfernen →
       Speichern. Prüfen mit der curl-Probe aus MZP: Die Antwort muss
       `ADMIN_ONLY_OPERATION` lauten. Kommt stattdessen ein `idToken`, ist die
       Registrierung noch offen, und das Probekonto muss unter „Nutzer“ gelöscht werden.
    6. **Firestore anlegen:** Build → Firestore Database → „Datenbank erstellen“.
       Standard-Edition, Datenbank-ID `(default)`, Standort `europe-west3 (Frankfurt)`
       (lässt sich später nicht ändern), Start im **Produktionsmodus**.
    7. **Regeln ausrollen:** einmalig `npx firebase login`, dann
       `npx firebase deploy --only firestore:rules --project <projekt-id>`. Prüfen:
       Firestore Database → Reiter „Regeln“ zeigt die Haushalts-UID. Hinweis: Kein
       Workflow rollt Regeln aus. Wer `firestore.rules` ändert, muss neu ausrollen, sonst
       weist die Produktion den Zugriff ab.
    8. **Prüfen:** App auf jedem iPhone öffnen und mit dem Haushaltskonto anmelden.

    Danach folgen wie in MZP die Erklärung, warum der `apiKey` öffentlich sein darf, und
    der Hinweis, dass die Regeln nur die eine UID freigeben (`npm run test:rules` prüft
    das).

**Automatisierte Verifikation**:

- [x] `npm run test` läuft grün, einschließlich `credentials.test.ts`,
  `signInFailure.test.ts`, `SignInPage.test.tsx`, `ConfirmationPage.test.tsx`,
  `src/App.test.tsx` und `test/palette.test.ts` mit `--failure`
- [x] `npm run test:rules` läuft grün
- [x] `npm run test:e2e` läuft grün mit allen vier Abläufen aus `e2e/session.spec.ts`
- [x] `npm run lint`, `npm run format:check` und `npm run build` laufen grün
- [x] `git status` zeigt `.env.emulator` als neue Datei, aber keine Playwright- oder
  Firebase-Logdateien

### Phase 2: Echtes Firebase-Projekt anschließen

Abhängigkeiten: Phase 1

Du arbeitest die README-Anleitung ab und gibst dem Agenten drei Werte: das
`firebaseConfig`-Objekt, die Projekt-ID und die UID des Haushaltskontos. Der Agent trägt
sie ein. Danach rollst du die Regeln aus, und die App wird gepusht.

**Vorbereitung durch den Nutzer** (README, Schritte 1 bis 6):

- [ ] Projekt angelegt, Projekt-ID notiert
- [ ] Web-App registriert, `firebaseConfig` an den Agenten übergeben
- [ ] E-Mail/Passwort aktiviert
- [ ] Haushaltskonto angelegt, Zugangsdaten in den Passwortmanagern, UID an den Agenten
  übergeben
- [ ] Selbstregistrierung abgeschaltet
- [ ] Firestore in `europe-west3` im Produktionsmodus angelegt

**Aufgaben**:

- [ ] `src/shared/auth/firebaseConfig.ts`: die Demo-Werte durch das übergebene
  `firebaseConfig`-Objekt ersetzen.
- [ ] `.firebaserc` mit `{ "projects": { "default": "<projekt-id>" } }` anlegen.
- [ ] `package.json`: In `test:e2e` wird `--project demo-mental-unloader` durch die echte
  Projekt-ID ersetzt. Die App und `prepareEmulators` sprechen den Emulator mit
  `firebaseConfig.projectId` an. Weicht `--project` davon ab, warnt der Emulator bei
  `singleProjectMode` bei jeder Anfrage (firebase-tools 15.30.1,
  `emulator/auth/server.js`, Modus `WARNING`). `test:rules` bleibt bei
  `demo-mental-unloader`.
- [ ] `firestore.rules`: `household-uid-placeholder` durch die übergebene UID ersetzen.
- [ ] `README.md`: In der Anleitung die tatsächliche Projekt-ID in den Befehlen
  einsetzen.

**Automatisierte Verifikation**:

- [ ] `npm run test`, `npm run test:rules` und `npm run test:e2e` laufen grün
- [ ] `npm run lint`, `npm run format:check` und `npm run build` laufen grün
- [ ] Nach einem frischen `npm run build` enthält `dist/assets/*.js` die echte
  `projectId` und weder `demo-mental-unloader` noch `127.0.0.1:9099`. Der Build ist
  nötig, weil auch der E2E-Lauf nach `dist/` schreibt.

**Manuelle Verifikation**:

- [ ] README Schritt 5: Die curl-Probe gegen den echten `apiKey` liefert
  `ADMIN_ONLY_OPERATION`.
- [ ] README Schritt 7: Die Regeln sind ausgerollt, und die Konsole zeigt unter
  Firestore → Regeln die Haushalts-UID.
- [ ] Nach dem Push auf `main` (nur auf ausdrückliche Anweisung) ist der Workflow grün.
  In Safari auf dem iPhone erscheint die Anmeldeseite, und der Passwortmanager bietet
  das Haushaltskonto an.
- [ ] Nach der Anmeldung erscheint „Dringend“. Nach dem Schließen und erneuten Öffnen
  der App vom Home-Bildschirm ist man weiterhin angemeldet.
- [ ] Die Anmeldung klappt auch auf dem zweiten iPhone.
- [ ] Mit VoiceOver: Die Anmeldeseite liest „Mental Unloader, Überschrift“. Eine falsche
  Eingabe wird angesagt. Einstellungen → „Abmelden“ führt zur Bestätigungsseite
  („Abmelden?“), die Knöpfe unten sind erreichbar, und nach dem Bestätigen sagt
  VoiceOver „Abgemeldet.“
- [ ] Im Hellmodus ist der Fehlertext auf der Anmeldeseite gut lesbar.

## Notizen zur Umsetzung

Hier während der Umsetzung Rückmeldungen, Probleme und Entscheidungen festhalten.

- Phase 1: `npm install` (npm 11.17) führt die Install-Skripte von `re2`, `protobufjs`
  und `@firebase/util` nicht aus (`allow-scripts`). Die Emulatoren, Regeltests und E2E
  laufen trotzdem; MZP hat dafür ebenfalls keine Freigabe.
- Phase 1: Der Lockfile-Diff ist groß, enthält aber nur neue Pakete. Keine bestehende
  Version hat sich geändert.
- Phase 1: Im E2E steht der Fehlertext zweimal auf der Seite (Fehlerzeile und
  Live-Region). Der Test prüft deshalb das erste Vorkommen.
- Phase 1: Das Emulator-Passwort im E2E lautet `nur-im-emulator`.

## Verweise

- Gesamtplan: `docs/agents/plans/2026-10-08-gesamtplan.md` (Zeilen 50–55, 205–226, 257)
- Vorgänger: `docs/agents/plans/2026-10-09-grundgeruest.md`
- Architektur: `.claude/skills/architecture/SKILL.md`,
  `.claude/skills/architecture/references/typescript.md`
- Vorlagen in MZP (`..\Mahlzeitenplaner`): `src/shared/auth/*`, `src/App.tsx`,
  `src/shared/ui/BottomBar.tsx`, `src/shopping/ui/RemoveItemPage.tsx`,
  `firestore.rules`, `firestore.rules.test.ts`, `firebase.json`,
  `vitest.rules.config.ts`, `playwright.config.ts`, `.env.emulator`,
  `e2e/emulatorHousehold.ts`, `e2e/keyboard.ts`, `.gitignore`, README-Abschnitt
  „Firebase absichern“
- MZP-Plan mit der ersten Firebase-Einrichtung:
  `docs/agents/plans/2026-09-14-einkaufsliste-pwa-mit-firestore-sync.md` (ab Zeile 362)
- Firebase API-Schlüssel: https://firebase.google.com/docs/projects/api-keys
