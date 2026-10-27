# Jurnal de modificări — MarkdownAtelier

Format: [SemVer](https://semver.org/lang/ro/) (MAJOR.MINOR.PATCH). Istoricul complet al versiunilor anterioare este în secțiunea „Istoric / Changelog” din [README.ro.md](README.ro.md).

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
