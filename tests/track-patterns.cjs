const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm');
const sandbox={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../track-v1.js'),'utf8'),sandbox);const track=sandbox.window.NRTrack;
let seed=192837;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const stats=[];for(const distance of [0,250,500,800,1500,3000,6000,15000,50000]){let safe=1,total=0,dangers=0,forced=0,rest=0,gold=0,base=0;for(let wave=0;wave<2500;wave++){
 const row=track.row({distance,wave,safe,z:2.4,random});const hazards=row.items.filter(o=>track.hazards.includes(o.type));
 assert(Math.abs(row.safe-safe)<=1,'unreachable two-lane transition');
 const route=hazards.filter(o=>o.lane===row.safe&&!o.type.startsWith('drone'));
 if(row.action){forced++;assert.equal(route.length,1);assert(row.action==='up'?['crate','barrier','gap'].includes(route[0].type):route[0].type==='laser');assert.equal(hazards.filter(o=>o.type==='container').length,2);assert.equal(row.items.filter(o=>o.type==='cue'&&o.action===row.action&&o.lane===row.safe).length,1);}
 else assert.equal(route.length,0,'route obstructed without action');
 for(const o of hazards){if(o.type.startsWith('drone')){assert(o.from!==row.safe&&o.to!==row.safe);assert.equal(Math.abs(o.from-o.to),1);}if(o.type==='gap')assert(o.length<=3);}
 const worstNextPace=Math.min(.86,.36+(distance+100)/5200)*1.18*25;
 assert(row.spacing/worstNextPace>=1.1-1e-9,'not enough time to land and act again');
 for(const o of row.items.filter(o=>o.type==='crystal')){if(o.value===5){gold++;assert(o.requiresJump||o.requiresSlide);const obstacle=hazards.find(h=>h.lane===o.lane);assert(obstacle&&['crate','barrier','laser','gap'].includes(obstacle.type));}else base+=o.value;}
 total+=row.spacing*2;dangers+=hazards.length;rest+=row.rest?1:0;safe=row.safe;
 }const row={distance,hazardsPerKm:dangers/total*1000,baseFragmentsPerKm:base/total*1000,forcedPercent:forced/25,restPercent:rest/25,riskyRewards:gold};stats.push(row);if(distance>=800){assert(row.forcedPercent>=20);if(distance>=6000)assert(row.forcedPercent>=45,'advanced tiers need more required actions');assert(row.restPercent<12);}if(distance<200)assert.equal(forced,0);
}
const out=process.env.NOCTURNE_UI_OUTPUT;if(out){fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'parcours-statistiques.json'),JSON.stringify({sampledRows:22500,stats},null,2));}console.log(JSON.stringify({sampledRows:22500,stats},null,2));
