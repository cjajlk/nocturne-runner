(() => {
  'use strict';

  const c = document.querySelector('#game');
  const ctx = c.getContext('2d');
  const overlay = document.querySelector('#overlay');
  const msg = document.querySelector('#msg');
  const btn = document.querySelector('#start');
  const pauseBtn = document.querySelector('#pause');

  let W = 900;
  const H = 1400;
  let CX = W / 2;

  let state = 'menu';
  window.getGameState = () => ({
    running: window.CJajlkAccount?.isIdentityReady?.() === true && state === 'playing',
    paused: document.hidden || !document.hasFocus() || !overlay.classList.contains('hidden')
  });
  let lane = 1, px = 1;
  let dist = 0, score = 0, orbs = 0;
  let speed = 0.35;
  let objects = [];
  let spawn = 0, scroll = 0;
  let board = 0, jump = 0, slide = 0, stun = 0;
  let last = 0, frame = 0;
  let best = 0,oldBest=0,newRecord=false,recordFlash=0,runId=null,activeBonus=null,cooldown=0,bonusPending=false,revived=false,invulnerable=0,fallTime=0,sequence=0;
  let storageBlocked=false;
  const storeError=e=>{storageBlocked=true;if(state==='playing')togglePause();if(state!=='menu'){state='paused';showOverlay('SAUVEGARDE À VÉRIFIER','RECHARGER LE JEU');msg.textContent='Course arrêtée pour préserver les données. Recharge le jeu pour récupérer les événements en attente.';}document.querySelector('#notice').textContent='Sauvegarde : '+e.message;};
  const persist=p=>p.catch(storeError);
  let collectedFragments=[],wordToast='',wordToastTime=0;
  let magnet=0, surcharge=0, propulsion=0, chargeReady=true, wave=0, safeLane=1;
  let runStats={jumps:0, dodges:0};
  const duration=k=>8+NRProfile.levels[k]*2;
  const hazards=NRTrack.hazards;

  try { best = NRStore.read().best; } catch {}

  const img = {};
  const manifest = {
    novaSheet:'@assets/nova-sheet.png',catSheet:'@assets/cat-sheet.png',
    ...Object.fromEntries(NRCharacters.map(ch=>[ch.sheetKey,'@'+ch.sheet])),
    run: ['perso_dos/asset_04.png', 'perso_dos/asset_05.png', 'perso_dos/asset_04.png', 'perso_dos/asset_06.png'],
    idle: 'perso_dos/asset_01.png',
    jump: 'perso_dos/asset_07.png',
    slide: 'perso_dos/asset_08.png',
    board: 'bonus/asset_07.png',
    orb: 'bonus/asset_02.png',
    crystal: 'bonus/asset_01.png',
    shield: 'bonus/asset_04.png',
    boost: 'bonus/asset_05.png',
    magnet: 'bonus/asset_03.png',
    barrier: 'barrieres/asset_08.png',
    post: 'barrieres/asset_10.png',
    road: 'routes/asset_01.png',
    boostRoad: 'routes/asset_06.png',
    tunnel: 'routes/asset_05.png',
    roadConnector: 'routes/asset_10.png',
    guard: 'barrieres/asset_03.png',
    guardShort: 'barrieres/asset_01.png',
    leftSign: 'decos laterale/asset_03.png',
    lamp: 'decos laterale/asset_04.png',
    billboard: 'decos laterale/asset_01.png',
    pipes: 'decos laterale/asset_08.png',
    crystals: 'decos laterale/asset_09.png',
    drone: 'decos laterale/asset_06.png',
    supportTall: 'support route/asset_02.png',
    supportWide: 'support route/asset_05.png',
    supportArch: 'support route/asset_16.png',
    supportShort: 'support route/asset_18.png',
    portal: 'portails/asset_05.png',
    facadesLeft: [
      'facades_gauche/asset_01.png','facades_gauche/asset_02.png','facades_gauche/asset_03.png',
      'facades_gauche/asset_04.png','facades_gauche/asset_05.png','facades_gauche/asset_06.png'
    ],
    facadesRight: [
      'facades_droite/asset_01.png','facades_droite/asset_02.png','facades_droite/asset_03.png',
      'facades_droite/asset_04.png','facades_droite/asset_05.png','facades_droite/asset_06.png'
    ],
    bigLeft: ['grands_gauche/asset_01.png','grands_gauche/asset_02.png'],
    bigRight: ['grands_droite/asset_01.png','grands_droite/asset_02.png']
  };

  for (const [k, path] of Object.entries(manifest)) {
    img[k] = Array.isArray(path) ? path.map(load) : load(path);
  }

  function load(p) {
    const i = new Image();
    i.onload = () => { if (state !== 'playing') render(); };
    i.src = p.startsWith('@') ? p.slice(1) : 'nocturne runner/' + p;
    return i;
  }

  function draw(k, x, y, w, h, alpha = 1) {
    const i = typeof k === 'string' ? img[k] : k;
    if (!i || !i.complete || !i.naturalWidth) return;
    ctx.globalAlpha = alpha;
    ctx.drawImage(i, x, y, w, h);
    ctx.globalAlpha = 1;
  }

  function text(s, x, y, size = 35, align = 'left', color = '#fff') {
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.font = `800 ${size}px system-ui`;
    ctx.shadowColor = '#6f33ee';
    ctx.shadowBlur = NRProfile.options.quality === 'low' ? 0 : 12;
    ctx.fillText(s, x, y);
    ctx.shadowBlur = 0;
  }

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function roadMetrics(p) {
    p = clamp(p, 0, 1);
    const ease = Math.pow(p, 1.82);
    const y = 350 + 1035 * ease;
    const half = 74 + 344 * Math.pow(p, 1.06);
    return { y, half, ease };
  }

  function roadPoint(p) {
    const m = roadMetrics(p);
    return { left: CX - m.half, right: CX + m.half, y: m.y, half: m.half };
  }

  async function reset() {
    if(!window.NR3D){msg.textContent='Le rendu 3D n’est pas disponible. Active l’accélération graphique du navigateur, puis recharge le jeu.';return;}
    if(state==='starting')return;state='starting';try{await NRStore.ready;runId=await NRStore.start();}catch(e){state='menu';storeError(e);return;}
    oldBest=NRStore.read().best;best=oldBest;newRecord=false;recordFlash=0;cooldown=0;activeBonus=null;bonusPending=false;revived=false;invulnerable=0;sequence=0;fallTime=0;NRAudio.unlock();
    window.CJGameIntegration?.suspend();
    lane = px = 1;
    dist = score = orbs = scroll = frame = 0;
    objects = [];
    collectedFragments=[]; wordToast='';wordToastTime=0; wave=0; safeLane=1; magnet=surcharge=propulsion=0; chargeReady=true; runStats={jumps:0,dodges:0};
    let nextZ=-26;while(nextZ>-150)nextZ-=spawnObj(nextZ);
    speed = 0.34;
    spawn = Math.max(0,-150-nextZ);
    board = jump = slide = stun = 0;
    state = 'playing';
    overlay.classList.add('hidden');
    document.querySelector('#bonus-controls').classList.remove('hidden');
    pauseBtn.classList.remove('hidden');
    last = performance.now();
    requestAnimationFrame(loop);
  }

  async function finish(){
    if(state==='over'||state==='finishing')return;state='finishing';CJGameIntegration?.suspend();
    try{await NRStore.flush();await NRStore.finish(runId,Math.floor(dist),runStats);best=NRStore.read().best;state='over';showOverlay('COURSE TERMINÉE','REJOUER');msg.innerHTML=`<div class="results"><span>Distance<strong>${Math.floor(dist)} m</strong></span><span>Score<strong>${Math.floor(score)}</strong></span><span>Fragments sécurisés<strong>${orbs} ◈</strong></span><span>Portefeuille<strong>${NRProfile.wallet} ◈</strong></span></div>`;pauseBtn.classList.add('hidden');document.querySelector('#bonus-controls').classList.add('hidden');}catch(e){state='paused';storeError(e);}
  }
  async function death(fall=false){if(state!=='playing')return;if(activeBonus)cooldown=5;activeBonus=null;board=magnet=propulsion=0;CJGameIntegration?.suspend();if(fall){state='falling';fallTime=.5;return;}await offerRevive();}
  async function offerRevive(){state='checking';try{await NRStore.flush();if(!revived&&NRStore.read().wallet>=50){state='dead';showOverlay('UNE SECONDE CHANCE','REVENIR · 50 ◈');msg.innerHTML='<p>Reprends à la même distance avec 2 secondes de protection.</p><button id="refuse-revive">Terminer la course</button>';document.querySelector('#refuse-revive').onclick=()=>finish();}else finish();}catch(e){state='paused';storeError(e);}}
  async function resurrect(){if(state!=='dead'||bonusPending)return;bonusPending=true;try{if(!await NRStore.revive(runId)){bonusPending=false;return finish();}revived=true;invulnerable=2;objects=objects.filter(o=>(!hazards.includes(o.type)&&o.type!=='cue')||o.z<-30||o.z>9);jump=slide=0;state='playing';overlay.classList.add('hidden');last=performance.now();requestAnimationFrame(loop);}catch(e){storeError(e);}finally{bonusPending=false;}}
  function showOverlay(title,label){
    overlay.classList.toggle('arcade-home',state==='menu');
    document.querySelector('#screen-title').textContent=title;
    document.querySelector('#home-screen').hidden=false;
    document.querySelector('#detail-screen').hidden=true;
    document.querySelector('#menu-screen').hidden=true;overlay.classList.add('immersive');
    document.querySelector('#run-hud').classList.add('hidden');document.querySelector('#direction-controls').classList.add('hidden');
    btn.textContent=label; overlay.classList.remove('hidden');refreshMenu();
  }
  async function activateBonus(type){if(state!=='playing'||activeBonus||cooldown>0||bonusPending)return false;bonusPending=true;try{if(!await NRStore.consume(runId,crypto.randomUUID(),type))return false;activeBonus={type,time:type==='propulsion'?4+NRProfile.levels.propulsion:duration(type)};NRProfile.sound(650);return true;}catch(e){storeError(e);return false;}finally{bonusPending=false;}}
  const activateBoost=()=>activateBonus('propulsion');
  function control(direction) {
    if (state !== 'playing') return;
    if (direction === 'left') lane = Math.max(0, lane - 1);
    if (direction === 'right') lane = Math.min(2, lane + 1);
    if (direction === 'up' && jump <= 0 && slide <= 0) { jump = 0.85; runStats.jumps++; }
    if (direction === 'down' && slide <= 0 && jump <= 0) slide = 0.75;
  }

  document.addEventListener('keydown', e => {
    const m = {
      ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
      a: 'left', d: 'right', w: 'up', s: 'down', ' ': 'up'
    };
    if (m[e.key]&&state==='playing') {
      e.preventDefault();
      control(m[e.key]);
    }
    if (e.key === 'Escape') togglePause();
    if(e.key.toLowerCase()==='b')activateBoost();const bonusKeys={1:'magnet',2:'board',3:'surge',4:'propulsion'};if(bonusKeys[e.key])activateBonus(bonusKeys[e.key]);
  });

  let gesture=null;
  c.addEventListener('pointerdown',e=>{
    if(state!=='playing'||gesture||e.button>0)return;
    gesture={id:e.pointerId,x:e.clientX,y:e.clientY};
    try{c.setPointerCapture(e.pointerId);}catch{}
  });
  c.addEventListener('pointerup',e=>{
    if(!gesture||gesture.id!==e.pointerId)return;
    const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;gesture=null;
    if(Math.abs(dx)<23&&Math.abs(dy)<23)return;
    control(Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down'));
  });
  for(const event of ['pointercancel','lostpointercapture'])c.addEventListener(event,e=>{if(gesture?.id===e.pointerId)gesture=null;});

  btn.addEventListener('click', () => {
    if(storageBlocked){location.reload();return;}if(['starting','checking','finishing','falling'].includes(state)||bonusPending)return;
    if(state==='dead'){resurrect();return;}NRAudio.unlock();
    if (state === 'paused') {
      window.CJGameIntegration?.suspend();
      state = 'playing';
      overlay.classList.add('hidden');
      last = performance.now();
      requestAnimationFrame(loop);
    } else {
      reset();
    }
  });

  function togglePause() {
    window.CJGameIntegration?.suspend();
    if (state === 'playing') {
      state = 'paused';
      showOverlay('COURSE EN PAUSE','REPRENDRE');
      msg.textContent='Prends une respiration. La cité t’attend.';
    } else if (state === 'paused') {
      state = 'playing';
      overlay.classList.add('hidden');
      last = performance.now();
      requestAnimationFrame(loop);
    }
  }

  pauseBtn.addEventListener('click', togglePause);

  // Each row has a reachable route, sometimes requiring a signalled jump or slide.
  function spawnObj(z=-150){const row=NRTrack.row({distance:dist,wave,safe:safeLane,z,speed});safeLane=row.safe;for(const item of row.items)objects.push({...item,safe:row.safe,routeAction:row.action,pattern:row.pattern,rowId:wave,id:++sequence,hit:false});if(wave%4===0){const w=NRProfile.currentWord();const available=[...w.letters].map((letter,slot)=>({letter,slot,wordId:NRProfile.word.completed})).filter(o=>!NRProfile.word.found[o.slot]&&!objects.some(p=>p.type==='letter'&&!p.hit&&p.wordId===o.wordId&&p.slot===o.slot));if(available.length)objects.push({lane:safeLane,z:z-13,type:'letter',hit:false,id:++sequence,...available[0]});}wave++;return row.spacing;}
  function update(dt){
    if(bonusPending&&state==='playing')return;
    if(state==='falling'){fallTime-=dt;if(fallTime<=0)offerRevive();return;}
    wordToastTime=Math.max(0,wordToastTime-dt);recordFlash=Math.max(0,recordFlash-dt);invulnerable=Math.max(0,invulnerable-dt);collectedFragments=collectedFragments.filter(f=>(f.time-=dt)>0);px+=(lane-px)*Math.min(1,dt*15);
    if(activeBonus){activeBonus.time-=dt;if(activeBonus.time<=0){activeBonus=null;cooldown=5;}}else cooldown=Math.max(0,cooldown-dt);
    board=activeBonus?.type==='board'?activeBonus.time:0;magnet=activeBonus?.type==='magnet'?activeBonus.time:0;propulsion=activeBonus?.type==='propulsion'?activeBonus.time:0;surcharge=0;
    speed=Math.min(.86,.36+dist/5200)*(board>0?1.12+NRProfile.levels.board*.012:1);const advance=dt*speed*25;
    const previousDistance=dist;dist+=advance*2;score+=advance*10;scroll+=dt*speed;frame+=dt*10;jump=Math.max(0,jump-dt);slide=Math.max(0,slide-dt);
    if(!newRecord&&dist>oldBest){newRecord=true;recordFlash=3;}
    for(let milestone=Math.floor(previousDistance/1000)+1;milestone<=Math.floor(dist/1000);milestone++){orbs+=5;persist(NRStore.credit(runId,'distance:'+milestone,5));}
    spawn-=advance;while(spawn<=0)spawn+=spawnObj(-150-advance-spawn);
    for(const o of objects){const previous=o.z;o.z+=advance;o.travel=(o.travel||0)+advance;const olane=o.type.startsWith('drone')?NRTrack.droneX(o):o.lane,delta=Math.abs(px-olane),close=delta<.40,crossing=previous<2.4&&o.z>=2.4;
      if(o.type==='cue')continue;
      const airborne=jump>0&&Math.sin((.85-jump)/.85*Math.PI)>.48;
      const insideHazard=Math.abs(o.z-2.4)<=(['crate','container'].includes(o.type)?1.13:.35);
      const insideGap=o.type==='gap'&&o.z-o.length/2<=2.4&&o.z+o.length/2>=2.4;
      if(hazards.includes(o.type)&&(o.type==='gap'||!o.hit)&&(((crossing||insideHazard)&&close&&o.type!=='gap')||(insideGap&&close))){const avoided=propulsion>0||invulnerable>0||(['crate','barrier','droneLow','gap'].includes(o.type)&&airborne)||(['laser','droneHigh'].includes(o.type)&&slide>.08);
        if(avoided){if(o.type!=='gap')o.hit=true;if(!o.dodged){o.dodged=true;runStats.dodges++;score+=10;}}
        else if(activeBonus?.type==='surge'&&o.type!=='gap'){activeBonus=null;cooldown=5;invulnerable=0;o.hit=true;o.destroyed=true;NRProfile.sound(160);}
        else{death(o.type==='gap');return;}
      }else if(crossing&&!o.hit&&hazards.includes(o.type)){o.hit=true;runStats.dodges++;if(delta<.72&&propulsion<=0&&invulnerable<=0)persist(NRStore.near(runId,'near:'+o.id).then(ok=>{if(ok)orbs++;}));}
      if(!o.hit&&!hazards.includes(o.type)&&((crossing&&close&&(o.type!=='crystal'||propulsion>0||magnet>0||(!o.requiresJump&&!o.requiresSlide)||(o.requiresJump&&airborne)||(o.requiresSlide&&slide>.08)))||(magnet>0&&o.type==='crystal'&&o.z>-7&&o.z<2.4))){o.hit=true;if(o.type==='crystal'){const amount=o.value||1;orbs+=amount;persist(NRStore.credit(runId,'fragment:'+o.id,amount));if(magnet>0){const q=projectWorld((o.lane-1)*3.66,o.height||1.05,o.z);if(q)collectedFragments.push({x:q.x,y:q.y,time:.45});}NRProfile.sound(900);}else if(o.type==='letter')persist(NRProfile.collectLetter(o).then(result=>{if(result){wordToast=result;wordToastTime=4;}}));else if(NRStore.types.includes(o.type))persist(NRStore.pickup(runId,'pickup:'+o.id,o.type).then(ok=>{if(ok){wordToast='Bonus ajouté au stock · à équiper pour la prochaine course';wordToastTime=3;}}));}
    }objects=objects.filter(o=>o.z<12);updateBonusControls();
  }
  function updateBonusControls(){
    const remaining=runId?NRProfile.runs[runId]?.remaining:{},names={magnet:'Aimant',board:'Planche',surge:'Bouclier Surge',propulsion:'Propulsion'};
    document.querySelectorAll('[data-bonus]').forEach(b=>{const t=b.dataset.bonus,n=Math.min(remaining?.[t]||0,NRProfile.inventory[t]),active=activeBonus?.type===t;
      b.disabled=state!=='playing'||!!activeBonus||cooldown>0||bonusPending||n<1;
      b.dataset.state=active?'active':cooldown>0?'cooldown':n<1?'empty':activeBonus?'locked':'ready';
      b.querySelector('.bonus-count').textContent=n;b.querySelector('.bonus-timer').textContent=active?Math.ceil(activeBonus.time)+'s':cooldown>0?Math.ceil(cooldown)+'s':'';
      b.setAttribute('aria-label',names[t]+' : '+n+' disponibles'+(active?', actif':cooldown>0?', en recharge':''));
    });
    document.querySelector('#bonus-status').textContent=activeBonus?names[activeBonus.type]+' actif':cooldown>0?'Recharge':'';
  }

  function background() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#080816');
    g.addColorStop(0.42, '#160c33');
    g.addColorStop(1, '#060814');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Simple sky for now: just a few clean silhouettes instead of a dense skyline.
    ctx.fillStyle = 'rgba(150,80,255,0.08)';
    ctx.fillRect(0, 0, W, 240);

    const stars = [
      [110,70,2],[180,95,2],[260,60,2],[340,120,2],[430,82,2],[520,58,2],[610,108,2],[700,74,2],[780,98,2],
      [150,145,1.5],[235,165,1.5],[390,150,1.5],[480,132,1.5],[590,160,1.5],[745,145,1.5]
    ];
    for (const [x,y,r] of stars) {
      ctx.fillStyle = 'rgba(120,220,255,0.85)';
      ctx.beginPath();
      ctx.arc(x,y,r,0,Math.PI*2);
      ctx.fill();
    }

    const moonG = ctx.createRadialGradient(700, 145, 8, 700, 145, 90);
    moonG.addColorStop(0, 'rgba(216,160,255,0.95)');
    moonG.addColorStop(0.45, 'rgba(151,85,255,0.35)');
    moonG.addColorStop(1, 'rgba(151,85,255,0)');
    ctx.fillStyle = moonG;
    ctx.beginPath();
    ctx.arc(700,145,90,0,Math.PI*2);
    ctx.fill();
    ctx.fillStyle = 'rgba(225,190,255,0.92)';
    ctx.beginPath();
    ctx.arc(700,145,26,0,Math.PI*2);
    ctx.fill();

    ctx.save();
    if(document.body.classList.contains('mobile-course'))ctx.translate(0,projectWorld(0,0,-240).y-380);
    // Far skyline follows the street horizon on the low mobile camera.
    const blocks = [
      [40,250,60,130],[115,215,88,165],[225,235,55,145],[305,190,95,190],[430,230,72,150],
      [540,200,110,180],[690,225,70,155],[790,205,65,175]
    ];
    for (const [x,y,w,h] of blocks) {
      ctx.fillStyle = 'rgba(18,16,37,0.95)';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = 'rgba(109,54,192,0.18)';
      ctx.fillRect(x, y, w, 8);
    }

    ctx.fillStyle = 'rgba(84,36,140,0.22)';
    ctx.fillRect(0, 380, W, 3);

    const haze = ctx.createLinearGradient(0, 300, 0, 560);
    haze.addColorStop(0, 'rgba(44,18,74,0)');
    haze.addColorStop(.6, 'rgba(40,18,72,0.28)');
    haze.addColorStop(1, 'rgba(15,11,36,0.02)');
    ctx.fillStyle = haze;
    ctx.fillRect(0, 300, W, 300);
    ctx.restore();
  }

  function road() {
    if (window.NR3D) {
      ctx.drawImage(window.NR3D.render(scroll, speed, objects), 0, 0, W, H);
    } else {
      const top = roadPoint(0), bottom = roadPoint(1);
      ctx.beginPath();
      ctx.moveTo(top.left, top.y);
      ctx.lineTo(top.right, top.y);
      ctx.lineTo(bottom.right, bottom.y);
      ctx.lineTo(bottom.left, bottom.y);
      ctx.closePath();
      ctx.fillStyle = '#17172c';
      ctx.fill();
      ctx.strokeStyle = '#49d3fa';
      ctx.lineWidth = 9;
      ctx.stroke();
      for (const f of [1 / 3, 2 / 3]) {
        ctx.beginPath();
        ctx.moveTo(top.left + (top.right - top.left) * f, top.y);
        ctx.lineTo(bottom.left + (bottom.right - bottom.left) * f, bottom.y);
        ctx.strokeStyle = '#aa83ff';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    }
  }

  function projectWorld(x, y, z) {
    if (window.NR3D) return window.NR3D.project(x, y, z);
    const p = clamp(1 - (12 - z) / 170, 0, 1), r = roadPoint(p);
    return { x: CX + x / 5.5 * r.half, y: r.y, scale: .18 + p * 1.1 };
  }

  function imageSize(entry, targetH) {
    const im = typeof entry === 'string' ? img[entry] : entry;
    if (!im || !im.naturalWidth || !im.naturalHeight) return { w: targetH * 0.7, h: targetH };
    return { w: targetH * (im.naturalWidth / im.naturalHeight), h: targetH };
  }

  function sideStructures() {
    // simple side masses to visually anchor the road between city walls
    for (let i = 0; i < 11; i++) {
      const p1 = 0.12 + i * 0.07;
      const p2 = p1 + 0.065;
      const a = roadPoint(clamp(p1, 0, 1));
      const b = roadPoint(clamp(p2, 0, 1));
      const offA = 22 + p1 * 118;
      const offB = 22 + p2 * 118;
      const topLiftA = 16 + p1 * 18;
      const topLiftB = 16 + p2 * 18;
      const alpha = 0.14 + p2 * 0.16;
      ctx.beginPath();
      ctx.moveTo(a.left - offA, a.y - topLiftA);
      ctx.lineTo(b.left - offB, b.y - topLiftB);
      ctx.lineTo(b.left - 10, b.y + 4);
      ctx.lineTo(a.left - 10, a.y + 4);
      ctx.closePath();
      ctx.fillStyle = `rgba(18,14,34,${alpha})`;
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(a.right + offA, a.y - topLiftA);
      ctx.lineTo(b.right + offB, b.y - topLiftB);
      ctx.lineTo(b.right + 10, b.y + 4);
      ctx.lineTo(a.right + 10, a.y + 4);
      ctx.closePath();
      ctx.fillStyle = `rgba(18,14,34,${alpha})`;
      ctx.fill();
    }
  }

  function cityFacades() {
    // v0.7.1: larger screen-space city corridor. Prior 3D projections
    // pushed the images outside the field of view at x=+/-8 world units.
    // Clip each building to the safe space OUTSIDE the actual WebGL track.
    // This preserves obstacle and lane readability.
    const drift = (scroll * 0.38) % 1;
    const columns = [
      { y: 1320, h: 765, w: 390, a: 1.0 },
      { y: 1040, h: 585, w: 295, a: 0.97 },
      { y: 790,  h: 415, w: 205, a: 0.94 },
      { y: 620,  h: 285, w: 135, a: 0.90 }
    ];

    // Separate corridor mask follows the road's actual projected edge.
    function clipSide(side) {
      const positions = [];
      for (let z = -225; z <= 11; z += 4) {
        const q = projectWorld(side * 5.90, 0, z);
        if (q && Number.isFinite(q.x) && Number.isFinite(q.y)) positions.push(q);
      }
      ctx.beginPath();
      if (side < 0) {
        ctx.moveTo(0, 0);ctx.lineTo(W/2,0);
        for (const q of positions) ctx.lineTo(clamp(q.x - 10, 0, W/2), clamp(q.y, 0, H));
        ctx.lineTo(0,H);
      } else {
        ctx.moveTo(W,0);ctx.lineTo(W/2,0);
        for (const q of positions) ctx.lineTo(clamp(q.x + 10, W/2,W),clamp(q.y,0,H));
        ctx.lineTo(W,H);
      }
      ctx.closePath();
      ctx.clip();
    }

    for (const side of [-1,1]) {
      const list = side < 0 ? img.bigLeft : img.bigRight;
      ctx.save();
      clipSide(side);
      // Far-to-near painter order, wall pictures rather than tiny free-floating props.
      for (let j = columns.length-1; j >= 0; j--) {
        const spec = columns[j];
        const variant = (j + Math.floor(scroll / 4)) % 2;
        const sprite = list[variant];
        const effectiveY = spec.y + drift * (j===0?65:30);
        const w = spec.w, h = spec.h;
        const x = side < 0 ? (j===0 ? -54 : 175 - w * 0.76 - j*6) : (j===0 ? W-w+54 : W-175 - w*0.24 + j*6);
        draw(sprite, x, effectiveY-h, w, h, spec.a);
      }
      ctx.restore();
    }
  }

  function foregroundProps() {
    // Keep props very light for now: only a few near-road accents after the big wall images.
    const keys = ['lamp', 'crystals', 'leftSign', 'supportWide'];
    for (let i = 0; i < 8; i++) {
      const z = 4 - i * 16 + (scroll * 25) % 16;
      if (z > 10 || z < -120) continue;
      for (const side of [-1, 1]) {
        const id = i - Math.floor(scroll * 25 / 16);
        if ((id + (side > 0 ? 1 : 0)) % 2 !== 0) continue;
        const key = keys[((id + (side > 0 ? 1 : 0)) % keys.length + keys.length) % keys.length];
        const pos = projectWorld(side * (6.25 + (i % 2) * 0.55), 0, z);
        if (!pos || pos.scale <= 0.05) continue;
        const depth = clamp((8 - z) / 120, 0, 1);
        const base = key === 'lamp' ? [88, 250] : key === 'supportWide' ? [165, 118] : key === 'leftSign' ? [138, 120] : [120, 150];
        const sc = Math.min(2.2, Math.max(.24, pos.scale * 1.12));
        const w = base[0] * sc, h = base[1] * sc;
        draw(key, pos.x - w / 2, pos.y - h * 0.93, w, h, clamp(0.46 + depth * 0.44, 0.46, 0.92));
      }
    }
  }

  function atmosphere() {
    const g = ctx.createLinearGradient(0, 420, 0, 1100);
    g.addColorStop(0, 'rgba(58,24,104,0)');
    g.addColorStop(0.35, 'rgba(76,28,128,0.10)');
    g.addColorStop(1, 'rgba(40,18,72,0.18)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 420, W, 700);
  }

  function scenery() {
    atmosphere();
    if (!window.NR3D) cityFacades();
    foregroundProps();
  }

  function entities(){
    for(const o of objects.slice().sort((a,b)=>a.z-b.z)){
      if((o.hit&&!hazards.includes(o.type))||o.destroyed||o.z>12)continue;
      if(o.type==='letter'&&(o.wordId!==NRProfile.word.completed||NRProfile.word.found[o.slot]))continue;
      if(window.NR3D&&hazards.includes(o.type)&&!o.type.startsWith('drone'))continue;
      const pos=projectWorld((o.lane-1)*3.66,o.type==='crystal'?(o.height||1.05):o.type==='letter'?1.05:0,o.z);if(!pos)continue;
      const size=95*Math.max(.12,Math.min(2.2,pos.scale));
      if(o.type==='cue'){if(o.z<-60||o.z>2.4)continue;const q=projectWorld((o.lane-1)*3.66,o.action==='up'?5.6:4.2,o.z-5);if(!q)continue;const label=o.action==='up'?'↑ SAUT':'↓ GLISSE';ctx.save();ctx.globalAlpha=Math.min(1,(o.z+60)/20);text(label,q.x,q.y,Math.max(22,Math.min(34,75*q.scale)),'center','#fff29a');ctx.restore();
      }else if(o.type.startsWith('drone')){const q=projectWorld((NRTrack.droneX(o)-1)*3.66,o.type==='droneLow'?1:2.5,o.z);if(!q)continue;const h=120*q.scale,ds=imageSize('drone',h);draw('drone',q.x-ds.w/2,q.y-h/2,ds.w,h);text(o.type==='droneLow'?'↑':'↓',q.x,q.y-h*.6,Math.max(12,h*.3),'center',o.type==='droneLow'?'#67efff':'#ff6fdc');if(o.z<-25)text((Math.floor((o.travel+6)/24)%2===0?'→':'←'),q.x,q.y+h*.8,Math.max(12,h*.25),'center','#ffe399');
      }else if(o.type==='crystal'){
        ctx.save();ctx.translate(pos.x,pos.y);ctx.shadowColor='#e84cff';ctx.shadowBlur=NRProfile.options.quality==='low'?0:18;
        ctx.beginPath();ctx.moveTo(0,-size*.55);ctx.lineTo(size*.28,0);ctx.lineTo(0,size*.4);ctx.lineTo(-size*.28,0);ctx.closePath();ctx.fillStyle=o.value===5?'#eaa33d':'#c42af1';ctx.fill();ctx.strokeStyle='#ffe0ff';ctx.lineWidth=Math.max(1,size*.025);ctx.stroke();ctx.beginPath();ctx.moveTo(0,-size*.55);ctx.lineTo(0,size*.4);ctx.lineTo(size*.28,0);ctx.stroke();ctx.restore();
       }else if(o.type==='letter'){
        ctx.save();ctx.translate(pos.x,pos.y);ctx.strokeStyle='#ffe09b';ctx.fillStyle='#352746';ctx.shadowColor='#f8c954';ctx.shadowBlur=NRProfile.options.quality==='low'?0:18;ctx.lineWidth=Math.max(1,size*.025);ctx.beginPath();ctx.roundRect(-size*.36,-size*.53,size*.72,size*.85,size*.12);ctx.fill();ctx.stroke();text(o.letter,0,size*.10,size*.6,'center','#ffe4a0');ctx.restore();
      }else if(o.type==='board'){ctx.save();ctx.translate(pos.x,pos.y-size*.3);ctx.scale(size/160,size/160);hoverboard(0,0);ctx.restore();
      }else if(!hazards.includes(o.type)){
        ctx.fillStyle='#11172d';ctx.strokeStyle=o.type==='board'?'#bc56ff':'#53efff';ctx.lineWidth=3;ctx.fillRect(pos.x-size*.45,pos.y-size,size*.9,size*.9);ctx.strokeRect(pos.x-size*.45,pos.y-size,size*.9,size*.9);
        draw(o.type==='magnet'?'magnet':o.type==='surge'?'shield':'boost',pos.x-size*.36,pos.y-size*.87,size*.72,size*.72);
      }else draw(o.type==='laser'?'barrier':'post',pos.x-size/2,pos.y-size,size,size);
    }
  }

  function hoverboard(x,y){
    ctx.save();ctx.translate(x,y);ctx.shadowColor='#43e9ff';ctx.shadowBlur=NRProfile.options.quality==='low'?0:18;
    // Foreshortened deck with a visible thickness: both feet rest on its top.
    ctx.beginPath();ctx.moveTo(-112,-8);ctx.lineTo(-70,-25);ctx.lineTo(80,-25);ctx.lineTo(116,-5);ctx.lineTo(90,21);ctx.lineTo(-84,21);ctx.closePath();ctx.fillStyle='#121b35';ctx.fill();ctx.strokeStyle='#bb55ff';ctx.lineWidth=4;ctx.stroke();
    ctx.beginPath();ctx.moveTo(-112,-8);ctx.lineTo(-84,8);ctx.lineTo(90,8);ctx.lineTo(116,-5);ctx.lineTo(90,21);ctx.lineTo(-84,21);ctx.closePath();ctx.fillStyle='#34225a';ctx.fill();ctx.strokeStyle='#56efff';ctx.lineWidth=3;ctx.stroke();
    ctx.shadowBlur=0;for(const dx of [-73,73]){ctx.fillStyle='#61f3ff';ctx.fillRect(dx-14,11,28,5);}
    ctx.strokeStyle='#e066ff';ctx.lineWidth=2;for(const dx of [-45,0,45]){ctx.beginPath();ctx.moveTo(dx-12,-16);ctx.lineTo(dx+8,-9);ctx.lineTo(dx-12,-3);ctx.stroke();}
    ctx.restore();
  }
  function companion(x,y){
    const cx=x+(x>CX?-105:105),cy=y-130+Math.sin(frame*.8)*8;
    ctx.save();
    // Collected fragments travel to the companion before fading.
    for(const f of collectedFragments){const t=1-f.time/.45,e=1-Math.pow(1-t,2),fx=f.x+(cx-f.x)*e,fy=f.y+(cy-f.y)*e;
      ctx.globalAlpha=1-t*.5;ctx.strokeStyle='#dd5aff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(fx-8,fy);ctx.lineTo(fx,fy-15);ctx.lineTo(fx+8,fy);ctx.lineTo(fx,fy+12);ctx.closePath();ctx.stroke();
    }
    ctx.globalAlpha=1;
    if(NRProfile.pet==='cat'&&img.catSheet.complete&&img.catSheet.naturalWidth){const index=collectedFragments.length?1:Math.floor(frame/3)%4;drawSprite(img.catSheet,NRSPRITES.cat.frames[index],cx,cy+35,75*NRSPRITES.cat.frames[index][3]/NRSPRITES.cat.frames[0][3]);ctx.restore();return;}
    ctx.translate(cx,cy);ctx.shadowColor='#6debff';ctx.shadowBlur=NRProfile.options.quality==='low'?0:15;
    ctx.fillStyle='#152943';ctx.strokeStyle='#64eaff';ctx.lineWidth=2.5;
    ctx.beginPath();ctx.roundRect(-25,-33,50,39,12);ctx.fill();ctx.stroke();
    ctx.fillStyle='#050e20';ctx.fillRect(-17,-21,34,17);ctx.fillStyle='#70f3ff';for(const dx of [-10,10])ctx.fillRect(dx-3,-16,6,7);
    ctx.fillStyle='#653793';ctx.beginPath();ctx.roundRect(-15,10,30,27,8);ctx.fill();ctx.strokeStyle='#e26cff';ctx.stroke();
    ctx.fillStyle='#ee8aff';ctx.beginPath();ctx.moveTo(0,13);ctx.lineTo(7,22);ctx.lineTo(0,30);ctx.lineTo(-7,22);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#9e7dde';ctx.beginPath();ctx.moveTo(-15,17);ctx.lineTo(-34,27);ctx.moveTo(15,17);ctx.lineTo(33,9);ctx.moveTo(0,-33);ctx.lineTo(0,-45);ctx.stroke();
    ctx.fillStyle='#ff8cea';ctx.beginPath();ctx.arc(0,-47,4,0,Math.PI*2);ctx.fill();
    const glow=ctx.createRadialGradient(0,43,1,0,43,20);glow.addColorStop(0,'#62eaffaa');glow.addColorStop(1,'#62eaff00');ctx.fillStyle=glow;ctx.fillRect(-22,34,44,33);
    ctx.restore();
  }
  function drawSprite(image,rect,x,feet,height,anchor=.5){
    if(!image?.complete||!image.naturalWidth||!rect)return;
    const width=height*rect[2]/rect[3];ctx.drawImage(image,rect[0],rect[1],rect[2],rect[3],x-width*anchor,feet-height,width,height);
  }
  function player(){
    const mobile=document.body.classList.contains('mobile-course'),worldX=(px-1)*3.66;
    const foot=projectWorld(worldX,0,2.4),ground=foot?foot.y:1106;
    const jumpArc=jump>0?Math.sin((.85-jump)/.85*Math.PI):0;
    // A world-space body and jump follow the chase camera, instead of retaining
    // a fixed screen size while the rest of the scene moves into the distance.
    const worldLift=(propulsion>0?5.4:jumpArc*3.6)+(board>0?.25+Math.sin(frame*.65)*.06:0);
    const raised=mobile?projectWorld(worldX,worldLift,2.4):null;
    const x=raised?raised.x:foot?foot.x:CX+(px-1)*215;
    const actorHeight=mobile?raised.y-projectWorld(worldX,worldLift+2.3,2.4).y:180;
    const groundScale=mobile?(ground-projectWorld(worldX,2.3,2.4).y)/180:1;
    let h=actorHeight,im=board>0?img.idle:img.run[Math.floor(frame/2)%img.run.length];
    if(jump>0||propulsion>0)im=img.jump;
    else if(slide>0){im=img.slide;h=mobile?raised.y-projectWorld(worldX,worldLift+1.65,2.4).y:104;}
    else if(state==='over')im=img.idle;
    const lift=propulsion>0?230:jump>0?Math.sin((.85-jump)/.85*Math.PI)*155:0;
    const hover=board>0?12+Math.sin(frame*.65)*3:0;
    const feet=(mobile?raised.y:ground-lift-hover)+(state==='falling'?(1-fallTime/.5)*360:0);
    ctx.fillStyle=mobile?'rgba(5,8,20,.58)':'rgba(5,8,20,.42)';ctx.beginPath();ctx.ellipse(foot?.x||x,ground+(mobile?0:5),(board>0?105:mobile?52:70)*groundScale,(mobile?6:15)*groundScale,0,0,Math.PI*2);ctx.fill();
    if(board>0){ctx.save();ctx.translate(x,feet+10);ctx.scale(.78*groundScale,.78*groundScale);hoverboard(0,0);ctx.restore();}
    const character=NRCharacters.find(ch=>ch.id===NRProfile.character),sheet=character?img[character.sheetKey]:img.novaSheet,rig=NRSPRITES[NRProfile.character];
    if(rig&&sheet?.complete&&sheet.naturalWidth){
      const pose=(jump>0||propulsion>0)?3:slide>0?4:board>0?5:state==='over'?0:1+Math.floor(frame/2)%2;
      const rect=rig.frames[pose];
      const height=pose===4?h:character&&pose!==3?actorHeight:actorHeight*Math.min(1.04,rect[3]/rig.frames[0][3]);
      drawSprite(sheet,rect,x,feet,height,rig.anchors?(rig.anchors[pose]-rect[0])/rect[2]:.5);
    }else{const {w}=imageSize(im,h),scale=Math.min(1,2*Math.min(x-12,W-12-x)/w);draw(im,x-w*scale/2,feet-h*scale,w*scale,h*scale);}
    if(activeBonus?.type==='surge')draw('shield',x-30*groundScale,feet-h-50*groundScale,60*groundScale,60*groundScale);
    if(magnet>0)companion(x,feet);
  }

  function hud() {
    const visible=['playing','falling'].includes(state)&&overlay.classList.contains('hidden');
    for(const id of ['run-hud','direction-controls'])document.getElementById(id).classList.toggle('hidden',!visible);
    document.getElementById('hud-distance').textContent=Math.floor(dist)+' m';
    document.getElementById('hud-best').textContent=best+' m';
    document.getElementById('hud-fragments').textContent='◈ '+orbs;
    document.getElementById('hud-score').textContent=Math.floor(score);
    const status=document.getElementById('record-status');status.textContent=newRecord?'NOUVEAU RECORD !':'Record : encore '+Math.max(0,Math.floor(oldBest-dist)+1)+' m';status.classList.toggle('record-flash',recordFlash>0);
    document.getElementById('record-progress').value=Math.min(1,dist/Math.max(1,oldBest));
    if(wordToastTime>0){ctx.fillStyle='#121832e8';if(document.body.classList.contains('mobile-course')){ctx.fillRect(30,210,W-60,58);text(wordToast,CX,247,Math.min(wordToast.length>45?20:25,(W-70)/Math.max(1,wordToast.length)*1.5),'center','#ffe3a3');}else{ctx.fillRect(80,275,740,58);text(wordToast,450,312,wordToast.length>45?20:25,'center','#ffe3a3');}}
  }

  let viewMobile=null,viewDirty=true;
  function configureView(){
    const mobile=state!=='menu'&&matchMedia('(max-width:600px), (max-height:500px) and (pointer:coarse)').matches;
    if(viewMobile===mobile&&!viewDirty)return;
    viewMobile=mobile;viewDirty=false;
    document.body.classList.toggle('mobile-course',mobile);
    const bounds=document.querySelector('#app').getBoundingClientRect();
    W=mobile?Math.round(H*bounds.width/Math.max(1,bounds.height)):900;CX=W/2;
    const factor=Math.min(1,Math.sqrt(1260000/(W*H))),width=Math.round(W*factor),height=Math.round(H*factor);
    if(c.width!==width||c.height!==height){c.width=width;c.height=height;}
    ctx.setTransform(width/W,0,0,height/H,0,0);
    window.NR3D?.resize(W,H,mobile);
  }
  function render() {
    configureView();
    if(document.body.classList.contains('mobile-course'))window.NR3D?.resize(W,H,true,jump>0&&propulsion<=0?Math.sin((.85-jump)/.85*Math.PI)*1.8:0);
    background();
    road();
    scenery();
    entities();
    if(state==='menu')window.NRHomeArt?.paint(c,img,NRProfile.character);
    player();
    hud();
  }

  function loop(now) {
    if (!['playing','falling'].includes(state)) return;
    window.CJGameIntegration?.tick(now, 'runner');
    const dt = Math.min(0.045, (now - last) / 1000 || 0.016);
    last = now;
    update(dt);
    render();
    if (['playing','falling'].includes(state)) requestAnimationFrame(loop);
  }

  window.NRGame={preview(){if(state!=='playing')render();},home(){if(state==='playing')return;state='menu';showOverlay('LA CITÉ T’ATTEND','JOUER');msg.textContent='Trois voies. Une cité. Repousse tes limites.';pauseBtn.classList.add('hidden');document.querySelector('#bonus-controls').classList.add('hidden');render();},activateBoost};
  document.querySelectorAll('[data-bonus]').forEach(b=>{
    let origin=null,moved=false,pointerHandled=false;
    b.addEventListener('pointerdown',e=>{origin={id:e.pointerId,x:e.clientX,y:e.clientY};moved=false;pointerHandled=false;if(e.pointerType==='touch'&&document.body.classList.contains('mobile-course'))try{b.setPointerCapture(e.pointerId);}catch{}});
    const track=e=>{if(origin&&Math.hypot(e.clientX-origin.x,e.clientY-origin.y)>18)moved=true;};
    b.addEventListener('pointermove',track);
    b.addEventListener('pointerup',e=>{track(e);if(origin?.id===e.pointerId&&!moved&&e.button<=0&&e.pointerType==='touch'&&document.body.classList.contains('mobile-course')){pointerHandled=true;activateBonus(b.dataset.bonus);}origin=null;});
    b.addEventListener('pointercancel',()=>{origin=null;moved=true;});
    b.addEventListener('click',e=>{if(e.detail!==0&&(moved||pointerHandled)){e.preventDefault();pointerHandled=false;return;}activateBonus(b.dataset.bonus);});
  });
  document.querySelectorAll('[data-direction]').forEach(b=>b.addEventListener('pointerdown',e=>{e.preventDefault();control(b.dataset.direction);}));
  window.addEventListener('resize',()=>{viewDirty=true;if(state!=='playing'&&state!=='falling')render();});
  for(const event of ['blur','pagehide'])window.addEventListener(event,()=>{if(state==='playing')togglePause();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='playing')togglePause();});
  objects=[{lane:0,z:-18,type:'crate',hit:false},{lane:2,z:-34,type:'laser',hit:false},{lane:1,z:-57,type:'container',hit:false},...Array.from({length:6},(_,i)=>({lane:1,z:-12-i*4,type:'crystal',hit:false}))];
  objects.push({lane:2,z:-15,type:'letter',hit:false,...NRProfile.nextLetter()});
  render();
})();
