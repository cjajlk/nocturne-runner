/* Conservative row generator: an adjacent clear lane is reserved per row. */
(()=>{const hazards=['crate','barrier','laser','container','gap','droneLow','droneHigh'];
const stage=d=>d<600?0:d<1800?1:d<3000?2:d<6000?3:d<10000?4:d<20000?5:d<50000?6:7;
function droneX(o){const phase=(o.travel||0)/24;const tri=1-Math.abs((phase%2)-1);if(o.z>-25&&o.frozenX===undefined)o.frozenX=(o.from+(o.to-o.from)*tri);return o.frozenX??(o.from+(o.to-o.from)*tri);}
window.NRTrack={hazards,stage,droneX,row({distance,wave,safe,z,speed,random=Math.random}){const tier=stage(distance),rest=wave%10>=8;
 let next=Math.max(0,Math.min(2,safe+Math.floor(random()*3)-1));const pool=['crate','barrier'];if(tier>=1)pool.push('laser','container');if(tier>=2)pool.push('gap');if(tier>=3)pool.push('droneLow','droneHigh');const items=[];
 if(!rest){let type=pool[Math.floor(random()*pool.length)];if(type.startsWith('drone')){if(next===1)next=safe===0?0:safe===2?2:random()<.5?0:2;const lanes=[0,1,2].filter(l=>l!==next);items.push({type,lane:lanes[0],from:lanes[0],to:lanes[1],travel:0,z});}else{const lanes=[0,1,2].filter(l=>l!==next);if(random()<.5)lanes.reverse();const count=tier>=4&&random()<Math.min(.7,.3+(tier-4)*.12)?2:1;for(const lane of lanes.slice(0,count))items.push({type,lane,z,length:type==='gap'?3:0});}}
 const motif=wave%4;if(motif===0||rest)items.push({type:'crystal',value:rest?2:3,lane:next,z:z+6});else if(motif===1){items.push({type:'crystal',value:3,lane:next,z:z+5},{type:'crystal',value:3,lane:next,z:z+2});}else if(motif===2&&!rest){const risk=items.find(o=>!o.type.startsWith('drone'));if(risk)items.push({type:'crystal',value:5,lane:risk.lane,z:z+7});}
 if(wave%11===5)items.push({type:['magnet','board','surge','propulsion'][Math.floor(wave/11)%4],lane:next,z:z-7});
 return {safe:next,items,spacing:Math.max(rest?32:24,Math.min(.73,.34+(distance+400)/7000)*1.18*25*1.45),rest,tier};}};
})();
