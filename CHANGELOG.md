# Jurnal de modificări — MarkdownAtelier

Format: [SemVer](https://semver.org/lang/ro/) (MAJOR.MINOR.PATCH). Istoricul complet al versiunilor anterioare este în secțiunea „Istoric / Changelog” din [README.ro.md](README.ro.md).

## 2.2.0 — 2026-10-27

### Adăugat
- Diagrame Mermaid (subset compact, fără dependențe, randate local în SVG inline): blocurile ```` ```mermaid ```` cu `flowchart`/`graph` (direcții TB/TD/BT/LR/RL; noduri `[ ]`, `( )`, `([ ])`, `(( ))`, `{ }`; săgeți `-->`, `---`, `-.->`, `==>`, etichete `-->|text|` și `-- text -->`; lanțuri `A --> B --> C`; cicluri și bucle) și `sequenceDiagram` (`participant`/`actor … as`, mesaje `->>`, `-->>`, `->`, `-->`, `-x`, `-)`, `Note over/left of/right of`, mesaj către sine). SVG accesibil (`role="img"`, titlu și descriere), culori din tema curentă, tipărit corect.
- Sintaxa nesuportată (`subgraph`, `style`/`classDef`/`click`, `loop`/`alt`/`opt`, `activate`, `&`, alte forme de noduri, alte tipuri: pie, gantt, class, state etc.) sau depășirea limitelor (60 noduri, 120 conexiuni, 24 participanți, 150 evenimente) produce un mesaj clar, cu linia, în cele 8 limbi, iar sursa rămâne bloc de cod. Textul din diagramă este escapat; nu se execută nimic.
- În `.docx`, o diagramă devine un paragraf-text cu titlul ei (nu imagine).
- Test nou `tests/mermaid.test.mjs` (30 de verificări).

### Documentat (exista deja)
- Export PDF prin tipărire (buton „PDF” / Shift+P, CSS `@media print`) există din versiunile anterioare; acum include și diagramele.

### Nu s-a implementat
- Alte tipuri Mermaid (class, state, ER, gantt, pie, mindmap...), `subgraph`, stiluri și teme Mermaid: un randor complet nu încape fără dependență; planificat. Aspectul nu este identic cu cel al Mermaid oficial (aranjare proprie, mai simplă).
- Fișier PDF nativ (scris de mână): exportul rămâne tipărirea din browser; planificat.
- Traducerile noi (fr/it/es/pt/de/hu) sunt automate, neverificate de vorbitori nativi.

## 2.1.0 — 2026-10-27

### Adăugat
- Export în Word `.docx` („↓ .docx” în panoul Export), fără dependențe: scriitor ZIP propriu cu CRC-32 + WordprocessingML generat din HTML-ul previzualizării (titluri, formatare inline, linkuri, liste imbricate și numerotate cu repornire, liste de sarcini, citate, tabele cu antet și aliniere, blocuri de cod, linii orizontale, note de subsol). Trece prin verificarea datelor personale ca celelalte exporturi.
- Texte noi în 8 limbi (traducerile fr/it/es/pt/de/hu sunt automate, neverificate de vorbitori nativi).
- Test nou `tests/docx.test.mjs` (45 de verificări: ZIP/CRC, XML bine format, conținut, 0 cereri de rețea; validare opțională cu pandoc și LibreOffice).
- README: „Stare” și „Offline”.

### Nu s-a implementat
- Diagrame Mermaid: un randor corect nu încape fără dependență; planificat.
- Fișier PDF nativ: exportul rămâne tipărirea din browser; planificat.
- Ecuații Word native, imagini în `.docx` (acum doar text alternativ), colorare sintactică în `.docx`.
- Modul focus și istoricul local al versiunilor existau deja (2.0.0), neschimbate.
- Testarea `.docx` în Microsoft Word: de făcut (verificat doar cu pandoc și LibreOffice).

## 2.0.0 — 2026-10-26

Versiunea anterioară; vezi README.ro.md.
