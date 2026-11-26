/* VolleyLive capture charts: score progression, lead and player charts (drawProgression). */
(function () {
  'use strict';
  var P = window.VolleyCaptureCharts;
  var esc = window.VolleyDom.esc,
    DATA = P.DATA,
    PC = P.PC,
    PN = P.PN,
    GREY = P.GREY,
    GREEN = P.GREEN,
    RED = P.RED,
    cat = P.cat,
    ON_STATE = P.ON_STATE;
  var PROG_FIRST = true,
    progHide = null; // hides the open progression tooltip
  document.addEventListener('click', function () {
    if (progHide) progHide();
    Array.prototype.forEach.call(document.querySelectorAll('.ptip'), function (x) {
      x.style.display = 'none';
    });
  });
  function drawProgression() {
    var svg = document.getElementById('chart');
    svg.innerHTML = '';
    document.getElementById('legend').innerHTML = '';
    document.getElementById('players').innerHTML = '';
    var MM = window.VolleyCapture.match,
      NUMS =
        MM && MM.team && MM.team.players && MM.team.players.length ? MM.team.players.slice() : [1, 2, 3, 4, 5, 6, 7];
    var pt = document.getElementById('progTitle');
    if (pt) {
      var lp = DATA.length ? DATA[DATA.length - 1] : { a: 0, b: 0 };
      pt.textContent = MM
        ? 'Set ' +
          (MM.currentSet || 1) +
          ' score progression - ' +
          (MM.team.name || 'Team A') +
          ' ' +
          lp.a +
          ' : ' +
          lp.b +
          ' ' +
          (MM.opponent.name || 'Team B')
        : 'Set score progression';
    }
    var CATS = [];
    NUMS.forEach(function (k) {
      CATS.push({ id: 'A' + k, name: 'A - player ' + k + (PN[k] ? ' (' + PN[k] + ')' : ''), col: PC[k] || GREY });
    });
    CATS.push({ id: 'A0', name: 'A - point on B error', col: GREY });
    CATS.push({ id: 'BP', name: 'B - positive action', col: GREEN });
    CATS.push({ id: 'BE', name: 'B - point on A error', col: RED });
    var colOf = {};
    CATS.forEach(function (c) {
      colOf[c.id] = c;
    });
    var on = ON_STATE;
    CATS.forEach(function (c) {
      if (!(c.id in on)) on[c.id] = true;
    });
    var W = 1200,
      H = 724,
      L = 60,
      R = 24,
      T = 20;
    var N = Math.max(1, DATA.length),
      MAXS = 0;
    DATA.forEach(function (p) {
      MAXS = Math.max(MAXS, p.a, p.b);
    });
    var YMAX = Math.ceil((MAXS + 1) / 2) * 2;
    var pw = W - L - R,
      ph = 330,
      dT = T + ph + 18,
      dh = 110;
    function X(n) {
      return L + (pw * n) / N;
    }
    function Y(s) {
      return T + ph - (ph * s) / YMAX;
    }
    var NS = 'http://www.w3.org/2000/svg';
    function el(t, a, p) {
      var e = document.createElementNS(NS, t);
      for (var k in a) e.setAttribute(k, a[k]);
      (p || svg).appendChild(e);
      return e;
    }
    // grid + axes (integers only)
    for (var s = 0; s <= YMAX; s += 2) {
      el('line', { x1: L, x2: W - R, y1: Y(s), y2: Y(s), class: 'grid' });
      var t = el('text', { x: L - 8, y: Y(s) + 4, 'text-anchor': 'end', class: 'tick' });
      t.textContent = s;
    }
    for (var n = 0; n <= N; n += 2) {
      el('line', { x1: X(n), x2: X(n), y1: T, y2: T + ph, class: 'grid' });
      el('line', { x1: X(n), x2: X(n), y1: dT, y2: dT + dh, class: 'grid' });
      var t2 = el('text', { x: X(n), y: dT + dh + 16, 'text-anchor': 'middle', class: 'tick' });
      t2.textContent = n;
    }
    el('line', { x1: L, x2: L, y1: T, y2: T + ph, class: 'axis' });
    el('line', { x1: L, x2: W - R, y1: T + ph, y2: T + ph, class: 'axis' });
    var yl = el('text', {
      x: 16,
      y: T + ph / 2,
      'text-anchor': 'middle',
      class: 'lbl',
      transform: 'rotate(-90 16 ' + (T + ph / 2) + ')',
    });
    yl.textContent = 'Score';
    var xl = el('text', { x: L + pw / 2, y: dT + dh + 34, 'text-anchor': 'middle', class: 'lbl' });
    xl.textContent = 'Point number';
    // score lines
    function path(key, col, dash) {
      var d = 'M' + X(0) + ' ' + Y(0);
      DATA.forEach(function (p) {
        d += ' L' + X(p.n) + ' ' + Y(p[key]);
      });
      el('path', {
        d: d,
        fill: 'none',
        stroke: col,
        'stroke-width': 2.5,
        'stroke-dasharray': dash || '',
        'stroke-linejoin': 'round',
      });
    }
    path('a', '#1F3864');
    path('b', '#555', '7 5');
    var lg = el('text', { x: L + 8, y: T + 14, class: 'tick' });
    lg.innerHTML =
      '<tspan fill="#1F3864" font-weight="700">&#8212; Team A score</tspan>  <tspan fill="#555" font-weight="700">- - Team B score</tspan>';
    // lead bars (A - B) under the score chart: green = A ahead, red = B ahead
    var DV = DATA.map(function (p) {
      return p.a - p.b;
    });
    var DHI = Math.max(1, Math.max.apply(null, DV)) + 1,
      DLO = Math.min(-1, Math.min.apply(null, DV)) - 1;
    function YD(v) {
      return dT + dh - (dh * (v - DLO)) / (DHI - DLO);
    }
    for (var v = DLO; v <= DHI; v++) {
      el('line', { x1: L, x2: W - R, y1: YD(v), y2: YD(v), class: 'grid' });
      var dtx = el('text', { x: L - 8, y: YD(v) + 4, 'text-anchor': 'end', class: 'tick' });
      dtx.textContent = v;
    }
    el('line', { x1: L, x2: L, y1: dT, y2: dT + dh, class: 'axis' });
    var bw = Math.max(2, (pw / N) * 0.72);
    DATA.forEach(function (p, i) {
      var d = DV[i];
      if (d === 0) return;
      var top = d > 0 ? YD(d) : YD(0),
        hh = Math.abs(YD(d) - YD(0));
      el('rect', { x: X(p.n) - bw / 2, y: top, width: bw, height: hh, fill: d > 0 ? GREEN : RED, rx: 1 });
    });
    el('line', { x1: L, x2: W - R, y1: YD(0), y2: YD(0), stroke: '#555', 'stroke-width': 1.5 });
    var dyl = el('text', {
      x: 16,
      y: dT + dh / 2,
      'text-anchor': 'middle',
      class: 'lbl',
      transform: 'rotate(-90 16 ' + (dT + dh / 2) + ')',
    });
    dyl.textContent = 'Lead A-B';
    var dlg = el('text', { x: L + 8, y: dT + 12, class: 'tick' });
    dlg.innerHTML =
      '<tspan fill="' +
      GREEN +
      '" font-weight="700">&#9632; A ahead</tspan>  <tspan fill="' +
      RED +
      '" font-weight="700">&#9632; B ahead</tspan>';
    // hover / tap on each point (column) -> tooltip
    var tip = document.getElementById('tip'),
      card = document.querySelector('.card');
    function reason(p) {
      if (p.c === 'T') return p.w === 'A' ? 'Point by team A' : 'Point on team A error';
      if (p.w === 'A')
        return p.c === 0
          ? 'Point on team B error'
          : 'Point by player ' + esc(p.c) + (PN[p.c] ? ' (' + esc(PN[p.c]) + ')' : '');
      return p.c === 0
        ? 'Positive action by team B'
        : 'Point on team A error by player ' + esc(p.c) + (PN[p.c] ? ' (' + esc(PN[p.c]) + ')' : '');
    }
    var hl = el('rect', {
      x: 0,
      y: T,
      width: pw / N,
      height: dT + dh - T,
      fill: '#1F3864',
      'fill-opacity': 0.08,
      style: 'display:none;pointer-events:none',
    });
    var markers = [];
    DATA.forEach(function (p, i) {
      var cw0 = pw / N;
      var r = el('rect', {
        x: X(p.n) - cw0 / 2,
        y: T,
        width: cw0,
        height: dT + dh - T,
        fill: 'transparent',
        style: 'cursor:pointer',
      });
      var id = cat(p),
        c = colOf[id] ? colOf[id].col : GREY,
        cy = p.w === 'A' ? Y(p.a) : Y(p.b);
      var m = el('circle', { cx: X(p.n), cy: cy, r: 7, fill: c, class: 'pt' });
      m.style.pointerEvents = 'none';
      if (c === '#FDD835') m.style.stroke = '#555';
      m._p = p;
      m._id = id;
      markers.push(m);
      function show() {
        m.setAttribute('r', 10);
        hl.setAttribute('x', X(p.n) - cw0 / 2);
        hl.style.display = '';
        var d = DV[i];
        tip.innerHTML =
          '<b>P' +
          esc(p.n) +
          '</b> &nbsp; A ' +
          esc(p.a) +
          ' : ' +
          esc(p.b) +
          ' B &nbsp; (lead ' +
          (d > 0 ? '+' : '') +
          d +
          ')<br>' +
          reason(p);
        tip.style.display = 'block';
        var cr = card.getBoundingClientRect(),
          mr = r.getBoundingClientRect();
        var x = mr.left - cr.left + mr.width / 2 + 14,
          y = mr.top - cr.top + 30;
        if (x + tip.offsetWidth > cr.width) x = mr.left - cr.left - tip.offsetWidth - 14;
        tip.style.left = Math.max(4, x) + 'px';
        tip.style.top = y + 'px';
      }
      function hide() {
        m.setAttribute('r', 7);
        hl.style.display = 'none';
        tip.style.display = 'none';
      }
      r.addEventListener('mouseenter', show);
      r.addEventListener('mouseleave', hide);
      r.addEventListener('click', function (e) {
        e.stopPropagation();
        show();
      });
    });
    progHide = function () {
      tip.style.display = 'none';
      hl.style.display = 'none';
    };
    function mix(hex, t) {
      var n = parseInt(hex.slice(1), 16),
        r = n >> 16,
        g = (n >> 8) & 255,
        b = n & 255;
      function m(c) {
        return Math.round(c + (255 - c) * t);
      }
      return 'rgb(' + m(r) + ',' + m(g) + ',' + m(b) + ')';
    }
    // score strip (Score A / Score B after each point) then action strip (same colours as the spreadsheet rows 13/14)
    var sy = dT + dh + 74,
      ch = 24,
      cw = Math.min(pw / N - 2, 24),
      sy2 = sy + 2 * (ch + 4);
    var sn = el('text', { x: L - 8, y: sy - 6, 'text-anchor': 'end', class: 'tick' });
    sn.textContent = 'Point';
    DATA.forEach(function (p) {
      var nt = el('text', { x: X(p.n), y: sy - 6, 'text-anchor': 'middle', class: 'tick', 'font-size': '9' });
      nt.textContent = p.n;
    });
    // run (streak) length before each point: 0 = first point of a streak
    var RUN = DATA.map(function (p, i) {
      var r = 0;
      for (var j = i - 1; j >= 0 && DATA[j].w === p.w; j--) r++;
      return r;
    });
    // score table colours (same for both teams): dark grey = team scored, light grey = score unchanged
    // streak (2nd, 3rd... consecutive point): vivid green for A, vivid red for B (no gradation)
    var STREAK = { A: '#00B33C', B: '#FF0000' },
      DARK = '#555555'; // vivid green / vivid red
    [
      ['Score A', 'a', 'A'],
      ['Score B', 'b', 'B'],
    ].forEach(function (r, ri) {
      var yy = sy + ri * (ch + 4);
      var lb = el('text', { x: L - 8, y: yy + ch / 2 + 4, 'text-anchor': 'end', class: 'tick' });
      lb.textContent = r[0];
      DATA.forEach(function (p, i) {
        var scored = p.w === r[2];
        var fillc, txtc;
        if (!scored) {
          fillc = mix(DARK, 0.75);
          txtc = DARK;
        } // score unchanged: light grey (75% lighter)
        else if (RUN[i] === 0) {
          fillc = DARK;
          txtc = '#fff';
        } // first point of a streak (or isolated point): dark grey
        else {
          fillc = STREAK[r[2]];
          txtc = '#fff';
        } // following points of a streak: green (A) / red (B)
        var g = el('g', { class: 'cell' });
        el('rect', { x: X(p.n) - cw / 2, y: yy, width: cw, height: ch, fill: fillc, rx: 2 }, g);
        var tx = el('text', { x: X(p.n), y: yy + ch / 2 + 4, 'text-anchor': 'middle', fill: txtc }, g);
        tx.textContent = p[r[1]];
      });
    });
    var sa = el('text', { x: L - 8, y: sy2 + ch / 2 + 4, 'text-anchor': 'end', class: 'tick' });
    sa.textContent = 'Action A';
    var sb = el('text', { x: L - 8, y: sy2 + ch + 4 + ch / 2 + 4, 'text-anchor': 'end', class: 'tick' });
    sb.textContent = 'Action B';
    var cells = [];
    DATA.forEach(function (p) {
      var id = cat(p),
        c = colOf[id] ? colOf[id].col : GREY,
        row = p.w === 'A' ? 0 : 1,
        cx = X(p.n) - cw / 2;
      var g = el('g', { class: 'cell' });
      el('rect', { x: cx, y: sy2 + row * (ch + 4), width: cw, height: ch, fill: c, rx: 2 }, g);
      var tx = el(
        'text',
        {
          x: cx + cw / 2,
          y: sy2 + row * (ch + 4) + ch / 2 + 4,
          'text-anchor': 'middle',
          fill: c === '#FDD835' ? '#000' : '#fff',
        },
        g
      );
      tx.textContent = p.c === 0 ? 'A' : p.c; // code 0 is displayed as 'A'
      cells.push({ g: g, id: id });
    });
    // legend with filters
    var lgd = document.getElementById('legend');
    function apply() {
      markers.forEach(function (m) {
        m.style.display = on[m._id] ? '' : 'none';
      });
      cells.forEach(function (c) {
        c.g.style.display = on[c.id] ? '' : 'none';
      });
    }
    CATS.forEach(function (c) {
      var lb = document.createElement('label');
      lb.innerHTML =
        '<input type="checkbox"' +
        (on[c.id] ? ' checked' : '') +
        '><span class="sw" style="background:' +
        c.col +
        '"></span>' +
        esc(c.name);
      lb.querySelector('input').addEventListener('change', function (e) {
        on[c.id] = e.target.checked;
        apply();
      });
      lb._cb = lb.querySelector('input');
      lgd.appendChild(lb);
    });
    function setAll(v) {
      CATS.forEach(function (c) {
        on[c.id] = v;
      });
      Array.prototype.forEach.call(lgd.querySelectorAll('input'), function (i) {
        i.checked = v;
      });
      apply();
    }
    document.getElementById('all').onclick = function () {
      setAll(true);
    };
    document.getElementById('none').onclick = function () {
      setAll(false);
    };
    if (PROG_FIRST) {
      PROG_FIRST = false;
      setAll(true);
    } else apply(); // default: all indicators selected (use Clear all or the checkboxes to hide some)
    // ---- per-attacker chart: cumulative points + differential (points - errors) on the same graph
    var ATT = (function () {
      var m = window.VolleyCapture.match;
      if (!m || !m.team || !m.team.roster) return [5, 6, 7];
      return m.team.roster
        .filter(function (r) {
          return r.position === 'oh' || r.position === 'mb' || r.position === 'opp';
        })
        .map(function (r) {
          return r.number;
        })
        .filter(function (n) {
          return DATA.some(function (p) {
            return p.c === n;
          });
        });
    })(); // attackers: 5 & 6 = OH, 7 = OPP (edit to add e.g. 4 = MB)
    var LINE = { 6: '#E0A800' }; // darker line for the yellow player (readability)
    var DIFFC = '#263238';
    var ERRC = '#FF0000'; // vivid red for errors
    function pale(hex) {
      var n = parseInt(hex.slice(1), 16),
        r = n >> 16,
        g = (n >> 8) & 255,
        b = n & 255;
      function m(c) {
        return Math.round(c + (255 - c) * 0.55);
      }
      return 'rgb(' + m(r) + ',' + m(g) + ',' + m(b) + ')';
    }
    // colour of the differential curve
    var host = document.getElementById('players');
    var cum = {},
      err = {},
      dif = {};
    ATT.forEach(function (k) {
      var t = 0,
        e = 0;
      cum[k] = [];
      err[k] = [];
      dif[k] = [];
      DATA.forEach(function (p) {
        if (p.w === 'A' && p.c === k) t++;
        if (p.w === 'B' && p.c === k) e++;
        cum[k].push(t);
        err[k].push(e);
        dif[k].push(t - e);
      });
    });
    var HI = 1,
      LO = 0;
    ATT.forEach(function (k) {
      HI = Math.max(HI, cum[k][N - 1], Math.max.apply(null, dif[k]));
      LO = Math.min(LO, Math.min.apply(null, dif[k]));
    });
    HI += 1;
    LO -= 1;
    function stepPts(vals, Yf) {
      var a = [[X(0), Yf(0)]],
        prev = 0;
      DATA.forEach(function (p, i) {
        var c = vals[i];
        a.push([X(p.n), Yf(prev)]);
        a.push([X(p.n), Yf(c)]);
        prev = c;
      });
      return a;
    }
    function bandPath(v1, v2, Yf) {
      var a = stepPts(v1, Yf),
        b = stepPts(v2, Yf).reverse();
      return (
        'M' +
        a
          .concat(b)
          .map(function (q) {
            return q[0] + ' ' + q[1];
          })
          .join(' L') +
        ' Z'
      );
    }
    function stepPath(vals, Yf) {
      var d = 'M' + X(0) + ' ' + Yf(0),
        prev = 0;
      DATA.forEach(function (p, i) {
        var c = vals[i];
        d += ' L' + X(p.n) + ' ' + Yf(prev) + ' L' + X(p.n) + ' ' + Yf(c);
        prev = c;
      });
      return d;
    }
    // ---- consolidated charts (3 attackers): points scored, then differential - curves only
    function consolidated(title, series, styleFn, ylabel) {
      var H2 = 300,
        T2 = 16,
        B2 = 44,
        ph2 = H2 - T2 - B2;
      function Y2(v) {
        return T2 + ph2 - (ph2 * (v - LO)) / (HI - LO);
      }
      var cd = document.createElement('div');
      cd.className = 'card';
      cd.style.marginTop = '14px';
      var h = document.createElement('h2');
      h.textContent = title;
      cd.appendChild(h);
      var sv = document.createElementNS(NS, 'svg');
      sv.setAttribute('viewBox', '0 0 ' + W + ' ' + H2);
      sv.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      cd.appendChild(sv);
      var lg = document.createElement('div');
      lg.className = 'legend';
      lg.style.marginTop = '4px';
      ATT.forEach(function (k) {
        var st = styleFn(k);
        lg.innerHTML +=
          '<span><svg width="34" height="10"><line x1="0" y1="5" x2="34" y2="5" stroke="' +
          st.stroke +
          '" stroke-width="3"' +
          (st.dash ? ' stroke-dasharray="' + st.dash + '"' : '') +
          '/></svg> Player ' +
          esc(k) +
          (PN[k] ? ' (' + esc(PN[k]) + ')' : '') +
          '</span>';
      });
      cd.appendChild(lg);
      host.appendChild(cd);
      function e2(t, a) {
        var e = document.createElementNS(NS, t);
        for (var q in a) e.setAttribute(q, a[q]);
        sv.appendChild(e);
        return e;
      }
      for (var v = LO; v <= HI; v++) {
        e2('line', { x1: L, x2: W - R, y1: Y2(v), y2: Y2(v), class: 'grid' });
        var yt = e2('text', { x: L - 8, y: Y2(v) + 4, 'text-anchor': 'end', class: 'tick' });
        yt.textContent = v;
      }
      for (var n = 0; n <= N; n += 2) {
        e2('line', { x1: X(n), x2: X(n), y1: T2, y2: T2 + ph2, class: 'grid' });
        var xt = e2('text', { x: X(n), y: T2 + ph2 + 16, 'text-anchor': 'middle', class: 'tick' });
        xt.textContent = n;
      }
      e2('line', { x1: L, x2: L, y1: T2, y2: T2 + ph2, class: 'axis' });
      e2('line', { x1: L, x2: W - R, y1: T2 + ph2, y2: T2 + ph2, class: 'axis' });
      e2('line', { x1: L, x2: W - R, y1: Y2(0), y2: Y2(0), stroke: '#666', 'stroke-width': 1.5 });
      var xl2 = e2('text', { x: L + pw / 2, y: T2 + ph2 + 36, 'text-anchor': 'middle', class: 'lbl' });
      xl2.textContent = 'Point number';
      var yl2 = e2('text', {
        x: 16,
        y: T2 + ph2 / 2,
        'text-anchor': 'middle',
        class: 'lbl',
        transform: 'rotate(-90 16 ' + (T2 + ph2 / 2) + ')',
      });
      yl2.textContent = ylabel;
      // vertical dodge: when several players share the same value on a segment, spread their lines by a few pixels
      var DG = 4.5,
        off = {};
      ATT.forEach(function (k) {
        off[k] = [];
      });
      for (var i = -1; i < N; i++) {
        var groups = {};
        ATT.forEach(function (k) {
          var v = i < 0 ? 0 : series[k][i];
          (groups[v] = groups[v] || []).push(k);
        });
        for (var v in groups) {
          var g = groups[v];
          g.forEach(function (k, j) {
            off[k][i + 1] = (j - (g.length - 1) / 2) * DG;
          });
        }
      }
      ATT.forEach(function (k) {
        var st = styleFn(k),
          pts = [],
          prevV = 0,
          prevO = off[k][0];
        pts.push([X(0), Y2(0) + prevO]);
        DATA.forEach(function (p, i) {
          var v = series[k][i],
            o = off[k][i + 1];
          pts.push([X(p.n), Y2(prevV) + prevO]);
          pts.push([X(p.n), Y2(v) + o]);
          prevV = v;
          prevO = o;
        });
        var d =
          'M' +
          pts
            .map(function (q) {
              return q[0] + ' ' + q[1];
            })
            .join(' L');
        e2('path', {
          d: d,
          fill: 'none',
          stroke: st.stroke,
          'stroke-width': 3,
          'stroke-dasharray': st.dash || '',
          'stroke-linejoin': 'round',
        });
      });
    }
    if (ATT.length)
      consolidated(
        'All attackers - points scored over time',
        cum,
        function (k) {
          return { stroke: LINE[k] || PC[k] };
        },
        'Points'
      );
    if (ATT.length)
      consolidated(
        'All attackers - differential (points - errors)',
        dif,
        function (k) {
          return { stroke: LINE[k] || PC[k] };
        },
        'Differential'
      );
    ATT.forEach(function (k) {
      var col = PC[k],
        lc = LINE[k] || col,
        H2 = 300,
        T2 = 16,
        B2 = 44,
        ph2 = H2 - T2 - B2;
      function Y2(v) {
        return T2 + ph2 - (ph2 * (v - LO)) / (HI - LO);
      }
      var cd = document.createElement('div');
      cd.className = 'card';
      cd.style.marginTop = '14px';
      var h = document.createElement('h2');
      h.innerHTML =
        '<span class="sw" style="background:' +
        col +
        '"></span>Player ' +
        esc(k) +
        (PN[k] ? ' (' + esc(PN[k]) + ')' : '') +
        ' - points scored: ' +
        cum[k][N - 1] +
        ' | errors: ' +
        err[k][N - 1] +
        ' | differential: ' +
        (dif[k][N - 1] > 0 ? '+' : '') +
        dif[k][N - 1];
      cd.appendChild(h);
      var sv = document.createElementNS(NS, 'svg');
      sv.setAttribute('viewBox', '0 0 ' + W + ' ' + H2);
      sv.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      cd.appendChild(sv);
      var lg = document.createElement('div');
      lg.className = 'legend';
      lg.style.marginTop = '4px';
      lg.innerHTML =
        '<span><svg width="34" height="10"><line x1="0" y1="5" x2="34" y2="5" stroke="' +
        lc +
        '" stroke-width="3"/></svg> Points scored (cumulative)</span>' +
        '<span><svg width="34" height="10"><line x1="0" y1="5" x2="34" y2="5" stroke="' +
        pale(lc) +
        '" stroke-width="3" stroke-dasharray="6 4"/></svg> Differential (points - errors)</span>' +
        '<span><span class="sw" style="background:' +
        ERRC +
        '"></span> Error committed</span>';
      cd.appendChild(lg);
      var tp = document.createElement('div');
      tp.className = 'ptip';
      cd.appendChild(tp);
      host.appendChild(cd);
      function e2(t, a) {
        var e = document.createElementNS(NS, t);
        for (var q in a) e.setAttribute(q, a[q]);
        sv.appendChild(e);
        return e;
      }
      for (var v = LO; v <= HI; v++) {
        e2('line', { x1: L, x2: W - R, y1: Y2(v), y2: Y2(v), class: 'grid' });
        var yt = e2('text', { x: L - 8, y: Y2(v) + 4, 'text-anchor': 'end', class: 'tick' });
        yt.textContent = v;
      }
      for (var n = 0; n <= N; n += 2) {
        e2('line', { x1: X(n), x2: X(n), y1: T2, y2: T2 + ph2, class: 'grid' });
        var xt = e2('text', { x: X(n), y: T2 + ph2 + 16, 'text-anchor': 'middle', class: 'tick' });
        xt.textContent = n;
      }
      e2('line', { x1: L, x2: L, y1: T2, y2: T2 + ph2, class: 'axis' });
      e2('line', { x1: L, x2: W - R, y1: T2 + ph2, y2: T2 + ph2, class: 'axis' });
      e2('line', { x1: L, x2: W - R, y1: Y2(0), y2: Y2(0), stroke: '#666', 'stroke-width': 1.5 });
      var xl2 = e2('text', { x: L + pw / 2, y: T2 + ph2 + 36, 'text-anchor': 'middle', class: 'lbl' });
      xl2.textContent = 'Point number';
      var yl2 = e2('text', {
        x: 16,
        y: T2 + ph2 / 2,
        'text-anchor': 'middle',
        class: 'lbl',
        transform: 'rotate(-90 16 ' + (T2 + ph2 / 2) + ')',
      });
      yl2.textContent = 'Points / Differential';
      // curves
      var zero = dif[k].map(function () {
          return 0;
        }),
        difPos = dif[k].map(function (v) {
          return Math.max(v, 0);
        });
      e2('path', { d: bandPath(zero, difPos, Y2), fill: lc, 'fill-opacity': 0.5, stroke: 'none' }); // area under the differential curve: 50% of the reference colour
      e2('path', { d: bandPath(cum[k], dif[k], Y2), fill: lc, 'fill-opacity': 0.25, stroke: 'none' }); // area between the top curve and the differential: 25% of the reference colour
      e2('path', {
        d: stepPath(dif[k], Y2),
        fill: 'none',
        stroke: pale(lc),
        'stroke-width': 3,
        'stroke-dasharray': '8 5',
        'stroke-linejoin': 'round',
      });
      e2('path', {
        d: stepPath(cum[k], Y2),
        fill: 'none',
        stroke: lc,
        'stroke-width': 3.5,
        'stroke-linejoin': 'round',
      });
      function attach(m, p, i, kind) {
        function show() {
          m.setAttribute('r', m.getAttribute('data-r') * 1.4);
          tp.innerHTML =
            '<b>P' +
            esc(p.n) +
            '</b> &nbsp; A ' +
            esc(p.a) +
            ' : ' +
            esc(p.b) +
            ' B<br>Player ' +
            esc(k) +
            (kind === 'err' ? ' error' : ' scores') +
            '<br>Points ' +
            cum[k][i] +
            ' / Errors ' +
            err[k][i] +
            ' / Diff ' +
            (dif[k][i] > 0 ? '+' : '') +
            dif[k][i];
          tp.style.display = 'block';
          var cr = cd.getBoundingClientRect(),
            mr = m.getBoundingClientRect();
          var x = mr.left - cr.left + mr.width / 2 + 12,
            y = mr.top - cr.top - 8;
          if (x + tp.offsetWidth > cr.width) x = mr.left - cr.left - tp.offsetWidth - 12;
          tp.style.left = Math.max(4, x) + 'px';
          tp.style.top = Math.max(4, y - tp.offsetHeight / 2) + 'px';
        }
        function hide() {
          m.setAttribute('r', m.getAttribute('data-r'));
          tp.style.display = 'none';
        }
        m.addEventListener('mouseenter', show);
        m.addEventListener('mouseleave', hide);
        m.addEventListener('click', function (ev) {
          ev.stopPropagation();
          show();
        });
      }
      // differential markers (drawn first, larger, dark ring) then points markers on top
      DATA.forEach(function (p, i) {
        var sc = p.w === 'A' && p.c === k,
          er = p.w === 'B' && p.c === k;
        if (!sc && !er) return;
        var m = e2('circle', {
          cx: X(p.n),
          cy: Y2(dif[k][i]),
          r: 6,
          'data-r': 6,
          fill: er ? ERRC : pale(col),
          class: 'pt',
        });
        if (!er && col === '#FDD835') m.style.stroke = '#555';
        attach(m, p, i, er ? 'err' : 'pt');
        var lab = e2('text', {
          x: X(p.n) + (er ? 0 : 13),
          y: Y2(dif[k][i]) + (er ? 22 : 19),
          'text-anchor': er ? 'middle' : 'start',
          class: 'tick',
        });
        lab.setAttribute('font-weight', '700');
        lab.setAttribute('fill', er ? ERRC : DIFFC);
        lab.style.paintOrder = 'stroke';
        lab.style.stroke = '#fff';
        lab.style.strokeWidth = '4px';
        lab.textContent = (dif[k][i] > 0 ? '+' : '') + dif[k][i];
      });
      DATA.forEach(function (p, i) {
        if (!(p.w === 'A' && p.c === k)) return;
        var m = e2('circle', { cx: X(p.n), cy: Y2(cum[k][i]), r: 6, 'data-r': 6, fill: col, class: 'pt' });
        if (col === '#FDD835') m.style.stroke = '#555';
        attach(m, p, i, 'pt');
        var pl = e2('text', { x: X(p.n), y: Y2(cum[k][i]) - 12, 'text-anchor': 'middle', class: 'tick' });
        pl.setAttribute('font-weight', '700');
        pl.setAttribute('fill', lc === '#E0A800' ? '#8a6d00' : lc);
        pl.style.paintOrder = 'stroke';
        pl.style.stroke = '#fff';
        pl.style.strokeWidth = '4px';
        pl.textContent = cum[k][i];
      });
    });
  }
  P.drawProgression = drawProgression;
})();
