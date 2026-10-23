(()=>{'use strict';
  let pending=false;
  const active=()=>!!(document.fullscreenElement||document.webkitFullscreenElement);
  function refresh(message=''){
    const button=document.querySelector('[data-fullscreen]');
    if(button){button.disabled=pending;button.textContent=active()?'Quitter le plein écran':'Plein écran';button.setAttribute('aria-pressed',String(active()));}
    const status=document.querySelector('[data-fullscreen-status]');
    if(status)status.textContent=message;
    window.dispatchEvent(new Event('resize'));
  }
  async function toggle(){
    if(pending)return;
    pending=true;let message='';
    try{
      if(active()){
        const exit=document.exitFullscreen||document.webkitExitFullscreen;
        if(exit)await exit.call(document);
      }else{
        const root=document.documentElement,request=root.requestFullscreen||root.webkitRequestFullscreen;
        if(!request){message='Plein écran indisponible dans ce navigateur. Le jeu reste jouable en portrait.';return;}
        await request.call(root);
      }
    }catch{message='Plein écran refusé par le navigateur. Le jeu reste jouable en portrait.';}
    finally{pending=false;refresh(message);}
  }
  document.addEventListener('fullscreenchange',()=>refresh());
  document.addEventListener('webkitfullscreenchange',()=>refresh());
  window.NRFullscreen={active,toggle};
})();
