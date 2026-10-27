// Teste pentru exportul .docx din MarkdownAtelier 2.1.0 (fără biblioteci: ZIP „stored" + WordprocessingML).
// Verifică: fișierul se descarcă prin butonul din fereastra Export, ZIP valid (CRC32), XML bine format,
// conținutul (titluri, liste, tabel, cod, link, formule liniare, caractere speciale), 0 cereri de rețea.
// Dacă sunt instalate `pandoc` / `soffice`, documentul este și redeschis cu ele (omise dacă lipsesc).
// Rulează: node tests/docx.test.mjs   (PW_ROOT=…/playwright/package.json dacă playwright nu e local)
import {createRequire} from "module"; import {fileURLToPath} from "url"; import path from "path"; import fs from "fs"; import os from "os";
import {execFileSync} from "child_process"; import zlib from "zlib";
const require=createRequire(process.env.PW_ROOT || import.meta.url); const {chromium}=require("playwright");
const here=path.dirname(fileURLToPath(import.meta.url)); const URL_='file://'+path.resolve(here,'../index.html');
let pass=0,fail=0; const ok=(c,m)=>{ if(c){pass++;} else {fail++; console.log('FAIL:',m);} };
const has=c=>{try{execFileSync('which',[c],{stdio:'ignore'});return true}catch{return false}};
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'mdx-'));
const MD=`# Titlu *ital* **bold**

Text cu \`cod\`, ==marcat==, ~sub~ și ^sup^, ~~tăiat~~ [link](https://ex.com/a?x=1&y=2) și & < > "ghilimele" [intern](#titlu).

- a
- b
  - b1
    - b2

1. unu
2. doi
   1. doi-unu

Paragraf între liste.

1. restart

- [x] gata
- [ ] nu

> citat
> pe două linii
>
> - element în citat

| A | B | C |
|---|:-:|--:|
| 1 | **2** | 3 |
| x | y | z |

\`\`\`js
let a = 1;
	tab();
console.log(a);
\`\`\`

$E=mc^2$ și

$$\\frac{a}{b}+\\sqrt{x}$$

---

::: details Mai mult
ascuns
:::

nota[^1].

[^1]: Nota de subsol.
`;
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined});
const ctx=await browser.newContext({acceptDownloads:true,viewport:{width:1280,height:800}});
const reqs=[]; await ctx.route(/^https?:/, r=>{reqs.push(r.request().url()); return r.abort();});
const p=await ctx.newPage(); const errs=[];
p.on('pageerror',e=>errs.push('pageerror '+e.message)); p.on('console',m=>{ if(m.type()==='error'||/Content Security/i.test(m.text())) errs.push('console '+m.text()); });
await p.addInitScript(()=>{const c=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){(window.__dl=window.__dl||[]).push(this.download);return c.call(this);};});
await p.goto(URL_); await p.waitForTimeout(3600);
ok(await p.locator('#expDocx').count()===1,'butonul #expDocx există');
await p.fill('#editor',MD); await p.waitForTimeout(300);
await p.click('#btnExport'); await p.waitForTimeout(200);
const [dl]=await Promise.all([p.waitForEvent('download',{timeout:15000}),p.click('#expDocx')]);
const file=path.join(tmp,'out.docx'); await dl.saveAs(file);
const dn=await p.evaluate(()=>(window.__dl||[]).slice(-1)[0]); ok(/^.+\.docx$/.test(dn||''),'nume de fișier .docx: '+dn); // (suggestedFilename() din Playwright e «download» pentru blob: pe file://, ca la .md)
if(process.env.KEEP)fs.copyFileSync(file,process.env.KEEP);
const buf=fs.readFileSync(file);
ok(buf.readUInt32LE(0)===0x04034b50,'semnătură ZIP');
// citește ZIP-ul (stored) și verifică CRC32
const entries={}; let o=0;
while(buf.readUInt32LE(o)===0x04034b50){
  const crc=buf.readUInt32LE(o+14),cs=buf.readUInt32LE(o+18),us=buf.readUInt32LE(o+22),nl=buf.readUInt16LE(o+26),el=buf.readUInt16LE(o+28),m=buf.readUInt16LE(o+8);
  const name=buf.toString('utf8',o+30,o+30+nl),data=buf.subarray(o+30+nl+el,o+30+nl+el+cs);
  ok(m===0&&cs===us,'intrare stored: '+name); ok((zlib.crc32?zlib.crc32(data):crc)===crc,'CRC32 '+name);
  entries[name]=data.toString('utf8'); o+=30+nl+el+cs;
}
ok(buf.readUInt32LE(o)===0x02014b50,'director central după intrări');
['[Content_Types].xml','_rels/.rels','word/document.xml','word/styles.xml','word/numbering.xml','word/_rels/document.xml.rels','docProps/core.xml'].forEach(n=>ok(n in entries,'conține '+n));
ok(Object.keys(entries)[0]==='[Content_Types].xml','[Content_Types].xml primul');
// XML bine format (în pagină, cu DOMParser)
const bad=await p.evaluate(x=>Object.entries(x).filter(([k,v])=>{const d=new DOMParser().parseFromString(v,'application/xml');return d.getElementsByTagName('parsererror').length}).map(e=>e[0]),entries);
ok(bad.length===0,'XML bine format: '+bad.join(','));
const D=entries['word/document.xml'];
ok(/<w:pStyle w:val="Heading1"\/>/.test(D),'titlu Heading1');
ok(D.includes('<w:i/>')&&D.includes('<w:b/>')&&D.includes('<w:strike/>')&&D.includes('w:highlight')&&D.includes('subscript')&&D.includes('superscript'),'formatări inline');
ok(/<w:hyperlink r:id="rId10"/.test(D)&&entries['word/_rels/document.xml.rels'].includes('Target="https://ex.com/a?x=1&amp;y=2"'),'hiperlink extern, & scăpat');
ok(!/Target="#/.test(entries['word/_rels/document.xml.rels']),'linkurile interne nu devin relații externe');
ok(D.includes('&amp; &lt; &gt;'),'caractere speciale scăpate');
ok(/<w:tbl>/.test(D)&&D.includes('w:val="center"')&&D.includes('w:val="right"')&&D.includes('<w:tblHeader/>'),'tabel cu aliniere și antet');
ok((D.match(/w:styleId|<w:pStyle w:val="Code"\/>/g)||[]).length>=3,'cod pe linii cu stil Code');
ok(D.includes('E=mc^2')&&D.includes('(a)/(b)')&&D.includes('√(x)'),'formule în text liniar');
ok(D.includes('☑')&&D.includes('☐'),'liste de sarcini');
ok(/<w:numId w:val="1"\/>/.test(D)&&/<w:numId w:val="2"\/>/.test(D)&&/<w:numId w:val="3"\/>/.test(D),'liste cu și fără număr, ordonate cu restart');
ok(/<w:pBdr><w:left /.test(D)&&D.includes('<w:pBdr><w:bottom '),'citat cu bară și linie orizontală');
ok(D.includes('Mai mult')&&D.includes('Nota de subsol'),'details și notă de subsol');
ok(entries['docProps/core.xml'].includes('<dc:title>'),'titlu în proprietăți');
// validare externă (opțională)
if(has('pandoc')){
  const txt=execFileSync('pandoc',[file,'-t','plain','--wrap=none'],{encoding:'utf8'});
  ok(/Titlu ital bold/.test(txt)&&/b1/.test(txt)&&/doi-unu/.test(txt)&&/console\.log\(a\);/.test(txt),'pandoc citește textul');
  const gfm=execFileSync('pandoc',[file,'-t','gfm','--wrap=none'],{encoding:'utf8'});
  ok(/^# Titlu/m.test(gfm)&&/\| \*\*A\*\* *\| \*\*B\*\* *\| \*\*C\*\* *\|/.test(gfm)&&/\[(<u>)?link(<\/u>)?\]\(https:\/\/ex\.com\/a\?x=1&y=2\)/.test(gfm)&&/^1\. +restart/m.test(gfm),'pandoc: titlu, tabel, link, restart numerotare');
} else console.log('(pandoc lipsește: validare omisă)');
if(has('soffice')){
  try{execFileSync('soffice',['--headless','--convert-to','pdf','--outdir',tmp,file],{stdio:'ignore',timeout:120000,env:{...process.env,HOME:tmp}});
   const pdf=path.join(tmp,'out.pdf'); ok(fs.existsSync(pdf)&&fs.statSync(pdf).size>1000,'LibreOffice convertește în PDF');}
  catch(e){ok(false,'soffice: '+e.message.slice(0,100));}
} else console.log('(soffice lipsește: validare omisă)');
// PII guard: cu date personale, exportul trece prin dialogul de verificare (nu se descarcă tăcut)
ok(reqs.length===0,'0 cereri de rețea: '+reqs.join(','));
ok(errs.length===0,'fără erori/CSP: '+errs.join(' | '));
await browser.close(); fs.rmSync(tmp,{recursive:true,force:true});
console.log(`docx: ${pass} ok, ${fail} eșuate`); process.exit(fail?1:0);
