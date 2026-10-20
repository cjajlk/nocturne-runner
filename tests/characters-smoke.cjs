const fs=require('fs'),path=require('path'),assert=require('assert');
const {chromium}=require(process.env.NOCTURNE_PLAYWRIGHT||'playwright');
const root=path.resolve(__dirname,'..');
(async()=>{
 const server=require('http').createServer((req,res)=>{try{const f=path.join(root,decodeURIComponent(new URL(req.url,'http://localhost').pathname));res.setHeader('Content-Type',f.endsWith('.js')?'application/javascript':f.endsWith('.css')?'text/css':f.endsWith('.png')?'image/png':'text/html');res.end(fs.readFileSync(f));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,executablePath:process.env.NOCTURNE_CHROME});
 try{
  const context=await browser.newContext();
  await context.route('https://cjajlk.github.io/**',r=>r.abort());
  await context.addInitScript(()=>{requestAnimationFrame=()=>1;window.CJajlkAccount={isIdentityReady:()=>true};window.CJEngine={suspend(){},tick(){return 0;}};});
  let source=fs.readFileSync(path.join(root,'game.js'),'utf8');
  source=source.replace('function drawSprite(image,rect,x,feet,height,anchor=.5){','function drawSprite(image,rect,x,feet,height,anchor=.5){window.CHAR_DRAW={src:image.src,rect,x,feet,height,anchor};');
  source=source.replace('  render();\n})();',`window.CHAR_TEST={img,reset,render,update,set:v=>{if('jump'in v)jump=v.jump;if('slide'in v)slide=v.slide;if('board'in v)board=v.board;if('propulsion'in v)propulsion=v.propulsion;if('frame'in v)frame=v.frame;if('objects'in v)objects=v.objects;if('lane'in v)lane=px=v.lane;}};render();\n})();`);
  await context.route('**/game.js',r=>r.fulfill({contentType:'application/javascript',body:source}));
  const url='http://127.0.0.1:'+server.address().port+'/index.html',p=await context.newPage(),p2=await context.newPage(),errors=[];
  for(const page of [p,p2]){page.on('pageerror',e=>errors.push(e.message));await page.goto(url);await page.evaluate(()=>NRStore.ready);}
  await p.evaluate(()=>localStorage.setItem('cjPlayerData','untouched'));
  // Refused purchases preserve money and ownership, including forged IDs and every Onyx prerequisite.
  for(const [id,best,words,wallet]of [['k-0',2499,0,6000],['k-0',2500,0,5999],['vesper',0,39,10000],['vesper',0,40,9999],['onyx',7499,60,18000],['onyx',7500,59,18000],['onyx',7500,60,17999],['unknown',99999,99,99999]]){
   await p.evaluate(v=>NRStore.transaction(d=>{d.best=v.best;d.word.completed=v.words;d.wallet=v.wallet;d.unlockedCharacters=['runner'];d.character='runner';}),{best,words,wallet});
   assert.equal(await p.evaluate(id=>NRProfile.buyCharacter(id),id),false);
   assert.deepEqual(await p.evaluate(()=>({wallet:NRStore.read().wallet,owned:NRStore.read().unlockedCharacters,character:NRStore.read().character})),{wallet,owned:words>=20?['runner','nova']:['runner'],character:'runner'});
  }
  // Concurrent tabs can buy each character once only, exactly at its thresholds.
  for(const [id,best,words,price]of [['k-0',2500,0,6000],['vesper',0,40,10000],['onyx',7500,60,18000]]){
   await p.evaluate(v=>NRStore.transaction(d=>{d.best=v.best;d.word.completed=v.words;d.wallet=v.price+123;d.unlockedCharacters=['runner'];d.character='runner';}),{best,words,price});
   const bought=await Promise.all([p.evaluate(id=>NRProfile.buyCharacter(id),id),p2.evaluate(id=>NRProfile.buyCharacter(id),id)]);
   assert.equal(bought.filter(Boolean).length,1);
   assert.equal(await p.evaluate(()=>NRStore.read().wallet),123);
   assert.equal(await p.evaluate(id=>NRStore.read().unlockedCharacters.filter(c=>c===id).length,id),1);
   assert.equal(await p.evaluate(()=>NRStore.read().character),id);
   assert.equal(await p.evaluate(id=>NRProfile.buyCharacter(id),id),false);
   await p.reload();await p.evaluate(()=>NRStore.ready);
   assert.equal(await p.evaluate(()=>NRProfile.character),id);
   await p.locator('#open-menu').click();await p.locator('[data-page="collection"]').click();
   assert.equal(await p.locator('[data-character="'+id+'"]').textContent(),'Équipé');
   await p.locator('[data-character="runner"]').click();
   await p.locator('[data-character="'+id+'"]').click();
   assert.equal(await p.evaluate(()=>NRStore.read().wallet),123);
  }
  assert.equal(await p.evaluate(()=>NRProfile.equipCharacter('not-owned')),false);
  // Exercise the actual buy button once; the transaction tests above cover race conditions.
  await p.evaluate(()=>NRStore.transaction(d=>{d.best=2500;d.wallet=6000;d.unlockedCharacters=['runner'];d.character='runner';}));
  await p.locator('#back').click();await p.locator('[data-page="collection"]').click();
  await p.locator('[data-character-buy="k-0"]').click();
  assert.equal(await p.locator('[data-character="k-0"]').textContent(),'Équipé');
  assert.equal(await p.evaluate(()=>NRStore.read().wallet),0);
  const out=process.env.NOCTURNE_UI_OUTPUT||path.join(require('os').tmpdir(),'nocturne-characters');fs.mkdirSync(out,{recursive:true});
  await p.evaluate(()=>NRStore.transaction(d=>{d.unlockedCharacters=['runner','nova','k-0','vesper','onyx'];}));
  const renders=[];
  for(const [width,height]of [[360,800],[390,844],[412,915]]){
   await p.setViewportSize({width,height});
   for(const id of ['k-0','vesper','onyx']){
    await p.evaluate(async id=>{await NRProfile.equipCharacter(id);await CHAR_TEST.reset();await Promise.all(Object.values(CHAR_TEST.img).flat().map(im=>im.decode().catch(()=>{})));CHAR_TEST.update(.001);},id);
    for(const [pose,values,index]of [['course',{frame:0},1],['course-2',{frame:2},2],['saut',{jump:.425},3],['glissade',{slide:.4},4],['planche',{board:3},5],['vol',{propulsion:3},3]]){
     await p.evaluate(values=>{CHAR_TEST.set({jump:0,slide:0,board:0,propulsion:0,frame:0,objects:[],...values});CHAR_TEST.render();},values);
     const draw=await p.evaluate(()=>window.CHAR_DRAW),rect=await p.evaluate(v=>NRSPRITES[v.id].frames[v.index],{id,index});
     assert(draw.src.endsWith('/'+id+'-sheet.png'));assert.deepEqual(draw.rect,rect);
     const hudBottom=await p.locator('#run-hud').evaluate(e=>e.getBoundingClientRect().bottom);
     assert(draw.height>0&&draw.height<260);assert((draw.feet-draw.height)/1400*height>hudBottom+16,'head overlaps HUD');assert(draw.feet<1400);
     renders.push({width,height,id,pose,draw});
     if(pose==='course'||width===390)await p.screenshot({path:path.join(out,id+'-'+pose+'-'+width+'x'+height+'.png')});
    }
   }
  }
  // Alpha corners and each pose contain actual image pixels; no background rectangle in the sheet.
  await p.evaluate(()=>{for(const ch of NRCharacters){const im=CHAR_TEST.img[ch.sheetKey],canvas=document.createElement('canvas');canvas.width=im.naturalWidth;canvas.height=im.naturalHeight;const c=canvas.getContext('2d');c.drawImage(im,0,0);if(c.getImageData(0,0,1,1).data[3]!==0)throw Error(ch.id+' opaque background');for(const [x,y,w,h]of NRSPRITES[ch.id].frames){const data=c.getImageData(x,y,w,h).data;let opaque=0,clear=0;for(let i=3;i<data.length;i+=4){if(data[i]>128)opaque++;if(data[i]===0)clear++;}if(opaque<1000||clear<1000)throw Error(ch.id+' empty or opaque pose');}}});
  assert.equal(await p.evaluate(()=>localStorage.getItem('cjPlayerData')),'untouched');assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(out,'tests-personnages.json'),JSON.stringify({purchases:true,concurrentTabs:true,reload:true,uiPurchase:true,alpha:true,cjUntouched:true,renders,errors},null,2));
  console.log('Character purchase prerequisites, exact prices, concurrent tabs, duplicate rejection, equip/reload, UI purchase, all six poses and three mobile sizes passed.');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exit(1)});
