# Chemistry Script Website – Properties of Matter

Private Entwicklungsablage für die interaktive Chemie-Unterrichtswebsite (Unterrichtssprache: British English).

## Projektziel

- Vollständige Übernahme des fachlichen Ausgangsmaterials.
- Fachliche Texte, Formeln und Aufgabenstellungen **nicht** ohne ausdrücklichen Auftrag ändern.
- Interaktive Antwortfelder, Zeichenflächen, Lernziele, Zuordnungen und Diagramme schrittweise verbessern.
- Änderungen über Git-Versionen nachvollziehen.

## Stand

Das Repository ist eingerichtet; der **einmalige Import der vorhandenen Website-Dateien steht noch aus**.
Ausgangsstand: `Properties_of_Matter_Website_revised_v2.zip` aus unserem Chat.

## Vorgesehene Ordnerstruktur

Die Dateien aus dem Ordner `Properties_of_Matter_Website` gehören direkt ins Repository:

```text
index.html
chapters/
css/
js/
assets/
source/
content_audit.json
README.md
```

Die Ordner `chapters/`, `css/`, `js/` und `assets/` werden von der Website benötigt.
`source/` enthält LaTeX-Quellen für die Entwicklung und darf bei einer öffentlichen Veröffentlichung **nicht automatisch mit ausgeliefert werden**.

## Veröffentlichung

**Noch keine Veröffentlichung aktiv.** Nach dem Import richten wir eine getrennte Vorschau ein, die nur Website-Dateien veröffentlicht. Prüfen, ob `chapters/07_solutions.html` ebenfalls öffentlich sichtbar sein soll.

GitHub Pages mit einem *privaten* Repository setzt nach GitHub-Dokumentation einen dafür geeigneten kostenpflichtigen Plan voraus; mit GitHub Free braucht GitHub Pages ein öffentliches Repository. Alternativ lässt sich die Vorschau über einen externen statischen Hosting-Dienst aufsetzen.

## Weiterer Workflow

1. Änderungen an Website-Dateien in einem separaten Branch/PR vorbereiten.
2. Fachliche Inhalte auf unverlangte Änderungen prüfen.
3. Vorschau testen.
4. Geprüfte Version übernehmen.
