/* VolleyLive Match Hub v1.21.0 */
(function () {
  'use strict';
  var KE='volleyCapture.events.v1', KD='volleyCapture.chartData.v1', KM='volleyCapture.match.v1';
  var KH='volleyMatchHub.history.v1', STAGE='volleyCapture.stage';
  var MAX_FILE_BYTES=10*1024*1024, ACTIVE={live:1,paused:1,in_progress:1};
  var $=function(id){return document.getElementById(id)};
  var state={active:null,history:[],all:[],pendingImport:null,pendingFileName:'',rendering:false};

  function safeParse(value,fallback){try{var parsed=JSON.parse(value);return parsed==null?fallback:parsed}catch(e){return fallback}}
  function storageGet(key,fallback){return safeParse(localStorage.getItem(key)||'',fallback)}
  function storageSet(key,value){localStorage.setItem(key,JSON.stringify(value))}
  function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function text(value){return String(value==null?'':value).trim()}
  function lower(value){return text(value).toLowerCase().replace(/[\s-]+/g,'_')}
  function finite(value){if(value===undefined||value===null||value==='')return null;var n=Number(value);return isFinite(n)?n:null}
  function dateValue(value){var n=Date.parse(value||'');return isFinite(n)?n:0}
  function first(){for(var i=0;i<arguments.length;i++){var value=arguments[i];if(value!==undefined&&value!==null&&text(value)!=='')return value}return null}
  function emit(name,properties){try{window.dispatchEvent(new CustomEvent('matchhub:telemetry',{detail:{event:name,properties:properties||{}}}))}catch(e){}}
  function setStatus(message,tone){var el=$('matchHubStatus');if(!el)return;el.textContent=message||'';if(tone)el.dataset.tone=tone;else el.removeAttribute('data-tone')}
  function hasUnsafeKey(value){
    if(!value||typeof value!=='object')return false;
    var names=Object.getOwnPropertyNames(value);
    for(var i=0;i<names.length;i++){
      var key=names[i];
      if(key==='__proto__'||key==='prototype'||key==='constructor')return true;
      if(hasUnsafeKey(value[key]))return true;
    }
    return false;
  }
  function teamFromV2(raw,id,fallbackIndex){
    var teams=Array.isArray(raw.teams)?raw.teams:[];
    var found=null;
    for(var i=0;i<teams.length;i++)if(String(first(teams[i].teamId,teams[i].id,''))===String(id||'')){found=teams[i];break}
    found=found||teams[fallbackIndex]||{};
    return {id:first(found.teamId,found.id,null),name:first(found.name,found.displayName,null),shortName:first(found.shortName,found.abbreviation,null)};
  }
  function captureTeams(match){
    return {
      home:{id:first(match.team&&match.team.id,null),name:first(match.team&&match.team.name,null),shortName:first(match.team&&match.team.shortName,null)},
      away:{id:first(match.opponent&&match.opponent.id,null),name:first(match.opponent&&match.opponent.name,null),shortName:first(match.opponent&&match.opponent.shortName,null)}
    };
  }
  function pointScore(raw,match,currentSet){
    var home=null,away=null,events=Array.isArray(raw.events)?raw.events:[],rallies=Array.isArray(raw.rallies)?raw.rallies:[];
    var rows=events.concat(rallies),best=null,bestOrder=-1;
    rows.forEach(function(row,index){
      var setNo=finite(first(row.set,row.setNumber,row.setIndex));if(setNo!==null&&setNo!==Number(currentSet))return;
      var score=row.scoreAfter||row.score||null,a,b;
      if(score){a=finite(first(score.home,score.our,score.team1,score.a));b=finite(first(score.away,score.opponent,score.team2,score.b))}
      if(a==null||b==null){a=finite(first(row.scoreA,row.homeScore));b=finite(first(row.scoreB,row.awayScore))}
      var order=finite(first(row.sequenceNumber,row.actionOrder,row.rallyNumber,index));
      if(a!=null&&b!=null&&order>=bestOrder){best={home:a,away:b};bestOrder=order}
    });
    if(best)return best;
    var chart=Array.isArray(raw.chartData)?raw.chartData:storageGet(KD,[]),last=chart.length?chart[chart.length-1]:null;
    if(last)return {home:finite(first(last.a,last.home,0)),away:finite(first(last.b,last.away,0))};
    var sets=Array.isArray(raw.sets)?raw.sets:[],set=null;
    for(var i=0;i<sets.length;i++)if(Number(first(sets[i].setNumber,sets[i].number,i+1))===Number(currentSet)){set=sets[i];break}
    set=set||sets[sets.length-1];
    if(set){var fs=set.currentScore||set.score||set.finalScore||{};return {home:finite(first(fs.home,fs.our,fs.team1,set.homeScore,set.ourScore)),away:finite(first(fs.away,fs.opponent,fs.team2,set.awayScore,set.opponentScore))}}
    return {home:null,away:null};
  }
  function setScore(raw,match){
    var home=finite(first(match.homeSetsWon,match.ourSetsWon,raw.homeSetsWon));
    var away=finite(first(match.awaySetsWon,match.opponentSetsWon,raw.awaySetsWon));
    if(home!==null&&away!==null)return {home:home,away:away};
    if(window.VolleySets&&window.VolleySets.summary&&raw.format==='volley-live-capture'){
      try{var summary=window.VolleySets.summary(match,Array.isArray(raw.events)?raw.events:[]);return {home:finite(summary.wonA),away:finite(summary.wonB)}}catch(e){}
    }
    var sets=Array.isArray(raw.sets)?raw.sets:[],h=0,a=0,seen=false;
    sets.forEach(function(set){
      var score=set.finalScore||set.score||{},x=finite(first(score.home,score.our,score.team1,set.homeScore,set.ourScore)),y=finite(first(score.away,score.opponent,score.team2,set.awayScore,set.opponentScore));
      var winner=lower(first(set.winner,set.winnerSide,set.winningSide,''));
      if(winner==='home'||winner==='our'||winner==='team1'){h++;seen=true}else if(winner==='away'||winner==='opponent'||winner==='team2'){a++;seen=true}else if(x!==null&&y!==null&&x!==y&&lower(first(set.status,''))==='completed'){x>y?h++:a++;seen=true}
    });
    return {home:seen?h:null,away:seen?a:null};
  }
  function currentSetNumber(raw,match){
    var n=finite(first(match.currentSet,match.currentSetNumber,raw.currentSetNumber));if(n!==null)return n;
    var sets=Array.isArray(raw.sets)?raw.sets:[];if(!sets.length)return null;
    var active=sets.filter(function(set){return ACTIVE[lower(set.status)]});
    var selected=(active.length?active:sets)[(active.length?active:sets).length-1];
    return finite(first(selected.setNumber,selected.number,sets.indexOf(selected)+1));
  }
  function archiveCurrent(){
    var match=storageGet(KM,null);if(!match)return null;
    return {format:'volley-live-capture',version:1,savedAt:first(match.updatedAt,match.savedAt,null),match:match,events:storageGet(KE,[]),chartData:storageGet(KD,[])};
  }
  function summaryFrom(raw,sourceName){
    if(!raw||typeof raw!=='object')return null;
    var match=raw.match&&typeof raw.match==='object'?raw.match:raw;
    var isV2=Array.isArray(raw.teams),teams=isV2?{
      home:teamFromV2(raw,first(match.ourTeamId,match.homeTeamId),0),
      away:teamFromV2(raw,first(match.opponentTeamId,match.awayTeamId),1)
    }:captureTeams(match);
    var id=text(first(match.id,match.matchId,raw.id,raw.matchId,''));
    if(!id)return null;
    var status=lower(first(match.status,raw.status,'completed'));
    var setNo=currentSetNumber(raw,match),points=pointScore(raw,match,setNo),sets=setScore(raw,match);
    var updated=first(match.updatedAt,match.savedAt,raw.updatedAt,raw.savedAt,null);
    var matchDate=first(match.matchDate,match.date,match.startedAt,match.createdAt,raw.matchDate,raw.createdAt,null);
    return {id:id,status:status,homeTeam:teams.home,awayTeam:teams.away,currentSetNumber:setNo,currentHomePoints:points.home,currentAwayPoints:points.away,homeSetsWon:sets.home,awaySetsWon:sets.away,matchDate:matchDate,updatedAt:updated,schemaVersion:first(raw.schemaVersion,raw.version,null),raw:raw,sourceName:sourceName||'match.json'};
  }
  function isActive(summary){return !!(summary&&ACTIVE[lower(summary.status)])}
  function displayName(team,fallback){return text(first(team&&team.shortName,team&&team.name,fallback))||fallback}
  function longName(team,fallback){return text(first(team&&team.name,team&&team.shortName,fallback))||fallback}
  function formatDate(value){if(!value)return 'Date unavailable';var date=new Date(value);if(!isFinite(date.getTime()))return 'Date unavailable';try{return new Intl.DateTimeFormat(undefined,{day:'2-digit',month:'short',year:'numeric'}).format(date)}catch(e){return date.toLocaleDateString()}}
  function savedLabel(value){
    if(!value)return 'Save status unavailable';var when=new Date(value),now=new Date();if(!isFinite(when.getTime()))return 'Save status unavailable';
    var diff=Math.max(0,now.getTime()-when.getTime());if(diff<60000)return 'Saved just now';if(diff<3600000)return 'Saved '+Math.floor(diff/60000)+' min ago';
    if(when.toDateString()===now.toDateString())return 'Saved at '+when.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
    return 'Saved '+formatDate(value)+' '+when.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
  }
  function readHistory(){var rows=storageGet(KH,[]);return Array.isArray(rows)?rows.filter(function(row){return row&&row.raw&&row.id}):[]}
  function writeHistory(rows){storageSet(KH,rows.slice(0,100))}
  function upsertHistory(raw,sourceName,copyId){
    var value=raw;if(copyId){value=JSON.parse(JSON.stringify(raw));if(value.match)value.match.id=copyId;else value.id=copyId}
    var sum=summaryFrom(value,sourceName);if(!sum)throw new Error('Missing stable match ID or required team fields.');
    var rows=readHistory(),record={id:sum.id,raw:value,sourceName:sourceName||'match.json',importedAt:new Date().toISOString(),updatedAt:first(sum.updatedAt,new Date().toISOString())};
    rows=rows.filter(function(row){return row.id!==record.id});rows.unshift(record);writeHistory(rows);return summaryFrom(value,record.sourceName)
  }
  function syncCurrent(){
    var raw=archiveCurrent(),sum=summaryFrom(raw,'Current match');
    if(sum&&sum.status==='completed'){
      var rows=readHistory(),exists=rows.some(function(row){return row.id===sum.id});
      if(!exists){rows.unshift({id:sum.id,raw:raw,sourceName:'Completed local match',importedAt:new Date().toISOString(),updatedAt:first(sum.updatedAt,new Date().toISOString())});writeHistory(rows)}
    }
    return sum;
  }
  function load(){
    var active=syncCurrent(),history=readHistory().map(function(row){return summaryFrom(row.raw,row.sourceName)}).filter(Boolean);
    history.sort(function(a,b){var ac=a.status==='completed'?1:0,bc=b.status==='completed'?1:0;if(ac!==bc)return bc-ac;var ad=dateValue(a.matchDate),bd=dateValue(b.matchDate);if(ad!==bd)return bd-ad;return dateValue(b.updatedAt)-dateValue(a.updatedAt)});
    state.active=isActive(active)?active:null;state.history=history;state.all=[];
    if(active)state.all.push(active);
    history.forEach(function(item){if(!state.all.some(function(existing){return existing.id===item.id}))state.all.push(item)});
  }
  function currentScoreLabel(sum){var home=sum.currentHomePoints,away=sum.currentAwayPoints;return (home===null||away===null)?'— – —':home+' – '+away}
  function recentScore(sum){if(sum.status==='completed'&&sum.homeSetsWon!==null&&sum.awaySetsWon!==null)return sum.homeSetsWon+' – '+sum.awaySetsWon;return sum.status?sum.status.replace(/_/g,' ').toUpperCase():'STATUS NA'}
  function calendarIcon(){return '<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="4" y="7" width="24" height="21" rx="3"/><path d="M10 4v6M22 4v6M4 13h24M10 18h3M18 18h3M10 23h3M18 23h3"/></svg>'}
  function renderRecent(){
    var list=$('matchHubRecentList');if(!list)return;var rows=state.history.slice(0,2);
    if(!rows.length){list.innerHTML='<div class="mh-empty"><strong>No matches yet</strong><span>Start a new match or import an existing one.</span><div class="mh-empty-actions"><button type="button" data-mh-new>New match</button><button type="button" data-mh-import>Import match</button></div></div>';return}
    list.innerHTML=rows.map(function(sum){var home=longName(sum.homeTeam,'HOME'),away=longName(sum.awayTeam,'AWAY');return '<button type="button" class="mh-recent-row" data-match-id="'+esc(sum.id)+'" aria-label="Open '+esc(home)+' versus '+esc(away)+' played '+esc(formatDate(sum.matchDate))+', '+esc(recentScore(sum))+'"><span class="mh-calendar">'+calendarIcon()+'</span><span class="mh-recent-copy"><span class="mh-recent-teams">'+esc(home)+' <small>vs</small> '+esc(away)+'</span><span class="mh-recent-date">'+esc(formatDate(sum.matchDate))+'</span></span><span class="mh-result">'+esc(recentScore(sum))+'</span><span class="mh-recent-chevron" aria-hidden="true">›</span></button>'}).join('');
  }
  function render(){
    if(state.rendering)return;state.rendering=true;
    try{
      load();var button=$('homeContinue'),info=$('homeContinueInfo'),summary=$('matchHubActiveSummary');
      if(button){button.disabled=!state.active;button.setAttribute('aria-disabled',state.active?'false':'true')}
      if(!state.active){if(info)info.textContent='No match in progress';if(summary)summary.hidden=true;if(button)button.setAttribute('aria-label','No match in progress');}
      else{
        var home=displayName(state.active.homeTeam,'HOME'),away=displayName(state.active.awayTeam,'AWAY'),setNo=state.active.currentSetNumber;
        if(info)info.textContent='Resume your match in progress';if(summary){summary.hidden=false;$('matchHubTeams').textContent=home+' vs '+away;$('matchHubScore').textContent=currentScoreLabel(state.active);$('matchHubMeta').textContent=(setNo?'Set '+setNo:'Set unavailable')+' • '+savedLabel(state.active.updatedAt)}
        if(button)button.setAttribute('aria-label','Continue '+home+' versus '+away+', '+(setNo?'Set '+setNo+', ':'')+'score '+(state.active.currentHomePoints===null?'unavailable':state.active.currentHomePoints+' to '+state.active.currentAwayPoints));
      }
      renderRecent();var see=$('matchHubSeeAll');if(see)see.hidden=!state.history.length;
      var off=$('matchHubOffline');if(off)off.hidden=navigator.onLine;
      emit('match_hub_viewed',{source:'home',hasActiveMatch:!!state.active,recentMatchCount:state.history.length});
    }catch(error){setStatus('Matches could not be loaded.','error');var retry=$('matchHubRetry');if(retry)retry.hidden=false;var button=$('homeContinue');if(button){button.disabled=true;button.setAttribute('aria-disabled','true')}}
    state.rendering=false;
  }
  function openDialog(dialog){if(!dialog)return;if(typeof dialog.showModal==='function'){if(!dialog.open)dialog.showModal()}else dialog.setAttribute('open','')}
  function closeDialog(dialog){if(!dialog)return;if(typeof dialog.close==='function'&&dialog.open)dialog.close();else dialog.removeAttribute('open')}
  function openViewer(sum){
    if(!sum||!sum.raw)return;localStorage.setItem('volleySpectator.archive.v1',JSON.stringify(sum.raw));localStorage.setItem('volleySpectator.archiveName.v1',sum.sourceName||'match.json');sessionStorage.setItem('volleyAnalysis.replay.v1',JSON.stringify(sum.raw));sessionStorage.setItem('volleyAnalysis.replay.source.v1',sum.sourceName||'match.json');location.href='spectator.html#live-score';
  }
  function clearCurrent(){localStorage.removeItem(KM);localStorage.removeItem(KE);localStorage.removeItem(KD)}
  function beginSetup(){sessionStorage.setItem(STAGE,'setup');location.reload()}
  function newMatch(event){
    if(!state.active){emit('match_hub_new_match_selected',{source:'home',hasActiveMatch:false});return}
    event.preventDefault();event.stopImmediatePropagation();$('matchHubDecisionText').textContent='A match is already in progress: '+longName(state.active.homeTeam,'HOME')+' vs '+longName(state.active.awayTeam,'AWAY')+'. Continue it, save it before starting another, or cancel.';openDialog($('matchHubDecision'));emit('match_hub_new_match_selected',{source:'home',hasActiveMatch:true});
  }
  function selectorItems(scope){var items=scope==='history'?state.history:state.all,container=$('matchHubSelectorList');if(!container)return;container.innerHTML='';
    if(!items.length){container.innerHTML='<div class="mh-empty"><strong>No matches available</strong><span>Create a new match or import a VolleyLive JSON file.</span></div>';return}
    container.innerHTML=items.map(function(sum){return '<button type="button" class="mh-selector-item" data-select-id="'+esc(sum.id)+'"><span><b>'+esc(longName(sum.homeTeam,'HOME'))+' vs '+esc(longName(sum.awayTeam,'AWAY'))+'</b><br><small>'+esc(formatDate(sum.matchDate))+' · '+esc(sum.status.replace(/_/g,' '))+'</small></span><strong>'+esc(recentScore(sum))+'</strong></button>'}).join('')}
  function openSelector(scope){load();selectorItems(scope);$('matchHubSelectorTitle').textContent=scope==='history'?'Match history':'View match';openDialog($('matchHubSelector'));emit(scope==='history'?'match_hub_see_all_selected':'match_hub_view_match_selected',{source:'home',recentMatchCount:state.history.length})}
  function validateImport(raw){
    if(hasUnsafeKey(raw))throw new Error('Unsafe object keys are not allowed.');
    var check=window.VolleyStatsAdapter&&window.VolleyStatsAdapter.validate?window.VolleyStatsAdapter.validate(raw):null;
    if(!check||!check.valid)throw new Error(check&&check.errors&&check.errors.length?check.errors.join(' '):'Unsupported VolleyLive JSON structure.');
    var sum=summaryFrom(raw,'Imported match');if(!sum)throw new Error('Missing stable match ID or required team fields.');
    if(!text(first(sum.homeTeam.name,sum.homeTeam.shortName,''))||!text(first(sum.awayTeam.name,sum.awayTeam.shortName,'')))throw new Error('Required team fields are missing.');
    return sum;
  }
  function chooseFile(){var input=$('matchHubFile');if(!input)return;input.value='';input.click();emit('match_hub_import_selected',{source:'home'})}
  function importFailure(message,category){setStatus('Import failed: '+message,'error');emit('match_hub_import_failed',{source:'home',errorCategory:category||'validation'})}
  function importRaw(raw,fileName){
    var sum;try{sum=validateImport(raw)}catch(error){importFailure(error.message,'validation');return}
    var existing=state.all.some(function(item){return item.id===sum.id});
    if(existing){state.pendingImport=raw;state.pendingFileName=fileName;$('matchHubDuplicateText').textContent='A match with ID '+sum.id+' already exists. Open the existing match, import this file as a copy, or cancel.';$('matchHubOpenExisting').dataset.matchId=sum.id;openDialog($('matchHubDuplicate'));return}
    try{var imported=upsertHistory(raw,fileName);setStatus('Match imported successfully.','success');emit('match_hub_import_succeeded',{source:'home',matchStatus:imported.status,schemaVersion:imported.schemaVersion||'unknown'});render();openViewer(imported)}catch(error){importFailure(error.message,'persistence')}
  }
  function onFile(){var file=this.files&&this.files[0];if(!file)return;if(file.size>MAX_FILE_BYTES){importFailure('File exceeds the 10 MB limit.','size');return}if(!/\.json$/i.test(file.name)){importFailure('Select a .json file.','type');return}var reader=new FileReader();reader.onerror=function(){importFailure('The file could not be read.','read')};reader.onload=function(){var raw;try{raw=JSON.parse(reader.result)}catch(error){importFailure('Invalid JSON syntax.','parse');return}importRaw(raw,file.name)};reader.readAsText(file)}
  function bind(){
    var homeNew=$('homeNew'),homeOpen=$('homeOpen'),recent=$('matchHubRecentList');
    if(homeNew)homeNew.addEventListener('click',newMatch,true);
    if(homeOpen)homeOpen.addEventListener('click',function(event){event.preventDefault();event.stopImmediatePropagation();openSelector('all')},true);
    if($('homeContinue'))$('homeContinue').addEventListener('click',function(){if(!this.disabled)emit('match_hub_continue_selected',{source:'home',matchStatus:state.active&&state.active.status})},true);
    if($('matchHubImport'))$('matchHubImport').addEventListener('click',chooseFile);
    if($('matchHubFile'))$('matchHubFile').addEventListener('change',onFile);
    if($('matchHubSeeAll'))$('matchHubSeeAll').addEventListener('click',function(){openSelector('history')});
    if($('matchHubRetry'))$('matchHubRetry').addEventListener('click',function(){this.hidden=true;setStatus('');render()});
    if(recent)recent.addEventListener('click',function(event){var row=event.target.closest('[data-match-id]');if(row){var sum=state.all.find(function(item){return item.id===row.dataset.matchId});emit('match_hub_recent_match_selected',{source:'home',matchStatus:sum&&sum.status});openViewer(sum);return}if(event.target.closest('[data-mh-new]'))homeNew.click();if(event.target.closest('[data-mh-import]'))chooseFile()});
    document.querySelectorAll('[data-dialog-close]').forEach(function(button){button.addEventListener('click',function(){closeDialog(button.closest('dialog'))})});
    $('matchHubContinueCurrent').addEventListener('click',function(){closeDialog($('matchHubDecision'));$('homeContinue').click()});
    $('matchHubSaveStart').addEventListener('click',function(){try{if(window.saveMatchJson)window.saveMatchJson();var raw=archiveCurrent();if(raw)upsertHistory(raw,'Saved local match')}catch(e){}clearCurrent();beginSetup()});
    $('matchHubDiscardStart').addEventListener('click',function(){clearCurrent();beginSetup()});
    $('matchHubSelectorList').addEventListener('click',function(event){var row=event.target.closest('[data-select-id]');if(!row)return;var sum=state.all.find(function(item){return item.id===row.dataset.selectId});openViewer(sum)});
    $('matchHubSelectorImport').addEventListener('click',function(){closeDialog($('matchHubSelector'));chooseFile()});
    $('matchHubSelectorNew').addEventListener('click',function(){closeDialog($('matchHubSelector'));homeNew.click()});
    $('matchHubOpenExisting').addEventListener('click',function(){var id=this.dataset.matchId,sum=state.all.find(function(item){return item.id===id});closeDialog($('matchHubDuplicate'));openViewer(sum)});
    $('matchHubImportCopy').addEventListener('click',function(){if(!state.pendingImport)return;try{var copyId=(summaryFrom(state.pendingImport,'copy').id||'match')+'-copy-'+Date.now(),sum=upsertHistory(state.pendingImport,state.pendingFileName,copyId);closeDialog($('matchHubDuplicate'));state.pendingImport=null;setStatus('Match imported as a copy.','success');render();openViewer(sum)}catch(error){importFailure(error.message,'duplicate')}});
    window.addEventListener('online',render);window.addEventListener('offline',render);window.addEventListener('pageshow',render);window.addEventListener('focus',render);
    var home=$('homeScreen');if(home&&window.MutationObserver)new MutationObserver(function(records){records.forEach(function(record){if(record.attributeName==='hidden'&&!home.hidden)render()})}).observe(home,{attributes:true});
  }
  function init(){var hub=$('matchHub');if(!hub)return;hub.setAttribute('aria-busy','true');bind();render();hub.setAttribute('aria-busy','false');window.VolleyMatchHub={refresh:render,summaryFrom:summaryFrom,validateImport:validateImport,openViewer:openViewer,archiveCurrent:archiveCurrent}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
