(function () {
  var statsToggle = document.getElementById('statsToggle');
  var statsPanel = document.getElementById('statsPanel');
  var statsArrow = document.getElementById('statsArrow');
  statsToggle.addEventListener('click', function () {
    var open = statsToggle.getAttribute('aria-expanded') === 'true';
    open = !open;
    statsToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    statsPanel.hidden = !open;
    statsArrow.textContent = open ? '▲' : '▼';
  });
  var historyToggle = document.getElementById('historyToggle');
  var historyPanel = document.getElementById('historyPanel');
  var historyArrow = document.getElementById('historyArrow');
  historyToggle.addEventListener('click', function () {
    var open = historyToggle.getAttribute('aria-expanded') === 'true';
    open = !open;
    historyToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    historyPanel.hidden = !open;
    historyArrow.textContent = open ? '▲' : '▼';
  });
  var DATA = [];
  var STORAGE_DATA = 'volleyCapture.chartData.v1',
    STORAGE_EVENTS = 'volleyCapture.events.v1';
  try {
    var storedData = JSON.parse(localStorage.getItem(STORAGE_DATA) || 'null');
    if (Array.isArray(storedData))
      DATA = storedData.map(function (p) {
        if (p && p.c === 'A') p.c = 0;
        return p;
      });
  } catch (e) {}
  var PC = { 1: '#6A1B9A', 2: '#00ACC1', 3: '#FB8C00', 4: '#1E88E5', 5: '#EC407A', 6: '#FDD835', 7: '#6D4C41' };
  var PN = { 1: 'Setter', 2: 'Libero', 3: '', 4: 'MB', 5: 'OH', 6: 'OH', 7: 'OPP' };
  (function () {
    var m = window.VOLLEY_MATCH,
      RN = { setter: 'Setter', oh: 'OH', mb: 'MB', opp: 'OPP', libero: 'Libero' },
      PAL = [
        '#6A1B9A',
        '#00ACC1',
        '#FB8C00',
        '#1E88E5',
        '#EC407A',
        '#FDD835',
        '#6D4C41',
        '#43A047',
        '#8E24AA',
        '#F4511E',
        '#3949AB',
        '#00897B',
      ];
    if (m && m.team && m.team.roster) {
      PN = {};
      m.team.roster.forEach(function (r, i) {
        PN[r.number] = (r.name ? r.name + ' \u00B7 ' : '') + (RN[r.position] || '');
        if (!PC[r.number]) PC[r.number] = PAL[i % PAL.length];
      });
    }
  })();
  var GREY = '#9E9E9E',
    GREEN = '#2E7D32',
    RED = '#C62828';
  function cat(p) {
    if (p.w === 'A') return p.c === 0 ? 'A0' : 'A' + p.c;
    return p.c === 0 ? 'BP' : 'BE';
  }
  var ON_STATE = {},
    PROG_FIRST = true;
  window.__progHide = null;
  document.addEventListener('click', function () {
    if (window.__progHide) window.__progHide();
    Array.prototype.forEach.call(document.querySelectorAll('.ptip'), function (x) {
      x.style.display = 'none';
    });
  });
  function drawProgression() {
    var svg = document.getElementById('chart');
    svg.innerHTML = '';
    document.getElementById('legend').innerHTML = '';
    document.getElementById('players').innerHTML = '';
    var MM = window.VOLLEY_MATCH,
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
        return p.c === 0 ? 'Point on team B error' : 'Point by player ' + p.c + (PN[p.c] ? ' (' + PN[p.c] + ')' : '');
      return p.c === 0
        ? 'Positive action by team B'
        : 'Point on team A error by player ' + p.c + (PN[p.c] ? ' (' + PN[p.c] + ')' : '');
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
          p.n +
          '</b> &nbsp; A ' +
          p.a +
          ' : ' +
          p.b +
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
    window.__progHide = function () {
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
        c.name;
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
      var m = window.VOLLEY_MATCH;
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
          k +
          (PN[k] ? ' (' + PN[k] + ')' : '') +
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
        k +
        (PN[k] ? ' (' + PN[k] + ')' : '') +
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
            p.n +
            '</b> &nbsp; A ' +
            p.a +
            ' : ' +
            p.b +
            ' B<br>Player ' +
            k +
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
  function renderOriginPie(containerId, legendId, earned, given) {
    var c = document.getElementById(containerId),
      l = document.getElementById(legendId);
    if (!c || !l) return;
    var total = earned + given,
      green = '#16a34a',
      orange = '#f59e0b';
    if (total === 0) {
      c.innerHTML =
        '<svg viewBox="0 0 240 240" role="img" aria-label="No points"><circle cx="120" cy="120" r="82" fill="#e5e7eb"/><circle cx="120" cy="120" r="52" fill="#fff"/><text x="120" y="116" text-anchor="middle" font-size="30" font-weight="800" fill="#64748b">0</text><text x="120" y="140" text-anchor="middle" font-size="13" fill="#64748b">points</text></svg>';
      l.innerHTML = '';
      return;
    }
    var ep = (earned / total) * 100,
      gp = (given / total) * 100,
      r = 82,
      circ = 2 * Math.PI * r,
      elen = (circ * ep) / 100,
      glen = (circ * gp) / 100;
    c.innerHTML =
      '<svg viewBox="0 0 240 240" role="img" aria-label="' +
      earned +
      ' points won, ' +
      given +
      ' points given by opponent">' +
      '<circle cx="120" cy="120" r="' +
      r +
      '" fill="none" stroke="#e5e7eb" stroke-width="42"/>' +
      '<circle cx="120" cy="120" r="' +
      r +
      '" fill="none" stroke="' +
      green +
      '" stroke-width="42" stroke-dasharray="' +
      elen +
      ' ' +
      (circ - elen) +
      '" transform="rotate(-90 120 120)"/>' +
      '<circle cx="120" cy="120" r="' +
      r +
      '" fill="none" stroke="' +
      orange +
      '" stroke-width="42" stroke-dasharray="' +
      glen +
      ' ' +
      (circ - glen) +
      '" stroke-dashoffset="' +
      -elen +
      '" transform="rotate(-90 120 120)"/>' +
      '<text x="120" y="116" text-anchor="middle" font-size="32" font-weight="800" fill="#1f2937">' +
      total +
      '</text><text x="120" y="140" text-anchor="middle" font-size="13" fill="#64748b">classified points</text></svg>';
    l.innerHTML =
      '<div class="pie-legend-item"><span class="pie-color" style="background:' +
      green +
      '"></span>Points won <strong>' +
      earned +
      ' (' +
      ep.toFixed(0) +
      '%)</strong></div><div class="pie-legend-item"><span class="pie-color" style="background:' +
      orange +
      '"></span>Points from opponent errors <strong>' +
      given +
      ' (' +
      gp.toFixed(0) +
      '%)</strong></div>';
  }
  function updateOriginPies(events) {
    var aWon = 0,
      aGiven = 0,
      bWon = 0,
      bGiven = 0;
    (events || []).forEach(function (e) {
      if (e.winningTeam === 'team1' && e.pointOrigin === 'earned') aWon++;
      else if (e.winningTeam === 'team1' && e.pointOrigin === 'opponent_error') aGiven++;
      else if (e.winningTeam === 'team2' && e.pointOrigin === 'earned') bWon++;
      else if (e.winningTeam === 'team2' && e.pointOrigin === 'opponent_error') bGiven++;
    });
    renderOriginPie('teamAPie', 'teamAPieLegend', aWon, aGiven);
    renderOriginPie('teamBPie', 'teamBPieLegend', bWon, bGiven);
  }
  function errorSeries(events) {
    var a = 0,
      b = 0,
      pts = [{ x: 0, a: 0, b: 0, d: 0 }];
    (events || []).forEach(function (e, i) {
      // New model: opponent_error identifies which team committed the fault.
      // Fallback to player/result keeps old locally stored events readable.
      if (e.pointOrigin === 'opponent_error') {
        if (e.winningTeam === 'team1') b++;
        else if (e.winningTeam === 'team2') a++;
      } else if (e.result === 'error') {
        if (String(e.player) === 'A') b++;
        else a++;
      }
      pts.push({ x: i + 1, a: a, b: b, d: b - a });
    });
    return pts;
  }
  function renderErrorCharts(events) {
    var pts = errorSeries(events),
      trend = document.getElementById('errorTrendChart'),
      diff = document.getElementById('errorDiffChart');
    if (!trend || !diff) return;
    var W = 900,
      H = 300,
      L = 55,
      R = 25,
      T = 45,
      B = 45,
      n = Math.max(1, pts.length - 1),
      maxErr = 1;
    pts.forEach(function (p) {
      maxErr = Math.max(maxErr, p.a, p.b);
    });
    function X(x) {
      return L + (W - L - R) * (x / n);
    }
    function Y(v) {
      return T + (H - T - B) * (1 - v / maxErr);
    }
    var grid = '',
      ticks = '';
    for (var y = 0; y <= maxErr; y++) {
      var yy = Y(y);
      grid += '<line class="error-grid" x1="' + L + '" y1="' + yy + '" x2="' + (W - R) + '" y2="' + yy + '"/>';
      ticks +=
        '<text x="' +
        (L - 10) +
        '" y="' +
        (yy + 4) +
        '" text-anchor="end" font-size="11" fill="#64748b">' +
        y +
        '</text>';
    }
    var pa = pts
        .map(function (p) {
          return X(p.x) + ',' + Y(p.a);
        })
        .join(' '),
      pb = pts
        .map(function (p) {
          return X(p.x) + ',' + Y(p.b);
        })
        .join(' ');
    var dotsA = '',
      dotsB = '';
    pts.forEach(function (p) {
      dotsA += '<circle cx="' + X(p.x) + '" cy="' + Y(p.a) + '" r="3.5" fill="#1f3864"/>';
      dotsB += '<circle cx="' + X(p.x) + '" cy="' + Y(p.b) + '" r="3.5" fill="#666"/>';
    });
    var step = Math.max(1, Math.ceil(n / 10)),
      labels = '';
    for (var i = 0; i <= n; i += step) {
      labels +=
        '<text x="' +
        X(i) +
        '" y="' +
        (H - 14) +
        '" text-anchor="middle" font-size="10" fill="#64748b">' +
        i +
        '</text>';
    }
    trend.innerHTML =
      '<svg viewBox="0 0 ' +
      W +
      ' ' +
      H +
      '" role="img" aria-label="Cumulative errors for both teams">' +
      grid +
      ticks +
      '<line class="error-axis" x1="' +
      L +
      '" y1="' +
      (H - B) +
      '" x2="' +
      (W - R) +
      '" y2="' +
      (H - B) +
      '"/>' +
      labels +
      '<polyline class="error-a" points="' +
      pa +
      '"/>' +
      dotsA +
      '<polyline class="error-b" points="' +
      pb +
      '"/>' +
      dotsB +
      '<text x="' +
      L +
      '" y="22" font-size="12" font-weight="700" fill="#1f3864">Team A errors: ' +
      pts[pts.length - 1].a +
      '</text><text x="' +
      (L + 150) +
      '" y="22" font-size="12" font-weight="700" fill="#555">Team B errors: ' +
      pts[pts.length - 1].b +
      '</text></svg>';
    var DW = 900,
      DH = 300,
      mid = 145,
      plotH = 95,
      maxD = 1;
    pts.forEach(function (p) {
      maxD = Math.max(maxD, Math.abs(p.d));
    });
    var barW = Math.max(4, ((DW - L - R) / Math.max(1, n)) * 0.65),
      bars = '';
    pts.slice(1).forEach(function (p) {
      var h = (Math.abs(p.d) / maxD) * plotH,
        x = X(p.x) - barW / 2;
      if (p.d === 0) {
        bars += '<rect class="diff-zero" x="' + x + '" y="' + (mid - 1) + '" width="' + barW + '" height="2" rx="1"/>';
        return;
      }
      var yy = p.d > 0 ? mid - h : mid;
      bars +=
        '<rect class="' +
        (p.d > 0 ? 'diff-green' : 'diff-red') +
        '" x="' +
        x +
        '" y="' +
        yy +
        '" width="' +
        barW +
        '" height="' +
        h +
        '" rx="2"/>';
    });
    var dticks =
      '<text x="' +
      (L - 10) +
      '" y="' +
      (mid - plotH + 4) +
      '" text-anchor="end" font-size="11" fill="#64748b">+' +
      maxD +
      '</text><text x="' +
      (L - 10) +
      '" y="' +
      (mid + 4) +
      '" text-anchor="end" font-size="11" fill="#64748b">0</text><text x="' +
      (L - 10) +
      '" y="' +
      (mid + plotH + 4) +
      '" text-anchor="end" font-size="11" fill="#64748b">-' +
      maxD +
      '</text>';
    diff.innerHTML =
      '<svg viewBox="0 0 ' +
      DW +
      ' ' +
      DH +
      '" role="img" aria-label="Error differential Team A versus Team B">' +
      dticks +
      '<line class="error-grid" x1="' +
      L +
      '" y1="' +
      (mid - plotH) +
      '" x2="' +
      (DW - R) +
      '" y2="' +
      (mid - plotH) +
      '"/><line x1="' +
      L +
      '" y1="' +
      mid +
      '" x2="' +
      (DW - R) +
      '" y2="' +
      mid +
      '" stroke="#374151" stroke-width="2"/><line class="error-grid" x1="' +
      L +
      '" y1="' +
      (mid + plotH) +
      '" x2="' +
      (DW - R) +
      '" y2="' +
      (mid + plotH) +
      '"/>' +
      bars +
      '<text x="' +
      L +
      '" y="22" font-size="12" font-weight="700" fill="#3f7f35">Green: Team A fewer errors</text><text x="' +
      (L + 205) +
      '" y="22" font-size="12" font-weight="700" fill="#c43b32">Red: Team A more errors</text></svg>';
  }
  // ---- tablet capture, persistence and export ----
  (function captureModule() {
    var EVENTS = [];
    try {
      EVENTS = JSON.parse(localStorage.getItem(STORAGE_EVENTS) || '[]');
      if (!Array.isArray(EVENTS)) EVENTS = [];
    } catch (e) {
      EVENTS = [];
    }
    var choice = { player: null, action: null, result: null },
      step = 'player';
    var ORDER = {
      setter: ['set', 'service', 'block', 'defense', 'attack', 'reception'],
      oh: ['reception', 'attack', 'defense', 'service', 'block', 'set'],
      mb: ['block', 'attack', 'service', 'defense', 'set', 'reception'],
      opp: ['attack', 'block', 'service', 'defense', 'reception', 'set'],
      libero: ['reception', 'defense', 'set', 'service', 'attack', 'block'],
      adv: ['adverse'],
    };
    var ALAB = {
        reception: 'Reception',
        defense: 'Defense',
        set: 'Set (pass)',
        attack: 'Attack',
        block: 'Block',
        service: 'Service',
        adverse: 'Opponent action',
        team: 'Team',
        generic: 'Generic',
      },
      RLAB = { setter: 'Setter', oh: 'OH', mb: 'MB', opp: 'OPP', libero: 'Libero', adv: 'Opponent' };
    var chip = document.getElementById('pickChip'),
      backBtn = document.getElementById('captureBack');
    function rosterInfo(n) {
      var r = (window.VOLLEY_MATCH && VOLLEY_MATCH.team && VOLLEY_MATCH.team.roster) || [];
      for (var i = 0; i < r.length; i++) {
        if (r[i].number === Number(n)) return r[i];
      }
      return null;
    }
    function roleOfPlayer(p) {
      if (p === 'A') return 'adv';
      var i = rosterInfo(p);
      return i && i.position && ORDER[i.position] ? i.position : null;
    }
    function orderActions() {
      var list = document.getElementById('actionList'),
        role = roleOfPlayer(choice.player),
        ord = ORDER[role] || ['reception', 'defense', 'set', 'attack', 'block', 'service'];
      Array.prototype.forEach.call(list.querySelectorAll('[data-action]'), function (b) {
        b.hidden = ord.indexOf(b.getAttribute('data-action')) < 0;
      });
      ord.forEach(function (k, i) {
        var b = list.querySelector('[data-action="' + k + '"]');
        b.classList.toggle('top', i === 0);
        list.appendChild(b);
      });
    }
    function updateChip() {
      if (choice.player === null) {
        chip.hidden = true;
        backBtn.hidden = true;
        return;
      }
      var i = rosterInfo(choice.player),
        role = roleOfPlayer(choice.player),
        who =
          choice.player === 'A'
            ? 'ADVERSE'
            : choice.player === 'T'
              ? window.VOLLEY_MATCH.team.name || 'Team A'
              : '#' + choice.player + (i && i.name ? ' ' + i.name : '') + (role ? ' \u00B7 ' + RLAB[role] : '');
      chip.innerHTML =
        '<span>' +
        who +
        '</span>' +
        (choice.action ? '<span class="arrow">\u2192</span><span class="act">' + ALAB[choice.action] + '</span>' : '');
      chip.hidden = false;
      backBtn.hidden = false;
    }
    var status = document.getElementById('captureStatus'),
      hist = document.getElementById('captureHistory'),
      score = document.getElementById('liveScore');
    var MATCH = window.VOLLEY_MATCH,
      VS = window.VolleySets,
      KM_ = 'volleyCapture.match.v1';
    function curSet() {
      return (MATCH && MATCH.currentSet) || 1;
    }
    function lastScore() {
      if (MATCH) return VS.score(EVENTS, curSet());
      var p = DATA.length ? DATA[DATA.length - 1] : null;
      return { a: p ? p.a : 0, b: p ? p.b : 0 };
    }
    function rebuildData() {
      // chart data = scoring rallies of the current set, rebuilt from events
      if (!MATCH) return;
      DATA.length = 0;
      EVENTS.forEach(function (e) {
        if ((e.set || 1) !== curSet() || !e.winningTeam) return;
        DATA.push({
          n: DATA.length + 1,
          a: e.scoreA,
          b: e.scoreB,
          w: e.winningTeam === 'team1' ? 'A' : 'B',
          c: e.player === 'A' ? 0 : e.player,
          action: e.action,
          result: e.result,
          winningTeam: e.winningTeam,
          pointOrigin: e.pointOrigin,
          ts: e.timestamp,
        });
      });
    }
    function saveMatch() {
      localStorage.setItem(KM_, JSON.stringify(MATCH));
    }
    function tn(t) {
      return t === 'team1' ? (MATCH && MATCH.team.name) || 'Team A' : (MATCH && MATCH.opponent.name) || 'Team B';
    }
    var attScope = 'set';
    function renderAttackers() {
      var g = document.getElementById('attGrid');
      if (!g || !MATCH) return;
      var evs =
        attScope === 'set'
          ? EVENTS.filter(function (e) {
              return (e.set || 1) === curSet();
            })
          : EVENTS;
      g.innerHTML = window.VolleyStats.cards(MATCH, evs);
    }
    document.querySelectorAll('#attSection [data-scope]').forEach(function (b) {
      b.addEventListener('click', function () {
        attScope = b.dataset.scope;
        document.querySelectorAll('#attSection [data-scope]').forEach(function (x) {
          x.classList.toggle('on', x === b);
        });
        renderAttackers();
      });
    });
    function exportReport() {
      if (!MATCH) {
        status.textContent = 'No match to report.';
        return;
      }
      var name =
        String(MATCH.name || 'match')
          .trim()
          .replace(/[\\/:*?"<>|]+/g, '')
          .replace(/\s+/g, '_')
          .slice(0, 80) + '_report.html';
      var blob = new Blob([window.VolleyReport.build(MATCH, EVENTS)], { type: 'text/html' });
      try {
        var file = new File([blob], name, { type: 'text/html' });
        if (
          navigator.canShare &&
          navigator.canShare({ files: [file] }) &&
          /iPhone|iPad|iPod/.test(navigator.userAgent)
        ) {
          navigator.share({ files: [file], title: name }).catch(function () {});
          document.getElementById('fileStatus').textContent = 'Report: ' + name;
          return;
        }
      } catch (x) {}
      var u = URL.createObjectURL(blob),
        a = document.createElement('a');
      a.href = u;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () {
        URL.revokeObjectURL(u);
      }, 1500);
      document.getElementById('fileStatus').textContent = 'Report: ' + name;
    }
    window.buildMatchReport = function () {
      return window.VolleyReport.build(MATCH, EVENTS);
    };
    window.__vlc = {
      commit: function (p, a, r) {
        choice = { player: p, action: a, result: r };
        commit(p);
      },
    };
    function renderSets() {
      var line = document.getElementById('setsLine'),
        box = document.getElementById('setOver'),
        panel = document.getElementById('capturePanel');
      if (!MATCH) {
        line.innerHTML = '';
        box.hidden = true;
        panel.classList.remove('locked');
        return;
      }
      var su = VS.summary(MATCH, EVENTS);
      line.innerHTML = '';
      var c = su.current,
        t = document.getElementById('setOverTitle'),
        tx = document.getElementById('setOverText'),
        nb = document.getElementById('nextSetBtn');
      if (su.matchWinner) {
        box.hidden = false;
        box.className = 'set-over match';
        t.textContent = 'MATCH WON BY ' + tn(su.matchWinner).toUpperCase();
        tx.textContent =
          'Sets ' +
          su.wonA +
          ' : ' +
          su.wonB +
          ' \u00B7 ' +
          su.sets
            .map(function (x) {
              return x.a + '-' + x.b;
            })
            .join(', ');
        nb.textContent = 'MATCH FINISHED';
        nb.dataset.mode = 'finished';
        nb.disabled = true;
        panel.classList.add('locked');
        if (MATCH.status !== 'completed') {
          MATCH.status = 'completed';
          saveMatch();
        }
      } else if (c && c.winner) {
        box.hidden = false;
        box.className = 'set-over set';
        nb.disabled = false;
        t.textContent = 'SET ' + c.set + ' FINISHED';
        tx.textContent =
          'Won by ' +
          tn(c.winner) +
          ' ' +
          Math.max(c.a, c.b) +
          '-' +
          Math.min(c.a, c.b) +
          ' \u00B7 Sets ' +
          su.wonA +
          ' : ' +
          su.wonB;
        nb.textContent =
          'START SET ' + (c.set + 1) + (c.set + 1 === VS.decidingSet(MATCH) ? ' (to 15)' : '') + ' \u2192';
        nb.dataset.mode = 'next';
        nb.disabled = false;
        panel.classList.add('locked');
      } else {
        box.hidden = true;
        nb.disabled = false;
        panel.classList.remove('locked');
        if (MATCH.status === 'completed') {
          MATCH.status = 'in_progress';
          saveMatch();
        }
      }
    }
    function showStep(name) {
      step = name;
      document.querySelectorAll('#capturePanel .step').forEach(function (x) {
        x.classList.toggle('active', x.getAttribute('data-step') === name);
      });
      updateChip();
    }
    var deleteLockedUntil = 0,
      deleteTimer = null,
      DELETE_LOCK_MS = 450;
    window.VLC_HISTORY_DELETE_LOCK_MS = DELETE_LOCK_MS;
    window.VLC_HISTORY_DELETES_BLOCKED = window.VLC_HISTORY_DELETES_BLOCKED || 0;
    function isDeleteLocked() {
      return Date.now() < deleteLockedUntil;
    }
    function armDeleteGuard() {
      deleteLockedUntil = Date.now() + DELETE_LOCK_MS;
      clearTimeout(deleteTimer);
      deleteTimer = setTimeout(function () {
        render();
      }, DELETE_LOCK_MS);
    }
    function historyRow(e, isLatest) {
      var tr = document.createElement('tr'),
        rk = e.result === 'error' ? 'error' : e.result === 'point' ? 'point' : 'neutral',
        rl = rk.charAt(0).toUpperCase() + rk.slice(1);
      if (isLatest) tr.className = 'history-latest';
      tr.innerHTML =
        '<td>' +
        e.id +
        '</td><td>' +
        e.player +
        '</td><td>' +
        e.action +
        '</td><td><span class="result-badge result-' +
        rk +
        '">' +
        rl +
        '</span></td><td><div class="history-score-cell"><span>' +
        e.scoreA +
        ' : ' +
        e.scoreB +
        '</span>' +
        (isLatest
          ? '<button type="button" class="history-delete" data-delete-last aria-label="Delete last action" title="Delete last action"' +
            (isDeleteLocked() ? ' disabled' : '') +
            '>Delete</button>'
          : '') +
        '</div></td>';
      return tr;
    }
    function render() {
      var sc = lastScore(),
        suHead = MATCH ? VS.summary(MATCH, EVENTS) : { wonA: 0, wonB: 0 };
      score.classList.remove('lead', 'trail', 'tie');
      score.classList.add(sc.a > sc.b ? 'lead' : sc.a < sc.b ? 'trail' : 'tie');
      score.innerHTML =
        '<span class="set-badge set-badge-a" aria-label="Sets won by ' +
        tn('team1') +
        '">' +
        suHead.wonA +
        '</span><span class="score-side side-a"><span class="digit-box" aria-label="' +
        tn('team1') +
        ' score">' +
        sc.a +
        '</span><span class="service-line" aria-hidden="true"></span></span><span class="sep">:</span><span class="score-side side-b"><span class="digit-box" aria-label="' +
        tn('team2') +
        ' score">' +
        sc.b +
        '</span><span class="service-line" aria-hidden="true"></span></span><span class="set-badge set-badge-b" aria-label="Sets won by ' +
        tn('team2') +
        '">' +
        suHead.wonB +
        '</span>';
      score.title =
        tn('team1') + ' ' + sc.a + ' : ' + sc.b + ' ' + tn('team2') + ' · Sets ' + suHead.wonA + ' : ' + suHead.wonB;
      hist.innerHTML = '';
      renderSets();
      renderAttackers();
      if (!EVENTS.length) {
        var empty = document.createElement('tr');
        empty.className = 'history-empty';
        empty.innerHTML = '<td colspan="5">No action recorded.</td>';
        hist.appendChild(empty);
      } else
        EVENTS.slice()
          .reverse()
          .forEach(function (e, index) {
            hist.appendChild(historyRow(e, index === 0));
          });
      status.innerHTML = EVENTS.length
        ? '<span class="last-event">Last:</span> #' +
          EVENTS[EVENTS.length - 1].player +
          ' ' +
          EVENTS[EVENTS.length - 1].action +
          ' / ' +
          EVENTS[EVENTS.length - 1].result
        : 'Ready for a new action.';
      updateOriginPies(EVENTS);
      renderErrorCharts(EVENTS);
      if (window.updateCourt) window.updateCourt(EVENTS);
      drawProgression();
    }
    function persist(msg) {
      localStorage.setItem(STORAGE_DATA, JSON.stringify(DATA));
      localStorage.setItem(STORAGE_EVENTS, JSON.stringify(EVENTS));
      if (msg) status.textContent = msg;
    }
    window.VLCLogSubstitution = function (ev) {
      EVENTS.push(ev);
      persist();
      render();
    };
    function currentRotationNumber() {
      if (!MATCH || !MATCH.startingRotation || !window.VolleyRotation) return null;
      var cs = MATCH.currentSet || 1,
        setEvents = EVENTS.filter(function (e) {
          return (e.set || 1) === cs;
        });
      return window.VolleyRotation.replay(MATCH, setEvents).rotations;
    }
    function commit(player) {
      if (MATCH) {
        var su0 = VS.summary(MATCH, EVENTS);
        if (su0.matchWinner || (su0.current && su0.current.winner)) {
          renderSets();
          return;
        }
      }
      var sc = lastScore(),
        a = sc.a,
        b = sc.b;
      var playerValue = player === 'A' || player === 'T' ? player : Number(player);
      var winningTeam = null,
        pointOrigin = null;
      if (choice.result === 'point') {
        if (playerValue === 'A') {
          winningTeam = 'team2';
          pointOrigin = 'earned';
        } else {
          winningTeam = 'team1';
          pointOrigin = 'earned';
        }
      } else if (choice.result === 'error') {
        if (playerValue === 'A') {
          winningTeam = 'team1';
          pointOrigin = 'opponent_error';
        } else {
          winningTeam = 'team2';
          pointOrigin = 'opponent_error';
        }
      }
      if (winningTeam === 'team1') a++;
      else if (winningTeam === 'team2') b++;
      var runtimeContext = window.VLC_RUNTIME_CONTEXT || {},
        runtimePlayer = playerValue === 'A' || playerValue === 'T' ? null : rosterInfo(playerValue),
        runtimeRole = runtimePlayer
          ? { setter: 'SET', oh: 'OH', mb: 'MB', opp: 'OPP', libero: 'LIB' }[runtimePlayer.position] ||
            String(runtimePlayer.position || '').toUpperCase()
          : 'OPPONENT',
        runtimeAction =
          {
            service: 'SERVE',
            reception: 'RECEPTION',
            set: 'SET',
            attack: 'ATTACK',
            block: 'BLOCK',
            defense: 'DEFENCE',
            freeball: 'RELANCE',
          }[choice.action] || String(choice.action || '').toUpperCase(),
        runtimeStatus =
          { point: 'POSITIVE', neutral: 'NEUTRAL', error: 'ERROR' }[choice.result] ||
          String(choice.result || '').toUpperCase();
      var ev = {
        id: EVENTS.length + 1,
        eventId:
          runtimeContext.eventId || 'evt_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9),
        set: (window.VOLLEY_MATCH && VOLLEY_MATCH.currentSet) || 1,
        setNumber: (window.VOLLEY_MATCH && VOLLEY_MATCH.currentSet) || 1,
        timestamp: new Date().toISOString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        authorSide: playerValue === 'A' ? 'AWAY' : 'HOME',
        playerId: runtimePlayer ? 'player_' + runtimePlayer.number : null,
        playerNumber: runtimePlayer ? Number(runtimePlayer.number) : null,
        playerRole: runtimeRole,
        action: choice.action,
        actionCode: runtimeAction,
        result: choice.result,
        status: runtimeStatus,
        player: playerValue,
        winningTeam: winningTeam,
        pointOrigin: pointOrigin,
        rotation: currentRotationNumber(),
        scoreBefore: { home: sc.a, away: sc.b },
        scoreAfter: { home: a, away: b },
        scoreA: a,
        scoreB: b,
        inputMode: runtimeContext.inputMode || 'LEGACY',
        schemaVersion: 'runtime-input-v1',
      };
      if (
        EVENTS.some(function (existing) {
          return existing.eventId && existing.eventId === ev.eventId;
        })
      ) {
        status.textContent = 'Événement déjà enregistré.';
        return;
      }
      EVENTS.push(ev);
      if (choice.result !== 'neutral')
        DATA.push({
          n: DATA.length + 1,
          a: a,
          b: b,
          w: winningTeam === 'team1' ? 'A' : 'B',
          c: playerValue === 'A' ? 0 : playerValue,
          action: choice.action,
          result: choice.result,
          winningTeam: winningTeam,
          pointOrigin: pointOrigin,
          ts: ev.timestamp,
        });
      persist();
      choice = { player: null, action: null, result: null };
      showStep('player');
      render();
    }
    document.querySelectorAll('[data-player]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.classList.contains('nofocus')) return;
        var pv = b.getAttribute('data-player');
        choice.player = pv;
        choice.action = null;
        orderActions();
        showStep('action');
      });
    });
    document.querySelectorAll('[data-action]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (choice.player === null) return;
        choice.action = b.getAttribute('data-action');
        showStep('result');
      });
    });
    document.querySelectorAll('[data-result]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (choice.player === null || !choice.action) return;
        choice.result = b.getAttribute('data-result');
        commit(choice.player);
      });
    });
    backBtn.addEventListener('click', function () {
      if (step === 'result') {
        choice.action = null;
        showStep('action');
      } else if (step === 'action') {
        choice = { player: null, action: null, result: null };
        showStep('player');
      }
    });
    function removeSubstitutionForEvent(e) {
      if (!MATCH || !e || (e.type !== 'SUBSTITUTION' && e.eventType !== 'SUBSTITUTION' && e.action !== 'substitution'))
        return false;
      var subs = MATCH.subs || [],
        before = subs.length;
      MATCH.subs = subs.filter(function (s) {
        if (s.eventId != null && e.id != null) return String(s.eventId) !== String(e.id);
        return !(
          Number(s.set || 1) === Number(e.set || 1) &&
          Number(s.out) === Number(e.playerOut) &&
          Number(s['in']) === Number(e.playerIn) &&
          String(s.ts || '') === String(e.timestamp || '')
        );
      });
      return MATCH.subs.length !== before;
    }
    function deleteLastAction() {
      if (isDeleteLocked()) {
        window.VLC_HISTORY_DELETES_BLOCKED++;
        return false;
      }
      if (!EVENTS.length) {
        status.textContent = 'No action to delete.';
        render();
        return false;
      }
      armDeleteGuard();
      var e = EVENTS.pop(),
        matchChanged = removeSubstitutionForEvent(e);
      if (MATCH && Number(curSet()) > Number(e.set || 1)) {
        MATCH.currentSet = Number(e.set || 1);
        matchChanged = true;
      }
      if (matchChanged) saveMatch();
      if (MATCH) rebuildData();
      else if (e.result !== 'neutral') DATA.pop();
      persist();
      choice = { player: null, action: null, result: null };
      showStep('player');
      render();
      return true;
    }
    hist.addEventListener('click', function (event) {
      var button = event.target.closest && event.target.closest('[data-delete-last]');
      if (!button || !hist.contains(button)) return;
      event.preventDefault();
      event.stopPropagation();
      deleteLastAction();
    });
    window.VLCDeleteLastAction = deleteLastAction;
    document.getElementById('nextSetBtn').addEventListener('click', function () {
      var su = VS.summary(MATCH, EVENTS);
      if (!su.current || !su.current.winner || su.matchWinner) return;
      MATCH.currentSet = curSet() + 1;
      saveMatch();
      DATA.length = 0;
      persist();
      sessionStorage.setItem('volleyCapture.stage', 'capture');
      location.reload();
    });
    if (MATCH) {
      rebuildData();
      persist();
    }
    render();
  })();
})();
