// MarkdownAtelier 2.0.0 — versiuni ramificate (ramuri, diferență pe cuvinte, îmbinare în trei) + comentarii ancorate.
// Rulează: node tests/versions.test.mjs
import {createRequire} from "module"; import {fileURLToPath} from "url"; import path from "path";
const require=createRequire(process.env.NODE_PW||"/opt/node-tools/package.json"); const {chromium}=require("playwright");
const here=path.dirname(fileURLToPath(import.meta.url));
let pass=0,fail=0; const ok=(c,m,i)=>{ if(c){pass++;console.log('  ok   '+m);} else {fail++; console.log('FAIL:',m,i===undefined?'':JSON.stringify(i));} };
const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || process.env.CHROME || undefined,args:["--no-sandbox"]});
const ctx=await b.newContext({serviceWorkers:'block',viewport:{width:1100,height:800}}); await ctx.route(/^https?:/,r=>r.abort());
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
let dialogs=0; p.on('dialog',d=>{dialogs++;d.dismiss();});
await p.goto('file://'+path.resolve(here,'../index.html')); await p.waitForTimeout(1200);

// --- motorul de îmbinare (unitar)
const m=await p.evaluate(()=>({
  clean:merge3("a\nb\nc\nd","a\nB\nc\nd","a\nb\nc\nD","o","t"),
  conflict:merge3("a\nb\nc","a\nX\nc","a\nY\nc","o","t"),
  same:merge3("a\nb","a\nZ","a\nZ","o","t"),
  insBoth:merge3("a\nb","a\nb\nx","new\na\nb","o","t"),
  empty:merge3("","hello","","o","t"),
}));
ok(m.clean.text==="a\nB\nc\nD"&&m.clean.conflicts===0,'merge3: modificări separate se combină',m.clean);
ok(m.conflict.conflicts===1&&/<<<<<<< o\nX\n=======\nY\n>>>>>>> t/.test(m.conflict.text),'merge3: aceeași linie modificată diferit = conflict cu marcaje',m.conflict);
ok(m.same.conflicts===0&&m.same.text==="a\nZ",'merge3: modificare identică în ambele părți, fără conflict',m.same);
ok(m.insBoth.text==="new\na\nb\nx"&&m.insBoth.conflicts===0,'merge3: inserări la capete diferite',m.insBoth);
ok(m.empty.text==="hello"&&m.empty.conflicts===0,'merge3: bază goală',m.empty);

// --- diferență pe cuvinte
const df=await p.evaluate(()=>{const d=document.createElement('div');verRenderDiff("Ana are mere roșii","Ana are pere și mere",d);return {html:d.innerHTML,same:(()=>{const e=document.createElement('div');verRenderDiff("x y","x y",e);return e.textContent;})()};});
ok(/<ins>[^<]*pere[^<]*<\/ins>/.test(df.html)&&/<del>[^<]*roșii[^<]*<\/del>/.test(df.html),'diferența marchează cuvintele adăugate și șterse',df.html);
ok(df.same.length>0&&!/</.test(df.same),'fără diferențe: mesaj text',df.same);
const xss=await p.evaluate(()=>{const d=document.createElement('div');verRenderDiff("a","<img src=x onerror=1> a",d);return d.querySelectorAll('img').length;});
ok(xss===0,'diferența nu interpretează HTML');

// --- flux UI
await p.fill('#editor','Titlu\n\nprimul paragraf\n\nal doilea paragraf\n\nfinal');
await p.waitForTimeout(700);
await p.click('#btnVer'); await p.waitForTimeout(200);
ok(await p.isVisible('#scrimVer'),'panoul Istoric se deschide');
await p.fill('#verNote','v1'); await p.click('#verSave');
let st=await p.evaluate(()=>{const d=activeDoc();return {n:d.vers.snaps.length,cur:d.vers.cur};});
ok(st.n===1&&st.cur==='main','versiune salvată pe ramura principală',st);
await p.click('#verSave'); // fără modificări
st=await p.evaluate(()=>activeDoc().vers.snaps.length); ok(st===1,'a doua salvare fără modificări nu creează versiune');
await p.fill('#verNewName','idee'); await p.click('#verNewBtn');
st=await p.evaluate(()=>({cur:activeDoc().vers.cur,br:Object.keys(activeDoc().vers.branches)}));
ok(st.cur==='idee'&&st.br.length===2,'ramură nouă creată și activă',st);
await p.fill('#verNewName','idee'); await p.click('#verNewBtn');
ok(await p.evaluate(()=>activeDoc().vers.branches.idee&&Object.keys(activeDoc().vers.branches).length===2),'nume de ramură duplicat respins');
await p.click('#scrimVer [data-close]'); 
await p.fill('#editor','Titlu\n\nprimul paragraf\n\nal doilea paragraf\n\nfinal\n\nconcluzie nouă');
await p.click('#btnVer'); await p.fill('#verNote','v2 idee'); await p.click('#verSave');
await p.selectOption('#verBranchSel','main'); await p.waitForTimeout(200);
ok((await p.inputValue('#editor'))==='Titlu\n\nprimul paragraf\n\nal doilea paragraf\n\nfinal','trecerea pe „main” încarcă textul ramurii');
await p.click('#scrimVer [data-close]');
await p.fill('#editor','TITLU\n\nprimul paragraf\n\nal doilea paragraf\n\nfinal');
await p.click('#btnVer'); await p.click('#verSave');
await p.selectOption('#verMergeSel','idee'); await p.click('#verMergeBtn'); await p.waitForTimeout(200);
ok((await p.inputValue('#editor'))==='TITLU\n\nprimul paragraf\n\nal doilea paragraf\n\nfinal\n\nconcluzie nouă','îmbinarea combină modificările din ambele ramuri');
st=await p.evaluate(()=>{const d=activeDoc();const h=verHead(d);return {parent2:!!h.parent2,label:h.label};});
ok(st.parent2&&/merge idee/.test(st.label),'îmbinarea curată creează o versiune cu doi părinți',st);
await p.click('#verMergeBtn'); 
ok(await p.evaluate(()=>{const d=activeDoc();return verAnc(d,verHead(d).id).has(d.vers.branches.idee);}),'ramura îmbinată e strămoș al capului');
// diff UI
await p.click('[data-vdiff]'); await p.waitForTimeout(100);
ok(await p.isVisible('#verDiff'),'compararea afișează diferențele');
// restaurare
const firstRest=await p.evaluate(()=>activeDoc().vers.snaps[0].id);
await p.click('[data-vrest="'+firstRest+'"]'); await p.waitForTimeout(100);
ok((await p.inputValue('#editor')).startsWith('Titlu\n'),'restaurarea pune textul versiunii în editor');
// conflict
await p.click('#scrimVer [data-close]');
const cf=await p.evaluate(()=>{
  const d=activeDoc();
  editor.value="linie\nA";verSave("c0",true);
  verNewBranch("b2");editor.value="linie\nB2";verSave("c-b2",true);
  verSwitch("main");editor.value="linie\nM";verSave("c-main",true);
  const r=verMerge("b2");
  return {c:r.conflicts,txt:editor.value,pending:!!d.vers.pending,head:verHead(d).label};
});
ok(cf.c===1&&/<<<<<<< main\nM\n=======\nB2\n>>>>>>> b2/.test(cf.txt),'îmbinare cu conflict: marcajele sunt în editor',cf);
ok(cf.pending&&cf.head==='c-main','în conflict nu se creează versiune automat');
// persistență
await p.waitForTimeout(700);
await p.reload(); await p.waitForTimeout(1200);
st=await p.evaluate(()=>{const d=activeDoc();return {n:d.vers.snaps.length,br:Object.keys(d.vers.branches).sort().join(',')};});
ok(st.n>=6&&st.br==='b2,idee,main','versiunile persistă după reîncărcare (localStorage)',st);
{const ks=await p.evaluate(()=>Object.keys(localStorage));ok(ks.includes('markdownatelier.v1')&&!ks.some(k=>/ver|branch|note/i.test(k)),'versiunile stau în cheia existentă, fără chei noi',ks);}

// --- comentarii
await p.fill('#editor','Introducere scurtă.\n\nAcesta este fragmentul de comentat.\n\nFinal.');
await p.evaluate(()=>{const v=editor.value,i=v.indexOf('fragmentul de comentat');editor.focus();editor.setSelectionRange(i,i+'fragmentul de comentat'.length);});
await p.click('#btnVer'); await p.click('#verTabs [data-tab=c]');
await p.click('#comAdd'); // text gol
ok((await p.evaluate(()=>activeDoc().notes||[])).length===0,'comentariu gol respins');
await p.fill('#comText','Reformulează aici'); await p.click('#comAdd');
let notes=await p.evaluate(()=>activeDoc().notes);
ok(notes.length===1&&notes[0].q==='fragmentul de comentat','comentariul se ancorează de fragmentul selectat',notes);
ok((await p.textContent('#comList')).includes('Reformulează aici'),'comentariul apare în listă');
await p.evaluate(()=>{editor.setSelectionRange(0,0);});
await p.fill('#comText','fără selecție'); await p.click('#comAdd');
ok((await p.evaluate(()=>activeDoc().notes.length))===1,'fără selecție nu se adaugă comentariu');
// ancora urmărește textul după editări
await p.fill('#editor','NOU PREFIX LUNG ca să mute poziția.\n\nIntroducere scurtă.\n\nAcesta este fragmentul de comentat.\n\nFinal.');
await p.evaluate(()=>renderNotes());
await p.click('[data-cgo]'); await p.waitForTimeout(100);
const sel=await p.evaluate(()=>editor.value.slice(editor.selectionStart,editor.selectionEnd));
ok(sel==='fragmentul de comentat','„↦” selectează fragmentul chiar după mutarea lui',sel);
await p.click('#btnVer'); await p.click('#verTabs [data-tab=c]');
await p.fill('#editor','alt text complet');
await p.evaluate(()=>renderNotes());
ok((await p.textContent('#comList')).includes('(')&&await p.evaluate(()=>!document.querySelector('[data-cgo]')),'ancoră pierdută: marcat ca orfan, fără salt');
await p.click('[data-cdel]');
ok((await p.evaluate(()=>activeDoc().notes.length))===0,'comentariul se șterge');
// i18n: toate cheile în toate limbile
const miss=await p.evaluate(()=>{const o=[];for(const k in VX)for(const l of LI8)if(!I18N[l][k])o.push(l+':'+k);return o;});
ok(miss.length===0,'cheile noi există în cele 8 limbi',miss);
await p.evaluate(()=>{});
for(const lg of ['en','de','hu']){
  await p.evaluate(l=>{settings.lang=l;LANG=l;applyI18n();},lg);
  const lab=await p.textContent('#btnVer .lab'); ok(lab&&lab.length>2,'buton Istoric tradus: '+lg+' = '+lab);
}
ok(dialogs===0,'fără dialoguri native');
ok(errs.length===0,'fără erori JS',errs);
await b.close(); console.log('\n'+pass+' reușite, '+fail+' eșuate'); process.exit(fail?1:0);
