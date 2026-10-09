---
date: 2026-10-08
git_commit: 4cba238ca766c64c59c2defe56a0ab2cd07c389d
branch: main
story: MUL-000
topic: "Gesamtplan Mental Unloader"
tags: [plan, gesamtplan, pwa, firestore, accessibility]
status: draft
---

# PLAN: MUL-000 — Gesamtplan Mental Unloader

Mental Unloader ist eine Aufgaben-App für iPhones, gebaut als Web-App (PWA) ohne
Apple-Developer-Account. Sie läuft auf GitHub Pages, und die Daten des Haushalts werden
über Firestore auf allen Geräten abgeglichen. Technik, Look and Feel und der
VoiceOver-First-Ansatz stammen aus dem Schwesterprojekt `..\Mahlzeitenplaner`.

Dieser Plan hält die Entscheidungen der grill-me-Sitzung vom 08.10.2026 fest und teilt
das Vorhaben in neun Teilpläne (MUL-001 bis MUL-009) auf. Jeder Teilplan entsteht
**einzeln und erst dann**, wenn der vorige umgesetzt und committet ist, jeweils mit
`/rpi-plan` und mit Verweis auf diesen Gesamtplan.

## Akzeptanzkriterien (Gesamtvorhaben)

- Die App lässt sich auf mehreren iPhones zum Home-Bildschirm hinzufügen und zeigt dort
  den vollen Namen „Mental Unloader“ und ein Haken-Icon.
- Ein gemeinsames Haushaltskonto meldet sich einmal pro Gerät an. Alle Geräte sehen
  denselben Datenbestand, auch nach kurzer Offline-Phase.
- Ordner → Listen → Aufgaben lassen sich anlegen, bearbeiten, verschieben und löschen.
- Aufgaben haben die Fälligkeit 🔥 Dringend, 📅 Stichtag oder ☕ Irgendwann. Stichtage
  können wiederkehren.
- Die Dringend-Seite sammelt alles Dringende aus allen Listen. Die Navigation zeigt die
  Anzahl als Badge.
- Die gesamte App ist ausschließlich mit VoiceOver bedienbar, und axe meldet keine
  Verstöße.
- Dunkel- und Hellmodus sind exakte Farbumkehrungen voneinander, maschinell geprüft.

## Wesentliche Entscheidungen und Abwägungen

### Technik und Betrieb

1. **Stack 1:1 aus dem Mahlzeitenplaner:** TypeScript, React 19, Vite 8,
   `vite-plugin-pwa`, Firebase (Auth + Firestore), Vitest + Testing Library + axe,
   Firestore-Regeltests im Emulator, Playwright-E2E, Prettier, ESLint mit
   Architekturgrenze, GitHub Pages per GitHub Actions.
   - Warum: Bewährt und bereits für VoiceOver und iOS erprobt.
   - Auswirkung: Bausteine wie `NavigationBar`, `BottomBar`, `Stepper`, Announcer,
     `useHeadingFocus`, Bestätigungsseiten, App-Update und Farbumkehr werden als
     Vorlage übernommen und angepasst.
2. **Eigenes Firebase-Projekt** mit eigenem Haushaltskonto. Selbstregistrierung ist
   aus, und `firestore.rules` gibt nur die eine Haushalts-UID frei.
   - Warum: Regeln, Kontingente und Ausrollvorgänge bleiben von der anderen App
     getrennt.
   - Auswirkung: MUL-002 enthält eine **ausführliche Schritt-für-Schritt-Anleitung**
     (was, wie, wo) zur Einrichtung des Firebase-Projekts.
3. **Adresse:** `https://burnywes.github.io/mental-unloader/`, Basis-Pfad
   `/mental-unloader/` (Repo `burnyWes/mental-unloader`).
4. **Keine Push-Benachrichtigungen und kein Icon-Badge** auf dem Home-Bildschirm.
   - Warum: Push bräuchte Cloud Functions (Blaze-Tarif) und einen zeitgesteuerten Job.
     Das Icon-Badge wäre ohne Server oft veraltet.
   - Auswirkung: Beides steht als Idee für später in `docs/notes.txt`.

### Begriffe

5. **Ordner → Listen → Aufgaben.** Im Code heißen sie `folder`, `list` und `task`.
   - Warum: „Ordner“ deckt sich mit dem Icon, und „Aufgabe“ spricht VoiceOver sauber
     aus (anders als „TODO“).
6. **Beim ersten Start ist die App leer.** „Meine TODOs“ und „Familien-TODOs“ sind nur
   Beispiele.

### Fälligkeit

7. **Überschrift „Fälligkeit“** mit drei sich ausschließenden Optionen. Es sind echte
   Radio-Buttons im Checkbox-Look:
   🔥 **Dringend** (Flamme), 📅 **Stichtag** (Kalender mit Uhr), ☕ **Irgendwann**
   (Kaffeetasse). Voreinstellung ist **Irgendwann**.
8. **Dringend bleibt Dringend.** Beim Speichern wird `urgentSince` = heute gesetzt.
   Das Datum dient nur zum Sortieren und wird nicht als Stichtag angezeigt. Eine
   dringende Aufgabe ist **nie wiederkehrend**.
9. **„Dringend ab“** (natives `<select>`), Voreinstellung **1 Woche vorher**:
   *sofort* (= ab jetzt), *am Stichtag*, *1 Tag*, *1 Woche*, *1 Monat*, *¼ Jahr*,
   *½ Jahr*, *1 Jahr vorher*.
10. **Stichtag-Eingabe:** drei Stepper TT / MM / JJJJ mit **Ringlauf je Feld**.
    - Der Tag läuft im Kreis innerhalb der Länge des aktuellen Monats (30.11. ▲ → 01.11.).
    - Ändert sich der Monat und passt der Tag nicht mehr, wird er auf den letzten Tag
      gekürzt (31.01. → Feb → 28.02.).
    - Das Jahr läuft nicht im Kreis.
    - Für VoiceOver ist jedes Feld ein `role="spinbutton"` (Wischen nach oben oder
      unten). Der Monat wird als Name gesprochen. Die ▲▼-Knöpfe sind für VoiceOver
      ausgeblendet.
    - Startwert ist **heute + 1 Woche**. Vergangene Daten sind erlaubt und werden als
      „überfällig“ angezeigt.

### Wiederkehrende Aufgaben

11. **Rhythmus:** wöchentlich, monatlich, vierteljährlich, halbjährlich, jährlich.
    Der Schalter „Wiederkehrend“ erscheint nur bei 📅 Stichtag.
12. **Nächster Stichtag beim Erledigen:**
    - wird **vom alten Stichtag aus** gerechnet, nicht vom Erledigungstag,
    - wird **so lange weitergeschoben, bis er nach heute liegt** (Verpasstes wird nicht
      nachgeholt),
    - behält den **ursprünglichen Tag als Anker** (31.01. → 28.02. → 31.03.).
    - Der Vorlauf „Dringend ab“ gilt für jeden neuen Stichtag gleich.
13. **Erledigt-Ansicht:** Eine wiederkehrende Aufgabe erscheint dort **nur einmal**,
    mit „n× erledigt, zuletzt TT.MM.“. Sie bleibt zugleich unter „offen“. Erst nach der
    ersten Erledigung taucht sie unter „erledigt“ auf. Die einzelnen Erledigungsdaten
    stehen als **Verlauf auf der Übersichtsseite**.

### Listen-Seite und Erledigt-Filter

14. **Filter `| offen (n) || erledigt (n) |`.** Der Zähler zählt **Einträge**, nicht
    Erledigungen, sodass Zähler und sichtbare Zeilen immer übereinstimmen.
15. **Sortierung „offen“** (gilt überall, auch auf der Dringend-Seite):
    zuerst 🔥 (ältestes `urgentSince` zuerst), dann 📅 nach Stichtag aufsteigend
    (Überfälliges wird als „überfällig“ markiert und angesagt), zuletzt ☕ nach
    Erstellungszeitpunkt, älteste zuerst.
16. **Sortierung „erledigt“:** zuletzt erledigt zuerst, mit Erledigungsdatum in der
    Zeile.
17. **Wieder öffnen (↺):** nur für normale Aufgaben, auf der Übersichtsseite anstelle
    von ✓, ohne Sicherheitsabfrage. Erledigungen wiederkehrender Aufgaben lassen sich
    nicht rückgängig machen.
18. **Nichts wird automatisch gelöscht.** Einzeln löschen geht per 🗑. Auf einer
    wiederkehrenden Aufgabe löscht 🗑 die **ganze Aufgabe**.

### Dringend-Seite

19. **Inhalt:** alle 🔥 dringenden Aufgaben sowie alle 📅 Aufgaben, deren Vorlauf
    erreicht ist, aus allen Ordnern und Listen. Es gibt **keinen Erledigt-Filter**
    und keine [✎][+]-Knöpfe.
20. **Herkunftszeile** „Ordner › Liste“ unter dem Aufgabennamen. VoiceOver liest
    „Müll rausbringen, dringend, Familie, Haushalt“.
21. **Badge** am Dringend-Icon der Navigation mit der Zahl der offenen dringenden
    Aufgaben. Bei 0 ist er ausgeblendet. VoiceOver liest „Dringend, 3 Aufgaben“.
22. **Startseite** der App ist die Dringend-Seite.

### Bestätigungen

23. **Eigene Bestätigungsseiten statt modaler Dialoge**, nach dem Muster von
    `RemoveItemPage` im Mahlzeitenplaner (MZP-038). Sie gelten für Erledigen (aus der
    Liste, von der Dringend-Seite und von der Übersichtsseite) und für Löschen
    (Aufgabe, Liste, Ordner). Die Navigation ist dort ausgeblendet, und die Knöpfe
    sind unten fixiert.
    - Bei wiederkehrenden Aufgaben nennt die Abfrage den nächsten Stichtag.
    - Nach dem Bestätigen geht es zurück zur Ausgangsseite, der Fokus liegt auf der
      nächsten Zeile, und eine Ansage bestätigt die Aktion.

### Ordner und Listen

24. **Bearbeiten-Seiten** für Ordner (Name) und Liste (Name, Ordner-Auswahl), jeweils
    mit 🗑 Löschen und 💾 Speichern.
25. **Löschen nimmt den Inhalt mit**, und die Abfrage nennt die Menge („Ordner Familie
    mit 3 Listen und 17 Aufgaben löschen?“).
26. **Verschieben:** Eine Liste lässt sich in einen anderen Ordner verschieben, eine
    Aufgabe in eine andere Liste (Auswahlfeld mit `<optgroup>` je Ordner).
27. **Ordner und Listen werden alphabetisch sortiert**, ohne manuelle Reihenfolge.
    Namen dürfen nicht leer sein, müssen aber nicht eindeutig sein.

### Oberfläche

28. **Navigation oben fixiert**, mit drei reinen Icon-Knöpfen:
    `| ☑ Dringend (Badge) || 📁 Ordner || ⚙ Einstellungen |`.
    Aktionsknöpfe sind meist unten fixiert, Inhalte meist zentriert.
29. **Drei Knopf-Typen, ähnlich und doch anders.** Gemeinsam haben sie den runden
    linken Rand, einen dicken hell-orangen Rahmen und den Namen auf schwarzem Grund.

    ```
    Ordner   ╭──────────────────┬─────╮   eine Schaltfläche, rechts rund,
             │ Familien-TODOs   │  →  │   →-Feld dunkel-orange gefüllt
             │ 3 Listen         │     │
             ╰──────────────────┴─────╯

    Liste    ╭─────────────────────╲      eine Schaltfläche, rechts
             │ Haushalt             ╲     spitz mit 45° (Spitzentiefe =
             │ 5 offen, 🔥 2         ╱     halbe Höhe), Rahmen läuft mit
             ╰─────────────────────╱

    Aufgabe  ╭────────────────┬─────╮     ZWEI Schaltflächen:
             │ Müll rausbr.   │  ✓  │     Name → Übersichtsseite,
             │ 📅 15.10.      │     │     ✓ (dunkel-orange) → Erledigen
             ╰────────────────┴─────╯
    ```
30. **Checkbox, Radio-Button und Schalter** sehen alle wie die Checkbox aus dem
    Beispiel aus: nur linke und untere Kante, großer grüner Haken.
31. **Farben:** Der Dunkelmodus ist Standard. Hell = **exakte Umkehr** jeder Farbe,
    maschinell durch einen Paletten-Test gesichert. Startwerte mit maximaler Sättigung,
    der Feinschliff folgt am iPhone (MUL-009):

    | Rolle | Dunkel | Hell |
    |---|---|---|
    | Hintergrund | `#000000` | `#FFFFFF` |
    | Schrift | `#FFFFFF` | `#000000` |
    | Knopf-Fläche | `#993D00` | `#66C2FF` |
    | Knopf-Rahmen | `#FF9933` | `#0066CC` |
    | Haken | `#00FF33` | `#FF00CC` |
    | Überfällig | `#FF6666` | `#009999` |

32. **Einstellungen:** Schalter „Dunkelmodus“ (Standard an, pro Gerät im
    localStorage, folgt **nicht** der iOS-Systemeinstellung).
33. **App-Name** „Mental Unloader“, auch unter dem Icon. **App-Icon:** großer grüner
    Haken im Checkbox-Stil auf Schwarz mit hell-orangem Rand, erzeugt per Skript wie
    `scripts/generateIcons.mjs`.

## Annahmen, die ohne weitere Rückfrage umgesetzt werden

- **Firestore-Datenmodell flach:** Sammlungen `folders`, `lists` und `tasks` mit
  Verweisen `folderId` bzw. `listId`. Die Dringend-Seite braucht alle Aufgaben über alle
  Listen hinweg, und flache Sammlungen machen das Verschieben zu einer einzigen
  Feldänderung.
- **Erledigungen** werden an der Aufgabe als Liste von Zeitpunkten gespeichert
  (`completions`). Bei normalen Aufgaben enthält sie höchstens einen Eintrag.
- **Offline-first** mit lokaler Firestore-Persistenz wie im Mahlzeitenplaner,
  einschließlich der Ansagen zum Verbindungsstatus.
- **Löschen mit Inhalt** geschieht als Firestore-Batch, damit kein halber Zustand
  zurückbleibt.
- **Unterseiten** (Anlegen, Bearbeiten, Übersicht, Bestätigung) zeigen statt der
  Navigation einen `|< zurück|`-Knopf. Nach dem Speichern geht es zur aufrufenden Seite
  zurück.
- **Übersichtsseite einer Aufgabe:** Name als Überschrift, darunter Beschreibung,
  Fälligkeit (bei Stichtag mit „Dringend ab“ und Rhythmus), Herkunft „Ordner › Liste“
  und gegebenenfalls der Erledigt-Verlauf. Unten stehen die Icon-Knöpfe ✓ (bzw. ↺),
  ✎ und 🗑 mit Beschriftung für VoiceOver.
- **Beschreibung** ist mehrzeiliger Klartext, ohne Formatierung und ohne klickbare
  Links.
- **Bei jedem Seitenwechsel** springt der Fokus auf die Überschrift, Ergebnisse werden
  über die Live-Region angesagt, und alle Ziele sind mindestens 44 px groß.
- **„Abmelden“** steht in den Einstellungen.
- **App-Update** wird wie im Mahlzeitenplaner angeboten (`registerType: 'prompt'`)
  und nicht ungefragt neu geladen.
- **`README.md` und `.claude/projekt.md`** werden in MUL-001 korrigiert. Die README
  beschreibt derzeit fälschlich Einkaufsliste und Mahlzeiten (Kopierrest), in
  `projekt.md` fehlen Stack, Befehle und fachliche Kontexte.
- **Fachliche Kontexte** (Vorschlag für `projekt.md`): `tasks` (Ordner, Listen,
  Aufgaben, Fälligkeit, Wiederholung, Dringend-Sicht) sowie `shared` (Anmeldung,
  Darstellung, App-Update, Bedienelemente). Ob Ordner und Listen ein eigener Kontext
  werden, entscheidet der Plan MUL-003.

## Teilpläne

Jede Stufe endet mit einer benutzbaren und ausgerollten App.

```
MUL-001 Grundgerüst ──► MUL-002 Firebase + Anmeldung ──► MUL-003 Ordner
                                                             │
MUL-009 Farb-Feinschliff ◄── MUL-008 Wiederkehrend ◄──┐      ▼
                                                      │  MUL-004 Listen
                         MUL-007 Dringend-Seite ◄─────┤      │
                              + Badge                 │      ▼
                                                      └─ MUL-005 Aufgaben (Basis)
                                                             │
                                                             ▼
                                                         MUL-006 Stichtag
```

| Nr. | Teilplan | Inhalt | Danach benutzbar |
|---|---|---|---|
| MUL-001 | Grundgerüst | Vite/React/TS, Lint/Format/Test, Architekturgrenze, PWA-Manifest + Icon-Skript, GitHub-Pages-Workflow, Farbtokens + Paletten-Test, Navigationsleiste mit drei Icons, Einstellungen mit Dunkelmodus, App-Update-Angebot, `projekt.md`/README korrigieren | leere App auf dem Home-Bildschirm |
| MUL-002 | Firebase + Anmeldung | **ausführliche Einrichtungsanleitung** für das Firebase-Projekt, Haushaltskonto, Anmeldeseite, `firestore.rules` + Regeltests, Emulator, Playwright-Grundlage, Abmelden | Login auf allen Geräten |
| MUL-003 | Ordner | Ordner-Seite, Ordner-Knopf, anlegen, bearbeiten, löschen | Ordner synchron |
| MUL-004 | Listen | Listen-Seite, Pfeilspitzen-Knopf, anlegen, bearbeiten, verschieben, Ordner-Löschen mitsamt Listen | Struktur steht |
| MUL-005 | Aufgaben (Basis) | Aufgaben-Zeile, Filter offen/erledigt mit Zählern, Übersichtsseite, Bearbeiten-Seite mit ☕/🔥, Erledigen-Bestätigung, wieder öffnen, löschen, verschieben, Sortierung | erste echte Nutzung |
| MUL-006 | Stichtag | 📅, Stepper mit Ringlauf, „Dringend ab“, überfällig | Termine |
| MUL-007 | Dringend-Seite | Sammelansicht, Herkunftszeile, Badge, Startseite | Kernnutzen komplett |
| MUL-008 | Wiederkehrend | Rhythmus, Ankerdatum, Nachholen, Erledigt-Verlauf, „n× erledigt“ | Vollausbau |
| MUL-009 | Farb-Feinschliff | Töne am iPhone ausprobieren, maximale Sättigung | – |

## Außerhalb des Umfangs

- Push-Benachrichtigungen und Badge am Home-Bildschirm-Icon (siehe `docs/notes.txt`)
- Manuelle Sortierung von Ordnern und Listen
- Mehrere Konten bzw. Rechte pro Person
- Formatierte Beschreibungen, Anhänge, Suche
