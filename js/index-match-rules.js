(function () {
  // ---- set & match rules (derived from events only) ----
  window.VolleyStats = (function () {
    var ACTS = ['attack', 'block', 'service', 'reception', 'defense', 'set', 'freeball'],
      ALL = ['attack', 'block', 'service', 'reception', 'defense', 'set', 'freeball', 'generic'],
      ALAB = {
        generic: 'No action detail',
        attack: 'Attack',
        block: 'Block',
        service: 'Service',
        reception: 'Reception',
        defense: 'Defense',
        set: 'Set',
        freeball: 'Free ball',
      };
    var RN = { setter: 'Setter', oh: 'OH', mb: 'MB', opp: 'OPP', libero: 'Libero' };
    function esc(t) {
      return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
      });
    }
    function info(mm, n) {
      var r = (mm && mm.team && mm.team.roster) || [];
      for (var i = 0; i < r.length; i++) if (r[i].number === n) return r[i];
      return null;
    }
    function attackers(mm, evs) {
      var r = (mm && mm.team && mm.team.roster) || [],
        seen = {};
      (evs || []).forEach(function (e) {
        if (e.player !== 'A') seen[e.player] = 1;
      });
      return r
        .filter(function (x) {
          return (x.position === 'oh' || x.position === 'mb' || x.position === 'opp') && seen[x.number];
        })
        .sort(function (a, b) {
          var o = { oh: 0, opp: 1, mb: 2 };
          return o[a.position] - o[b.position] || a.number - b.number;
        });
    }
    function series(evs, n) {
      var p = 0,
        e = 0,
        out = [],
        setMarks = [],
        last = null;
      (evs || []).forEach(function (x) {
        if (x.player !== n) return;
        var st = x.set || 1;
        if (last !== null && st !== last) setMarks.push(out.length);
        last = st;
        if (x.result === 'point') p++;
        else if (x.result === 'error') e++;
        out.push({ p: p, e: e, d: p - e });
      });
      return { pts: out, setMarks: setMarks };
    }
    function byAction(evs, n) {
      var t = {};
      ALL.forEach(function (a) {
        t[a] = { point: 0, error: 0, neutral: 0 };
      });
      (evs || []).forEach(function (x) {
        if (x.player === n && t[x.action] && t[x.action][x.result] !== undefined) t[x.action][x.result]++;
      });
      return t;
    }
    function svg(sr) {
      var pts = sr.pts,
        W = 420,
        H = 210,
        L = 34,
        R = 10,
        T = 12,
        B = 28,
        N = Math.max(1, pts.length),
        hi = 1,
        lo = 0;
      pts.forEach(function (q) {
        hi = Math.max(hi, q.p, q.e, q.d);
        lo = Math.min(lo, q.d);
      });
      hi += 1;
      lo = Math.min(lo - 1, 0);
      function X(i) {
        return (L + ((W - L - R) * i) / N).toFixed(1);
      }
      function Y(v) {
        return (T + ((H - T - B) * (hi - v)) / (hi - lo)).toFixed(1);
      }
      var o =
        '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial,sans-serif">';
      var step = Math.max(1, Math.ceil((hi - lo) / 6));
      for (var v = lo; v <= hi; v += step) {
        o +=
          '<line x1="' +
          L +
          '" x2="' +
          (W - R) +
          '" y1="' +
          Y(v) +
          '" y2="' +
          Y(v) +
          '" stroke="#eef0f3"/><text x="' +
          (L - 5) +
          '" y="' +
          (+Y(v) + 4) +
          '" font-size="10" text-anchor="end" fill="#64748b">' +
          v +
          '</text>';
      }
      sr.setMarks.forEach(function (i) {
        o +=
          '<line x1="' +
          X(i) +
          '" x2="' +
          X(i) +
          '" y1="' +
          T +
          '" y2="' +
          (H - B) +
          '" stroke="#94a3b8" stroke-dasharray="4 3"/>';
      });
      o +=
        '<line x1="' +
        L +
        '" x2="' +
        (W - R) +
        '" y1="' +
        Y(0) +
        '" y2="' +
        Y(0) +
        '" stroke="#475569" stroke-width="1.2"/>';
      var xs = Math.max(1, Math.ceil(N / 8));
      for (var i = 0; i <= N; i += xs)
        o +=
          '<text x="' +
          X(i) +
          '" y="' +
          (H - B + 14) +
          '" font-size="10" text-anchor="middle" fill="#64748b">' +
          i +
          '</text>';
      o +=
        '<text x="' +
        (L + (W - L - R) / 2) +
        '" y="' +
        (H - 3) +
        '" font-size="10" text-anchor="middle" fill="#475569">player actions</text>';
      function line(key, col, w, dash) {
        var d = 'M' + X(0) + ' ' + Y(0),
          prev = 0;
        pts.forEach(function (q, i) {
          d += ' L' + X(i + 1) + ' ' + Y(prev) + ' L' + X(i + 1) + ' ' + Y(q[key]);
          prev = q[key];
        });
        return (
          '<path d="' +
          d +
          '" fill="none" stroke="' +
          col +
          '" stroke-width="' +
          w +
          '"' +
          (dash ? ' stroke-dasharray="' + dash + '"' : '') +
          '/>'
        );
      }
      o += line('e', '#dc2626', 2.5) + line('p', '#16a34a', 2.5) + line('d', '#1e2a4a', 3, '6 3');
      return o + '</svg>';
    }
    function card(mm, evs, x) {
      var sr = series(evs, x.number),
        t = byAction(evs, x.number),
        tot = { p: 0, e: 0, n: 0 };
      ALL.forEach(function (a) {
        tot.p += t[a].point;
        tot.e += t[a].error;
        tot.n += t[a].neutral;
      });
      var df = tot.p - tot.e;
      var h =
        '<div class="att-card role-' +
        x.position +
        '" data-att="' +
        x.number +
        '"><h4>#' +
        x.number +
        ' ' +
        esc(x.name || '') +
        ' \u00B7 ' +
        RN[x.position] +
        '</h4>';
      h +=
        '<div class="att-kpi"><span class="k-p">Pts ' +
        tot.p +
        '</span><span class="k-e">Err ' +
        tot.e +
        '</span>' +
        '<span class="k-n">Neu ' +
        tot.n +
        '</span>' +
        '<span class="k-d">Diff ' +
        (df > 0 ? '+' : '') +
        df +
        '</span></div>';
      h +=
        svg(sr) +
        '<div class="att-legend"><b style="background:#16a34a"></b>points<b style="background:#dc2626"></b>errors<b style="background:#1e2a4a"></b>points \u2212 errors</div><table class="att-tbl"><tr><th>Action</th><th>Pt</th><th>Err</th>' +
        '<th>Neu</th>' +
        '</tr>';
      ALL.forEach(function (a) {
        var r = t[a];
        if (r.point + r.error + r.neutral)
          h +=
            '<tr><td>' +
            ALAB[a] +
            '</td><td>' +
            r.point +
            '</td><td>' +
            r.error +
            '</td>' +
            '<td>' +
            r.neutral +
            '</td>' +
            '</tr>';
      });
      return h + '</table></div>';
    }
    function cards(mm, evs) {
      var at = attackers(mm, evs);
      return at.length
        ? at
            .map(function (x) {
              return card(mm, evs, x);
            })
            .join('')
        : '<div class="att-empty">No OH / MB / OPP action in the log yet.</div>';
    }
    return {
      attackers: attackers,
      series: series,
      byAction: byAction,
      svg: svg,
      card: card,
      cards: cards,
      esc: esc,
      info: info,
      ACTS: ACTS,
      ALAB: ALAB,
      RN: RN,
    };
  })();
  window.VolleySets = (function () {
    function setsToWin(mm) {
      return mm && mm.format && mm.format.setsToWin === 2 ? 2 : 3;
    }
    function decidingSet(mm) {
      return setsToWin(mm) * 2 - 1;
    }
    function target(mm, n) {
      return n === decidingSet(mm) ? 15 : 25;
    }
    function score(evs, n) {
      var a = 0,
        b = 0;
      (evs || []).forEach(function (e) {
        if ((e.set || 1) !== n) return;
        if (e.winningTeam === 'team1') a++;
        else if (e.winningTeam === 'team2') b++;
      });
      return { a: a, b: b };
    }
    function winner(mm, evs, n) {
      var sc = score(evs, n),
        t = target(mm, n);
      if (Math.max(sc.a, sc.b) >= t && Math.abs(sc.a - sc.b) >= 2) return sc.a > sc.b ? 'team1' : 'team2';
      return null;
    }
    function summary(mm, evs) {
      var cur = (mm && mm.currentSet) || 1,
        res = [],
        wa = 0,
        wb = 0;
      for (var n = 1; n <= cur; n++) {
        var sc = score(evs, n),
          w = winner(mm, evs, n);
        if (w === 'team1') wa++;
        else if (w === 'team2') wb++;
        res.push({ set: n, a: sc.a, b: sc.b, winner: w, target: target(mm, n) });
      }
      var need = setsToWin(mm),
        mw = wa >= need ? 'team1' : wb >= need ? 'team2' : null;
      return { sets: res, wonA: wa, wonB: wb, setsToWin: need, current: res[res.length - 1], matchWinner: mw };
    }
    return {
      setsToWin: setsToWin,
      decidingSet: decidingSet,
      target: target,
      score: score,
      winner: winner,
      summary: summary,
    };
  })();
})();
