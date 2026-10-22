const fs=require('fs'),path=require('path'),assert=require('assert');
const {chromium}=require(process.env.NOCTURNE_PLAYWRIGHT||'playwright');
const root=path.resolve(__dirname,'..'),out=process.env.NOCTURNE_UI_OUTPUT||path.join(require('os').tmpdir(),'nocturne-graphics');
const baseline=process.env.NOCTURNE_GRAPHICS_BASELINE==='1',lot=Number(process.env.NOCTURNE_GRAPHICS_LOT||3);
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const server=require('http').createServer((req,res)=>{try{const f=path.join(root,decodeURIComponent(new URL(req.url,'http://localhost').pathname));res.setHeader('Content-Type',f.endsWith('.js')?'application/javascript':f.endsWith('.css')?'text/css':f.endsWith('.png')?'image/png':'text/html');res.end(fs.readFileSync(f));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,executablePath:process.env.NOCTURNE_CHROME});
 try{
  const context=await browser.newContext();await context.route('https://cjajlk.github.io/**',r=>r.abort());
  await context.addInitScript(()=>{requestAnimationFrame=()=>1;window.CJajlkAccount={isIdentityReady:()=>true};window.CJEngine={suspend(){},tick(){return 0;}};});
  const source=fs.readFileSync(process.env.NOCTURNE_SOURCE_GAME||path.join(root,'game.js'),'utf8');const wake=source.includes('function speedWake()')?'speedWake,':'';
  await context.route('**/game.js',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  render();\n})();',`window.PACK={reset,update,render,control,${wake}get:()=>({state,dist,speed,scroll,objects,px,jump,slide,W,H}),set:v=>{if('lane'in v)lane=px=v.lane;if('board'in v)board=v.board;if('objects'in v)objects=v.objects;if('jump'in v)jump=v.jump;if('slide'in v)slide=v.slide;if('dist'in v)dist=v.dist;if('scroll'in v)scroll=v.scroll;if('speed'in v)speed=v.speed;if('activeBonus'in v)activeBonus=v.activeBonus;}};render();\n})();`)}));
  if(process.env.NOCTURNE_SOURCE_ROAD)await context.route('**/road3d.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync(process.env.NOCTURNE_SOURCE_ROAD,'utf8')}));
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const results=[];
  for(const [width,height]of [[1280,800],[360,800],[390,844],[412,915]]){
   await page.setViewportSize({width,height});await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');
   await page.evaluate(async()=>{await NRStore.ready;await PACK.reset();});
   const scenes=lot===1?['modules']:lot===2?['modules','fosses','fosses-proches']:['modules','fosses','fosses-proches','depart','maximum','planche'];
   for(const scene of scenes){
    await page.evaluate(scene=>{const modules=[0,1,2].map(lane=>({id:lane,type:'container',lane,z:-10,hit:false})).concat([{id:3,type:'container',lane:1,z:-36,hit:false},{id:4,type:'crate',lane:0,z:-52,hit:false},{id:5,type:'laser',lane:2,z:-58,hit:false}]);const gaps=[{id:1,type:'gap',lane:0,z:-8,length:3,hit:false},{id:2,type:'gap',lane:1,z:-8,length:3,hit:false},{id:3,type:'gap',lane:2,z:-30,length:3,hit:false},{id:4,type:'barrier',lane:1,z:-50,hit:false}];PACK.set({lane:1,jump:0,slide:0,dist:scene==='depart'?0:5000,scroll:42.25,speed:scene==='depart'?.36:scene==='planche'?1.0148:.86,activeBonus:scene==='planche'?{type:'board',time:8}:null,board:scene==='planche'?8:0,objects:scene==='modules'?modules:scene.startsWith('fosses')?gaps.map(o=>({...o,z:o.z+(scene==='fosses-proches'?6:0)})):[...modules.slice(3),{id:31,type:'crystal',lane:1,z:-12,hit:false},{id:32,type:'letter',lane:2,z:-18,letter:'N',hit:false}]});if(scene==='fosses-proches')PACK.set({lane:2,jump:.425});PACK.render();},scene);
    await page.screenshot({path:path.join(out,scene+'-'+width+'x'+height+'.png')});
   }
   const tests=await page.evaluate(({baseline,lot})=>{
    const g=PACK.get(),gl=NR3D.canvas.getContext('webgl'),scene=[{id:0,type:'container',lane:0,z:-12,hit:false},{id:1,type:'gap',lane:2,z:-9,length:3,hit:false},{id:2,type:'laser',lane:1,z:-42,hit:false}];
    const snapshot=()=>JSON.stringify(NRStore.read()),saved=snapshot();
    // Rendering never changes live objects (including their collision flags) or storage.
    const input=JSON.stringify(scene);NR3D.render(42.25,.86,scene);if(JSON.stringify(scene)!==input)throw Error('graphics mutated objects');
    const hashes=[];for(const type of ['container','crate','barrier','laser','gap']){const o={id:2,type,lane:1,z:-6,length:3,hit:false};const first=NR3D.render(42.25,.86,[o]).toDataURL();o.hit=true;const second=NR3D.render(42.25,.86,[o]).toDataURL();if(first!==second)throw Error(type+' disappeared after collision');o.destroyed=true;const gone=NR3D.render(42.25,.86,[o]).toDataURL();if(first===gone)throw Error(type+' not visibly rendered');hashes.push(type);}
    if(!baseline&&lot>=1){const variants=new Set();for(let id=0;id<4;id++)variants.add(NR3D.render(42.25,.86,[{id,type:'container',lane:1,z:-8}]).toDataURL());if(variants.size!==4)throw Error('four module silhouettes missing');}
    if(!baseline&&lot>=3){PACK.set({board:0,activeBonus:null});const ctx=document.querySelector('#game').getContext('2d'),stroke=ctx.stroke;const counts=[];for(const pace of [.36,.86,1.0148]){PACK.set({speed:pace});let n=0;ctx.stroke=()=>n++;PACK.speedWake();ctx.stroke=stroke;counts.push(n);}if(counts.join()!=='2,6,6')throw Error('wake not pace-dependent');NRProfile.options.quality='low';let n=0;ctx.stroke=()=>n++;PACK.speedWake();ctx.stroke=stroke;NRProfile.options.quality='high';if(n!==2)throw Error('wake low quality not bounded');let previous=-1;for(const pace of [.36,.86,1.0148]){NR3D.render(42.25,pace,scene);if(NR3D.visualStats.speedLevel<=previous)throw Error('speed FX not progressive');previous=NR3D.visualStats.speedLevel;}NRProfile.options.quality='high';NR3D.render(42.25,.86,scene);const high=NR3D.visualStats.railStreaks;NRProfile.options.quality='low';NR3D.render(42.25,.86,scene);if(NR3D.visualStats.railStreaks>=high)throw Error('low quality FX not reduced');NRProfile.options.quality='high';}
PACK.set({lane:1,jump:0,slide:0,board:0,activeBonus:null,objects:scene,scroll:42.25,speed:.86});PACK.render();
    const perf=[];for(const quality of ['high','low']){NRProfile.options.quality=quality;for(let i=0;i<8;i++)NR3D.render(42.25,.86,scene);const samples=[];let vertices=0;for(let i=0;i<20;i++){const t=performance.now();PACK.set({objects:scene,scroll:42.25+i*.01,speed:.86});PACK.render();gl.finish();samples.push(performance.now()-t);vertices=gl.getBufferParameter(gl.ARRAY_BUFFER,gl.BUFFER_SIZE)/28;}samples.sort((a,b)=>a-b);perf.push({quality,medianMs:samples[10],p90Ms:samples[18],vertices,visuals:NR3D.visualStats?{...NR3D.visualStats}:null});}NRProfile.options.quality='high';
    if(gl.getError()!==0)throw Error('WebGL error');if(saved!==snapshot())throw Error('rendering changed save');
    // Check solid modules in the runner's lane, at near/far distances and all poses.
    for(const lane of [0,1,2])for(const pose of ['run','jump','slide'])for(const z of [-55,2.4]){PACK.set({lane,jump:pose==='jump'?.425:0,slide:pose==='slide'?.5:0,board:0,activeBonus:null,objects:[{id:lane,type:'container',lane,z}]});PACK.render();for(const dx of [-1.4,1.4])for(const y of [0,4.6]){const q=NR3D.project((lane-1)*3.66+dx,y,z+1.13);if(q.x<0||q.x>PACK.get().W||q.y<0||q.y>1400)throw Error('module cropped in runner lane '+[lane,pose,z]);}}
    return {perf,visibleAfterCollision:hashes,projection:[-3.66,0,3.66].map(x=>NR3D.project(x,0,2.4)),state:{distance:g.dist,speed:g.speed},saveUntouched:true};
   },{baseline,lot});results.push({width,height,...tests});
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'graphics-tests.json'),JSON.stringify({baseline,lot,results,errors},null,2));console.log('Graphics lot '+lot+': scenes, visibility after collision, deterministic variants, immutable objects/saves and high/low performance captured.');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exit(1)});
