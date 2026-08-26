/* HYDRA site interactions v3 — true-3D hero */
(function () {
  'use strict';
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ================= 🐉 SERPENT HYDRA ENGINE =================
     Seven living necks rise from an ember core. They sway, breathe,
     track your cursor — and every few seconds one STRIKES.          */
  var cv = document.getElementById('fx');
  if (cv && !RM) {
    var ctx = cv.getContext('2d');
    var W=0,H=0,raf=0,t=0,frames=0,lastW=0,lastH=0;
    var mouse={x:.5,y:.42,tx:.5,ty:.42};
    var NECKS=[
      {name:'RECON', c1:[0,204,102],  c2:[46,230,168]},
      {name:'HUNT',  c1:[255,68,68],  c2:[255,148,87]},
      {name:'VERIFY',c1:[240,180,41], c2:[255,225,120]},
      {name:'REPORT',c1:[0,170,255],  c2:[120,200,255]},
      {name:'PLAN',  c1:[0,255,136],  c2:[160,255,200]},
      {name:'AUDIT', c1:[255,136,0],  c2:[255,190,120]},
      {name:'DEBUG', c1:[255,0,255],  c2:[230,140,255]}
    ];
    var SEGS=15;

    function size(){
      var r=cv.getBoundingClientRect();
      W=cv.width=Math.max(1,Math.round(r.width*devicePixelRatio));
      H=cv.height=Math.max(1,Math.round(r.height*devicePixelRatio));
    }
    function ensureSize(){
      var r=cv.getBoundingClientRect();
      if(Math.abs(r.width-lastW)>2||Math.abs(r.height-lastH)>2||cv.width<2){
        lastW=r.width;lastH=r.height;size();
      }
    }

    // strike state machine: idle → windup(300ms) → lunge(260ms) → recover(700ms)
    var striker={neck:-1,start:0};
    function strikeEnv(now,idx){
      if(striker.neck!==idx) return 0;
      var e=now-striker.start;
      if(e<0||e>1260){striker.neck=-1;return 0;}
      if(e<300) return -(e/300)*.18;                 // windup: pull back
      if(e<560) return ((e-300)/260);                // lunge: extend hard
      var r=(e-560)/700;                             // recover: ease home
      return (1-r);
    }

    function tick(){
      frames++; t+=16;
      if(frames%45===0) ensureSize();
      ctx.clearRect(0,0,W,H);
      var dpr=devicePixelRatio;
      mouse.x+=(mouse.tx-mouse.x)*.04; mouse.y+=(mouse.ty-mouse.y)*.04;

      var cx=W*(.5+(mouse.x-.5)*.07), cy=H*(.52+(mouse.y-.42)*.07);
      var S=Math.min(W,H)*.34;

      // ember core
      var cg=ctx.createRadialGradient(cx,cy,0,cx,cy,30*dpr);
      cg.addColorStop(0,'rgba(255,120,40,.95)');
      cg.addColorStop(.45,'rgba(46,230,168,.55)');
      cg.addColorStop(1,'rgba(46,230,168,0)');
      ctx.fillStyle=cg;ctx.beginPath();ctx.arc(cx,cy,30*dpr,0,7);ctx.fill();

      // choose a striker occasionally
      if(striker.neck===-1 && Math.random()<.008)
        striker={neck:Math.floor(Math.random()*7),start:t};

      var allSegs=[];
      for(var n=0;n<7;n++){
        var N=NECKS[n];
        var base=n*(Math.PI*2/7)+t*.00012;                 // slow carousel
        var mAng=Math.atan2((mouse.y-.42),(mouse.x-.5));   // cursor attraction
        var strike=strikeEnv(t,n);
        var pts=[];
        for(var s=0;s<=SEGS;s++){
          var f=s/SEGS;
          var sway=Math.sin(t*.0016+N.c1[0]+f*4.2)*(.38*f)*(1-Math.abs(strike));
          var ang=base+sway+f*(mAng-base)*(.10+.55*Math.abs(strike))*f+strike*f*.9;
          var rad=S*(.16+f*1.02);
          var px=cx+Math.cos(ang)*rad;
          var py=cy+Math.sin(ang)*rad*.60 - f*S*.28 + Math.sin(t*.001+n+f*3)*6*dpr*f;
          pts.push({x:px,y:py,f:f});
        }
        // neck body: glowing chain, thick at base → sharp at head
        for(s=0;s<SEGS;s++){
          var a=pts[s],b=pts[s+1],f=a.f;
          var mix=function(u){return Math.round(N.c1[u]+(N.c2[u]-N.c1[u])*f);};
          ctx.strokeStyle='rgba('+mix(0)+','+mix(1)+','+mix(2)+','+(0.75-f*.35).toFixed(2)+')';
          ctx.lineWidth=dpr*(5.5-f*4.2);
          ctx.lineCap='round';
          ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
          allSegs.push({x:b.x,y:b.y,r:dpr*(3.4-f*2.2),c:N.c2,o:(0.8-f*.3)});
        }
        // the head
        var hp=pts[SEGS];
        var hg=ctx.createRadialGradient(hp.x,hp.y,0,hp.x,hp.y,20*dpr);
        hg.addColorStop(0,'rgba('+N.c2[0]+','+N.c2[1]+','+N.c2[2]+',.95)');
        hg.addColorStop(1,'rgba('+N.c2[0]+','+N.c2[1]+','+N.c2[2]+',0)');
        ctx.fillStyle=hg;ctx.beginPath();ctx.arc(hp.x,hp.y,20*dpr,0,7);ctx.fill();
        ctx.fillStyle='#eafff6';ctx.beginPath();ctx.arc(hp.x,hp.y,3.4*dpr,0,7);ctx.fill();
        ctx.font=(11*dpr)+'px JetBrains Mono, monospace';
        ctx.fillStyle='rgba(231,238,245,.92)';ctx.textAlign='center';
        ctx.fillText(N.name,hp.x,hp.y-16*dpr);
        // eyes blink into existence when striking
        if(strike>0){
          ctx.fillStyle='rgba(255,60,60,'+(strike*.9).toFixed(2)+')';
          ctx.beginPath();ctx.arc(hp.x-3*dpr,hp.y-2*dpr,1.6*dpr,0,7);ctx.fill();
          ctx.beginPath();ctx.arc(hp.x+3*dpr,hp.y-2*dpr,1.6*dpr,0,7);ctx.fill();
        }
      }
      // ember sparks drifting off the core
      for(var i=0;i<26;i++){
        var ex=cx+Math.cos(i*2.4+t*.001)*S*.2, ey=cy+Math.sin(i*1.7+t*.0013)*S*.12;
        ctx.fillStyle='rgba(255,150,60,'+(0.25+0.2*Math.sin(t*.004+i)).toFixed(2)+')';
        ctx.beginPath();ctx.arc(ex,ey,dpr*1.6,0,7);ctx.fill();
      }

      raf=requestAnimationFrame(tick);
    }

    cv.parentElement.addEventListener('mousemove',function(e){
      var r=cv.getBoundingClientRect();
      mouse.tx=(e.clientX-r.left)/r.width; mouse.ty=(e.clientY-r.top)/r.height;
    });
    cv.parentElement.addEventListener('mouseleave',function(){mouse.tx=.5;mouse.ty=.42;});

    ensureSize();tick();
    setTimeout(ensureSize,80);setTimeout(ensureSize,400);setTimeout(ensureSize,1000);
    window.addEventListener('resize',function(){cancelAnimationFrame(raf);ensureSize();});
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

  /* ================= review scorecard bars ================= */
  var bio = new IntersectionObserver(function(es){ es.forEach(function(e){
    if (!e.isIntersecting) return;
    bio.unobserve(e.target);
    e.target.querySelectorAll('.bar i').forEach(function(b, i){
      setTimeout(function(){ b.style.width = b.getAttribute('data-w') + '%'; }, i * 120);
    });
  }); }, { threshold: .4 });
  document.querySelectorAll('.rev-score').forEach(function(el){ bio.observe(el); });

  /* ================= active nav + year ================= */
  var here = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(function(a){
    if (a.getAttribute('href') === here || (here.indexOf('index') === 0 && (a.getAttribute('href')||'').indexOf('index') === 0))
      a.classList.add('active');
  });
  var y = document.getElementById('yr');
  if (y) y.textContent = new Date().getFullYear();
})();
