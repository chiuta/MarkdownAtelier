// MarkdownAtelier — URL-urile din linkuri/imagini nu sunt mutilate de emfază (_ * ~ ^ =) și nu se poate ieși din atribut; XSS de bază.
// Rulează: node tests/md-links.test.mjs
import {createRequire} from "module"; import {fileURLToPath} from "url"; import path from "path";
const require=createRequire(process.env.NODE_PW||"/opt/node-tools/package.json"); const {chromium}=require("playwright");
const here=path.dirname(fileURLToPath(import.meta.url));
let pass=0,fail=0; const ok=(c,m,i)=>{ if(c){pass++;console.log('  ok   '+m);} else {fail++; console.log('FAIL:',m,i===undefined?'':JSON.stringify(i));} };
const b=await chromium.launch({executablePath:process.env.CHROME||"/opt/pw-browsers/chromium",args:["--no-sandbox"]});
const ctx=await b.newContext({serviceWorkers:'block'}); await ctx.route(/^https?:/,r=>r.abort());
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
await p.goto('file://'+path.resolve(here,'../index.html')); await p.waitForTimeout(1200);
const hrefOf=async md=>p.evaluate(md=>{const d=document.createElement('div');d.innerHTML=Atelier.parse(md);const a=d.querySelector('a');return a?{href:a.getAttribute('href'),html:d.innerHTML}:null;},md);
for(const [md,url] of [['[a](http://x.com/_foo_/bar)','http://x.com/_foo_/bar'],['[a](http://x.com/a*b*c)','http://x.com/a*b*c'],['[a](https://x.com/?t=abc==&x=y==)','https://x.com/?t=abc==&x=y=='],['[a](https://x.com/~u/~v)','https://x.com/~u/~v'],['[a](https://x.com/^a^)','https://x.com/^a^'],['<http://x.com/_a_/b>','http://x.com/_a_/b']]){
  const r=await hrefOf(md); ok(r&&r.href===url&&!/<(em|sub|sup|mark|strong)>/.test(r.html.replace(/^.*?<a [^>]*>/,'')==r.html?'':r.html.match(/<a [^>]*>/)[0]),'href intact: '+md,r);
}
const t=await p.evaluate(()=>{const d=document.createElement('div');d.innerHTML=Atelier.parse('[*bold* _it_](http://x.com/a) și ![_alt_](x.png "_t_")');return d.innerHTML;});
ok(/<a [^>]*href="http:\/\/x\.com\/a"[^>]*><em>bold<\/em> <em>it<\/em><\/a>/.test(t),'emfaza din textul linkului funcționează',t);
const x=await p.evaluate(()=>{const d=document.createElement('div');d.innerHTML=Atelier.parse('[x](javascript:alert(1)) ![y](javascript:1) <img src=x onerror=1> [z](http://a.com "t\\" onmouseover=\\"1")');return [d.querySelectorAll('script,img[onerror],[onmouseover]').length,[...d.querySelectorAll('a')].map(a=>a.getAttribute('href'))];});
ok(x[0]===0&&x[1].every(h=>!/^javascript:/i.test(h)),'fără script/on*/javascript:',x);
ok(errs.length===0,'fără erori JS',errs);
await b.close(); console.log('\n'+pass+' reușite, '+fail+' eșuate'); process.exit(fail?1:0);
