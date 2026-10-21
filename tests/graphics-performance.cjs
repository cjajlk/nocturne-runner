/* Alternating before/after samples reduce drift between independent browser runs. */
const fs=require('fs'),path=require('path'),assert=require('assert');
const {chromium}=require(process.env.NOCTURNE_PLAYWRIGHT||'playwright');
const reference=process.env.NOCTURNE_REFERENCE_DIR,out=process.env.NOCTURNE_UI_OUTPUT;
if(!reference||!out)throw Error('Set NOCTURNE_REFERENCE_DIR (original game.js / road3d.js) and NOCTURNE_UI_OUTPUT.');
(async()=>{
 const root=path.resolve(__dirname,'..'),server=require('http').createServer((req,res)=>{try{const f=path.join(root,decodeURIComponent(new URL(req.url,'http://localhost').pathname));res.setHeader('Content-Type',f.endsWith('.js')?'application/javascript':f.endsWith('.css')?'text/css':f.endsWith('.png')?'image/png':'text/html');res.end(fs.readFileSync(f));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,executablePath:process.env.NOCTURNE_CHROME});
 try{
  const pages={};
  for(const name of ['before','after']){
   const context=await browser.newContext();await context.route('https://cjajlk.github.io/**',r=>r.abort());await context.addInitScript(()=>{requestAnimationFrame=()=>1;window.CJajlkAccount={isIdentityReady:()=>true};window.CJEngine={suspend(){},tick(){return 0;}};});
   const dir=name==='before'?reference:root,game=fs.readFileSync(path.join(dir,'game.js'),'utf8');
   await context.route('**/game.js',r=>r.fulfill({contentType:'application/javascript',body:game.replace('  render();\n})();',`window.BENCH={reset,render,prepare:()=>{state='playing';overlay.classList.add('hidden');lane=px=1;dist=5000;scroll=42.25;speed=.86;jump=slide=board=propulsion=0;activeBonus=null;objects=[{id:0,type:'container',lane:0,z:-12,hit:false},{id:1,type:'gap',lane:2,z:-9,length:3,hit:false},{id:2,type:'laser',lane:1,z:-42,hit:false}];}};render();\n})();`)}));
   await context.route('**/road3d.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync(path.join(dir,'road3d.js'),'utf8')}));
   const p=await context.newPage();await p.goto('http://127.0.0.1:'+server.address().port+'/index.html',{waitUntil:'networkidle'});await p.evaluate(async()=>{await NRStore.ready;await BENCH.reset();});pages[name]=p;
  }
  const results=[];
  for(const [width,height]of [[1280,800],[360,800],[390,844],[412,915]])for(const quality of ['high','low']){
   for(const p of Object.values(pages)){await p.setViewportSize({width,height});await p.evaluate(quality=>{NRProfile.options.quality=quality;BENCH.prepare();for(let i=0;i<12;i++){BENCH.render();NR3D.canvas.getContext('webgl').finish();}},quality);}
   const samples={before:[],after:[]};
   for(let i=0;i<32;i++)for(const name of i%2?['after','before']:['before','after'])samples[name].push(await pages[name].evaluate(()=>{BENCH.prepare();const t=performance.now();BENCH.render();NR3D.canvas.getContext('webgl').finish();return performance.now()-t;}));
   const summary={};for(const name of ['before','after']){samples[name].sort((a,b)=>a-b);summary[name]={medianMs:samples[name][16],p90Ms:samples[name][28]};}
   results.push({width,height,quality,...summary,deltaMs:summary.after.medianMs-summary.before.medianMs,deltaPercent:100*(summary.after.medianMs/summary.before.medianMs-1)});
  }
  fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'performances-alternees.json'),JSON.stringify({method:'32 paired alternating samples per view/quality, identical scene and camera, gl.finish included; desktop Chrome simulation',results},null,2));
  assert(results.every(r=>Number.isFinite(r.after.medianMs)));console.log(JSON.stringify(results,null,2));
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exit(1)});
