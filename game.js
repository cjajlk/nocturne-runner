(() => {
  'use strict';

  const c = document.querySelector('#game');
  const ctx = c.getContext('2d');
  const overlay = document.querySelector('#overlay');
  const msg = document.querySelector('#msg');
  const btn = document.querySelector('#start');
  const pauseBtn = document.querySelector('#pause');

  const W = 900;
  const H = 1400;
  const CX = W / 2;

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
  let best = 0;
  let collectedFragments=[],wordToast='',wordToastTime=0;
  let magnet=0, surcharge=0, propulsion=0, chargeReady=true, wave=0, safeLane=1;
  let runStats={jumps:0, dodges:0};
  const duration=k=>8+NRProfile.levels[k]*2;
  const hazards=['crate','barrier','laser','container'];

  try { best = Number(localStorage.getItem('nocturneRunnerBest') || 0); } catch {}

  const img = {};
  const manifest = {
    novaSheet:'@assets/nova-sheet.png',catSheet:'@assets/cat-sheet.png',
    run: ['perso_dos/asset_04.png', 'perso_dos/asset_05.png', 'perso_dos/asset_04.png', 'perso_dos/asset_06.png'],
    idle: 'perso_dos/asset_01.png',
    jump: 'perso_dos/asset_07.png',
    slide: 'perso_dos/asset_08.png',
    board: 'bonus/asset_07.png',
    orb: 'bonus/asset_02.png',
    crystal: 'bonus/asset_01.png',
    shield: 'bonus/asset_04.png',
    boost: 'bonus/asset_05.png',
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

  function reset() {
    window.CJGameIntegration?.suspend();
    lane = px = 1;
    dist = score = orbs = scroll = frame = 0;
    objects = [];
    collectedFragments=[]; wordToast='';wordToastTime=0; wave=0; safeLane=1; magnet=surcharge=propulsion=0; chargeReady=true; runStats={jumps:0,dodges:0};
    for(let z=-26;z>-150;z-=24) spawnObj(z);
    speed = 0.34;
    spawn = 26;
    board = jump = slide = stun = 0;
    state = 'playing';
    overlay.classList.add('hidden');
    document.querySelector('#boost-control').classList.remove('hidden');
    pauseBtn.classList.remove('hidden');
    last = performance.now();
    requestAnimationFrame(loop);
  }

  function finish() {
    window.CJGameIntegration?.suspend();
    if(state==='over') return;
    state='over'; best=Math.max(best,Math.floor(dist));
    try{localStorage.setItem('nocturneRunnerBest',best)}catch{}
    NRProfile.bankRun(orbs,Math.floor(dist),runStats);
    showOverlay('COURSE TERMINÉE', 'REJOUER');
    msg.innerHTML=`<div class="results"><span>Distance<strong>${Math.floor(dist)} m</strong></span><span>Score<strong>${Math.floor(score)}</strong></span><span>Cristaux gagnés<strong>+${orbs} ◈</strong></span><span>Portefeuille<strong>${NRProfile.wallet} ◈</strong></span></div>`;
    pauseBtn.classList.add('hidden');document.querySelector('#boost-control').classList.add('hidden');
  }
  function showOverlay(title,label){
    document.querySelector('#screen-title').textContent=title;
    document.querySelector('#home-screen').hidden=false;
    document.querySelector('#detail-screen').hidden=true;
    btn.textContent=label; overlay.classList.remove('hidden');refreshMenu();
  }
  function activateBoost(){if(state!=='playing'||!chargeReady)return;chargeReady=false;propulsion=4+NRProfile.levels.propulsion;NRProfile.sound(600);}
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
    if (m[e.key]) {
      e.preventDefault();
      control(m[e.key]);
    }
    if (e.key === 'Escape') togglePause();
    if(e.key.toLowerCase()==='b') activateBoost();
  });

  let sx = 0, sy = 0;
  c.addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; });
  c.addEventListener('pointerup', e => {
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) < 23 && Math.abs(dy) < 23) return;
    control(Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down'));
  });

  btn.addEventListener('click', () => {
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

  // One free lane per row; adjacent safe lanes and spaced rows avoid traps.
  function spawnObj(z=-150){
    safeLane=clamp(safeLane+Math.floor(Math.random()*3)-1,0,2);
    const count=dist>250&&wave%3===0?2:1;
    const blocked=[0,1,2].filter(l=>l!==safeLane);
    if(Math.random()<.5)blocked.reverse();
    for(const l of blocked.slice(0,count))objects.push({lane:l,z,type:hazards[wave%4],hit:false});
    for(let j=0;j<5;j++)objects.push({lane:safeLane,z:z+5-j*2.3,type:'crystal',hit:false});
    if(wave%3===1)objects.push({lane:safeLane,z:z-9,type:['board','magnet','surcharge'][Math.floor(wave/3)%3],hit:false});
    if(wave%4===0){const w=NRProfile.currentWord();const available=[...w.letters].map((letter,slot)=>({letter,slot,wordId:NRProfile.word.completed})).filter(o=>!NRProfile.word.found[o.slot]&&!objects.some(p=>p.type==='letter'&&!p.hit&&p.wordId===o.wordId&&p.slot===o.slot));if(available.length)objects.push({lane:safeLane,z:z-13,type:'letter',hit:false,...available[0]});}
    wave++;
  }
  function update(dt){
    wordToastTime=Math.max(0,wordToastTime-dt);
    collectedFragments=collectedFragments.filter(f=>(f.time-=dt)>0);
    px+=(lane-px)*Math.min(1,dt*15);
    const base=Math.min(.73,.34+dist/7000);
    speed=base*(propulsion>0?1.22+NRProfile.levels.propulsion*.035:1);
    const advance=dt*speed*25;
    dist+=advance*2;score+=advance*10*(surcharge>0?2:1);
    scroll+=dt*speed;frame+=dt*10;
    board=Math.max(0,board-dt);magnet=Math.max(0,magnet-dt);surcharge=Math.max(0,surcharge-dt);propulsion=Math.max(0,propulsion-dt);
    jump=Math.max(0,jump-dt);slide=Math.max(0,slide-dt);stun=Math.max(0,stun-dt);
    spawn-=advance;
    if(spawn<=0){spawnObj();spawn=dist>250?22:26;}
    for(const o of objects){
      const previous=o.z;o.z+=advance;
      const close=Math.abs(px-o.lane)<.40;
      const collect=o.type==='crystal'&&(close||magnet>0);
      const crossing=previous<2.4&&o.z>=2.4;
      if(!o.hit&&((crossing&&(close||collect))||(magnet>0&&o.type==='crystal'&&o.z>-7&&o.z<2.4))){
        o.hit=true;
        if(o.type==='crystal'){if(magnet>0){const q=projectWorld((o.lane-1)*3.66,1.05,o.z);if(q)collectedFragments.push({x:q.x,y:q.y,time:.45});}orbs++;score+=10*(surcharge>0?2:1);NRProfile.sound(900);}
        else if(o.type==='letter'){const result=NRProfile.collectLetter(o);if(result){wordToast=result;wordToastTime=4;score+=50;NRProfile.sound(1100);}}
        else if(o.type==='board'){board=duration('board');NRProfile.sound(500);}
        else if(o.type==='magnet'){magnet=duration('magnet');NRProfile.sound(700);}
        else if(o.type==='surcharge'){surcharge=duration('surcharge');NRProfile.sound(800);}
        else if(hazards.includes(o.type)){
          const airborne=jump>0&&Math.sin((.85-jump)/.85*Math.PI)>.48;
          const avoided=(o.type==='crate'||o.type==='barrier')&&airborne||o.type==='laser'&&slide>.08;
          if(avoided){runStats.dodges++;score+=25;}
          else if(board>0){board=0;stun=1.2;NRProfile.sound(160);}
          else if(stun<=0){finish();return;}
        }
      }else if(crossing&&!o.hit&&hazards.includes(o.type)){o.hit=true;runStats.dodges++;}
    }
    objects=objects.filter(o=>o.z<12);
    document.querySelector('#boost-control').disabled=!chargeReady;
    document.querySelector('#boost-control').textContent=propulsion>0?'PROPULSION '+Math.ceil(propulsion)+'s':chargeReady?'⚡ BOOST · B':'BOOST UTILISÉ';
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

    // Far skyline kept very simple.
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
  }

  function road() {
    if (window.NR3D) {
      ctx.drawImage(window.NR3D.render(scroll, speed, objects), 0, 0);
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
      if(o.hit||o.z>10)continue;
      if(o.type==='letter'&&(o.wordId!==NRProfile.word.completed||NRProfile.word.found[o.slot]))continue;
      if(window.NR3D&&hazards.includes(o.type))continue;
      const pos=projectWorld((o.lane-1)*3.66,(o.type==='crystal'||o.type==='letter')?1.05:0,o.z);if(!pos)continue;
      const size=95*Math.max(.12,Math.min(2.2,pos.scale));
      if(o.type==='crystal'){
        ctx.save();ctx.translate(pos.x,pos.y);ctx.shadowColor='#e84cff';ctx.shadowBlur=NRProfile.options.quality==='low'?0:18;
        ctx.beginPath();ctx.moveTo(0,-size*.55);ctx.lineTo(size*.28,0);ctx.lineTo(0,size*.4);ctx.lineTo(-size*.28,0);ctx.closePath();ctx.fillStyle='#c42af1';ctx.fill();ctx.strokeStyle='#ffe0ff';ctx.lineWidth=Math.max(1,size*.025);ctx.stroke();ctx.beginPath();ctx.moveTo(0,-size*.55);ctx.lineTo(0,size*.4);ctx.lineTo(size*.28,0);ctx.stroke();ctx.restore();
       }else if(o.type==='letter'){
        ctx.save();ctx.translate(pos.x,pos.y);ctx.strokeStyle='#ffe09b';ctx.fillStyle='#352746';ctx.shadowColor='#f8c954';ctx.shadowBlur=18;ctx.lineWidth=Math.max(1,size*.025);ctx.beginPath();ctx.roundRect(-size*.36,-size*.53,size*.72,size*.85,size*.12);ctx.fill();ctx.stroke();text(o.letter,0,size*.10,size*.6,'center','#ffe4a0');ctx.restore();
      }else if(o.type==='board'){ctx.save();ctx.translate(pos.x,pos.y-size*.3);ctx.scale(size/160,size/160);hoverboard(0,0);ctx.restore();
      }else if(!hazards.includes(o.type)){
        ctx.fillStyle='#11172d';ctx.strokeStyle=o.type==='board'?'#bc56ff':'#53efff';ctx.lineWidth=3;ctx.fillRect(pos.x-size*.45,pos.y-size,size*.9,size*.9);ctx.strokeRect(pos.x-size*.45,pos.y-size,size*.9,size*.9);
        text(o.type==='board'?'◆':o.type==='magnet'?'∩':'×2',pos.x,pos.y-size*.35,size*.43,'center');
      }else draw(o.type==='laser'?'barrier':'post',pos.x-size/2,pos.y-size,size,size);
    }
  }

  function hoverboard(x,y){
    ctx.save();ctx.translate(x,y);ctx.shadowColor='#43e9ff';ctx.shadowBlur=18;
    // Foreshortened deck with a visible thickness: both feet rest on its top.
    ctx.beginPath();ctx.moveTo(-112,-8);ctx.lineTo(-70,-25);ctx.lineTo(80,-25);ctx.lineTo(116,-5);ctx.lineTo(90,21);ctx.lineTo(-84,21);ctx.closePath();ctx.fillStyle='#121b35';ctx.fill();ctx.strokeStyle='#bb55ff';ctx.lineWidth=4;ctx.stroke();
    ctx.beginPath();ctx.moveTo(-112,-8);ctx.lineTo(-84,8);ctx.lineTo(90,8);ctx.lineTo(116,-5);ctx.lineTo(90,21);ctx.lineTo(-84,21);ctx.closePath();ctx.fillStyle='#34225a';ctx.fill();ctx.strokeStyle='#56efff';ctx.lineWidth=3;ctx.stroke();
    ctx.shadowBlur=0;for(const dx of [-73,73]){ctx.fillStyle='#61f3ff';ctx.fillRect(dx-14,11,28,5);}
    ctx.strokeStyle='#e066ff';ctx.lineWidth=2;for(const dx of [-45,0,45]){ctx.beginPath();ctx.moveTo(dx-12,-16);ctx.lineTo(dx+8,-9);ctx.lineTo(dx-12,-3);ctx.stroke();}
    ctx.restore();
  }
  function companion(x,y){
    const cx=x+135,cy=y-155+Math.sin(frame*.8)*8;
    ctx.save();
    // Collected fragments travel to the companion before fading.
    for(const f of collectedFragments){const t=1-f.time/.45,e=1-Math.pow(1-t,2),fx=f.x+(cx-f.x)*e,fy=f.y+(cy-f.y)*e;
      ctx.globalAlpha=1-t*.5;ctx.strokeStyle='#dd5aff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(fx-8,fy);ctx.lineTo(fx,fy-15);ctx.lineTo(fx+8,fy);ctx.lineTo(fx,fy+12);ctx.closePath();ctx.stroke();
    }
    ctx.globalAlpha=1;
    if(NRProfile.pet==='cat'&&img.catSheet.complete&&img.catSheet.naturalWidth){const index=collectedFragments.length?1:Math.floor(frame/3)%4;drawSprite(img.catSheet,NRSPRITES.cat.frames[index],cx,cy+44,95*NRSPRITES.cat.frames[index][3]/NRSPRITES.cat.frames[0][3]);ctx.restore();return;}
    ctx.translate(cx,cy);ctx.shadowColor='#6debff';ctx.shadowBlur=15;
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
  function drawSprite(image,rect,x,feet,height){
    if(!image?.complete||!image.naturalWidth||!rect)return;
    const width=height*rect[2]/rect[3];ctx.drawImage(image,rect[0],rect[1],rect[2],rect[3],x-width/2,feet-height,width,height);
  }
  function player(){
    const foot=projectWorld((px-1)*3.66,0,2.4),x=foot?foot.x:CX+(px-1)*215,ground=foot?foot.y:1106;
    let h=365,im=board>0?img.idle:img.run[Math.floor(frame/2)%img.run.length];
    if(jump>0)im=img.jump;
    else if(slide>0){im=img.slide;h=210;}
    else if(state==='over')im=img.idle;
    const lift=jump>0?Math.sin((.85-jump)/.85*Math.PI)*155:0;
    const hover=board>0?12+Math.sin(frame*.65)*3:0;
    const feet=ground-lift-hover;
    ctx.fillStyle='rgba(5,8,20,.42)';ctx.beginPath();ctx.ellipse(x,ground+5,board>0?105:70,15,0,0,Math.PI*2);ctx.fill();
    if(board>0)hoverboard(x,feet+14);
    if(NRProfile.character==='nova'&&img.novaSheet.complete&&img.novaSheet.naturalWidth){
      const pose=jump>0?3:slide>0?4:board>0||state==='over'?0:1+Math.floor(frame/2)%2;
      const rect=NRSPRITES.nova.frames[pose];
      drawSprite(img.novaSheet,rect,x,feet,pose===4?210:365*rect[3]/NRSPRITES.nova.frames[0][3]);
    }else{const {w}=imageSize(im,h);draw(im,x-w/2,feet-h,w,h);}
    if(magnet>0)companion(x,feet);
  }

  function hud() {
    ctx.fillStyle = '#0c1035ba';
    ctx.fillRect(0, 0, W, 125);
    text('NOCTURNE RUNNER', 25, 53, 33);
    text(`${Math.floor(dist)} m`, W - 28, 53, 35, 'right', '#6cefff');
    text(`◈ ${orbs}       SCORE ${Math.floor(score)}`, 29, 99, 26);
    text(`RECORD ${best} m`, W - 28, 99, 23, 'right', '#cba3ff');
    if (board > 0) {
      ctx.fillStyle = '#1c1f45';
      ctx.fillRect(220, 160, 460, 18);
      ctx.fillStyle = '#4adeff';
      ctx.fillRect(220, 160, 460 * (board / duration('board')), 18);
    }
    let y=220;for(const [name,t] of [['PLANCHE',board],['AIMANT',magnet],['SCORE ×2',surcharge],['PROPULSION',propulsion]])if(t>0){text(name+' '+Math.ceil(t)+'s',35,y,25,'left','#6cf2ff');y+=35;}
    const letters=NRProfile.currentWord().letters,found=NRProfile.word.found;
    text('MOT DE LA CITÉ',450,1300,17,'center','#e6ca8c');
    const total=letters.length*40;for(let i=0;i<letters.length;i++){const lx=450-total/2+i*40;ctx.fillStyle=found[i]?'#684d38':'#151930';ctx.fillRect(lx,1310,33,35);text(letters[i],lx+16,1336,23,'center',found[i]?'#ffe1a0':'#9090b0');}
    if(wordToastTime>0){ctx.fillStyle='#121832e8';ctx.fillRect(80,345,740,58);text(wordToast,450,382,wordToast.length>45?20:25,'center','#ffe3a3');}
    text('←  →    ↑  ↓', 450, 1360, 27, 'center', '#a0b2e2');
  }

  function render() {
    background();
    road();
    scenery();
    entities();
    player();
    hud();
  }

  function loop(now) {
    if (state !== 'playing') return;
    window.CJGameIntegration?.tick(now, 'runner');
    const dt = Math.min(0.045, (now - last) / 1000 || 0.016);
    last = now;
    update(dt);
    render();
    if (state === 'playing') requestAnimationFrame(loop);
  }

  window.NRGame={preview(){if(state!=='playing')render();},home(){if(state==='playing')return;state='menu';showOverlay('LA CITÉ T’ATTEND','JOUER');msg.textContent='Trois voies. Une cité. Repousse tes limites.';pauseBtn.classList.add('hidden');document.querySelector('#boost-control').classList.add('hidden');render();},activateBoost};
  document.querySelector('#boost-control').addEventListener('click',activateBoost);
  objects=[{lane:0,z:-18,type:'crate',hit:false},{lane:2,z:-34,type:'laser',hit:false},{lane:1,z:-57,type:'container',hit:false},...Array.from({length:6},(_,i)=>({lane:1,z:-12-i*4,type:'crystal',hit:false}))];
  objects.push({lane:2,z:-15,type:'letter',hit:false,...NRProfile.nextLetter()});
  render();
})();
