/* Static poster composition: existing city and sprites, no simulation or timers. */
(()=>{'use strict';
const canvas=document.querySelector('#home-art'),ctx=canvas.getContext('2d');
window.NRHomeArt={paint(scene,images,character){
  ctx.clearRect(0,0,900,1400);
  ctx.save();ctx.translate(450,700);ctx.rotate(.018);ctx.scale(1.06,1.06);ctx.drawImage(scene,-450,-700);ctx.restore();
  const bloom=ctx.createRadialGradient(435,890,15,435,890,330);bloom.addColorStop(0,'#783cff45');bloom.addColorStop(1,'#783cff00');ctx.fillStyle=bloom;ctx.fillRect(70,550,730,730);
  ctx.save();ctx.translate(440,1020);ctx.rotate(-.085);
  ctx.strokeStyle='#4de5ff99';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-30,-45);ctx.lineTo(-160,205);ctx.moveTo(45,-20);ctx.lineTo(115,190);ctx.stroke();ctx.strokeStyle='#ec48ff77';ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(-60,0);ctx.lineTo(-115,215);ctx.stroke();
  ctx.fillStyle='#04071388';ctx.beginPath();ctx.ellipse(0,14,103,20,0,0,Math.PI*2);ctx.fill();
  const nova=character==='nova'&&images.novaSheet?.naturalWidth,image=nova?images.novaSheet:images.run[0];
  if(image?.complete&&image.naturalWidth){const rect=nova?NRSPRITES.nova.frames[1]:[0,0,image.naturalWidth,image.naturalHeight],height=445,width=height*rect[2]/rect[3];ctx.shadowColor='#6ef5ff';ctx.shadowBlur=13;ctx.drawImage(image,...rect,-width/2,-height,width,height);}
  ctx.restore();
}};
})();
