# Jurnal de modificări — MarkdownAtelier

Format: [SemVer](https://semver.org/lang/ro/) (MAJOR.MINOR.PATCH). Istoricul complet al versiunilor anterioare este în secțiunea „Istoric / Changelog” din [README.ro.md](README.ro.md).

## 2.4.3 — 2026-11-20

- fff-kit 1.8.1: când `localStorage`/`sessionStorage` aruncă sau lipsesc (cookie-uri și date de site blocate, WebView fără stocare, `<iframe sandbox>`), kitul pune în loc o stocare în memorie, iar pagina pornește în loc să se oprească; datele nu se păstrează după închiderea paginii
- fff-kit 1.8.1: ghidajul care mărește controalele mici la 44 px măsoară acum și lățimea corpului paginii și a părintelui, deci un rând de butoane nu mai poate ieși din ecran (grupul rămâne neatins când mărirea l-ar depăși)

## 2.4.2 — 2026-11-17

- Compatibilitate cu browsere mai vechi (Chrome/Edge 55+, Firefox 52+, Safari 10.1+/iOS 10.3+): kitul 1.8.0 aduce stratul de compatibilitate (rezerve pentru API-urile care lipsesc în motoarele vechi), iar sintaxa JavaScript mai nouă decât ES2017 a fost înlocuită cu forme echivalente acolo unde exista; expresiile regulate noi și `import()` trec prin rezerve. Fără modificări de funcționalitate intenționate. Verificat cu parser ES2017 și într-un motor vechi simulat, nu pe dispozitive reale.

## 2.4.1 — 2026-11-15

- Nou: butoane de distribuire pe rețele sociale (vertical, pe marginea din stânga; fără scripturi externe, doar linkuri deschise la clic); bara de zoom cu lupă și „potrivire ecran” revine pe marginea din dreapta, centrată pe verticală; corectat afișarea suprapusă la zoom mare (panourile cu înălțimi în vh/vw nu mai ies din ecran).

## 2.4.0 — 2026-11-15

- Nou: accesibilitate pe toate ecranele — butonul „Aa” (mărimea textului, contrast ridicat, fără animații, text lizibil, linkuri subliniate, citire cu voce), săgeata „Înapoi sus” și „Sari la conținut”; fereastra se potrivește mereu ecranului; zoom-ul cu lupă și „potrivire ecran” stau acum pe marginea din stânga (fff-kit 1.6.0).

## 2.3.8 — 2026-11-15

- Nou: texturi fractale hiper-detaliate (fff-texturi 1.1.2) — fundalul și suprafețele mari (carduri, panouri, antete, butoane; filele și dialogurile ascunse la încărcare, când se deschid) primesc un material generat local (WebGL2, fără rețea și fără imagini), care se repetă fără cusătură; culorile aplicației rămân ale ei. Se oprește din dialogul „Transparență” sau cu `?notex=1`.

## 2.3.3 — 2026-11-08

- Nou: la «↓ .docx» (și în descrierea din fereastra Export) se spune că imaginile și ecuațiile nu sunt incluse și că exportul .html le păstrează (8 limbi).
- Corectat un comentariu înșelător din cod (autosalvarea la închidere nu afișează niciun dialog).

## 2.3.0 — 2026-11-02 (reîmprospătare kit)

- Nou (kit): **Sincronizare între dispozitive** (`FFF.sync`) — în dialogul «Transparență» (clic pe versiune → Copie de siguranță): conectezi două dispozitive direct (WebRTC, cod/QR, fără server și fără cont) și își schimbă datele aplicației; cea mai recentă valoare câștigă, secretele (chei API, parole) nu se trimit, ștergerile nu se propagă. Aplicarea trece prin importul kitului (confirmare, chei permise, rollback).
- Nou (kit): **Istoric local — «mașina timpului»** (`FFF.history`) — instantanee automate ale datelor (IndexedDB, fără secrete), diferență față de starea curentă și restaurare reversibilă; «Șterge datele aplicației» șterge și istoricul.
- Module adăugate: `qr`, `p2p`, `sync`, `history` (+~140 KB). Versiunea aplicației nu se schimbă.

## 2.3.0 — 2026-11-01

- Corectat: adaptorul «Trimite la…» nu mai aruncă eroare când kitul FFF lipsește (gardian pe fiecare bloc; găsit de testul «fără kit» din CI).

Nou: «Trimite la…» (fff-kit, modulul FFF.bridge) — după orice export de fișier (GPX, ICS, CSV, Markdown) apare butonul «Trimite la…» către aplicațiile compatibile, iar importul de fișiere al aplicației primește plicuri .fff.json trimise de ele, cu confirmare înainte de import. Fără rețea, fără telemetrie.

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
