# Mental-Unloader

Nimmt den Kopf von Alltagsorganisation rund ums Essen: Einkaufsliste, Mahlzeiten mit
Rezepten und Zutaten, Vorräte und ein Essensplaner, der daraus Vorschläge macht.

Stack und Aufbau werden in der ersten Planungsrunde festgelegt.

## Arbeitsablauf

```
/grill-me <Vorhaben>        Vorhaben auf Herz und Nieren prüfen
/rpi-research <Frage>       Bestehendes verstehen        -> docs/agents/research/
/rpi-plan <Vorhaben>        Plan erstellen               -> docs/agents/plans/
/rpi-implement <Plan>       Plan Phase für Phase umsetzen
/commit                     Format, Lint, Tests, Architektur, Secrets -> Commit
```

Projektdaten (Kürzel, Bauart, Befehle) stehen in `.claude/projekt.md`, offene Punkte in
`docs/notes.txt`.
