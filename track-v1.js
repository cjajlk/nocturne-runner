/* Short authored sequences with an adjacent, bonus-free route through each row. */
(()=>{'use strict';
const hazards=['crate','barrier','laser','container','gap','droneLow','droneHigh'];
const thresholds=[200,600,1200,2500,5000,10000,20000];
const stage=d=>thresholds.reduce((tier,limit)=>tier+(d>=limit),0);
// Advanced authored patterns demand different successive actions while keeping
// one adjacent, reachable route through each row. No boost is required.
const advancedSequences=[
 ['weave','jump','choice','duck','weave','jump','drone','duck','weave','rest','jump','choice'],
 ['duck','weave','jump','choice','drone','duck','weave','jump','rest','weave','duck','jump'],
 ['jump','weave','duck','drone','choice','jump','weave','duck','jump','rest','weave','duck'],
 ['choice','duck','jump','weave','drone','jump','duck','weave','jump','rest','duck','weave']
];
const expertSequences=[
 ['jump','weave','duck','jump','drone','weave','duck','jump','weave','rest','duck','jump'],
 ['duck','jump','weave','drone','jump','duck','weave','jump','duck','rest','weave','jump'],
 ['weave','duck','jump','duck','weave','drone','jump','duck','weave','rest','jump','duck'],
 ['jump','duck','weave','jump','drone','duck','jump','weave','duck','rest','jump','weave']
];
const sequences=[
 ['weave','choice','jump','weave','duck','rest','weave','choice','jump','duck','weave','choice'],
 ['choice','weave','duck','jump','weave','choice','rest','weave','duck','weave','jump','choice'],
 ['weave','jump','choice','duck','rest','weave','drone','choice','weave','jump','duck','weave'],
 ['choice','weave','drone','jump','weave','duck','choice','rest','weave','duck','jump','choice']
];
function droneX(o){const phase=(o.travel||0)/24;const tri=1-Math.abs((phase%2)-1);if(o.z>-25&&o.frozenX===undefined)o.frozenX=(o.from+(o.to-o.from)*tri);return o.frozenX??(o.from+(o.to-o.from)*tri);}
function row({distance,wave,safe,z=-150,random=Math.random}){
 const encounter=distance+Math.max(0,(2.4-z)*2),tier=stage(encounter);
 const index=wave%12;
 const library=tier>=6?expertSequences:tier>=5?advancedSequences:sequences;
 const sequence=library[Math.floor(wave/12)%library.length];
 let pattern=sequence[index],next=safe,action=null;
 const moves=[-1,1].filter(step=>safe+step>=0&&safe+step<=2);
 const shift=()=>safe+moves[Math.floor(random()*moves.length)];
 if(tier===0){pattern=wave%7===5?'rest':wave%3===2?'weave':'choice';}
 if(pattern==='drone'&&encounter<1200)pattern='weave';
 if(pattern==='jump'&&encounter<450)pattern='choice';
 if(pattern==='duck'&&encounter<700)pattern='weave';
 const rest=pattern==='rest';
 if(pattern==='weave'||pattern==='jump'||pattern==='duck')next=shift();
 else if(!rest&&random()<.35)next=shift();
 if(pattern==='drone'&&next===1)next=safe===1?(random()<.5?0:2):safe;
 const items=[],other=[0,1,2].filter(lane=>lane!==next);
 const add=(type,lane)=>items.push({type,lane,z,...(type==='gap'?{length:3}:{})});
 if(pattern==='jump'||pattern==='duck'){
  action=pattern==='jump'?'up':'down';
  other.forEach(lane=>add('container',lane));
  const jumpTypes=encounter>=900?['barrier','crate','gap']:['barrier','crate'];
  add(action==='up'?jumpTypes[Math.floor(random()*jumpTypes.length)]:'laser',next);
  items.push({type:'cue',lane:next,z:z+5,action});
 }else if(pattern==='drone'){
  const type=encounter>=1600&&random()<.5?'droneHigh':'droneLow';
  items.push({type,lane:other[0],from:other[0],to:other[1],travel:0,z});
 }else if(!rest){
  const pool=['barrier','crate'];if(tier>=1)pool.push('container','laser');if(encounter>=900)pool.push('gap');
  const double=tier>=1&&(pattern==='weave'||random()<Math.min(.9,.55+tier*.07));
  if(random()<.5)other.reverse();
  for(const lane of other.slice(0,double?2:1))add(pool[Math.floor(random()*pool.length)],lane);
 }
 // Keep ordinary earnings close to the earlier economy. Extra gold asks for an action.
 if(rest){items.push({type:'crystal',value:1,lane:next,z:z+5},{type:'crystal',value:1,lane:next,z:z+1});}
 else if(action){items.push({type:'crystal',value:2,lane:next,z,height:action==='up'?4.2:.7,requiresJump:action==='up',requiresSlide:action==='down'});}
 else items.push({type:'crystal',value:2,lane:next,z:z+5});
 if(!action&&!rest&&wave%4===1){
  const risk=items.find(o=>['barrier','crate','laser','gap'].includes(o.type));
  if(risk)items.push({type:'crystal',value:5,lane:risk.lane,z,height:risk.type==='laser'?.7:4.2,requiresJump:risk.type!=='laser',requiresSlide:risk.type==='laser'});
 }
 if(wave%11===5)items.push({type:['magnet','board','surge','propulsion'][Math.floor(wave/11)%4],lane:next,z:z-7});
 // Maintain predictable, playable reaction windows at the UPDATED running speed.
 // Harder tiers come from action variety, not sub-second unavoidable spawns.
 const seconds=[2,1.65,1.45,1.3,1.2,1.17,1.13,1.13][tier];
 const interval=rest?seconds*(tier>=5?1.4:1.6):action?Math.max(1.32,seconds+.13):pattern==='drone'?Math.max(1.3,seconds):seconds;
 const maxPace=Math.min(.86,.36+(encounter+100)/5200)*1.18*25;
 return {safe:next,action,pattern,encounter,items,spacing:Math.max(13,maxPace*interval),rest,tier};
}
window.NRTrack={hazards,stage,droneX,row};
})();
