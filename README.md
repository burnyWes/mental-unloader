# Mental-Unloader

Aufgaben-App des Haushalts für das iPhone, als Progressive Web App vom Home-Bildschirm
aus nutzbar.

Adresse: https://burnywes.github.io/mental-unloader/

## Auf dem iPhone installieren

In Safari die Adresse öffnen, dann Teilen → „Zum Home-Bildschirm“. Die App startet von
dort ohne Browserleiste und bietet neue Versionen mit „Neue Version laden“ an.

## Arbeitsweise

Die Dauerregeln stehen in [CLAUDE.md](CLAUDE.md), die projektspezifischen Angaben in
[.claude/projekt.md](.claude/projekt.md). Offene Punkte und Bugs stehen in
[docs/notes.txt](docs/notes.txt). Den Weg zur fertigen App beschreibt der
[Gesamtplan](docs/agents/plans/2026-10-08-gesamtplan.md).

## Ablauf

```
/grill-me <Vorhaben>        Vorhaben auf Herz und Nieren prüfen
/rpi-research <Frage>       Bestehendes verstehen        -> docs/agents/research/
/rpi-plan <Vorhaben>        Plan erstellen               -> docs/agents/plans/
/rpi-implement <Plan>       Plan Phase für Phase umsetzen
/commit                     Format, Lint, Tests, Architektur, Secrets -> Commit
```

## Befehle

```
npm run dev         Entwicklungsserver
npm run test        Unit- und Komponententests, Architekturtest
npm run test:rules  Firestore-Regeln gegen den Emulator
npm run test:e2e    Playwright-Abläufe gegen den Auth-Emulator
npm run lint        ESLint einschließlich Schicht- und Kontextgrenzen
npm run format      Prettier
npm run build       Typprüfung und Produktions-Build nach dist/
npm run icons       App-Icons und favicon.svg nach public/ neu zeichnen
```

Regeltests und E2E starten die Firebase-Emulatoren und brauchen Java 21 oder neuer. Vor
dem ersten `npm run test:e2e` einmalig `npx playwright install chromium` ausführen.

Das Motiv der Icons steht in `scripts/checkMarkMotif.mjs`. Nach einer Änderung dort
`npm run icons` ausführen und die erzeugten Dateien mit einchecken.

Ein Push auf `main` prüft und baut die App im Workflow „Deploy to GitHub Pages“ und
rollt sie aus.

## Firebase einrichten und absichern

Die App nutzt ein eigenes Firebase-Projekt mit genau einem Haushaltskonto. Die Schritte
werden einmal durchlaufen und taugen später als Nachschlagewerk, etwa für ein neues
Passwort oder geänderte Regeln.

1. **Projekt anlegen:** https://console.firebase.google.com → „Projekt erstellen“. Name
   „Mental Unloader“, Projekt-ID möglichst `mental-unloader`. Ist sie vergeben, die
   vorgeschlagene ID notieren. Google Analytics und Gemini ausschalten. Der Tarif bleibt
   Spark (kostenlos). Geklappt: Die Projektübersicht öffnet sich.
2. **Web-App registrieren:** Projektübersicht → Symbol `</>` („Web“). Spitzname „Mental
   Unloader“, Firebase Hosting **nicht** ankreuzen → „App registrieren“. Das angezeigte
   `firebaseConfig`-Objekt kopieren. Es kommt nach `src/shared/auth/firebaseConfig.ts`
   und ist öffentlich (siehe unten). Geklappt: Unter Projekteinstellungen → „Meine Apps“
   steht die Web-App.
3. **Anmeldeart aktivieren:** Build → Authentication → „Jetzt starten“ → Reiter
   „Anmeldemethode“ → „E-Mail-Adresse/Passwort“ → obersten Schalter aktivieren,
   „E-Mail-Link“ aus lassen → Speichern. Geklappt: Der Anbieter steht als „Aktiviert“ in
   der Liste.
4. **Haushaltskonto anlegen:** Authentication → Reiter „Nutzer“ → „Nutzer hinzufügen“.
   E-Mail des Haushalts und ein langes, generiertes Passwort eintragen und beides sofort
   in die Passwortmanager aller Geräte übernehmen. Die angezeigte **Nutzer-UID**
   kopieren. Sie kommt nach `firestore.rules` in `isHousehold()`. Geklappt: Das Konto
   steht in der Nutzerliste.
5. **Selbstregistrierung abschalten:** Authentication → Reiter „Einstellungen“ →
   „Nutzeraktionen“ → Haken bei „Erstellen (Registrierung) aktivieren“ entfernen →
   Speichern. Ohne diesen Schritt kann sich jeder mit dem öffentlichen `apiKey` ein
   Konto im Projekt anlegen. Prüfen ohne Konsole, die Antwort muss
   `ADMIN_ONLY_OPERATION` lauten:

   ```
   curl -X POST -H "Content-Type: application/json" -d '{"email":"probe@example.com","password":"egal-was"}' "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=<apiKey>"
   ```

   Steht in der Antwort stattdessen ein `idToken`, ist die Registrierung noch offen, und
   die Probe hat gerade selbst ein Konto angelegt. Es muss unter „Nutzer“ gelöscht
   werden.
6. **Firestore anlegen:** Build → Firestore Database → „Datenbank erstellen“.
   Standard-Edition, Datenbank-ID `(default)`, Standort `europe-west3 (Frankfurt)`. Der
   Standort lässt sich später nicht ändern. Start im **Produktionsmodus**. Geklappt: Die
   leere Datenbank wird angezeigt.
7. **Regeln ausrollen:** einmalig `npx firebase login`, dann

   ```
   npx firebase deploy --only firestore:rules --project <projekt-id>
   ```

   Geklappt: Firestore Database → Reiter „Regeln“ zeigt die Haushalts-UID. Die Regeln
   rollt **kein** Workflow aus. Wer `firestore.rules` ändert, muss sie neu ausrollen,
   sonst weist die Produktion den Zugriff ab.
8. **Prüfen:** Die App auf jedem iPhone öffnen und mit dem Haushaltskonto anmelden.
   Geklappt: Nach der Anmeldung erscheint „Dringend“.

Der `apiKey` in `src/shared/auth/firebaseConfig.ts` ist öffentlich, das ist bei Firebase
so vorgesehen (https://firebase.google.com/docs/projects/api-keys). Er ist kein
Geheimnis, sondern nur die Projektadresse. Den Zugriff begrenzen die abgeschaltete
Selbstregistrierung (Schritt 5) und die Regeln: `firestore.rules` gibt Lesen und
Schreiben nur der einen Haushalts-UID frei. Ein fremdes Konto könnte also auch ohne
Schritt 5 keine Daten sehen. `npm run test:rules` prüft das.
