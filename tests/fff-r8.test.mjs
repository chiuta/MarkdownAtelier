// Teste pentru funcțiile noi din MarkdownAtelier 1.1.0 (runda 8): verificare locală de date personale înainte de export/copiere,
// document nou cu date mascate (originalul rămâne), căutare locală „după sens” în documente, 0 cereri de rețea, copie criptată prin kit.
// Rulează: node tests/fff-r8.test.mjs
import {createRequire} from "module"; import {fileURLToPath} from "url"; import path from "path"; import fs from "fs";
const require=createRequire("/opt/node-tools/package.json"); const {chromium}=require("playwright");
const here=path.dirname(fileURLToPath(import.meta.url)); const URL_='file://'+path.resolve(here,'../index.html');
const AXE=process.env.FFF_AXE||'/tmp/claude-0/-home-claude/78529928-3825-51c3-b9bd-0e81655ab6bc/scratchpad/sweep/node_modules/axe-core/axe.min.js';
let pass=0,fail=0; const ok=(c,m)=>{ if(c){pass++;} else {fail++; console.log('FAIL:',m);} };
const browser=await chromium.launch({executablePath:"/opt/pw-browsers/chromium"});
async function open(opts={}){
  const ctx=await browser.newContext({viewport:opts.vp||{width:1280,height:800},colorScheme:opts.scheme||'light',acceptDownloads:true,permissions:['clipboard-read','clipboard-write']});
  const reqs=[]; await ctx.route(/^https?:/, r=>{ reqs.push(r.request().url()); return r.abort(); });
  const p=await ctx.newPage(); const errs=[];
  p.on('pageerror',e=>errs.push('pageerror '+e.message)); p.on('console',m=>{ if(m.type()==='error'||/Content Security/i.test(m.text())) errs.push('console '+m.text()); });
  await p.addInitScript({content:fs.readFileSync(AXE,'utf8')});
  if(opts.init) await p.addInitScript(opts.init);
  await p.goto(URL_); await p.waitForTimeout(3600);
  return {ctx,p,errs,reqs};
}
async function axe(p,label){
  await p.waitForTimeout(150);
  const r=await p.evaluate(async()=>await axe.run(document,{resultTypes:['violations']}));
  ok(r.violations.length===0,`axe ${label}: `+r.violations.map(v=>v.id+' '+v.nodes.map(n=>n.target).join('|').slice(0,160)).join('; '));
}
const showExp=p=>p.evaluate(()=>document.querySelector('#scrimExport').classList.add('show'));
const TXT='# Raport\n\nContact: ion.popescu@example.com\nIBAN: RO49AAAA1B31007593840000\nCNP 1800101221144\n';

// 1. pornire + etichete
{ const {ctx,p,errs,reqs}=await open();
  ok(errs.length===0,'pornire fără erori/CSP: '+errs.join(' | '));
  ok(reqs.length===0,'0 cereri de rețea la pornire');
  ok(await p.evaluate(()=>document.querySelector('meta[name=application-version]').content==='1.2.3'),'versiune în meta');
  ok((await p.textContent('#app-version')).includes('v 1.2.3 · 2026-10-22'),'text #app-version');
  ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'fără depășire orizontală 1280');
  await axe(p,'start');
  await p.click('#btnExport'); await p.waitForSelector('#scrimExport.show');
  ok(await p.isChecked('#piiChk'),'verificarea e activă implicit');
  await axe(p,'panou export');
  await ctx.close(); }

// 2. guard la export (.md/.html/clipboard)
{ const {ctx,p,errs,reqs}=await open();
  await p.fill('#editor',TXT); await p.waitForTimeout(300);
  await p.click('#btnExport'); await p.waitForSelector('#scrimExport.show');
  // anulare => nimic descărcat
  let downloads=0; p.on('download',()=>downloads++);
  await p.click('#expMd'); await p.waitForSelector('dialog.fff-pii[open]');
  ok(await p.locator('dialog.fff-pii li').count()>=3,'dialogul listează ≥3 elemente (e-mail, IBAN, CNP)');
  await axe(p,'dialog PII');
  ok(downloads===0,'nimic descărcat cât dialogul e deschis');
  await p.keyboard.press('Escape'); await p.waitForTimeout(500);
  ok(downloads===0,'anulare: nimic descărcat');
  // mascare
  await p.evaluate(()=>{document.querySelector('#scrimExport').classList.add('show');});
  const [dl]=await Promise.all([p.waitForEvent('download'),(async()=>{ await p.click('#expMd'); await p.waitForSelector('dialog.fff-pii[open]'); await p.locator('dialog.fff-pii button').filter({hasText:/Maschează|Mask/i}).first().click(); })()]);
  const md=fs.readFileSync(await dl.path(),'utf8');
  ok(!md.includes('ion.popescu@example.com')&&!md.includes('RO49AAAA1B31007593840000')&&!md.includes('1800101221144'),'fișierul .md exportat nu conține datele');
  ok(/\[[^\]]+\]/.test(md)&&md.includes('# Raport'),'fișierul conține etichete și restul textului');
  ok((await p.inputValue('#editor'))===TXT,'documentul din editor NU a fost modificat');
  // continuă => original
  await p.evaluate(()=>{document.querySelector('#scrimExport').classList.add('show');});
  const [dl2]=await Promise.all([p.waitForEvent('download'),(async()=>{ await p.click('#expHtml'); await p.waitForSelector('dialog.fff-pii[open]'); await p.locator('dialog.fff-pii button').filter({hasText:/Continuă fără|Continue without/i}).first().click(); })()]);
  const html=fs.readFileSync(await dl2.path(),'utf8'); ok(html.includes('ion.popescu@example.com'),'„continuă fără mascare” exportă originalul (html)');
  // clipboard cu mascare
  await p.evaluate(()=>{document.querySelector('#scrimExport').classList.add('show');});
  await p.click('#expClip'); await p.waitForSelector('dialog.fff-pii[open]'); await p.locator('dialog.fff-pii button').filter({hasText:/Maschează|Mask/i}).first().click(); await p.waitForTimeout(500);
  const clip=await p.evaluate(()=>navigator.clipboard.readText()); ok(clip.length>100&&!clip.includes('ion.popescu@example.com'),'clipboard HTML mascat');
  // oprit
  await p.evaluate(()=>{document.querySelector('#scrimExport').classList.add('show');});
  await p.uncheck('#piiChk');
  ok(await p.evaluate(()=>JSON.parse(localStorage.getItem('markdownatelier.settings.v1')).piiGuard===false),'preferința se păstrează');
  const [dl3]=await Promise.all([p.waitForEvent('download'),p.click('#expMd')]);
  ok(fs.readFileSync(await dl3.path(),'utf8').includes('ion.popescu@example.com')&&await p.locator('dialog.fff-pii').count()===0,'cu verificarea oprită: export direct');
  ok(errs.length===0,'fără erori: '+errs.join('|')); ok(reqs.length===0,'0 cereri de rețea după export');
  await ctx.close(); }

// 3. verificare acum -> document nou mascat
{ const {ctx,p,errs}=await open();
  await p.fill('#editor','Text curat, fără nimic sensibil.'); await p.waitForTimeout(300);
  await showExp(p); await p.click('#piiScan'); await p.waitForTimeout(300);
  ok(await p.locator('dialog.fff-pii').count()===0&&(await p.textContent('#toast')).length>10,'text curat: mesaj, fără dialog');
  await p.fill('#editor',TXT); await p.waitForTimeout(300);
  await showExp(p); await p.click('#piiScan'); await p.waitForSelector('dialog.fff-pii[open]');
  await p.locator('dialog.fff-pii button').filter({hasText:/Maschează|Mask/i}).first().click(); await p.waitForTimeout(700);
  const v=await p.inputValue('#editor'); ok(!v.includes('ion.popescu@example.com')&&v.includes('Raport'),'documentul nou are datele mascate');
  const title=await p.inputValue('#docTitle').catch(()=>'' ); 
  const docs=await p.evaluate(()=>{ return JSON.parse(localStorage.getItem('markdownatelier.v1')).docs.map(d=>d.content); });
  ok(docs.some(c=>c===TXT),'originalul rămâne salvat neschimbat'); ok(docs.some(c=>c!==TXT&&c.includes('Raport')&&!c.includes('ion.popescu')),'copia mascată e salvată');
  ok(errs.length===0,'fără erori'); await ctx.close(); }

// 4. căutare locală
{ const {ctx,p,errs}=await open();
  await p.evaluate(()=>{ const k='markdownatelier.v1'; const s={docs:[],activeId:null}; const mk=(t,c,i)=>({id:'x'+i,title:t,content:c,created:Date.now(),updated:Date.now()-i});
    s.docs=[mk('Rețete','Plăcinta cu mere se coace patruzeci de minute. Adaugă scorțișoară.',1),mk('Călătorii','Trenul spre București pleacă dimineața din gară.',2),mk('Alert','<img src=x onerror=window.__xss=1> text xss <script>window.__xss=2</script>',3)]; s.activeId='x1';
    localStorage.setItem(k,JSON.stringify(s)); }); 
  await p.reload(); await p.waitForTimeout(3300);
  await p.click('#btnDocs'); await p.waitForSelector('#scrimDocs.show');
  ok((await p.textContent('#docPriv')).length>20,'notă de confidențialitate în panoul documentelor');
  await axe(p,'panou documente');
  await p.fill('#docSearch','placinta'); await p.waitForTimeout(300);
  ok(await p.locator('#docList .doc-item').count()===1,'căutare fără diacritice „placinta” găsește „Plăcinta”: '+await p.locator('#docList .doc-item').count());
  ok(await p.locator('#docList .di-snip mark').count()>=1,'fragment cu termen evidențiat');
  await p.fill('#docSearch','gara'); await p.waitForTimeout(300);
  ok(await p.locator('#docList .doc-item').count()===1&&(await p.textContent('#docList .di-title')).includes('Călătorii'),'căutare „gara” → Călătorii');
  await p.fill('#docSearch','zzqqxx'); await p.waitForTimeout(300);
  ok(await p.locator('#docList .doc-item').count()===0&&await p.locator('#docList .docempty').count()===1,'fără rezultate');
  await p.fill('#docSearch','xss'); await p.waitForTimeout(300);
  ok(await p.evaluate(()=>window.__xss===undefined),'conținutul cu HTML nu se execută (fragmentele sunt escapate)');
  ok(await p.locator('#docList img').count()===0,'fără elemente injectate în listă');
  await p.fill('#docSearch','scortisoara'); await p.waitForTimeout(300);
  await p.locator('#docList .di-main').first().click(); await p.waitForTimeout(300);
  ok((await p.inputValue('#editor')).includes('mere'),'rezultatul se deschide în editor');
  ok(errs.length===0,'fără erori: '+errs.join('|')); await ctx.close(); }

// 5. copie criptată prin kit (etichetă) + 360 întunecat
{ const {ctx,p,errs}=await open({vp:{width:360,height:740},scheme:'dark'});
  ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'fără depășire orizontală 360');
  await p.fill('#editor','Salut'); await p.keyboard.press('Control+s'); await p.waitForTimeout(1500);
  const idx=await p.evaluate(()=>FFF.store.indexKeys()); ok(idx.some(k=>/markdownatelier/.test(k)),'cheile aplicației sunt indexate: '+idx.join(','));
  await p.click('#btnExport'); await p.waitForSelector('#scrimExport.show'); await axe(p,'export 360 întunecat');
  await p.click('#expMd'); await p.waitForSelector('dialog.fff-pii',{timeout:1500}).catch(()=>{});
  await p.keyboard.press('Escape'); await p.click('[data-close]:visible').catch(()=>{}); await p.keyboard.press('Escape');
  await p.evaluate(()=>FFF.label.open()); await p.waitForSelector('dialog.fff-label[open], dialog[open]'); await axe(p,'etichetă transparență');
  ok(errs.length===0,'fără erori: '+errs.join('|')); await ctx.close(); }

await browser.close();
console.log(`\nMarkdownAtelier fff-r8: ${pass} reușite, ${fail} eșuate`); process.exit(fail?1:0);
