(function(){
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
})();
