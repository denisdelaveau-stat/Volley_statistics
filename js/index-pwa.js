/* PWA: offline cache, durable storage, install hint */
(function(){
  var standalone=(window.navigator.standalone===true)||(window.matchMedia&&matchMedia('(display-mode: standalone)').matches);
  var ios=/iPhone|iPad|iPod/.test(navigator.userAgent);
  var hint=document.getElementById('homeInstall');
  if(hint&&ios&&!standalone)hint.hidden=false;
  if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')){
    window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(e){console.warn('SW',e)})});
  }
  if(navigator.storage&&navigator.storage.persist){navigator.storage.persist().catch(function(){})}
})();
