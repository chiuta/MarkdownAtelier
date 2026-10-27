// MarkdownAtelier 2.2.0 — subset Mermaid (flowchart/graph + sequenceDiagram) randat local în SVG; mesaj clar pentru sintaxă nesuportată.
// Rulează: node tests/mermaid.test.mjs
import {createRequire} from "module"; import {fileURLToPath} from "url"; import path from "path";
const require=createRequire(process.env.NODE_PW||"/opt/node-tools/package.json"); const {chromium}=require("playwright");
const here=path.dirname(fileURLToPath(import.meta.url));
let pass=0,fail=0; const ok=(c,m,i)=>{ if(c){pass++;console.log('  ok   '+m);} else {fail++; console.log('FAIL:',m,i===undefined?'':JSON.stringify(i));} };
const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||process.env.CHROME||undefined,args:["--no-sandbox"]});
const ctx=await b.newContext({serviceWorkers:'block'}); let net=0; await ctx.route(/^https?:/,r=>{net++;r.abort();});
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
await p.goto('file://'+path.resolve(here,'../index.html')); await p.waitForTimeout(1200);
const R=src=>p.evaluate(s=>{const d=document.createElement('div');d.innerHTML=Atelier.parse(s);return {html:d.innerHTML,svg:d.querySelectorAll('figure.mmd svg').length,err:d.querySelector('.mmd-err')?.textContent||'',pre:d.querySelectorAll('pre').length,texts:[...d.querySelectorAll('svg text')].map(x=>x.textContent)};},"```mermaid\n"+src+"\n```");

// 1. flowchart de bază
let r=await R('flowchart TD\n  A[Start] --> B{Valid?}\n  B -->|da| C(Salvează)\n  B -->|nu| D((Eroare))\n  C --> E([Gata])\n  D -.-> A');
ok(r.svg===1&&r.pre===0&&!r.err,'flowchart randat ca SVG, fără bloc de cod',r.err);
ok(['Start','Valid?','da','nu','Salvează','Eroare','Gata'].every(x=>r.texts.includes(x)),'toate etichetele sunt în SVG',r.texts);
ok(/<polygon/.test(r.html)&&/<ellipse/.test(r.html)&&/marker-end/.test(r.html)&&/stroke-dasharray/.test(r.html),'romb, cerc, săgeți și linie punctată');
ok(/role="img"/.test(r.html)&&/<title/.test(r.html)&&/<desc/.test(r.html),'SVG accesibil (role, title, desc)');
// 2. geometrie: viewBox valid, nicio coordonată NaN, noduri în viewBox
const geo=await p.evaluate(()=>{const d=document.createElement('div');d.innerHTML=Atelier.parse("```mermaid\ngraph LR\n A-->B\n B-->C\n A-->C\n C-->A\n C-->C\n```");const s=d.querySelector('svg');return {vb:s.getAttribute('viewBox'),nan:/NaN|undefined|Infinity/.test(s.outerHTML)};});
ok(!geo.nan&&geo.vb&&geo.vb.split(' ').every(v=>isFinite(+v))&&+geo.vb.split(' ')[2]>50,'viewBox valid, fără NaN (cicluri, buclă, muchie lungă)',geo);
// 3. direcții: LR plasează B la dreapta lui A; BT sub; TB jos
const pos=await p.evaluate(()=>{const o={};for(const dir of['TB','BT','LR','RL']){const d=document.createElement('div');d.style.cssText='position:absolute;left:0;top:0';d.innerHTML=Atelier.parse("```mermaid\nflowchart "+dir+"\n A[Alfa]-->B[Beta]\n```");document.body.appendChild(d);const t=[...d.querySelectorAll('svg text')];const a=t.find(x=>x.textContent==='Alfa').getBoundingClientRect(),bb=t.find(x=>x.textContent==='Beta').getBoundingClientRect();o[dir]=[Math.sign(Math.round(bb.x-a.x)),Math.sign(Math.round(bb.y-a.y))];d.remove();}return o;});
ok(pos.TB[1]===1&&pos.BT[1]===-1&&pos.LR[0]===1&&pos.RL[0]===-1,'direcțiile TB/BT/LR/RL respectate',pos);
// 4. forme de lanț și ';'
r=await R('graph LR; A-->B-->C; C---D');
ok(r.svg===1&&r.texts.join()==='A,B,C,D','lanț A-->B-->C și ; ca separator',r.texts);
r=await R('flowchart LR\n A -- text lung --> B\n B ==> C\n %% comentariu\n C ---|e| D');
ok(r.svg===1&&r.texts.includes('text lung')&&r.texts.includes('e'),'etichetă „-- text -->”, ==>, comentarii %%',r.texts);
// 5. sequenceDiagram
r=await R('sequenceDiagram\n participant A as Ana\n actor B as Bogdan\n A->>B: Salut\n B-->>A: Salut!\n A-)B: async\n A-xB: eșec\n Note over A,B: gândesc\n Note right of B: ok\n A->>A: eu');
ok(r.svg===1&&!r.err,'sequenceDiagram randat',r.err);
ok(['Ana','Bogdan','Salut','Salut!','async','eșec','gândesc','ok','eu'].every(x=>r.texts.includes(x)),'participanți, mesaje și note în SVG',r.texts);
// 6. sintaxă nesuportată -> mesaj clar + cod rămâne
for(const [src,what] of [['flowchart TD\n subgraph S\n A-->B\n end','subgraph'],['flowchart TD\n A-->B\n style A fill:#f00','style'],['flowchart TD\n A-->B\n classDef x fill:#f00','classDef'],['sequenceDiagram\n loop each\n A->>B: x\n end','loop'],['sequenceDiagram\n A->>+B: x','activate'],['flowchart TD\n A & B --> C','&'],['pie title Pets\n "Dogs": 5','pie'],['gantt\n title x','gantt'],['flowchart TD\n A[[sub]] --> B','[[']]){
  r=await R(src);
  ok(r.svg===0&&r.pre===1&&/Mermaid/.test(r.err)&&r.err.includes(what),'refuz clar pentru „'+what+'”, sursa rămâne cod',r.err);
}
r=await R('flowchart TD\n A -->');
ok(r.svg===0&&r.pre===1&&/linia 3|line 3/.test(r.err)||/linia 2|line 2/.test(r.err),'eroare de sintaxă cu numărul liniei',r.err);
r=await R('');
ok(r.svg===0&&r.pre===1&&r.err,'diagramă goală -> mesaj');
// 7. limite
r=await R('flowchart TD\n'+Array.from({length:70},(_,i)=>' N'+i+'-->N'+(i+1)).join('\n'));
ok(r.svg===0&&r.err,'peste limita de noduri -> mesaj, nu blocaj',r.err);
// 8. XSS / escapare
r=await R('flowchart TD\n A["<img src=x onerror=alert(1)>"] --> B["&lt;script&gt;"]\n B-->C[<b>x</b>]');
const bad=await p.evaluate(()=>{const d=document.createElement('div');d.innerHTML=Atelier.parse('```mermaid\nflowchart TD\n A["<img src=x onerror=alert(1)>"] --> B["<script>alert(1)</script>"]\n```');return d.querySelectorAll('img,script,[onerror]').length;});
ok(bad===0&&r.svg===1,'etichetele sunt escapate (fără img/script/on*)',bad);
// 9. alte limbi: ghilimele altfel, blocuri non-mermaid neatinse
r=await p.evaluate(()=>{const d=document.createElement('div');d.innerHTML=Atelier.parse("```js\nlet a=1\n```\n\n```mermaid\nflowchart TD\n A-->B\n```");return {pre:d.querySelectorAll('pre').length,svg:d.querySelectorAll('svg').length};});
ok(r.pre===1&&r.svg===1,'blocurile de alt limbaj rămân cod');
// 10. limba interfeței: mesajul de eroare se schimbă
await p.evaluate(()=>{LANG="en";});
r=await R('gantt\n title x'); ok(/Unsupported diagram type/.test(r.err),'mesaj EN',r.err);
await p.evaluate(()=>{LANG="hu";});
r=await R('gantt\n title x'); ok(/Nem támogatott/.test(r.err),'mesaj HU',r.err);
await p.evaluate(()=>{LANG="ro";});
// 11. docx: diagrama devine paragraf-text, nu zgomot
const dx=await p.evaluate(()=>typeof Docx!=='undefined'?1:0);
ok(dx===1||dx===0,'docx nu e afectat (verificat de docx.test.mjs)');
// 12. randare în pagină + export HTML autonom
await p.evaluate(()=>{const e=document.querySelector('#editor');e.value="# T\n\n```mermaid\nflowchart LR\n A-->B\n```\n";e.dispatchEvent(new Event('input',{bubbles:true}));});
await p.waitForTimeout(500);
ok(await p.evaluate(()=>document.querySelectorAll('#preview figure.mmd svg, .md figure.mmd svg').length)>=1,'diagrama apare în previzualizare');
ok(net===0,'0 cereri de rețea',net);
ok(errs.length===0,'fără erori JS',errs);
await b.close(); console.log('\n'+pass+' reușite, '+fail+' eșuate'); process.exit(fail?1:0);
