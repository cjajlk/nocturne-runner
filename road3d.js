/* Nocturne Runner v0.4 — lightweight native WebGL 3D road. No internet dependency. */
(function(){'use strict';
const W=900,H=1400,canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
const gl=canvas.getContext('webgl',{alpha:true,antialias:true,preserveDrawingBuffer:true,premultipliedAlpha:false});
if(!gl){window.NR3D=null;return;}
const vert=`attribute vec3 p;attribute vec4 c;uniform mat4 vp;varying vec4 v;void main(){gl_Position=vp*vec4(p,1.);v=c;}`;
const frag=`precision mediump float;varying vec4 v;void main(){gl_FragColor=v;}`;
function shader(type,s){const q=gl.createShader(type);gl.shaderSource(q,s);gl.compileShader(q);if(!gl.getShaderParameter(q,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(q));return q;}
const prog=gl.createProgram();gl.attachShader(prog,shader(gl.VERTEX_SHADER,vert));gl.attachShader(prog,shader(gl.FRAGMENT_SHADER,frag));gl.linkProgram(prog);if(!gl.getProgramParameter(prog,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(prog));
gl.useProgram(prog);const locP=gl.getAttribLocation(prog,'p'),locC=gl.getAttribLocation(prog,'c'),locVP=gl.getUniformLocation(prog,'vp');const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.enableVertexAttribArray(locP);gl.enableVertexAttribArray(locC);gl.vertexAttribPointer(locP,3,gl.FLOAT,false,28,0);gl.vertexAttribPointer(locC,4,gl.FLOAT,false,28,12);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);
const camera=[0,5.9,14],target=[0,-3.2,-34],fovy=Math.PI/3.35,aspect=W/H;
function sub(a,b){return[a[0]-b[0],a[1]-b[1],a[2]-b[2]];}function cross(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];}function norm(a){const n=Math.hypot(...a);return a.map(t=>t/n);}
const front=norm(sub(target,camera)),right=norm(cross(front,[0,1,0])),up=cross(right,front),near=.2,far=400;
const f=1/Math.tan(fovy/2),nf=1/(near-far);
const persp=[f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*nf,-1,0,0,2*far*near*nf,0];
// column-major view from camera axes
const view=[right[0],up[0],-front[0],0,right[1],up[1],-front[1],0,right[2],up[2],-front[2],0,-dot(right,camera),-dot(up,camera),dot(front,camera),1];
const vp=new Float32Array(16);for(let col=0;col<4;col++)for(let row=0;row<4;row++){let s=0;for(let k=0;k<4;k++)s+=persp[k*4+row]*view[col*4+k];vp[col*4+row]=s;}
gl.uniformMatrix4fv(locVP,false,vp);
let a=[];
function tri(v1,v2,v3,color){const n=cross(sub(v2,v1),sub(v3,v1)),length=Math.hypot(...n)||1;const shade=.72+.28*Math.abs(n[1]/length)+.12*Math.abs(n[2]/length);for(const p of [v1,v2,v3]){const fog=Math.max(.12,Math.min(1,(p[2]+240)/180));a.push(...p,color[0]*shade*fog+.055*(1-fog),color[1]*shade*fog+.035*(1-fog),color[2]*shade*fog+.12*(1-fog),color[3]);}}
function quad(p0,p1,p2,p3,col){tri(p0,p1,p2,col);tri(p0,p2,p3,col);}
function box(x0,y0,z0,x1,y1,z1,col){quad([x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1],col);quad([x0,y0,z1],[x1,y0,z1],[x1,y0,z0],[x0,y0,z0],col);quad([x0,y0,z1],[x0,y1,z1],[x1,y1,z1],[x1,y0,z1],col);quad([x1,y0,z0],[x1,y1,z0],[x0,y1,z0],[x0,y0,z0],col);quad([x0,y0,z0],[x0,y1,z0],[x0,y1,z1],[x0,y0,z1],col);quad([x1,y0,z1],[x1,y1,z1],[x1,y1,z0],[x1,y0,z0],col);}
const cRoad=[.055,.069,.13,1],cJoint=[.19,.12,.32,1],cTrim=[.42,.13,.68,1],cCyan=[.03,.74,.95,1],cRail=[.075,.09,.16,1],cLine=[.55,.47,.83,1];
function segment(z0,z1,boost){box(-5.5,-.27,z0,5.5,0,z1,cRoad);box(-5.68,-.45,z0,-5.5,.30,z1,cRail);box(5.5,-.45,z0,5.68,.30,z1,cRail);box(-5.55,.04,z0,-5.43,.075,z1,cCyan);box(5.43,.04,z0,5.55,.075,z1,cCyan);box(-5.72,.32,z0,-5.49,.42,z1,cTrim);box(5.49,.32,z0,5.72,.42,z1,cTrim);box(-5.5,.018,z0,-5.35,.033,z0+.11,cJoint);box(5.35,.018,z0,5.5,.033,z0+.11,cJoint);
// Steel decking: thin panel joints, alternating strip plating and recessed ribs.
for(let z=z0+.4;z<z1;z+=3.4){
  box(-5.3,.021,z,5.3,.026,z+.085,cJoint);
  for(let x of [-5.06,-2.95,-.85,1.25,3.35])
    box(x,.022,z+.2,x+.045,.028,Math.min(z+3.0,z1),[.14,.16,.26,1]);
  for(let x of [-4.55,4.55])
    box(x-.09,.035,z+.2,x+.09,.046,Math.min(z+2.6,z1),[.08,.31,.51,1]);
}
// Two narrow steel side shoulders and emissive beacons.
box(-5.35,.035,z0,-5.08,.053,z1,[.12,.15,.26,1]);
box(5.08,.035,z0,5.35,.053,z1,[.12,.15,.26,1]);
for(let x of [-1.833,1.833])for(let z=z0+.9;z<z1;z+=2.9)box(x-.065,.02,z,x+.065,.034,Math.min(z+1.6,z1),cLine);
if(boost){for(let dz=2;dz<z1-z0-1;dz+=3.6){const z=z0+dz;for(let x of [-3.66,0,3.66]){quad([x-1,.05,z+.65],[x,.05,z-.18],[x+1,.05,z+.65],[x,.05,z+.25],cCyan);}}}
}
function projection(x,y,z){const rel=sub([x,y,z],camera),depth=dot(rel,front);if(depth<=.1)return null;const scale=f*H/2/depth;return{x:W/2+dot(rel,right)*scale,y:H/2-dot(rel,up)*scale,scale:scale/145,depth};}
// Original modular city assets built as geometry: the same perspective and
// scroll as the road, no external textures or runtime dependencies.
function city(scroll){
 const pace=scroll*25, block=22, phase=pace%block, passed=Math.floor(pace/block);
 const palettes=[[.13,.10,.24,1],[.09,.16,.23,1],[.20,.10,.25,1],[.12,.12,.27,1]];
 const neon=[[.12,.8,.95,1],[.73,.22,.95,1],[.95,.30,.65,1],[.95,.65,.28,1]];
 // Continuous raised sidewalks fill the void beside the elevated track.
 for(const s of [-1,1]){
  const x0=s<0?-12:5.85,x1=s<0?-5.85:12;
  box(x0,-.65,-245,x1,-.12,12,[.10,.12,.20,1]);
  box(x0,-.12,-245,x1,-.06,12,[.19,.18,.28,1]);
 }
 for(let i=0;i<12;i++){
  const z=10-i*block+phase;
  const id=i-passed;
  for(const s of [-1,1]){
   const v=((id*7+(s>0?2:0))%4+4)%4, col=palettes[v], light=neon[v];
   const height=8+v*2.1, inner=s*8.1, outer=s*(13.5+v*.6);
   const xa=Math.min(inner,outer), xb=Math.max(inner,outer);
   box(xa,-.1,z-20,xb,height,z-1,col);
   // Inward facing wall, corner pilasters, luminous cornice and roof crown.
   box(inner-.12,0,z-20,inner+.12,height,z-1,[.22,.20,.36,1]);
   box(xa,height,z-20,xb,height+.24,z-1,light);
   for(const zz of [z-19.8,z-1.4])box(inner-.18,0,zz,inner+.18,height+.4,zz+.26,[.30,.23,.43,1]);
   // Upper windows with deliberately irregular warm / cold occupancy.
   for(let yy=3.8;yy<height-1;yy+=(window.NRProfile?.options.quality==='low'?4.2:2.1))for(let zz=z-18;zz<z-2;zz+=3){
    const lit=(Math.round(yy*10)+Math.round((zz-z)*10)+v)%3!==0;
    box(inner-.16,yy,zz,inner+.16,yy+1.05,zz+1.35,lit?[light[0]*.65,light[1]*.65,light[2]*.75,1]:[.06,.07,.14,1]);
   }
   // Recessed shops, striped awnings and an illuminated hanging sign.
   for(let zz=z-18;zz<z-3;zz+=6){
    box(inner-.19,.35,zz,inner+.19,2.7,zz+3.9,[.04,.21,.28,1]);
    box(inner-.23,.35,zz,inner+.23,.47,zz+3.9,light);
    box(inner-.23,2.65,zz,inner+.23,2.85,zz+3.9,light);
    box(inner-s*1.15,2.8,zz,inner,3.08,zz+4.1,col);
    for(let stripe=0;stripe<4;stripe++)box(inner-s*1.15,3.08,zz+stripe,inner,3.13,zz+stripe+.35,light);
   }
   box(inner-s*.65,4.3,z-5,inner+s*.05,6.5,z-4.6,[.06,.07,.16,1]);
   box(inner-s*.7,4.5,z-5.05,inner-s*.64,6.25,z-4.55,light);
   // Foreground lamps and sidewalk service boxes establish speed cues.
   const lx=s*6.8;
   box(lx-.075,0,z-11,lx+.075,4.8,z-10.85,[.27,.25,.40,1]);
   box(lx-.38,4.6,z-11.2,lx+.38,4.82,z-10.65,[.32,.9,1,1]);
   box(s*7.1-.38,0,z-17,s*7.1+.38,.85,z-16,[.20,.17,.32,1]);
   box(s*7.1-.4,.7,z-17.03,s*7.1+.4,.8,z-16.97,light);
  }
  // High maintenance bridges frame the skyline without blocking the lanes.
  if(((id%5)+5)%5===2){
   box(-8.2,7.6,z-9,8.2,7.95,z-7,[.15,.13,.28,1]);
   box(-8.2,7.95,z-7.2,8.2,8.12,z-7,[.56,.23,.86,1]);
   for(let x=-7;x<=7;x+=2)box(x,7.95,z-7.2,x+.09,8.8,z-7,[.23,.29,.40,1]);
   box(-8.2,8.8,z-7.2,8.2,8.9,z-7,[.14,.65,.8,1]);
  }
 }
}

function obstacles(list){for(const o of list||[]){if(o.hit||o.z>12)continue;const x=(o.lane-1)*3.66,z=o.z;
 const dark=[.08,.10,.17,1],metal=[.24,.23,.33,1],pink=[.94,.16,.76,1],cyan=[.15,.87,.97,1];
 if(o.type==='crate'||o.type==='container'){
 const w=o.type==='container'?1.4:1.05,h=o.type==='container'?4.6:1.65;
 box(x-w,0,z-.9,x+w,h,z+.9,dark);box(x-w,h,z-.9,x+w,h+.12,z+.9,metal);
 for(const dx of [-w,w-.12])box(x+dx,0,z+.91,x+dx+.12,h,z+1.05,metal);
 for(const yy of [.12,h-.25])box(x-w,yy,z+.92,x+w,yy+.13,z+1.08,pink);
 quad([x-.55,h*.72,z+1.09],[x+.55,h*.72,z+1.09],[x,h*.30,z+1.09],[x,h*.30,z+1.09],pink);
 for(const dx of [-w+.12,w-.3])box(x+dx,.12,z+1.08,x+dx+.18,.30,z+1.13,cyan);
 if(o.type==='container')for(let y=.7;y<h-.5;y+=.55)box(x-w+.25,y,z+1.04,x+w-.25,y+.1,z+1.12,metal);
 }else if(o.type==='barrier'){
 for(const dx of [-1.2,1.05])box(x+dx,0,z-.3,x+dx+.15,1.15,z+.3,metal);
 box(x-1.3,.65,z-.26,x+1.3,1.25,z+.26,dark);
 for(let dx=-1.1;dx<1.1;dx+=.5)quad([x+dx,.72,z+.28],[x+dx+.2,.72,z+.28],[x+dx+.5,1.18,z+.28],[x+dx+.3,1.18,z+.28],cyan);
 }else if(o.type==='laser'){
 for(const dx of [-1.35,1.18]){box(x+dx,0,z-.28,x+dx+.17,3.4,z+.28,metal);box(x+dx,0,z+.29,x+dx+.17,3.4,z+.35,pink);}
 box(x-1.35,2.05,z-.22,x+1.35,3.45,z+.22,dark);
 for(const yy of [2.12,2.65,3.2])box(x-1.2,yy,z+.24,x+1.2,yy+.07,z+.30,pink);
 }
}}

function render(scroll,speed,list){gl.viewport(0,0,W,H);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);a=[];
const slide=(scroll*25)%16;
city(scroll);
for(let i=0;i<15;i++){const z1=12-i*16+slide;const z0=z1-16;segment(z0,z1,i%9===5);if(i%2===0){for(let side of [-1,1]){let x=side*7.2;box(x-.43,-6,z0-4,x+.43,-.45,z0-3.1,[.085,.075,.19,1]);box(x-.49,-5.8,z0-4,x+.49,-5.6,z0-3.1,cTrim);box(side*5.6-.13,-.8,z0-4,side*7.2+.13,-.5,z0-3.1,[.08,.12,.21,1]);}}}
// Thin real 3D rails/bumpers near the track
for(let i=0;i<12;i++){const z=10-i*17+(scroll*25)%17;for(let side of [-1,1]){box(side*5.65-.22,.37,z,side*5.65+.22,1.2,z+.4,cRail);box(side*5.6-.13,.96,z,side*5.6+.13,1.08,z+17,cCyan);}}
obstacles(list);
const data=new Float32Array(a);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.DYNAMIC_DRAW);gl.drawArrays(gl.TRIANGLES,0,data.length/7);return canvas;}
window.NR3D={render,project:projection,canvas,available:true};
})();
