/* v1.6.9 keeps the normative capture grammar and
   makes the Advanced action grid position-aware without blocking rare legal actions.
   Persisted result values remain point / error / neutral; no data migration is required. */
(function(){
  var M=window.VOLLEY_MATCH,H=window.__vlc;
  if(!M||!H)return;
  var panel=document.getElementById('capturePanel'),playerStep=panel.querySelector('[data-step="player"]'),actionStep=panel.querySelector('[data-step="action"]'),resultStep=panel.querySelector('[data-step="result"]');
  var g=playerStep.querySelector('.touch-grid.players'),head=panel.querySelector('.capture-head'),chip=document.getElementById('pickChip'),back=document.getElementById('captureBack');
  var actor=null,action=null,pendingResult=null,guardUntil=0,guardTimer=null,LOCK_MS=450;
  window.VLC_TAP_LOCK_MS=LOCK_MS;window.VLC_TAPS_BLOCKED=window.VLC_TAPS_BLOCKED||0;
  function esc(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  function eventCount(){try{var x=JSON.parse(localStorage.getItem('volleyCapture.events.v1')||'[]');return Array.isArray(x)?x.length:0}catch(e){return 0}}
  function isGuarded(){return Date.now()<guardUntil}
  function armGuard(){guardUntil=Date.now()+LOCK_MS;panel.classList.add('result-guard');clearTimeout(guardTimer);guardTimer=setTimeout(function(){panel.classList.remove('result-guard');refresh()},LOCK_MS)}
  function normalizedPosition(p){p=String(p||'').toLowerCase();return p==='opposite'?'opp':p==='middle'?'mb':p==='outside'?'oh':p}
  function playerParts(n){var r=M.team&&M.team.roster||[];for(var i=0;i<r.length;i++)if(String(r[i].number)===String(n))return {number:String(n),name:r[i].name||'',position:normalizedPosition(r[i].position)};return {number:String(n),name:'',position:''}}
  var ACTIONS=[
    {id:'attack',label:'ATTACK',family:'offence',side:'left'},
    {id:'block',label:'BLOCK',family:'offence',side:'left'},
    {id:'set',label:'SET',family:'control',side:'left'},
    {id:'freeball',label:'RELANCE',family:'control',side:'left'},
    {id:'service',label:'SERVE',family:'control',side:'right'},
    {id:'reception',label:'RECEPTION',family:'defence',side:'right'},
    {id:'defense',label:'DEFENCE',family:'defence',side:'right'}
  ];
  var MATRIX={
    setter:{attack:1,block:1,defense:1,reception:0,service:1,set:1,freeball:1},
    oh:{attack:1,block:1,defense:1,reception:1,service:1,set:0,freeball:1},
    opp:{attack:1,block:1,defense:1,reception:0,service:1,set:0,freeball:1},
    mb:{attack:1,block:1,defense:1,reception:0,service:1,set:0,freeball:1},
    libero:{attack:0,block:0,defense:1,reception:1,service:0,set:1,freeball:1}
  };
  function actionState(pos,id){if(pos==='libero'&&(id==='attack'||id==='block'||id==='service'))return 'blocked';return MATRIX[pos]&&MATRIX[pos][id]?'expected':'rare'}
  function actionButton(a){return '<button type="button" class="quick-action" data-quick-action="'+a.id+'" data-adv-row="'+a.id+'" data-family="'+a.family+'" aria-label="'+a.label+'">'+a.label+'</button>'}
  function actionById(id){for(var i=0;i<ACTIONS.length;i++)if(ACTIONS[i].id===id)return ACTIONS[i]}
  actionStep.innerHTML='<div class="quick-entry"><div class="quick-pad">'
    +'<div class="quick-top">'+actionButton(actionById('set'))+actionButton(actionById('defense'))+'</div>'
    +'<div class="quick-side-stack quick-left">'+actionButton(actionById('attack'))+actionButton(actionById('block'))+'</div>'
    +'<div class="quick-team-slot quick-team-home" aria-label="HOME result-first position"><button type="button" id="teamChoiceHome" class="quick-side home" data-quick-side="T" data-vlc-actor="T" aria-label="HOME · '+esc(M.team.name||'Home')+'" aria-hidden="true" tabindex="-1" hidden>HOME</button></div>'
    +'<div class="quick-result-stack"><button type="button" class="quick-result point" data-quick-result="point" data-vlc-result="point" aria-label="Positif" aria-controls="teamChoiceHome teamChoiceAway" aria-expanded="false"><span aria-hidden="true">□</span><small>POSITIF</small></button><button type="button" class="quick-result error" data-quick-result="error" data-vlc-result="error" aria-label="Erreur" aria-controls="teamChoiceHome teamChoiceAway" aria-expanded="false"><span aria-hidden="true">×</span><small>ERREUR</small></button><button type="button" class="quick-result neutral" data-quick-result="neutral" data-vlc-result="neutral" aria-label="Neutre" aria-controls="teamChoiceHome teamChoiceAway" aria-expanded="false"><span aria-hidden="true">○</span><small>NEUTRE</small></button></div>'
    +'<div class="quick-team-slot quick-team-away" aria-label="AWAY result-first position"><button type="button" id="teamChoiceAway" class="quick-side away" data-quick-side="A" data-vlc-actor="A" aria-label="AWAY · '+esc(M.opponent.name||'Away')+'" aria-hidden="true" tabindex="-1" hidden>AWAY</button></div>'
    +'<div class="quick-side-stack quick-right">'+actionButton(actionById('service'))+actionButton(actionById('reception'))+'</div>'
    +'<div class="quick-bottom">'+actionButton(actionById('freeball'))+'</div>'
    +'</div></div>';
  var sideButtons=actionStep.querySelectorAll('[data-quick-side]');
  g.classList.add('quick-player-tray');
  var title=playerStep.querySelector('.step-title');if(title){title.textContent='JOUEURS SUR LE TERRAIN';title.hidden=true}
  resultStep.classList.remove('active');playerStep.classList.add('active');actionStep.classList.add('active');
  if(chip)chip.hidden=true;if(back)back.hidden=true;
  var sub=document.getElementById('subToggle');if(sub){sub.textContent='⟳ Changer de joueur';sub.setAttribute('aria-label','Changer de joueur')}
  function refresh(){
    var awaiting=actor===null&&pendingResult!==null;
    sideButtons.forEach(function(b){b.hidden=!awaiting;b.disabled=!awaiting||isGuarded()||panel.classList.contains('locked')||panel.classList.contains('sub-mode');b.setAttribute('aria-hidden',awaiting?'false':'true');b.setAttribute('tabindex',awaiting?'0':'-1')});
    g.querySelectorAll('.court-grid [data-player]').forEach(function(b){b.classList.toggle('quick-selected',actor!==null&&String(actor)===b.getAttribute('data-player'))});
    var numeric=actor!==null&&actor!=='T'&&actor!=='A',pos=numeric?playerParts(actor).position:'';
    actionStep.querySelectorAll('[data-quick-action]').forEach(function(b){var id=b.getAttribute('data-quick-action'),state=numeric?actionState(pos,id):'rare';b.classList.remove('is-expected','is-rare','is-blocked','selected');b.classList.add('is-'+state);b.setAttribute('data-adv-state',state);b.setAttribute('aria-disabled',state==='blocked'?'true':'false');b.disabled=!numeric||state==='blocked';b.classList.toggle('selected',numeric&&action===id)});
    actionStep.querySelectorAll('[data-quick-result]').forEach(function(b){var selected=pendingResult===b.getAttribute('data-quick-result');b.disabled=isGuarded()||panel.classList.contains('locked')||panel.classList.contains('sub-mode');b.classList.toggle('pending',selected);b.setAttribute('aria-pressed',selected?'true':'false');b.setAttribute('aria-expanded',selected&&awaiting?'true':'false')});
  }
  function clearSelection(){actor=null;action=null;pendingResult=null;refresh()}
  function commit(result){
    if(actor===null||panel.classList.contains('locked')||panel.classList.contains('sub-mode')||isGuarded()){if(isGuarded())window.VLC_TAPS_BLOCKED++;return false}
    var a=action||(actor==='A'?'adverse':'generic'),before=eventCount();H.commit(actor,a,result);var accepted=eventCount()>before;
    actor=null;action=null;pendingResult=null;playerStep.classList.add('active');actionStep.classList.add('active');resultStep.classList.remove('active');if(chip)chip.hidden=true;if(back)back.hidden=true;
    if(accepted)armGuard();refresh();return accepted;
  }
  document.addEventListener('click',function(e){
    var target=e.target.closest&&e.target.closest('#capturePanel *');if(!target)return;
    var sideButton=e.target.closest('[data-quick-side]');if(sideButton&&panel.contains(sideButton)){e.stopImmediatePropagation();e.preventDefault();if(isGuarded()){window.VLC_TAPS_BLOCKED++;return}if(!pendingResult)return;var directResult=pendingResult;actor=sideButton.getAttribute('data-quick-side');action=null;pendingResult=null;commit(directResult);return}
    var sideSlot=e.target.closest('.quick-team-slot');if(sideSlot&&panel.contains(sideSlot)){if(isGuarded())window.VLC_TAPS_BLOCKED++;return}
    var result=e.target.closest('[data-quick-result]');if(result&&panel.contains(result)){e.stopImmediatePropagation();e.preventDefault();if(isGuarded()){window.VLC_TAPS_BLOCKED++;return}var chosen=result.getAttribute('data-quick-result');if(actor===null){pendingResult=pendingResult===chosen?null:chosen;refresh()}else commit(chosen);return}
    var actionButtonNode=e.target.closest('[data-quick-action]');if(actionButtonNode&&panel.contains(actionButtonNode)){e.stopImmediatePropagation();e.preventDefault();if(actionButtonNode.disabled||actor===null||actor==='T'||actor==='A')return;action=action===actionButtonNode.getAttribute('data-quick-action')?null:actionButtonNode.getAttribute('data-quick-action');refresh();return}
    var playerButton=e.target.closest('.court-grid [data-player]');if(playerButton&&g.contains(playerButton)){
      if(panel.classList.contains('sub-mode'))return;e.stopImmediatePropagation();e.preventDefault();if(playerButton.classList.contains('nofocus'))return;
      actor=playerButton.getAttribute('data-player');action=null;pendingResult=null;refresh();return;
    }
    if(e.target.closest('#captureBack')&&panel.contains(e.target.closest('#captureBack'))){e.stopImmediatePropagation();e.preventDefault();clearSelection()}
  },true);
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&pendingResult!==null){e.preventDefault();clearSelection()}});
  var oldUpdate=window.updateCourt;if(oldUpdate){window.updateCourt=function(evs){oldUpdate(evs);refresh()}}
  window.VLCQuickCapture={select:function(a){actor=String(a);action=null;pendingResult=null;refresh()},commit:commit,getState:function(){return {actor:actor,action:action,pendingResult:pendingResult,guarded:isGuarded()}}};
  refresh();
})();
