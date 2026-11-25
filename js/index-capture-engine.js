(function(){
  var m=null;try{m=JSON.parse(localStorage.getItem('volleyCapture.match.v1')||'null')}catch(e){}
  window.VOLLEY_MATCH=m;
  // ---- set & match rules (derived from events only) ----
  window.VolleyStats=(function(){
    var ACTS=['attack','block','service','reception','defense','set','freeball'],ALL=['attack','block','service','reception','defense','set','freeball','generic'],ALAB={generic:'No action detail',attack:'Attack',block:'Block',service:'Service',reception:'Reception',defense:'Defense',set:'Set',freeball:'Free ball'};
    var RN={setter:'Setter',oh:'OH',mb:'MB',opp:'OPP',libero:'Libero'};
    function esc(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
    function info(mm,n){var r=(mm&&mm.team&&mm.team.roster)||[];for(var i=0;i<r.length;i++)if(r[i].number===n)return r[i];return null}
    function attackers(mm,evs){
      var r=(mm&&mm.team&&mm.team.roster)||[],seen={};(evs||[]).forEach(function(e){if(e.player!=='A')seen[e.player]=1});
      return r.filter(function(x){return (x.position==='oh'||x.position==='mb'||x.position==='opp')&&seen[x.number]})
        .sort(function(a,b){var o={oh:0,opp:1,mb:2};return (o[a.position]-o[b.position])||(a.number-b.number)});
    }
    function series(evs,n){var p=0,e=0,out=[],setMarks=[],last=null;(evs||[]).forEach(function(x){if(x.player!==n)return;var st=x.set||1;if(last!==null&&st!==last)setMarks.push(out.length);last=st;if(x.result==='point')p++;else if(x.result==='error')e++;out.push({p:p,e:e,d:p-e})});return {pts:out,setMarks:setMarks}}
    function byAction(evs,n){var t={};ALL.forEach(function(a){t[a]={point:0,error:0,neutral:0}});(evs||[]).forEach(function(x){if(x.player===n&&t[x.action]&&t[x.action][x.result]!==undefined)t[x.action][x.result]++});return t}
    function svg(sr){
      var pts=sr.pts,W=420,H=210,L=34,R=10,T=12,B=28,N=Math.max(1,pts.length),hi=1,lo=0;
      pts.forEach(function(q){hi=Math.max(hi,q.p,q.e,q.d);lo=Math.min(lo,q.d)});hi+=1;lo=Math.min(lo-1,0);
      function X(i){return (L+(W-L-R)*i/N).toFixed(1)}function Y(v){return (T+(H-T-B)*(hi-v)/(hi-lo)).toFixed(1)}
      var o='<svg viewBox="0 0 '+W+' '+H+'" xmlns="http://www.w3.org/2000/svg" font-family="Arial,sans-serif">';
      var step=Math.max(1,Math.ceil((hi-lo)/6));
      for(var v=lo;v<=hi;v+=step){o+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+Y(v)+'" y2="'+Y(v)+'" stroke="#eef0f3"/><text x="'+(L-5)+'" y="'+(+Y(v)+4)+'" font-size="10" text-anchor="end" fill="#64748b">'+v+'</text>'}
      sr.setMarks.forEach(function(i){o+='<line x1="'+X(i)+'" x2="'+X(i)+'" y1="'+T+'" y2="'+(H-B)+'" stroke="#94a3b8" stroke-dasharray="4 3"/>'});
      o+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+Y(0)+'" y2="'+Y(0)+'" stroke="#475569" stroke-width="1.2"/>';
      var xs=Math.max(1,Math.ceil(N/8));for(var i=0;i<=N;i+=xs)o+='<text x="'+X(i)+'" y="'+(H-B+14)+'" font-size="10" text-anchor="middle" fill="#64748b">'+i+'</text>';
      o+='<text x="'+(L+(W-L-R)/2)+'" y="'+(H-3)+'" font-size="10" text-anchor="middle" fill="#475569">player actions</text>';
      function line(key,col,w,dash){var d='M'+X(0)+' '+Y(0),prev=0;pts.forEach(function(q,i){d+=' L'+X(i+1)+' '+Y(prev)+' L'+X(i+1)+' '+Y(q[key]);prev=q[key]});return '<path d="'+d+'" fill="none" stroke="'+col+'" stroke-width="'+w+'"'+(dash?' stroke-dasharray="'+dash+'"':'')+'/>'}
      o+=line('e','#dc2626',2.5)+line('p','#16a34a',2.5)+line('d','#1e2a4a',3,'6 3');
      return o+'</svg>';
    }
    function card(mm,evs,x){
      var sr=series(evs,x.number),t=byAction(evs,x.number),tot={p:0,e:0,n:0};
      ALL.forEach(function(a){tot.p+=t[a].point;tot.e+=t[a].error;tot.n+=t[a].neutral});
      var df=tot.p-tot.e;
      var h='<div class="att-card role-'+x.position+'" data-att="'+x.number+'"><h4>#'+x.number+' '+esc(x.name||'')+' \u00B7 '+RN[x.position]+'</h4>';
      h+='<div class="att-kpi"><span class="k-p">Pts '+tot.p+'</span><span class="k-e">Err '+tot.e+'</span>'+'<span class="k-n">Neu '+tot.n+'</span>'+'<span class="k-d">Diff '+(df>0?'+':'')+df+'</span></div>';
      h+=svg(sr)+'<div class="att-legend"><b style="background:#16a34a"></b>points<b style="background:#dc2626"></b>errors<b style="background:#1e2a4a"></b>points \u2212 errors</div><table class="att-tbl"><tr><th>Action</th><th>Pt</th><th>Err</th>'+'<th>Neu</th>'+'</tr>';
      ALL.forEach(function(a){var r=t[a];if(r.point+r.error+r.neutral)h+='<tr><td>'+ALAB[a]+'</td><td>'+r.point+'</td><td>'+r.error+'</td>'+'<td>'+r.neutral+'</td>'+'</tr>'});
      return h+'</table></div>';
    }
    function cards(mm,evs){var at=attackers(mm,evs);return at.length?at.map(function(x){return card(mm,evs,x)}).join(''):'<div class="att-empty">No OH / MB / OPP action in the log yet.</div>'}
    return {attackers:attackers,series:series,byAction:byAction,svg:svg,card:card,cards:cards,esc:esc,info:info,ACTS:ACTS,ALAB:ALAB,RN:RN};
  })();
  window.VolleySets=(function(){
    function setsToWin(mm){return (mm&&mm.format&&mm.format.setsToWin===2)?2:3}
    function decidingSet(mm){return setsToWin(mm)*2-1}
    function target(mm,n){return n===decidingSet(mm)?15:25}
    function score(evs,n){var a=0,b=0;(evs||[]).forEach(function(e){if((e.set||1)!==n)return;if(e.winningTeam==='team1')a++;else if(e.winningTeam==='team2')b++});return {a:a,b:b}}
    function winner(mm,evs,n){var sc=score(evs,n),t=target(mm,n);if(Math.max(sc.a,sc.b)>=t&&Math.abs(sc.a-sc.b)>=2)return sc.a>sc.b?'team1':'team2';return null}
    function summary(mm,evs){
      var cur=(mm&&mm.currentSet)||1,res=[],wa=0,wb=0;
      for(var n=1;n<=cur;n++){var sc=score(evs,n),w=winner(mm,evs,n);if(w==='team1')wa++;else if(w==='team2')wb++;res.push({set:n,a:sc.a,b:sc.b,winner:w,target:target(mm,n)})}
      var need=setsToWin(mm),mw=wa>=need?'team1':(wb>=need?'team2':null);
      return {sets:res,wonA:wa,wonB:wb,setsToWin:need,current:res[res.length-1],matchWinner:mw};
    }
    return {setsToWin:setsToWin,decidingSet:decidingSet,target:target,score:score,winner:winner,summary:summary};
  })();
  var nums=(m&&m.team&&m.team.players&&m.team.players.length)?m.team.players.slice():[1,2,3,4,5,6,7];
  var info={};((m&&m.team&&m.team.roster)||[]).forEach(function(r){info[r.number]=r});
  function esc(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  var LU=(m&&m.startingLineup)||{},roleOf={};
  [['oh1','oh'],['oh2','oh'],['mb1','mb'],['mb2','mb'],['setter','setter'],['opposite','opp'],['libero','libero']].forEach(function(x){if(LU[x[0]])roleOf[LU[x[0]]]=x[1]});
  var RL={setter:'SET',oh:'OH',mb:'MB',opp:'OPP',libero:'LIB'};
  window.updateScoreService=function(side){var board=document.getElementById('liveScore');if(!board)return;board.setAttribute('data-serving',side||'');board.querySelectorAll('.score-side').forEach(function(x){x.classList.remove('serving')});var target=board.querySelector(side==='A'?'.side-a':side==='B'?'.side-b':'');if(target)target.classList.add('serving')};
  var g=document.querySelector('#capturePanel .touch-grid.players');
  function cell(n,zone,tag){var i=info[n];return (zone?'<span class="pz">'+zone.toUpperCase()+'</span>':'')+'<span class="pn">'+n+'</span>'+(i&&i.name?'<small>'+esc(i.name)+'</small>':'')+(roleOf[n]?'<span class="rl">'+RL[roleOf[n]]+'</span>':'')+(tag?'<small class="tag">'+esc(tag)+'</small>':'')}
  function pbtn(n,zone){return '<button type="button" class="touch" data-player="'+n+'">'+cell(n,zone)+'</button>'}
  var advBtn='<button type="button" class="touch adversary-btn" data-player="A">ADVERSE</button>';
  // v1.3.0 Focus: players with focus=false are not proposed individually; the TEAM button ("T") replaces them.
  function isFocus(n){var i=info[n];return !(i&&i.focus===false)}
  window.VolleyFocus=isFocus;
  var teamBtn='<button type="button" class="touch team-focus-btn" id="teamFocusBtn" data-player="T" hidden>TEAM<small>players without focus</small></button>';
  // ---------- ROTATION ENGINE (pure functions) ----------
  // Rules: clockwise rotation P2>P1>P6>P5>P4>P3>P2, only when our team wins a rally
  // while the opponent was serving (side-out). Libero: back row only, never serves
  // (replaces the central in P6/P5) and leaves when that central's slot reaches P4.
  var POS=['p4','p3','p2','p5','p6','p1'];
  var NEXT={p2:'p1',p1:'p6',p6:'p5',p5:'p4',p4:'p3',p3:'p2'};
  var LIBERO_ZONES=['p6','p5'];
  function rotate(r){var n={};Object.keys(NEXT).forEach(function(k){n[NEXT[k]]=r[k]});return n}
  // Substitutions: match.subs=[{set,at,out,in,ts}] ; 'at' = number of events of that set before the change.
  function applySub(st,sb){
    var z=null;POS.forEach(function(k){if(st.rot[k]===sb.out)z=k});
    if(z){st.rot[z]=sb['in'];var i=st.mbs.indexOf(sb.out);if(i>-1)st.mbs[i]=sb['in'];}
    else if(sb.out===st.lib){st.lib=sb['in'];}
  }
  function replay(match,evs){
    var rot={};POS.forEach(function(k){rot[k]=match.startingRotation[k]});
    var cs=(match.currentSet||1),subs=(match.subs||[]).filter(function(x){return x.set===cs});
    var st={rot:rot,mbs:[match.startingLineup.mb1,match.startingLineup.mb2],lib:match.startingLineup.libero};
    function subsAt(i){subs.forEach(function(x){if(x.at===i)applySub(st,x)});rot=st.rot;}
    var serving=(match.firstRally&&match.firstRally.antibesState==='reception')?'B':'A',rotations=0;
    if(((match.currentSet||1)%2)===0)serving=(serving==='A')?'B':'A';   // first serve alternates from set to set
    (evs||[]).forEach(function(e,i){
      subsAt(i);
      if(e.winningTeam==='team1'){if(serving==='B'){rot=rotate(rot);st.rot=rot;serving='A';rotations++}}
      else if(e.winningTeam==='team2'){serving='B'}
    });
    subsAt((evs||[]).length);
    return {rot:rot,serving:serving,rotations:rotations,mbs:st.mbs,lib:st.lib,subs:subs};
  }
  function courtFrom(match,rot,stt){
    var c={},lib=(stt&&stt.lib)||match.startingLineup.libero,mbs=(stt&&stt.mbs)||[match.startingLineup.mb1,match.startingLineup.mb2],bench=lib;
    POS.forEach(function(k){c[k]={num:rot[k],libero:false,forNum:null}});
    LIBERO_ZONES.some(function(k){if(mbs.indexOf(rot[k])>-1){c[k]={num:lib,libero:true,forNum:rot[k]};bench=rot[k];return true}return false});
    c.bench=bench;return c;
  }
  window.VolleyRotation={rotate:rotate,replay:replay,court:courtFrom,POS:POS,LIBERO_ZONES:LIBERO_ZONES};
  var rot0=m&&m.startingRotation,lib0=m&&m.startingLineup&&m.startingLineup.libero;
  var ready=!!(rot0&&rot0.p1&&rot0.p2&&rot0.p3&&rot0.p4&&rot0.p5&&rot0.p6&&lib0);
  if(ready){
    g.classList.add('court-mode');
    g.innerHTML='<div class="court-status" id="courtStatus"></div><div class="phase-badge" id="phaseBadge" aria-live="polite"></div><div class="court-grid">'
      +POS.map(function(k){return '<button type="button" class="touch" data-player="'+rot0[k]+'" data-zone="'+k+'"></button>'}).join('')+'</div>'
      +'<div class="bench-row"><button type="button" class="touch" id="benchBtn" data-player="'+lib0+'"></button></div>'
      +'<div class="court-adv">'+teamBtn+advBtn+'</div>';
    g.insertAdjacentHTML('afterend','<button type="button" class="sub-toggle capture-sub-toggle" id="subToggle" aria-label="Changer de joueur">\u27F3 Changer de joueur</button><div class="sub-hint" id="subHint" hidden>Tap the player who leaves the court</div><div class="sub-log" id="subLog"></div>')
    // Updates the existing buttons in place so their click handlers stay attached.
    window.updateCourt=function(evs){
      var set=(evs||[]).filter(function(e){return (e.set||1)===(m.currentSet||1)});
      var st=replay(m,set),c=courtFrom(m,st.rot,st),anyNoFocus=false;window.__court={st:st,c:c};
      POS.forEach(function(k){
        var b=g.querySelector('[data-zone="'+k+'"]'),x=c[k];
        b.setAttribute('data-player',x.num);
        var fo=isFocus(x.num);if(!fo)anyNoFocus=true;
        b.className='touch'+(roleOf[x.num]?' role-'+roleOf[x.num]:'')+(x.libero?' is-lib':'')+((k==='p1'&&st.serving==='A')?' is-srv':'')+(fo?'':' nofocus');
        b.innerHTML=fo?cell(x.num,k,x.libero?'for #'+x.forNum:''):'<span class="pz">'+k.toUpperCase()+'</span><span class="nf">TEAM</span>';
      });
      var bb=document.getElementById('benchBtn'),bfo=isFocus(c.bench);if(!bfo)anyNoFocus=true;
      bb.setAttribute('data-player',c.bench);bb.className='touch'+(roleOf[c.bench]?' role-'+roleOf[c.bench]:'')+(bfo?'':' nofocus');bb.innerHTML=bfo?cell(c.bench,'',c.bench===st.lib?'':'out for LIB'):'<span class="nf">TEAM</span>';
      var tfb=document.getElementById('teamFocusBtn');if(tfb)tfb.hidden=!anyNoFocus;
      var sl=document.getElementById('subLog');sl.textContent=st.subs.length?('Subs set '+(m.currentSet||1)+' ('+st.subs.length+'/6): '+st.subs.map(function(x){return '#'+x['in']+' for #'+x.out}).join(' \u00B7 ')):'';
      var cs=document.getElementById('courtStatus'),tn=m.team.name||'Team A';
      var pb=document.getElementById('phaseBadge');if(pb){pb.className='phase-badge '+(st.serving==='A'?'srv':'rcv');pb.textContent=st.serving==='A'?'SERVICE':'RECEPTION'}
      var setterZone='';POS.some(function(k){if(roleOf[st.rot[k]]==='setter'){setterZone=k.slice(1);return true}return false});
      var rotationConfig=(st.rotations%6)+1,rotationCycle=Math.floor(st.rotations/6)+1;
      cs.className='court-status '+(st.serving==='A'?'srv':'rcv');cs.textContent='Rot. P'+(setterZone||'?')+' | R'+rotationConfig+' | C'+rotationCycle
      if(window.updateScoreService)window.updateScoreService(st.serving);
    };
    // ---------- substitution mode ----------
    var POSROLE={setter:'setter',set:'setter',oh:'oh',outside:'oh',mb:'mb',middle:'mb',opp:'opp',opposite:'opp',libero:'libero',lib:'libero'};
    (m.subs||[]).forEach(function(x){if(!roleOf[x['in']])roleOf[x['in']]=(info[x['in']]&&POSROLE[info[x['in']].position])||roleOf[x.out]});
    var panel=document.getElementById('capturePanel'),tg=document.getElementById('subToggle'),hint=document.getElementById('subHint');
    var sheet=document.createElement('div');sheet.className='sub-sheet';sheet.hidden=true;document.body.appendChild(sheet);
    function setMode(on){panel.classList.toggle('sub-mode',on);tg.classList.toggle('on',on);tg.textContent=on?'\u2715 Annuler':'\u27F3 Changer de joueur';tg.setAttribute('aria-label',on?'Annuler le changement de joueur':'Changer de joueur');hint.hidden=!on;}
    tg.addEventListener('click',function(){setMode(!panel.classList.contains('sub-mode'))});
    function positionOf(n){var p=String(info[n]&&info[n].position||'').toLowerCase();return POSROLE[p]||p}
    function openPicker(outNum,isLib){
      var k=window.__court,onCourt=[];POS.forEach(function(z){onCourt.push(k.c[z].num)});
      var outPosition=positionOf(outNum),avail=nums.filter(function(n){return n!==outNum&&onCourt.indexOf(n)<0&&info[n]&&info[n].present!==false&&positionOf(n)===outPosition});
      var oi=info[outNum],h='<div class="sub-card"><h3>'+(isLib?'Change libero':'Substitution')+' \u00B7 #'+outNum+(oi&&oi.name?' '+esc(oi.name):'')+' out</h3><div class="sub-sub">Choose an available '+(RL[outPosition]||outPosition.toUpperCase())+' player</div>';
      h+=avail.length?'<div class="sub-grid">'+avail.map(function(n){var i=info[n];return '<button type="button" data-in="'+n+'">'+n+'<small>'+esc((i&&i.name)||'')+(i&&i.position?' \u00B7 '+(RL[POSROLE[i.position]]||''):'')+'</small></button>'}).join('')+'</div>':'<div class="sub-empty">No player available on the bench (roster only has '+nums.length+' players).</div>';
      if(!avail.length)h=h.replace('No player available on the bench (roster only has '+nums.length+' players).','Aucun remplaçant disponible à ce poste');
      h+='<button type="button" class="sub-cancel">CANCEL</button></div>';
      sheet.innerHTML=h;sheet.hidden=false;
      sheet.querySelector('.sub-cancel').onclick=function(){sheet.hidden=true};
      sheet.querySelectorAll('[data-in]').forEach(function(b){b.onclick=function(){doSub(outNum,+b.dataset['in'])}});
    }
    function doSub(outNum,inNum){
      var cs=m.currentSet||1,n=(m.subs||[]).filter(function(x){return x.set===cs}).length;
      if(n>=6&&!confirm('6 substitutions already used in this set. Record anyway?'))return;
      var evs=[];try{evs=JSON.parse(localStorage.getItem('volleyCapture.events.v1')||'[]')}catch(e){}
      var at=evs.filter(function(e){return (e.set||1)===cs}).length;
      var rally=evs.filter(function(e){return (e.set||1)===cs&&!!e.winningTeam}).length+1,position=positionOf(outNum),now=new Date(),sc=window.VolleySets.score(evs,cs);
      var subEvent={id:evs.length+1,type:'SUBSTITUTION',eventType:'SUBSTITUTION',set:cs,rally:rally,timestamp:now.toISOString(),time:now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'}),action:'substitution',result:'neutral',player:inNum,playerOut:outNum,playerIn:inNum,position:position,winningTeam:null,pointOrigin:null,rotation:replay(m,evs.filter(function(e){return (e.set||1)===cs})).rotations,scoreA:sc.a,scoreB:sc.b};
      m.subs=m.subs||[];m.subs.push({set:cs,at:at,rally:rally,out:outNum,'in':inNum,position:position,eventId:subEvent.id,ts:subEvent.timestamp});
      if(!roleOf[inNum])roleOf[inNum]=(info[inNum]&&POSROLE[info[inNum].position])||roleOf[outNum];
      localStorage.setItem('volleyCapture.match.v1',JSON.stringify(m));
      sheet.hidden=true;setMode(false);if(window.VLCLogSubstitution)window.VLCLogSubstitution(subEvent);else{evs.push(subEvent);localStorage.setItem('volleyCapture.events.v1',JSON.stringify(evs));window.updateCourt(evs)}
      var stt=document.getElementById('captureStatus');if(stt)stt.textContent='Substitution: #'+inNum+' in for #'+outNum;
    }
    // capture phase: intercepts court taps before the normal input flow
    g.addEventListener('click',function(e){
      if(!panel.classList.contains('sub-mode'))return;
      var b=e.target.closest('.court-grid [data-player], .bench-row [data-player]');if(!b)return;
      e.stopPropagation();e.preventDefault();
      var num=+b.getAttribute('data-player'),k=window.__court,isLib=(num===k.st.lib);
      openPicker(num,isLib);
    },true);
    window.undoLastSub=function(evs){   // removes a substitution only when it is the latest logged event
      var cs=m.currentSet||1,sb=m.subs||[],last=evs.length?evs[evs.length-1]:null;
      for(var i=sb.length-1;i>=0;i--){if(sb[i].set===cs){var same=last&&last.type==='SUBSTITUTION'&&last.playerOut===sb[i].out&&last.playerIn===sb[i]['in'];if(same){var r=sb.splice(i,1)[0];evs.pop();localStorage.setItem('volleyCapture.match.v1',JSON.stringify(m));localStorage.setItem('volleyCapture.events.v1',JSON.stringify(evs));window.updateCourt(evs);return r}break}}
      return null;
    };
    window.updateCourt([]);
  }else{
    var fN=nums.filter(isFocus);
    g.innerHTML=fN.map(function(n){return pbtn(n,'')}).join('')+(fN.length<nums.length?teamBtn.replace(' hidden',''):'')+advBtn;
  }
  if(m){document.getElementById('captureTitle').textContent=m.team.name+' vs '+m.opponent.name+' · Set '+m.currentSet;}
})();
