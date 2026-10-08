/* Ahmed Homrani portfolio: menu, contact form, language hint,
   and a dot-grid background that reacts to the pointer.
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

  /* ---------- Background: a dot grid that leans toward the pointer ---------- */
  const canvas = document.getElementById('field');
  const ctx = canvas && canvas.getContext('2d');
  if (ctx) {
    const GAP = 26;          // grid spacing, px
    const RADIUS = 170;      // pointer influence radius, px
    const PUSH = 9;          // max displacement, px
    let w = 0, h = 0, dpr = 1, cols = 0, rows = 0;
    let base = '#c3c9d4', hot = '#2747d0';
    const target = { x: -1e4, y: -1e4 };
    const pos = { x: -1e4, y: -1e4 };
    let energy = 0;          // 0 = pointer away, 1 = pointer active
    let energyTarget = 0;
    let running = false;

    const readColors = () => {
      const cs = getComputedStyle(document.documentElement);
      base = cs.getPropertyValue('--dot').trim() || base;
      hot = cs.getPropertyValue('--dot-hot').trim() || hot;
    };
    const hex = (c) => {
      const m = c.replace('#', '');
      const n = parseInt(m.length === 3 ? m.split('').map((x) => x + x).join('') : m, 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    };

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(w / GAP) + 1; rows = Math.ceil(h / GAP) + 1;
      draw();
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      const b = hex(base), k = hex(hot);
      const ox = (w - (cols - 1) * GAP) / 2, oy = (h - (rows - 1) * GAP) / 2;
      const r2 = RADIUS * RADIUS;
      // calm grid in one pass
      ctx.fillStyle = base;
      ctx.beginPath();
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const x = ox + i * GAP, y = oy + j * GAP;
          const dx = x - pos.x, dy = y - pos.y;
          if (energy > 0.01 && dx * dx + dy * dy < r2) continue;
          ctx.moveTo(x + 1.1, y); ctx.arc(x, y, 1.1, 0, Math.PI * 2);
        }
      }
      ctx.fill();
      if (energy <= 0.01) return;
      // soft halo under the pointer
      const g = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, RADIUS);
      g.addColorStop(0, `rgba(${k[0]},${k[1]},${k[2]},${0.07 * energy})`);
      g.addColorStop(1, `rgba(${k[0]},${k[1]},${k[2]},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(pos.x - RADIUS, pos.y - RADIUS, RADIUS * 2, RADIUS * 2);
      // dots inside the radius: grow, tint and move away from the pointer
      const i0 = Math.max(0, Math.floor((pos.x - RADIUS - ox) / GAP));
      const i1 = Math.min(cols - 1, Math.ceil((pos.x + RADIUS - ox) / GAP));
      const j0 = Math.max(0, Math.floor((pos.y - RADIUS - oy) / GAP));
      const j1 = Math.min(rows - 1, Math.ceil((pos.y + RADIUS - oy) / GAP));
      for (let j = j0; j <= j1; j++) {
        for (let i = i0; i <= i1; i++) {
          const x = ox + i * GAP, y = oy + j * GAP;
          const dx = x - pos.x, dy = y - pos.y;
          const d2 = dx * dx + dy * dy;
          if (d2 >= r2) continue;
          const d = Math.sqrt(d2) || 1;
          let t = 1 - d / RADIUS; t = t * t * (3 - 2 * t) * energy; // smoothstep
          const push = PUSH * t;
          const px = x + (dx / d) * push, py = y + (dy / d) * push;
          const c = b.map((v, n) => Math.round(v + (k[n] - v) * t * 0.8));
          ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
          ctx.beginPath();
          ctx.arc(px, py, 1.1 + 1.1 * t, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    function frame() {
      pos.x += (target.x - pos.x) * 0.16;
      pos.y += (target.y - pos.y) * 0.16;
      energy += (energyTarget - energy) * 0.08;
      draw();
      const settled = Math.abs(target.x - pos.x) < 0.3 && Math.abs(target.y - pos.y) < 0.3 && Math.abs(energyTarget - energy) < 0.005;
      if (settled) { running = false; return; }
      requestAnimationFrame(frame);
    }
    const kick = () => { if (!running && !reduce.matches) { running = true; requestAnimationFrame(frame); } };

    const onMove = (e) => {
      if (reduce.matches) return;
      if (pos.x < -1e3) { pos.x = e.clientX; pos.y = e.clientY; }
      target.x = e.clientX; target.y = e.clientY; energyTarget = 1; kick();
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', () => { energyTarget = 0; kick(); });
    window.addEventListener('blur', () => { energyTarget = 0; kick(); });
    window.addEventListener('pointerup', (e) => { if (e.pointerType === 'touch') { energyTarget = 0; kick(); } }, { passive: true });
    window.addEventListener('resize', resize, { passive: true });
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => { readColors(); draw(); });
    reduce.addEventListener?.('change', () => { energy = energyTarget = 0; draw(); });

    readColors();
    resize();
  }
})();
