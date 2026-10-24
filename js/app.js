(() => {
  const ROOT = document.currentScript.src.replace(/js\/app\.js.*$/, ''), C = window.ZYRO_CONFIG, $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  // top loading bar: a counter, so overlapping loads can't hide it early
  const bar = document.body.appendChild(Object.assign(document.createElement('div'), { id: 'bar' }));
  let pending = 0, prog = 0, creep;
  const paint = () => { bar.style.transform = `scaleX(${prog})`; };
  const start = () => {
    if (pending++) return;
    clearInterval(creep); bar.style.opacity = 1; prog = .08; paint();
    creep = setInterval(() => { prog += (.9 - prog) * .1; paint(); }, 200);
  };
  const done = () => {
    if (--pending > 0) return;
    pending = 0; clearInterval(creep); prog = 1; paint();
    setTimeout(() => {
      if (pending) return;
      bar.style.opacity = 0;
      setTimeout(() => { if (!pending) { prog = 0; paint(); } }, 300);
    }, 250);
  };
  start(); // page load
  if (document.readyState === 'complete') done(); else addEventListener('load', done, { once: true });
  addEventListener('pageshow', e => { if (e.persisted) { pending = 1; done(); } });
  document.addEventListener('click', e => { // page navigation
    const a = e.target.closest?.('a[href]');
    if (a && !a.target && !e.metaKey && !e.ctrlKey && !e.shiftKey && a.protocol === location.protocol &&
        a.href.split('#')[0] !== location.href.split('#')[0]) start();
  });

  // subtle background particles (CSS-animated, skipped with reduced motion)
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const fx = document.body.appendChild(Object.assign(document.createElement('div'), { id: 'fx' }));
    for (let i = 0, n = innerWidth < 700 ? 14 : 30, r = Math.random; i < n; i++) {
      const p = document.createElement('i');
      p.style.cssText = `left:${r() * 100}%;width:${2 + r() * 3}px;height:${2 + r() * 3}px;--o:${(.25 + r() * .4).toFixed(2)};animation-duration:${22 + r() * 30}s;animation-delay:-${r() * 40}s`;
      fx.appendChild(p);
    }
  }

  // shared footer
  const foot = $('#site-footer');
  if (foot) foot.innerHTML = `<div class="socials">${C.socials.map(s =>
    `<a href="${s.url}" target="_blank" rel="noopener" aria-label="${s.name}"><i class="${s.icon}"></i></a>`).join('')}</div><p>${C.notice}</p>`;

  // landing: claim links
  document.querySelectorAll('[data-claim]').forEach(a => {
    const url = C[a.dataset.claim]?.claim;
    if (url) { a.href = url; a.target = '_blank'; a.rel = 'noopener'; }
    else { a.setAttribute('aria-disabled', 'true'); a.textContent = 'Link coming soon'; }
  });

  const platform = document.body.dataset.platform;
  if (!platform || !$('#podium')) return;

  const P = { icon: platform === 'skinrave', sym: C[platform].symbol || '' };
  const get = async u => { const r = await fetch(u); if (!r.ok) throw Error(`Request failed (${r.status})`); return r.json(); };
  const date = v => { if (!v) return null; if (typeof v === 'string' && /T[\d:.]+$/.test(v)) v += 'Z'; const d = new Date(v); return isNaN(d) ? null : d; };
  const censor = n => !n || n.length <= 2 ? n : n.length === 3 ? n[0] + '*' + n[2] : n.slice(0, 2) + '*'.repeat(Math.max(3, n.length - 3)) + n.slice(-1);
  // API startsAt can disagree with endsAt - duration; the end time is the reliable one, so derive the start from it
  const fixStart = (s, e, days) => days && e && (!s || Math.abs(e - days * 864e5 - s) > 6e4) ? new Date(e - days * 864e5) : s;
  const ord = n => { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };
  const money = (n, dec = 2) => {
    if (n == null || isNaN(n)) return '—';
    const v = Number(n).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    return P.icon ? `<span class="amt">${v}<img src="${ROOT}assets/currency.svg" alt=""></span>` : P.sym + v;
  };

  // platform adapters -> { prizePool, label, startsAt, endsAt, ended, players[] }
  const adapters = {
    async skinrave() {
      const [s, l] = await Promise.all([get(C.skinrave.api + '/status'), get(C.skinrave.api + '/leaderboard')]);
      if (!l.success) throw Error(l.message || 'Leaderboard unavailable');
      const c = s.competition || {}, R = C.skinrave.rewards;
      return {
        prizePool: R.reduce((a, b) => a + b, 0),
        label: c.durationDays ? `${c.durationDays} Day Race` : '',
        startsAt: null, // Skinrave keeps its existing end-only timer
        endsAt: date(c.endTime) || (c.remainingSeconds > 0 ? new Date(Date.now() + c.remainingSeconds * 1e3) : null),
        ended: !!c.isEnded,
        players: (l.data?.list || []).map((p, i) => ({
          place: i + 1, name: censor(p.user.username), avatar: p.user.avatarUrl, wagered: p.wagered,
          prize: R[i] ?? null, badge: p.user.levelTier ? `Lv.${p.user.level || 0} ${p.user.levelTier}` : ''
        }))
      };
    },
    async cs2reaper() {
      if (!C.cs2reaper.api) throw Error('CS2Reaper API endpoint is not configured yet.');
      const d = await get(C.cs2reaper.api);
      const endsAt = date(d.endsAt), days = 'durationDays' in C.cs2reaper ? C.cs2reaper.durationDays : 14;
      const startsAt = fixStart(date(d.startsAt), endsAt, days);
      if (startsAt?.getTime() !== date(d.startsAt)?.getTime())
        console.warn(`[CS2Reaper] API startsAt (${d.startsAt}) disagrees with endsAt minus ${days} days; using ${startsAt.toISOString()}. Fix the source data, or set durationDays: null in config.js to trust the API.`);
      return {
        prizePool: d.prizePool, label: 'BI-WEEKLY LEADERBOARD', // presentation label only; timer uses real timestamps
        startsAt, endsAt,
        players: (d.standings || []).map(s => ({ place: s.place, name: s.username, avatar: s.avatar, wagered: s.wagered, prize: s.prize, badge: '' }))
      };
    }
  };

  const av = p => `<div class="av"><span>${esc((p.name || '?')[0].toUpperCase())}</span>${p.avatar ? `<img src="${esc(p.avatar)}" alt="" loading="lazy">` : ''}</div>`;

  const card = (p = {}, i) => `
    <article class="pc p${i + 1}"><span class="pl">${ord(i + 1)}</span>${av(p)}
      <h3>${esc(p.name || 'No player yet')}</h3>${p.badge ? `<em class="badge">${esc(p.badge)}</em>` : ''}
      <div class="wg">Wagered<div class="wv">${money(p.wagered)}</div></div>
      <div class="prize">${p.prize ? money(p.prize) : '—'}</div></article>`;

  // upcoming -> count to startsAt; active -> count to endsAt; otherwise ended / none
  const phase = (now, s, e) => !e ? 'none' : now >= e ? 'ended' : s && now < s ? 'upcoming' : 'active';
  let tick;
  function timer(d) {
    clearInterval(tick);
    const el = $('#timer'), s = d.startsAt?.getTime(), e = d.endsAt?.getTime();
    let shown, nums = [];
    const run = () => { // re-evaluated every second, so the label flips automatically
      const now = Date.now(), ph = d.ended ? 'ended' : phase(now, s, e);
      if (ph !== shown) {
        shown = ph;
        el.innerHTML = ph === 'upcoming' || ph === 'active'
          ? `<p class="cap">${ph === 'upcoming' ? 'Starts in' : 'Ends in'}</p><div class="cd">${['D', 'H', 'M', 'S'].map(u => `<div><b>00</b><small>${u}</small></div>`).join('')}</div>`
          : `<p class="cap">${ph === 'ended' ? 'Competition ended' : 'No active competition'}</p>`;
        nums = el.querySelectorAll('b');
      }
      if (!nums.length) return clearInterval(tick);
      const t = Math.max(0, Math.floor(((ph === 'upcoming' ? s : e) - now) / 1e3));
      [t / 86400 | 0, t % 86400 / 3600 | 0, t % 3600 / 60 | 0, t % 60].forEach((v, i) => { nums[i].textContent = String(v).padStart(2, '0'); });
    };
    run(); tick = setInterval(run, 1000);
  }

  function render(d) {
    const pl = d.players.sort((a, b) => a.place - b.place);
    $('#pool').innerHTML = d.prizePool ? money(d.prizePool, 0) : '';
    $('#label').textContent = d.label || '';
    $('#podium').innerHTML = [0, 1, 2].map(i => card(pl[i], i)).join('');
    const rest = pl.slice(3);
    $('#rows').innerHTML = rest.length ? `<div class="row h"><span>Rank</span><span>Player</span><span>Wagered</span><span class="pr">Prize</span></div>` +
      rest.map(p => `<div class="row"><span>${ord(p.place)}</span><div class="who">${av(p)}<b>${esc(p.name || 'No player yet')}</b></div><span>${money(p.wagered)}</span><span class="pr">${p.prize ? money(p.prize) : '—'}</span></div>`).join('') : '';
    $('#msg').textContent = pl.length ? '' : 'No standings available yet.';
    $('#msg').className = 'msg';
    timer(d);
  }

  async function load() {
    start();
    try { render(await adapters[platform]()); }
    catch (e) {
      console.error(e);
      $('#msg').className = 'msg err';
      $('#msg').textContent = `Couldn't load the leaderboard. ${e.message}`;
    } finally { $('#preloader').classList.add('done'); done(); }
  }

  // broken avatar -> fall back to initial (delegated, works after every re-render)
  document.addEventListener('error', e => { if (e.target.matches?.('.av img')) e.target.remove(); }, true);

  load();
  const refresh = setInterval(load, 600000);
  addEventListener('pagehide', () => { clearInterval(tick); clearInterval(refresh); });
})();