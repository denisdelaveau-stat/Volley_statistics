/* Volley Live Coach UI v1.9.1 — unified volley-live v2.1 data source */
(function(){
  'use strict';
  var KM='volleyCapture.match.v1',KE='volleyCapture.events.v1';
  var screen=document.getElementById('coachScreen'),content=document.getElementById('coachContent');
  if(!screen||!content)return;
  var C={view:'overview',period:'set',phase:'all',rotation:null,playerScope:'court',role:'all',player:null,skill:'summary',detailHistory:false,data:null};
  var POS=['p4','p3','p2','p5','p6','p1'];
  var NEXT={p2:'p1',p1:'p6',p6:'p5',p5:'p4',p4:'p3',p3:'p2'};
  var ROLE={setter:'Passeur',oh:'Réceptionneuse-attaquante',mb:'Centrale',opp:'Pointue',libero:'Libéro'};
  var ROLE_SHORT={setter:'S',oh:'OH',mb:'MB',opp:'OPP',libero:'L'};
  function esc(v){return String(v==null?'':v).replace(/[&<>\"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]})}
  function read(k,fallback){try{var x=JSON.parse(localStorage.getItem(k)||'null');return x==null?fallback:x}catch(e){return fallback}}
  function clone(x){return JSON.parse(JSON.stringify(x))}
  function pct(n,d){return d?Math.round(n*100/d):null}
  function pctText(n,d,sign){var v=pct(n,d);return v==null?'—':(sign&&v>0?'+':'')+v+'%'}
  function num(v){return v==null?'—':String(v)}
  function playerInfo(match,n){var r=match&&match.team&&match.team.roster||[];for(var i=0;i<r.length;i++)if(String(r[i].number)===String(n))return r[i];return {number:n,name:'Joueur '+n,position:''}}
  function teamPlayers(match){return (match&&match.team&&match.team.roster||[]).filter(function(p){return p.present!==false})}
  function rotate(rot){var n={};Object.keys(NEXT).forEach(function(k){n[NEXT[k]]=rot[k]});return n}
  function setterNumber(match){return match&&match.startingLineup&&match.startingLineup.setter||((teamPlayers(match).filter(function(p){return p.position==='setter'})[0]||{}).number)}
  function setterZone(match,rot){var s=setterNumber(match),z='';POS.some(function(k){if(String(rot[k])===String(s)){z=k;return true}return false});return z||'p1'}
  function rotationTo(match,target){var r=clone(match.startingRotation||{}),guard=0;while(setterZone(match,r)!==target&&guard++<6)r=rotate(r);return r}
  function initialServing(match,setNo){var s=(match.firstRally&&match.firstRally.antibesState==='reception')?'B':'A';if(setNo%2===0)s=s==='A'?'B':'A';return s}

  function demoData(){
    var match={id:'demo_coach',name:'Match de démonstration',status:'in_progress',detailLevel:'advanced',currentSet:3,demoSetWins:{a:1,b:1},team:{name:'Nous',roster:[
      {number:12,name:'Emma',position:'oh',present:true},{number:8,name:'Léa',position:'mb',present:true},{number:7,name:'Chloé',position:'opp',present:true},{number:3,name:'Sarah',position:'libero',present:true},{number:9,name:'Jade',position:'oh',present:true},{number:4,name:'Alice',position:'setter',present:true},{number:2,name:'Nora',position:'mb',present:true}
    ]},opponent:{name:'Adversaire'},startingLineup:{oh1:12,oh2:9,mb1:8,mb2:2,setter:4,opposite:7,libero:3},startingRotation:{p1:4,p2:7,p3:8,p4:12,p5:3,p6:9},firstRally:{antibesState:'reception'},format:{setsToWin:3,setPoints:25,decidingSetPoints:15},subs:[]};
    var winners=['team1','team2','team1','team1','team2','team1','team2','team1','team1','team2','team2','team1','team1','team2','team1','team2','team1','team1','team2','team1','team1','team2','team1','team1','team2','team2','team1','team2','team1','team1','team2','team1','team2','team1','team1','team2','team1','team2','team1','team1'];
    var own=[12,8,7,3,9,4],actions=['attack','reception','service','block','defense','set'],events=[],a=0,b=0,id=1;
    winners.forEach(function(w,i){
      var p=own[i%own.length],secondary=own[(i+3)%own.length],act=actions[i%actions.length];
      if(i%3===0)events.push({id:id++,set:3,player:secondary,action:i%2?'defense':'reception',result:'neutral',winningTeam:null,scoreA:a,scoreB:b,timestamp:new Date(2026,10,20,8,0,i*20).toISOString()});
      if(i%4===0)events.push({id:id++,set:3,player:4,action:'set',result:'neutral',winningTeam:null,scoreA:a,scoreB:b,timestamp:new Date(2026,10,20,8,0,i*20+5).toISOString()});
      if(w==='team1')a++;else b++;
      var isOwn=w==='team1',result=isOwn?'point':(i%2?'error':'point'),player=isOwn?p:(result==='error'?p:'A'),action=isOwn?act:(result==='error'?act:'adverse');
      events.push({id:id++,set:3,player:player,action:action,result:result,winningTeam:w,pointOrigin:isOwn?'earned':(result==='error'?'opponent_error':'earned'),scoreA:a,scoreB:b,timestamp:new Date(2026,10,20,8,0,i*20+10).toISOString()});
    });
    return {match:match,events:events,demo:true};
  }

  function load(){
    try{
      if(window.VolleyStatsAdapter){
        var raw=window.VolleyStatsAdapter.fromLocalStorage(localStorage)||window.VolleyReferenceFixture;
        if(raw)return window.VolleyStatsAdapter.toCoachData(raw);
      }
    }catch(error){console.error('Coach data adapter:',error)}
    var m=read(KM,null),e=read(KE,[]);if(!m)return demoData();return {match:m,events:Array.isArray(e)?e:[],demo:false,explicitContext:false,sourceFormat:'volley-live-capture v1'}
  }
  function buildRallies(match,events){
    var sets={},ordered=[];
    events.forEach(function(e){var s=+e.set||1;(sets[s]||(sets[s]=[])).push(e)});
    Object.keys(sets).map(Number).sort(function(a,b){return a-b}).forEach(function(setNo){
      var serving=initialServing(match,setNo),rot=clone(match.startingRotation||{}),pending=[];
      sets[setNo].forEach(function(e){pending.push(e);if(!e.winningTeam)return;var z=setterZone(match,rot),r={set:setNo,actions:pending.slice(),winner:e.winningTeam,scoreA:+e.scoreA||0,scoreB:+e.scoreB||0,serving:serving,phase:serving==='A'?'serve':'receive',rotation:z,rotationLabel:z.toUpperCase()};ordered.push(r);pending=[];if(e.winningTeam==='team1'){if(serving==='B')rot=rotate(rot);serving='A'}else if(e.winningTeam==='team2')serving='B'});
    });
    return ordered;
  }
  function currentState(match,rallies,setNo){
    if(C.data&&C.data.explicitContext){var explicit=rallies.filter(function(r){return r.set===setNo}),last=explicit[explicit.length-1],rot=last&&last.lineup?clone(last.lineup):clone(match.startingRotation||{}),serving=last?(last.winner==='team1'?'A':'B'):initialServing(match,setNo);if(last&&last.phase==='receive'&&last.winner==='team1')rot=rotate(rot);return {serving:serving,rot:rot,rotation:setterZone(match,rot)}}
    var serving=initialServing(match,setNo),rot=clone(match.startingRotation||{});rallies.filter(function(r){return r.set===setNo}).forEach(function(r){if(r.winner==='team1'){if(serving==='B')rot=rotate(rot);serving='A'}else if(r.winner==='team2')serving='B'});return {serving:serving,rot:rot,rotation:setterZone(match,rot)}
  }
  function setSummary(match,rallies){if(match.demoSetWins)return {a:match.demoSetWins.a,b:match.demoSetWins.b};var wonA=0,wonB=0,current=+match.currentSet||1,max=C.data&&C.data.explicitContext?Math.max.apply(null,rallies.map(function(r){return r.set}).concat([current])):current-1;for(var s=1;s<=max;s++){var rr=rallies.filter(function(r){return r.set===s}),last=rr[rr.length-1];if(last){if(last.scoreA>last.scoreB)wonA++;else if(last.scoreB>last.scoreA)wonB++}}return {a:wonA,b:wonB}}
  function selectedRallies(){var all=C.data.rallies,m=C.data.match,cur=+m.currentSet||1;if(C.period==='match')return all;if(C.period==='last10')return all.slice(-10);return all.filter(function(r){return r.set===cur})}
  function selectedEvents(){var a=[];selectedRallies().forEach(function(r){a=a.concat(r.actions)});return a}
  function ownEvent(e){return e.player!=='A'&&e.player!=='T'}
  function metrics(rallies,events){
    var so=rallies.filter(function(r){return r.phase==='receive'}),bp=rallies.filter(function(r){return r.phase==='serve'}),soW=so.filter(function(r){return r.winner==='team1'}).length,bpW=bp.filter(function(r){return r.winner==='team1'}).length;
    var att=events.filter(function(e){return ownEvent(e)&&e.action==='attack'}),kills=att.filter(function(e){return e.result==='point'}).length,ae=att.filter(function(e){return e.result==='error'}).length;
    var rec=events.filter(function(e){return ownEvent(e)&&e.action==='reception'}),recP=rec.filter(function(e){return e.result!=='error'}).length;
    var srv=events.filter(function(e){return ownEvent(e)&&e.action==='service'}),aces=srv.filter(function(e){return e.result==='point'}).length,se=srv.filter(function(e){return e.result==='error'}).length;
    var blk=events.filter(function(e){return ownEvent(e)&&e.action==='block'}),bpnt=blk.filter(function(e){return e.result==='point'}).length,btouch=blk.filter(function(e){return e.result!=='error'}).length;
    return {so:{n:soW,d:so.length},bp:{n:bpW,d:bp.length},att:{kills:kills,errors:ae,d:att.length,n:kills-ae},rec:{n:recP,d:rec.length},serve:{aces:aces,errors:se,d:srv.length},block:{points:bpnt,touches:btouch,d:blk.length}}
  }
  function status(kind,v,d){if(!d||d<3)return 'neutral';if(kind==='so'||kind==='rec')return v>=60?'strong':v>=45?'watch':'critical';if(kind==='bp')return v>=40?'strong':v>=25?'watch':'critical';if(kind==='att')return v>=35?'strong':v>=15?'watch':'critical';return 'neutral'}
  function periodLabel(){return C.period==='match'?'Match':C.period==='last10'?'10 derniers':'Set '+(C.data.match.currentSet||1)}
  function scoreNow(){var rr=C.data.rallies.filter(function(r){return r.set===(+C.data.match.currentSet||1)}),last=rr[rr.length-1];return last?{a:last.scoreA,b:last.scoreB}:{a:0,b:0}}
  function periodButtons(){return '<div class="coach-period" aria-label="Période">'+[['set','SET '+(C.data.match.currentSet||1)],['match','MATCH'],['last10','10 DERNIERS']].map(function(x){return '<button type="button" data-period="'+x[0]+'" class="'+(C.period===x[0]?'active':'')+'">'+x[1]+'</button>'}).join('')+'</div>'}
  function footer(ref){var source=C.data.demo?'Données de démonstration.':C.data.explicitContext?'Référence officielle · volley-live v2.1':'Match courant · migration v1';return '<footer class="coach-footer"><span class="demo">'+source+'</span><span>'+ref+' · VOLLEY LIVE</span></footer>'}
  function kpi(title,value,sample,cls){return '<article class="coach-card coach-kpi '+cls+'"><span class="status" aria-hidden="true"></span><h3>'+title+'</h3><div class="value">'+value+'</div><div class="sample">'+sample+'</div></article>'}
  function roleClass(p){return p.position==='libero'?'libero':p.position==='setter'?'setter':''}
  function courtHTML(rot,title){var m=C.data.match;return '<section class="coach-card coach-court-card"><div class="coach-card-head"><h2>Organisation actuelle</h2><span class="coach-chip">'+esc(title)+'</span></div><div class="coach-court" role="img" aria-label="Organisation des joueurs sur le terrain"><div class="coach-net"></div><div class="coach-court-grid">'+POS.map(function(z){var p=playerInfo(m,rot[z]);return '<div class="coach-player-dot '+roleClass(p)+'"><span class="number">'+esc(p.number)+'</span><span class="name">'+esc(p.name||'Joueur')+'</span><small>Poste '+z.slice(1)+'</small></div>'}).join('')+'</div></div><p class="coach-court-legend">P : Passeuse &nbsp; · &nbsp; L : Libéro</p></section>'}
  function sharedHeading(title,sub,select){return '<div class="coach-heading-row"><div><h1 class="coach-title" tabindex="-1">'+title+'<span class="dot">.</span></h1>'+(sub?'<p class="coach-subtitle">'+sub+'</p>':'')+'</div>'+(select||'')+'</div>'}

  function renderOverview(){
    var m=C.data.match,r=selectedRallies(),e=selectedEvents(),mt=metrics(r,e),sc=scoreNow(),ss=setSummary(m,C.data.rallies),cur=currentState(m,C.data.rallies,+m.currentSet||1),rot=cur.rot;
    var sov=pct(mt.so.n,mt.so.d),bpv=pct(mt.bp.n,mt.bp.d),aev=mt.att.d?Math.round(mt.att.n*100/mt.att.d):null,recv=pct(mt.rec.n,mt.rec.d);
    var recent=C.data.rallies.slice(-10),homeW=recent.filter(function(x){return x.winner==='team1'}).length;
    var rotationStats=rotationMetrics(r),watch=rotationStats.slice().sort(function(a,b){return a.diff-b.diff})[0]||{label:'P—',won:0,total:0};
    var bestSkill=aev!=null&&aev>=Math.max(sov||-999,bpv||-999,recv||-999)?'Efficacité attaque':(recv!=null&&recv>=Math.max(sov||-999,bpv||-999)?'Réception positive':'Dynamique collective');
    var h=sharedHeading('Vue coach','Détecter la dynamique du match','<select class="coach-select" data-coach-period-select aria-label="Période"><option>'+periodLabel()+'</option></select>')+periodButtons();
    h+='<section class="coach-score"><div class="coach-team">'+esc(m.team.name||'Nous')+'<strong>'+sc.a+'</strong></div><div class="coach-dash">–</div><div class="coach-team away">'+esc(m.opponent.name||'Adversaire')+'<strong>'+sc.b+'</strong></div><div class="coach-match-meta">SET '+(m.currentSet||1)+' · SETS '+ss.a+'–'+ss.b+'</div><div class="coach-phase"><span class="mini-ball">◉</span>'+(cur.serving==='A'?'NOTRE SERVICE':'SERVICE ADVERSE')+'</div></section>';
    h+='<section class="coach-grid coach-kpis">'+
      kpi('Side-out',pctText(mt.so.n,mt.so.d),mt.so.d?mt.so.n+'/'+mt.so.d+' réceptions':'Échantillon limité',status('so',sov,mt.so.d))+
      kpi('Break point',pctText(mt.bp.n,mt.bp.d),mt.bp.d?mt.bp.n+'/'+mt.bp.d+' services':'Échantillon limité',status('bp',bpv,mt.bp.d))+
      kpi('Efficacité attaque',mt.att.d?(aev>0?'+':'')+aev+'%':'—',mt.att.d?mt.att.kills+'K / '+mt.att.errors+'E / '+mt.att.d+' ATT':'Échantillon limité',status('att',aev,mt.att.d))+
      kpi('Réception +',pctText(mt.rec.n,mt.rec.d),mt.rec.d?mt.rec.n+'/'+mt.rec.d+' réceptions':'Échantillon limité',status('rec',recv,mt.rec.d))+
      kpi('Service',mt.serve.d?mt.serve.aces+' ace'+(mt.serve.aces>1?'s':''):'—',mt.serve.d?mt.serve.errors+' erreur'+(mt.serve.errors>1?'s':'')+' · '+mt.serve.d+' services':'Échantillon limité','neutral')+
      kpi('Bloc',mt.block.d?mt.block.points+' point'+(mt.block.points>1?'s':''):'—',mt.block.d?mt.block.touches+' touches · '+mt.block.d+' actions':'Échantillon limité','neutral')+'</section>';
    h+=courtHTML(rot,'Passeuse en '+cur.rotation.toUpperCase());
    h+='<section class="coach-grid coach-two"><article class="coach-card coach-insight"><span class="icon">△</span><div><h3>À surveiller</h3><strong>'+watch.label+' · '+watch.won+'/'+watch.total+' rallyes gagnés</strong><span class="coach-muted">Signal descriptif · '+periodLabel().toLowerCase()+'</span></div><span class="coach-arrow">›</span></article><article class="coach-card coach-insight good"><span class="icon">▥</span><div><h3>Point fort</h3><strong>'+bestSkill+'</strong><span class="coach-muted">Données observées sur '+e.length+' actions</span></div><span class="coach-arrow">›</span></article></section>';
    h+='<section class="coach-card coach-momentum"><div><h3>Dynamique · 10 derniers points</h3><div class="rally-dots">'+recent.map(function(x){return '<span class="rally-dot '+(x.winner==='team1'?'':'loss')+'">'+(x.winner==='team1'?'N':'A')+'</span>'}).join('')+'</div></div><div class="coach-run-score"><span>Nous<strong>'+homeW+'</strong></span><b>·</b><span>Adversaire<strong>'+(recent.length-homeW)+'</strong></span></div></section>';
    h+='<div class="coach-actions"><button type="button" class="coach-cta" data-coach-go="rotations">↻ &nbsp; Analyser les rotations <span>›</span></button><button type="button" class="coach-cta secondary" data-coach-go="players">♟ &nbsp; Voir les joueurs <span>›</span></button></div>'+footer('Référence 01');
    content.innerHTML=h;
  }

  function rotationMetrics(rallies){
    var out=[];for(var z=1;z<=6;z++){var key='p'+z,rr=rallies.filter(function(r){return r.rotation===key&&(C.phase==='all'||r.phase===C.phase)}),won=rr.filter(function(r){return r.winner==='team1'}).length,ev=[];rr.forEach(function(x){ev=ev.concat(x.actions)});var mt=metrics(rr,ev);out.push({key:key,label:'P'+z,total:rr.length,won:won,lost:rr.length-won,diff:won-(rr.length-won),so:pct(mt.so.n,mt.so.d),bp:pct(mt.bp.n,mt.bp.d),att:mt.att.d?Math.round(mt.att.n*100/mt.att.d):null,rec:pct(mt.rec.n,mt.rec.d),events:ev,rallies:rr})}return out
  }
  function renderRotations(){
    var m=C.data.match,all=selectedRallies(),cur=currentState(m,C.data.rallies,+m.currentSet||1);if(!C.rotation)C.rotation=cur.rotation;
    var rows=rotationMetrics(all),sel=rows.filter(function(x){return x.key===C.rotation})[0]||rows[0],rot=rotationTo(m,C.rotation),best=rows.slice().sort(function(a,b){return (b.diff-a.diff)||(b.total-a.total)})[0],watch=rows.slice().sort(function(a,b){return (a.diff-b.diff)||(b.total-a.total)})[0];
    var h=sharedHeading('Analyse des rotations','Set '+(m.currentSet||1)+' · contexte tactique')+periodButtons();
    h+='<div class="coach-filter-row" aria-label="Phase"><button data-phase="all" class="'+(C.phase==='all'?'active':'')+'">TOUT</button><button data-phase="receive" class="'+(C.phase==='receive'?'active':'')+'">RÉCEPTION</button><button data-phase="serve" class="'+(C.phase==='serve'?'active':'')+'">SERVICE</button></div>';
    h+='<div class="rotation-tabs" aria-label="Rotation">'+rows.map(function(x){return '<button type="button" data-rotation="'+x.key+'" class="'+(x.key===C.rotation?'active':'')+'" aria-label="'+x.label+', différentiel '+x.diff+'">'+x.label+'</button>'}).join('')+'</div>';
    h+=courtHTML(rot,'Rotation '+C.rotation.slice(1));
    h+='<section class="coach-grid rotation-kpis">'+kpi('Side-out',sel.so==null?'—':sel.so+'%',sel.total?sel.won+'/'+sel.total+' rallyes':'Échantillon limité',status('so',sel.so,sel.total))+kpi('Break point',sel.bp==null?'—':sel.bp+'%',sel.total?sel.won+'/'+sel.total+' rallyes':'Échantillon limité',status('bp',sel.bp,sel.total))+kpi('Attaque',sel.att==null?'—':(sel.att>0?'+':'')+sel.att+'%',sel.events.length+' actions',status('att',sel.att,sel.events.length))+kpi('Réception +',sel.rec==null?'—':sel.rec+'%',sel.events.filter(function(e){return e.action==='reception'}).length+' réceptions',status('rec',sel.rec,sel.events.length))+'</section>';
    h+='<section class="coach-card rotation-chart"><h2>Comparaison des rotations</h2><p class="coach-subtitle">Différentiel de rallyes gagnés / perdus</p>'+rows.map(function(x){var width=x.total?Math.max(8,Math.min(100,50+x.diff*10)):3;return '<div class="rotation-bar '+(x.key===C.rotation?'active ':'')+(x.diff<0?'watch':'')+'"><span>'+x.label+'</span><div class="rotation-track"><div class="rotation-fill" style="width:'+width+'%"></div></div><strong>'+(x.diff>0?'+':'')+x.diff+'</strong></div>'}).join('')+'<p class="coach-note">Chaque valeur affiche un différentiel transparent : rallyes gagnés − rallyes perdus. Les faibles échantillons restent neutres.</p></section>';
    h+='<section class="coach-grid rotation-summary"><article class="coach-card rotation-award"><span class="big">♛</span><div>Meilleure rotation<div class="big">'+best.label+'</div><small>'+best.won+'/'+best.total+' rallyes</small></div></article><article class="coach-card rotation-award watch"><span class="big">△</span><div>À surveiller<div class="big">'+watch.label+'</div><small>'+watch.won+'/'+watch.total+' rallyes</small></div></article></section>';
    h+='<button type="button" class="detail-full-actions" data-coach-go="players">Comparer via les joueurs &nbsp; ›</button>'+footer('Référence 02');content.innerHTML=h;
  }

  function currentCourtNumbers(){var m=C.data.match,st=currentState(m,C.data.rallies,+m.currentSet||1);return POS.map(function(z){return st.rot[z]}).filter(function(x){return x!=null})}
  function playerStats(p,events,rallies){var pe=events.filter(function(e){return String(e.player)===String(p.number)}),att=pe.filter(function(e){return e.action==='attack'}),rec=pe.filter(function(e){return e.action==='reception'}),srv=pe.filter(function(e){return e.action==='service'}),blk=pe.filter(function(e){return e.action==='block'}),pts=pe.filter(function(e){return e.result==='point'}).length,err=pe.filter(function(e){return e.result==='error'}).length;var rallyCount=rallies.filter(function(r){return r.actions.some(function(e){return String(e.player)===String(p.number)})}).length;return {player:p,events:pe,attempts:pe.length,points:pts,errors:err,delta:pts-err,att:{d:att.length,k:att.filter(function(e){return e.result==='point'}).length,e:att.filter(function(e){return e.result==='error'}).length},rec:{d:rec.length,p:rec.filter(function(e){return e.result!=='error'}).length,e:rec.filter(function(e){return e.result==='error'}).length},srv:{d:srv.length,a:srv.filter(function(e){return e.result==='point'}).length,e:srv.filter(function(e){return e.result==='error'}).length},blk:{d:blk.length,p:blk.filter(function(e){return e.result==='point'}).length},rallies:rallyCount}}
  function filteredPlayers(){var m=C.data.match,on=currentCourtNumbers().map(String),r=teamPlayers(m);if(C.playerScope==='court')r=r.filter(function(p){return on.indexOf(String(p.number))>-1});if(C.role!=='all')r=r.filter(function(p){return p.position===C.role});return r}
  function allPlayerStats(){var rr=selectedRallies(),ev=selectedEvents();return filteredPlayers().map(function(p){return playerStats(p,ev,rr)}).sort(function(a,b){return (b.delta-a.delta)||(b.attempts-a.attempts)||(+a.player.number-+b.player.number)})}
  function summaryCards(s){var ae=s.att.d?Math.round((s.att.k-s.att.e)*100/s.att.d):null,rp=pct(s.rec.p,s.rec.d);return '<section class="coach-grid player-summary-kpis">'+kpi('Attaque',ae==null?'—':(ae>0?'+':'')+ae+'%',s.att.d?s.att.k+'K / '+s.att.e+'E / '+s.att.d+' ATT':'Échantillon limité',status('att',ae,s.att.d))+kpi('Réception',rp==null?'—':rp+'%',s.rec.d?s.rec.p+'/'+s.rec.d+' positives':'Échantillon limité',status('rec',rp,s.rec.d))+kpi('Service',s.srv.d?s.srv.a+' ace'+(s.srv.a>1?'s':''):'—',s.srv.d?s.srv.e+' erreur · '+s.srv.d+' services':'Échantillon limité','neutral')+'</section>'}
  function contributionBars(s){var vals=[['Attaque',s.att.d],['Réception',s.rec.d],['Service',s.srv.d],['Bloc',s.blk.d]],max=Math.max.apply(null,vals.map(function(x){return x[1]}).concat([1]));return vals.map(function(x){return '<div class="player-stat-line"><span>'+x[0]+'</span><div class="track"><div class="fill" style="width:'+Math.round(x[1]*100/max)+'%"></div></div><strong>'+x[1]+'</strong></div>'}).join('')}
  function renderPlayers(){
    var list=allPlayerStats();if(!C.player||!list.some(function(x){return String(x.player.number)===String(C.player)}))C.player=list.length?list[0].player.number:null;var s=list.filter(function(x){return String(x.player.number)===String(C.player)})[0];
    var h=sharedHeading('Performance joueurs','Contributions observées · delta = points − erreurs','<select class="coach-select" aria-label="Mode de comparaison"><option>Contributions</option></select>')+periodButtons();
    h+='<div class="coach-filter-row" aria-label="Présence"><button data-player-scope="court" class="'+(C.playerScope==='court'?'active':'')+'">SUR LE TERRAIN</button><button data-player-scope="all" class="'+(C.playerScope==='all'?'active':'')+'">TOUS</button></div><div class="coach-filter-row" aria-label="Poste">'+[['all','TOUS'],['oh','OH'],['mb','MB'],['opp','OPP'],['setter','S'],['libero','L']].map(function(x){return '<button data-role="'+x[0]+'" class="'+(C.role===x[0]?'active':'')+'">'+x[1]+'</button>'}).join('')+'</div>';
    if(!list.length){content.innerHTML=h+'<div class="coach-empty">Aucun joueur ne correspond aux filtres actifs.</div>'+footer('Référence 03');return}
    h+='<div class="players-layout"><section class="coach-card"><div class="coach-card-head"><h2>Joueurs</h2><span class="coach-chip">'+list.length+' affiché'+(list.length>1?'s':'')+'</span></div><table class="players-table"><thead><tr><th class="rank">#</th><th>Joueur</th><th>Poste</th><th style="text-align:right">Delta</th></tr></thead><tbody>'+list.map(function(x,i){return '<tr data-player="'+x.player.number+'" tabindex="0" class="'+(String(x.player.number)===String(C.player)?'selected':'')+'"><td class="rank">'+(i+1)+'</td><td class="player-name">'+esc(x.player.name||'Joueur')+' <span class="coach-muted">#'+x.player.number+'</span></td><td>'+esc(ROLE_SHORT[x.player.position]||'—')+'</td><td class="metric">'+(x.delta>0?'+':'')+x.delta+'</td></tr>'}).join('')+'</tbody></table><p class="coach-note">Classement explicable : le delta correspond uniquement aux points enregistrés moins les erreurs enregistrées.</p></section>';
    h+='<section class="coach-card"><h2 class="player-summary-title">'+esc(s.player.name||'Joueur')+' · #'+s.player.number+' <span>· '+esc(ROLE[s.player.position]||s.player.position||'')+'</span></h2>'+summaryCards(s)+'<section class="coach-grid player-mini-two"><article class="coach-card"><h3>Participation</h3><div class="coach-grid coach-two"><div class="coach-kpi"><div class="value">'+s.rallies+'</div><div class="sample">Rallyes avec action</div></div><div class="coach-kpi"><div class="value">'+s.attempts+'</div><div class="sample">Actions enregistrées</div></div></div></article><article class="coach-card"><h3>Contribution</h3>'+contributionBars(s)+'</article></section><button type="button" class="player-detail-cta" id="playerDetailCta" aria-label="Voir le détail du joueur numéro '+s.player.number+', '+esc(s.player.name||'Joueur')+'"><span class="silhouette" aria-hidden="true">♟</span><span>Voir le détail joueur</span><span class="chev" aria-hidden="true">›</span></button><div class="coach-footer"><span class="demo">'+(C.data.demo?'Données de démonstration.':C.data.explicitContext?'Référence officielle · volley-live v2.1':'Match courant · migration v1')+'</span><span>Référence 03 · VOLLEY LIVE</span></div></section></div>';content.innerHTML=h;
  }

  function currentPlayerStats(){var p=playerInfo(C.data.match,C.player);return playerStats(p,selectedEvents(),selectedRallies())}
  function skillRows(s){var rows=[['Attaque',s.att.d,s.att.k+' gagnantes · '+s.att.e+' erreurs'],['Réception',s.rec.d,s.rec.p+' positives · '+s.rec.e+' négatives'],['Service',s.srv.d,s.srv.a+' aces · '+s.srv.e+' erreurs'],['Bloc',s.blk.d,s.blk.p+' points']];if(C.skill==='attack')rows=rows.slice(0,1);else if(C.skill==='receive')rows=rows.slice(1,2);else if(C.skill==='serve')rows=rows.slice(2,3);else if(C.skill==='more')rows=rows.slice(3);return rows}
  function setEfficiency(p){var sets={};C.data.events.filter(function(e){return String(e.player)===String(p.number)&&e.action==='attack'}).forEach(function(e){var s=+e.set||1,o=sets[s]||(sets[s]={k:0,e:0,d:0});o.d++;if(e.result==='point')o.k++;else if(e.result==='error')o.e++});var keys=Object.keys(sets).map(Number).sort(function(a,b){return a-b});if(!keys.length)keys=[+C.data.match.currentSet||1];return keys.map(function(k){var o=sets[k]||{k:0,e:0,d:0},v=o.d?Math.round((o.k-o.e)*100/o.d):0;return {set:k,v:v,d:o.d}})}
  function actionLabel(e){var A={attack:'Attaque',reception:'Réception',service:'Service',block:'Bloc',defense:'Défense',set:'Passe',generic:'Action',team:'Équipe',adverse:'Adversaire'};var R={point:'gagnante',error:'erreur',neutral:'continue'};return (A[e.action]||e.action)+' '+(R[e.result]||e.result)}
  function renderDetail(){
    var s=currentPlayerStats(),p=s.player,ae=s.att.d?Math.round((s.att.k-s.att.e)*100/s.att.d):null,rp=pct(s.rec.p,s.rec.d),bars=setEfficiency(p),recent=s.events.slice(-4).reverse(),rows=skillRows(s);
    var h='<button type="button" class="detail-back" data-detail-back>‹ Retour aux joueurs</button>'+sharedHeading('Détail joueur','Analyse complète · '+periodLabel())+'<section class="coach-card detail-hero"><div class="detail-number">'+p.number+'</div><div><div class="detail-name">'+esc(p.name||'Joueur')+'<small>#'+p.number+' · '+esc(ROLE[p.position]||p.position||'')+'</small></div><span class="detail-status"><i></i> Sur le terrain</span></div><div class="detail-net">Delta observé<strong>'+(s.delta>0?'+':'')+s.delta+'</strong><small>'+s.points+' points · '+s.errors+' erreurs</small></div></section>';
    h+='<div class="skill-tabs" aria-label="Famille technique">'+[['summary','Synthèse'],['attack','Attaque'],['receive','Réception'],['serve','Service'],['more','Plus']].map(function(x){return '<button type="button" data-skill="'+x[0]+'" class="'+(C.skill===x[0]?'active':'')+'">'+x[1]+'</button>'}).join('')+'</div>'+summaryCards(s);
    h+='<section class="coach-card"><div class="coach-card-head"><h2>Bilan par geste</h2><span class="coach-chip">'+C.skill.toUpperCase()+'</span></div><table class="gesture-table"><thead><tr><th>Geste</th><th>Volume</th><th>Résultats</th></tr></thead><tbody>'+rows.map(function(x){return '<tr><td><strong>'+x[0]+'</strong></td><td>'+x[1]+' action'+(x[1]>1?'s':'')+'</td><td>'+x[2]+'</td></tr>'}).join('')+'</tbody></table><p class="coach-note">Efficacité attaque : '+(s.att.d?'('+s.att.k+' − '+s.att.e+') / '+s.att.d+' = '+(ae>0?'+':'')+ae+'%':'— · échantillon limité')+'</p></section>';
    h+='<section class="coach-grid detail-grid"><article class="coach-card"><h2>Participation</h2><div class="coach-grid coach-two"><div class="coach-kpi"><div class="value">'+s.rallies+'</div><div class="sample">Rallyes joués</div></div><div class="coach-kpi"><div class="value">'+s.attempts+'</div><div class="sample">Actions enregistrées</div></div></div></article><article class="coach-card"><h2>Points directs</h2><div class="coach-grid coach-kpis"><div class="coach-kpi"><div class="value">'+s.att.k+'</div><div class="sample">Attaques</div></div><div class="coach-kpi"><div class="value">'+s.srv.a+'</div><div class="sample">Aces</div></div><div class="coach-kpi"><div class="value">'+s.blk.p+'</div><div class="sample">Blocs</div></div></div></article><article class="coach-card"><h2>Performance par set</h2><p class="coach-note">Efficacité attaque</p><div class="set-bars">'+bars.map(function(x){return '<div class="set-bar" style="height:'+Math.max(5,Math.min(100,50+x.v/2))+'%"><span>'+(x.d?(x.v>0?'+':'')+x.v+'%':'—')+'</span><small>Set '+x.set+'</small></div>'}).join('')+'</div></article><article class="coach-card"><h2>Dernières actions</h2><div class="recent-list">'+(recent.length?recent.map(function(e){return '<div class="recent-item '+(e.result==='error'?'loss':'')+'"><i></i><span>Set '+(e.set||1)+' · '+num(e.scoreA)+'–'+num(e.scoreB)+'</span><strong>'+esc(actionLabel(e))+'</strong></div>'}).join(''):'<div class="coach-empty">Aucune action enregistrée.</div>')+'</div></article></section>';
    h+='<button type="button" class="detail-full-actions" data-all-actions>☷ &nbsp; Voir toutes les actions &nbsp; ›</button>'+footer('Détail joueur');content.innerHTML=h;
  }

  function updateShell(){screen.querySelectorAll('[data-coach-tab]').forEach(function(b){var active=b.dataset.coachTab===C.view||(C.view==='detail'&&b.dataset.coachTab==='players');b.classList.toggle('active',active);b.setAttribute('aria-selected',active?'true':'false')});var lb=document.getElementById('coachLiveLabel');if(lb)lb.textContent=C.data.demo?'DÉMO':C.data.explicitContext?'V2.1 RÉF':'EN DIRECT'}
  function render(){C.data=load();if(!C.data.rallies)C.data.rallies=buildRallies(C.data.match,C.data.events);updateShell();if(C.view==='overview')renderOverview();else if(C.view==='rotations')renderRotations();else if(C.view==='players')renderPlayers();else renderDetail()}
  function focusHeading(){setTimeout(function(){var h=content.querySelector('.coach-title');if(h)h.focus()},0)}
  function openCoach(){C.data=load();if(!C.data.rallies)C.data.rallies=buildRallies(C.data.match,C.data.events);document.getElementById('homeScreen').hidden=true;screen.hidden=false;C.view='overview';render();screen.scrollTop=0;focusHeading()}
  function closeCoach(){screen.hidden=true;document.getElementById('homeScreen').hidden=false;document.getElementById('homeCoach').focus()}
  document.getElementById('homeCoach').addEventListener('click',openCoach);document.getElementById('coachHome').addEventListener('click',closeCoach);
  screen.querySelector('.coach-nav').addEventListener('click',function(e){var b=e.target.closest('[data-coach-tab]');if(!b)return;C.view=b.dataset.coachTab;render();screen.scrollTop=0;focusHeading()});
  content.addEventListener('click',function(e){
    var b=e.target.closest('button,[data-player]');if(!b)return;
    if(b.dataset.period){C.period=b.dataset.period;render();return}
    if(b.dataset.coachGo){C.view=b.dataset.coachGo;render();screen.scrollTop=0;focusHeading();return}
    if(b.dataset.phase){C.phase=b.dataset.phase;render();return}
    if(b.dataset.rotation){C.rotation=b.dataset.rotation;render();return}
    if(b.dataset.playerScope){C.playerScope=b.dataset.playerScope;render();return}
    if(b.dataset.role){C.role=b.dataset.role;render();return}
    if(b.matches('tr[data-player]')){C.player=+b.dataset.player;render();return}
    if(b.id==='playerDetailCta'){
      if(!C.player){b.disabled=true;b.title='Sélectionnez un joueur pour voir le détail';return}
      b.classList.add('loading');b.disabled=true;b.setAttribute('aria-busy','true');var old=b.querySelector('span:nth-child(2)').textContent;b.querySelector('span:nth-child(2)').textContent='Ouverture du détail joueur';
      setTimeout(function(){try{C.view='detail';history.pushState({volleyCoachDetail:true},'',location.href.split('#')[0]+'#player-detail');C.detailHistory=true;render();screen.scrollTop=0;focusHeading()}catch(err){b.disabled=false;b.classList.remove('loading');b.removeAttribute('aria-busy');b.querySelector('span:nth-child(2)').textContent=old;b.title='Impossible d’ouvrir le détail. Réessayez.'}},90);return
    }
    if(b.hasAttribute('data-detail-back')){if(C.detailHistory){C.detailHistory=false;history.back()}else{C.view='players';render();focusHeading()}return}
    if(b.dataset.skill){C.skill=b.dataset.skill;render();return}
    if(b.hasAttribute('data-all-actions')){var p=currentPlayerStats(),msg=p.events.length?p.events.map(function(x){return 'Set '+(x.set||1)+' · '+num(x.scoreA)+'–'+num(x.scoreB)+' · '+actionLabel(x)}).join('\n'):'Aucune action enregistrée.';alert(msg)}
  });
  content.addEventListener('keydown',function(e){var r=e.target.closest&&e.target.closest('tr[data-player]');if(r&&(e.key==='Enter'||e.key===' ')){e.preventDefault();C.player=+r.dataset.player;render()}});
  window.addEventListener('popstate',function(){if(!screen.hidden&&C.view==='detail'){C.detailHistory=false;C.view='players';render();focusHeading()}});
  window.VolleyCoach={open:openCoach,close:closeCoach,render:render,buildRallies:buildRallies,metrics:metrics};
})();
