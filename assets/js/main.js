/* Ahmed Homrani portfolio: starfield that warps with scroll speed,
   and planets that drift into place as you travel past them.
   Everything is progressive enhancement: the page is complete without JS. */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Storage that never throws (private mode, blocked cookies) ---------- */
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* ignore */ } }
  };

  /* ---------- Mobile menu ---------- */
  const btn = document.querySelector('.menu-btn');
  const menu = document.getElementById('menu');
  if (btn && menu) {
    btn.hidden = false;
    const setOpen = (open) => {
      btn.setAttribute('aria-expanded', String(open));
      menu.classList.toggle('open', open);
    };
    btn.addEventListener('click', () => setOpen(btn.getAttribute('aria-expanded') !== 'true'));
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') { setOpen(false); btn.focus(); }
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.nav') && btn.getAttribute('aria-expanded') === 'true') setOpen(false);
    });
  }

  /* ---------- Contact form: sends through FormSubmit to my inbox ---------- */
  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');
  if (form && status) {
    const say = (kind, text) => {
      status.className = 'form-status ' + kind;
      status.textContent = text;
      status.focus({ preventScroll: true });
    };
    // Back from a no-JS submission
    if (new URLSearchParams(location.search).has('sent')) say('ok', status.dataset.ok);

    const btn = form.querySelector('button[type="submit"]');
    const fields = ['name', 'email', 'subject', 'message'].map((n) => form.elements[n]);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      let firstBad = null;
      fields.forEach((f) => {
        const bad = !f.value.trim() || !f.checkValidity();
        f.setAttribute('aria-invalid', String(bad));
        if (bad && !firstBad) firstBad = f;
      });
      if (firstBad) { say('err', status.dataset.invalid); firstBad.focus(); return; }
      if (form.elements._honey.value) return; // bot

      btn.disabled = true;
      btn.textContent = btn.dataset.sending;
      const data = Object.fromEntries(new FormData(form));
      data._subject = `${data._subject}: ${data.subject}`;
      data._replyto = data.email;
      data.page = location.href;
      delete data._next;
      try {
        const res = await fetch(form.dataset.ajax, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(data)
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || String(json.success) !== 'true') throw new Error(json.message || res.status);
        form.reset();
        fields.forEach((f) => f.removeAttribute('aria-invalid'));
        say('ok', status.dataset.ok);
      } catch (err) {
        say('err', status.dataset.err);
      } finally {
        btn.disabled = false;
        btn.textContent = btn.dataset.label;
      }
    });
    fields.forEach((f) => f.addEventListener('input', () => {
      if (f.getAttribute('aria-invalid') === 'true' && f.value.trim() && f.checkValidity()) f.setAttribute('aria-invalid', 'false');
    }));
  }

  /* ---------- Language: remember the choice, suggest (never force) a better match ---------- */
  const current = (document.documentElement.lang || 'en').slice(0, 2);
  document.querySelectorAll('.lang a[data-lang]').forEach((a) =>
    a.addEventListener('click', () => store.set('lang', a.dataset.lang)));

  const dataEl = document.getElementById('i18n-suggest');
  const banner = document.getElementById('suggest');
  if (dataEl && banner) {
    let data = {};
    try { data = JSON.parse(dataEl.textContent); } catch { /* ignore */ }
    const fromBrowser = (navigator.languages || [navigator.language || ''])
      .map((l) => String(l).slice(0, 2).toLowerCase())
      .find((l) => data[l]);
    const preferred = store.get('lang') || fromBrowser;
    if (preferred && preferred !== current && data[preferred]) {
      const s = data[preferred];
      const target = s.path + location.hash;
      banner.lang = preferred === 'pt' ? 'pt-BR' : preferred;
      document.getElementById('suggest-text').textContent = s.text;
      const go = document.getElementById('suggest-go');
      go.textContent = s.go;
      go.href = target;
      go.hreflang = preferred;
      go.addEventListener('click', () => store.set('lang', preferred));
      document.getElementById('suggest-close').addEventListener('click', () => {
        store.set('lang', current);
        banner.hidden = true;
      });
      banner.hidden = false;
    }
  }

  /* ---------- Starfield ---------- */
  const canvas = document.getElementById('stars');
  const ctx = canvas && canvas.getContext('2d');
  let stars = [];
  let w = 0, h = 0, dpr = 1;
  let lastY = window.scrollY, velocity = 0;

  const palette = ['#eceaf6', '#eceaf6', '#eceaf6', '#ffd9a0', '#b9c8ff'];

  function resize() {
    if (!ctx) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.min(420, Math.round((w * h) / 3800));
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h * 3,          // spread over a tall band so parallax wraps smoothly
      z: 0.15 + Math.random() * 0.85,    // depth: 1 is closest
      r: Math.random() < 0.08 ? 1.6 : 0.6 + Math.random() * 0.8,
      c: palette[(Math.random() * palette.length) | 0],
      tw: Math.random() * Math.PI * 2
    }));
    if (reduce.matches) draw(0);
  }

  function draw(time) {
    ctx.clearRect(0, 0, w, h);
    const sy = window.scrollY;
    const band = h * 3;
    for (const s of stars) {
      // parallax: closer stars move more
      let y = (s.y - sy * s.z * 0.35) % band;
      if (y < 0) y += band;
      if (y > h + 40) continue;
      const twinkle = reduce.matches ? 1 : 0.65 + 0.35 * Math.sin(time * 0.0015 + s.tw);
      ctx.globalAlpha = (0.3 + s.z * 0.6) * twinkle;
      ctx.strokeStyle = ctx.fillStyle = s.c;
      const streak = Math.min(Math.abs(velocity) * s.z * 1.4, 60);
      if (streak > 1.5) {
        // warp streaks trail behind the direction of travel
        ctx.globalAlpha *= 0.7;
        ctx.lineWidth = s.r;
        ctx.beginPath();
        ctx.moveTo(s.x, y);
        ctx.lineTo(s.x, y + Math.sign(velocity) * streak);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(s.x, y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  /* ---------- Planets ---------- */
  const planets = [...document.querySelectorAll('.planet')];

  function placePlanets() {
    const vh = window.innerHeight;
    for (const p of planets) {
      const r = p.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) continue;
      const d = Math.max(-1.2, Math.min(1.2, (r.top + r.height / 2 - vh / 2) / vh));
      const s = 1 - Math.min(Math.abs(d), 1) * 0.32;
      p.style.setProperty('--s', s.toFixed(3));
      p.style.setProperty('--ty', (d * 70).toFixed(1) + 'px');
      p.style.setProperty('--rot', (d * 18).toFixed(1) + 'deg');
    }
  }

  /* ---------- Loop ---------- */
  let running = false;
  function frame(time) {
    const y = window.scrollY;
    const dy = y - lastY;
    lastY = y;
    velocity += (dy - velocity) * 0.18;     // smooth the scroll speed
    if (Math.abs(velocity) < 0.05) velocity = 0;
    if (ctx) draw(time);
    placePlanets();
    if (running) requestAnimationFrame(frame);
  }

  function start() {
    if (running || reduce.matches || document.hidden) return;
    running = true;
    requestAnimationFrame(frame);
  }
  function stop() { running = false; }

  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  reduce.addEventListener?.('change', () => { if (reduce.matches) { stop(); planets.forEach(p => p.removeAttribute('style')); draw(0); } else start(); });

  resize();
  if (reduce.matches) { if (ctx) draw(0); } else start();
})();
