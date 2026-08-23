/* HYDRA site interactions v3 — true-3D hero */
(function () {
  'use strict';
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ================= 3D HERO STRUCTURE =================
     A slowly rotating point-cloud "hydra core": three nested shells
     of points + orbiting head nodes, perspective-projected with
     depth shading. Mouse position tilts the whole structure.      */
  var cv = document.getElementById('fx');
  if (cv && !RM) {
    var ctx = cv.getContext('2d');
    var W = 0, H = 0, raf = 0, t = 0, frames = 0;
    var lastW = 0, lastH = 0;
    var mouse = { x: 0.5, y: 0.42, tx: 0.5, ty: 0.42 };

    // --- build 3D point cloud once ---
    var pts = [];
    var SHELLS = [ { r: 1.00, n: 90 }, { r: 0.62, n: 50 }, { r: 0.30, n: 22 } ];
    for (var s = 0; s < SHELLS.length; s++) {
      var sh = SHELLS[s], golden = Math.PI * (3 - Math.sqrt(5));
      for (var i = 0; i < sh.n; i++) {
        var y = 1 - (i / (sh.n - 1)) * 2;
        var rad = Math.sqrt(Math.max(0, 1 - y * y));
        var th = golden * i;
        pts.push({
          x: Math.cos(th) * rad * sh.r,
          y: y * sh.r,
          z: Math.sin(th) * rad * sh.r,
          w: sh.r === 1 ? 0.5 : (sh.r === 0.62 ? 0.75 : 1.15)
        });
      }
    }
    // orbiting head nodes (the seven agents)
    var HEADS = ['RECON','HUNT','VERIFY','REPORT','PLAN','AUDIT','DEBUG'].map(function(n,i){
      return { name:n, ang:(i/7)*Math.PI*2, r:1.35, y:(i%2?-0.35:0.35) };
    });

    function ensureSize() {
      var r = cv.getBoundingClientRect();
      if (Math.abs(r.width - lastW) > 2 || Math.abs(r.height - lastH) > 2 || cv.width < 2) {
        lastW = r.width; lastH = r.height;
        W = cv.width = Math.max(1, Math.round(r.width * devicePixelRatio));
        H = cv.height = Math.max(1, Math.round(r.height * devicePixelRatio));
      }
    }

    function project(x, y, z, cx, cy, scale) {
      // rotate around Y (time) then X (mouse tilt)
      var ry = t * 0.00022 + mouse.x * 1.4;
      var rx = (mouse.y - 0.42) * 0.9;
      var x1 = x * Math.cos(ry) - z * Math.sin(ry);
      var z1 = x * Math.sin(ry) + z * Math.cos(ry);
      var y1 = y * Math.cos(rx) - z1 * Math.sin(rx);
      var z2 = y * Math.sin(rx) + z1 * Math.cos(rx);
      var persp = 3.2 / (3.2 + z2);              // perspective divide
      return {
        sx: cx + x1 * scale * persp,
        sy: cy + y1 * scale * persp,
        d: persp                                   // depth factor 0..~1.6
      };
    }

    function tick() {
      frames++; t += 16;
      if (frames % 45 === 0) ensureSize();
      ctx.clearRect(0, 0, W, H);
      var dpr = devicePixelRatio;
      var cx = W * (0.5 + (mouse.x - 0.5) * 0.05);
      var cy = H * (0.46 + (mouse.y - 0.42) * 0.05);
      var scale = Math.min(W, H) * 0.30;

      // ease mouse toward target (smooth parallax)
      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;

      var proj = [], i, p, P;
      for (i = 0; i < pts.length; i++) {
        p = pts[i];
        proj.push(project(p.x, p.y, p.z, cx, cy, scale));
        proj[i].w = p.w;
      }

      // connections between close points (3D distance approx via projected pairs)
      var D = scale * 0.34;
      for (i = 0; i < proj.length; i++) {
        for (var j = i + 1; j < proj.length; j++) {
          var dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y, dz = pts[i].z - pts[j].z;
          if (dx*dx + dy*dy + dz*dz < 0.085) {
            var a = Math.min(proj[i].d, proj[j].d);
            ctx.strokeStyle = 'rgba(46,230,168,' + (0.16 * a).toFixed(3) + ')';
            ctx.lineWidth = dpr * 0.7;
            ctx.beginPath();
            ctx.moveTo(proj[i].sx, proj[i].sy);
            ctx.lineTo(proj[j].sx, proj[j].sy);
            ctx.stroke();
          }
        }
      }

      // points — depth-sorted feel via alpha+size by perspective
      for (i = 0; i < proj.length; i++) {
        P = proj[i];
        var sz = P.w * P.d * 2.1 * dpr;
        ctx.fillStyle = 'rgba(120,255,205,' + Math.min(1, 0.25 + P.d * 0.55).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(P.sx, P.sy, sz, 0, 7); ctx.fill();
      }

      // glowing core at center
      var cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 24 * dpr);
      cg.addColorStop(0, 'rgba(46,230,168,.95)');
      cg.addColorStop(1, 'rgba(46,230,168,0)');
      ctx.fillStyle = cg;
      ctx.beginPath(); ctx.arc(cx, cy, 24 * dpr, 0, 7); ctx.fill();

      // orbiting agent heads — same projection math
      for (i = 0; i < HEADS.length; i++) {
        var hd = HEADS[i];
        hd.ang += 0.0016;
        var hx = Math.cos(hd.ang) * hd.r, hz = Math.sin(hd.ang) * hd.r;
        var hp = project(hx, hd.y + Math.sin(t*0.0008+i)*0.12, hz, cx, cy, scale);
        var g2 = ctx.createRadialGradient(hp.sx, hp.sy, 0, hp.sx, hp.sy, 14*dpr*hp.d);
        g2.addColorStop(0, 'rgba(88,166,255,.9)');
        g2.addColorStop(1, 'rgba(88,166,255,0)');
        ctx.globalAlpha = Math.min(1, hp.d * 0.8);
        ctx.fillStyle = g2;
        ctx.beginPath(); ctx.arc(hp.sx, hp.sy, 14 * dpr * hp.d, 0, 7); ctx.fill();
        ctx.font = (10*dpr)+'px JetBrains Mono, monospace';
        ctx.fillStyle = 'rgba(147,161,179,'+(0.35+hp.d*0.35).toFixed(2)+')';
        ctx.textAlign = 'center';
        ctx.fillText(hd.name, hp.sx, hp.sy + 24*dpr*hp.d);
        ctx.globalAlpha = 1;
      }

      raf = requestAnimationFrame(tick);
    }

    cv.parentElement.addEventListener('mousemove', function(e){
      var r = cv.getBoundingClientRect();
      mouse.tx = (e.clientX - r.left) / r.width;
      mouse.ty = (e.clientY - r.top) / r.height;
    });
    cv.parentElement.addEventListener('mouseleave', function(){
      mouse.tx = 0.5; mouse.ty = 0.42;
    });

    ensureSize(); tick();
    setTimeout(ensureSize, 80); setTimeout(ensureSize, 400); setTimeout(ensureSize, 1000);
    window.addEventListener('resize', function(){ cancelAnimationFrame(raf); ensureSize(); });
  }

  /* ================= copy buttons ================= */
  document.querySelectorAll('[data-copy]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var src = document.querySelector(btn.getAttribute('data-copy'));
      navigator.clipboard.writeText(src.innerText.trim()).then(function(){
        var old = btn.textContent;
        btn.textContent = '✓ copied';
        setTimeout(function(){ btn.textContent = old; }, 1400);
      });
    });
  });

  /* ================= reveal on scroll ================= */
  var io = new IntersectionObserver(function(es){ es.forEach(function(e){
    if (e.isIntersecting){ e.target.classList.add('on'); io.unobserve(e.target); }
  }); }, { threshold: .12 });
  document.querySelectorAll('.rv').forEach(function(el, i){
    el.style.transitionDelay = ((i % 4) * 60) + 'ms';
    io.observe(el);
  });

  /* ================= terminal demo typer ================= */
  var term = document.getElementById('term-body');
  if (term && !RM) {
    var LINES = [
      ['$ git clone https://github.com/sricharan996/hydra.git', 'cmd'],
      ['Cloning into \'hydra\'...', 'out'],
      ['remote: Enumerating objects: 391, done.', 'out'],
      ['Receiving objects: 100% (391/391), 1.14 MiB | 16.9 MiB/s, done.', 'out'],
      ['$ cd hydra && bash setup.sh', 'cmd'],
      ['   \ud83d\udc09 HYDRA \u2014 AI BUG BOUNTY SYSTEM SETUP', 'ok'],
      ['[*] opencode not found \u2014 installing automatically...', 'out'],
      ['[\u2713] opencode installed: 1.18.21', 'ok'],
      ['[*] Installing agents, skills, methodology -> ~/.config/opencode', 'out'],
      ['[*] Rendering opencode.jsonc with your identity', 'out'],
      ['[*] Creating recon workspace + helper scripts', 'out'],
      [' \u2705 HYDRA IS INSTALLED', 'done'],
      ['$ source ~/.bashrc', 'cmd'],
      ['$ export OPENROUTER_API_KEY=sk-or-...', 'cmd'],
      ['$ opencode', 'cmd'],
      ['', 'out'],
      ['> /hunt example.com          # authorized targets only', 'warn'],
      ['seven heads activated \u00b7 happy hunting', 'done']
    ];
    var li = 0, ci = 0, started = false;
    function typeStep() {
      if (li >= LINES.length) {
        setTimeout(function(){ term.innerHTML=''; li=0; ci=0; typeStep(); }, 6000);
        return;
      }
      var txt = LINES[li][0], cls = LINES[li][1];
      if (ci === 0) {
        var d = document.createElement('div');
        d.className = 'tl ' + cls;
        term.appendChild(d);
      }
      var cur = term.lastChild;
      cur.textContent = txt.slice(0, ++ci);
      if (ci >= txt.length) { li++; ci = 0; setTimeout(typeStep, cls === 'cmd' ? 420 : 130); }
      else setTimeout(typeStep, cls === 'cmd' ? 34 : 9);
    }
    var tio = new IntersectionObserver(function(es){ es.forEach(function(e){
      if (e.isIntersecting && !started){ started = true; tio.disconnect(); setTimeout(typeStep, 350); }
    }); }, { threshold: .4 });
    tio.observe(term.closest('.demo'));
  }

  /* ================= 3D tilt on agent cards ================= */
  document.querySelectorAll('.agent-grid .acard').forEach(function(card){
    card.addEventListener('pointermove', function(e){
      var r = card.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = 'perspective(900px) rotateY(' + (px*10).toFixed(2) +
        'deg) rotateX(' + (-py*8).toFixed(2) + 'deg) translateY(-2px)';
    });
    card.addEventListener('pointerleave', function(){
      card.style.transform = '';
    });
  });

  /* ================= rate HYDRA (stars → GitHub discussion) ================= */
  var starBtns = document.querySelectorAll('#stars button');
  var rating = 0, note = document.getElementById('rate-note'), sub = document.getElementById('rate-submit');
  var NOTES = {1:'rough — needs work',2:'has potential',3:'decent',4:'really good',5:'excellent — star it ⭐'};
  try {
    var mine = JSON.parse(localStorage.getItem('hydra_rating')||'null');
    if (mine && mine.r >= 1) {
      setTimeout(function(){
        rating = mine.r;
        starBtns.forEach(function(x,k){ x.classList.toggle('on', k < mine.r); });
        if (mine.c) document.getElementById('rate-comment').value = mine.c;
        note.textContent = '\u2713 your saved rating: ' + mine.r + '/5';
      }, 100);
    }
  } catch(e){}
  if (starBtns.length) {
    starBtns.forEach(function(b, i){
      b.addEventListener('click', function(){
        rating = i + 1;
        starBtns.forEach(function(x, k){ x.classList.toggle('on', k < rating); });
        note.textContent = NOTES[rating];
      });
      b.addEventListener('mouseenter', function(){
        starBtns.forEach(function(x, k){ x.classList.toggle('on', k <= i); });
      });
    });
    document.getElementById('stars').addEventListener('mouseleave', function(){
      starBtns.forEach(function(x, k){ x.classList.toggle('on', k < rating); });
    });
  }
  if (sub) {
    sub.addEventListener('click', function(ev){
      if (!rating) { ev.preventDefault(); note.textContent = 'select a star rating first ↑'; return; }
      var cmt = (document.getElementById('rate-comment').value || '').trim();
      // 1. save locally instantly
      try {
        localStorage.setItem('hydra_rating', JSON.stringify({r:rating,c:cmt,t:Date.now()}));
      } catch(e){}
      note.textContent = '\u2713 saved \u2014 your rating: ' + rating + '/5';
      // 2. offer public post (opens prefilled discussion)
      var body = '\u2605 Rating: ' + rating + '/5\n\n' + (cmt || '(no comment)') +
                 '\n\n--- submitted via site rating widget';
      ev.preventDefault();
      window.open('https://github.com/sricharan996/hydra/discussions/new?category=announcements' +
        '&title=' + encodeURIComponent('Review: ' + rating + '/5 stars') +
        '&body=' + encodeURIComponent(body), '_blank');
      sub.textContent = '\u2713 saved \u00b7 posted to GitHub \u2713';
    });
  }

  // live stats from public GitHub API (keyless; silent-fail)
  try {
    fetch('https://api.github.com/repos/sricharan996/hydra/discussions?per_page=50')
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(ds){
        if (!ds) return;
        var n = 0, stars = 0, up = 0;
        ds.forEach(function(d){
          n++;
          up += d.upvote_count || 0;
          var m = (d.body||'').match(/★ Rating:\s*([1-5])\/5/);
          if (m) stars += +m[1];
        });
        var rated = ds.filter(function(d){ return /★ Rating:\s*[1-5]\/5/.test(d.body||''); }).length;
        document.getElementById('rs-count').textContent = n;
        document.getElementById('rs-up').textContent = up;
        document.getElementById('rs-avg').textContent = rated ? (stars/rated).toFixed(1) + '\u2605' : '–';
      }).catch(function(){});
  } catch(e) {}

  /* ================= stat counters ================= */
  var cio = new IntersectionObserver(function(es){ es.forEach(function(e){
    if (!e.isIntersecting) return;
    cio.unobserve(e.target);
    var el = e.target, end = +el.getAttribute('data-count'), t0 = performance.now();
    (function step(now){
      var k = Math.min(1, (now - t0) / 1100);
      el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }); }, { threshold: .6 });
  document.querySelectorAll('[data-count]').forEach(function(el){ cio.observe(el); });

  /* ================= pipeline sequential glow ================= */
  var pio = new IntersectionObserver(function(es){ es.forEach(function(e){
    if (!e.isIntersecting) return;
    pio.unobserve(e.target);
    e.target.querySelectorAll('.flow-node').forEach(function(n, i){
      setTimeout(function(){ n.classList.add('lit'); setTimeout(function(){ n.classList.remove('lit'); }, 1600); }, 500 + i * 550);
    });
  }); }, { threshold: .35 });
  var fl = document.querySelector('.flow');
  if (fl) pio.observe(fl);

  /* ================= active nav + year ================= */
  var here = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(function(a){
    if (a.getAttribute('href') === here || (here.indexOf('index') === 0 && (a.getAttribute('href')||'').indexOf('index') === 0))
      a.classList.add('active');
  });
  var y = document.getElementById('yr');
  if (y) y.textContent = new Date().getFullYear();
})();
