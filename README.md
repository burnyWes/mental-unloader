# Mental-Unloader

Aufgaben-App des Haushalts für das iPhone, als Progressive Web App vom Home-Bildschirm
aus nutzbar.

Adresse: https://burnywes.github.io/mental-unloader/

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
npm run dev       Entwicklungsserver
npm run test      Unit- und Komponententests, Architekturtest
npm run lint      ESLint einschließlich Schicht- und Kontextgrenzen
npm run format    Prettier
npm run build     Typprüfung und Produktions-Build nach dist/
```

Ein Push auf `main` prüft und baut die App im Workflow „Deploy to GitHub Pages“ und
rollt sie aus.
