/* Indie Arcade Hub - semua data disimpan di localStorage (tanpa database) */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};
const root = document.documentElement;

/* ---------- Header & footer dipakai bersama ---------- */
function buildChrome() {
  const page = location.pathname.split('/').pop() || 'index.html';
  const link = (href, label) => `<a href="${href}" class="${page === href ? 'on' : ''}">${label}</a>`;
  $('#site-header').innerHTML = `
    <a class="logo" href="index.html">🕹️ INDIE ARCADE HUB</a>
    <nav aria-label="Menu utama">${link('index.html', 'Home')}${link('about.html', 'About')}${link('gallery.html', 'Galeri')}</nav>
    <div class="tools">
      <span id="xpBadge" title="XP dan koin kamu"></span>
      <button class="btn" id="themeBtn"></button>
      <button class="btn" id="modeBtn"></button>
    </div>`;
  $('#site-footer').innerHTML = `© ${new Date().getFullYear()} Pixel Pulse Studio. Studio dan game ini fiktif, dibuat untuk latihan.`;
}

/* ---------- Tema (Cyberpunk / Retro) dan mode (gelap / terang) ---------- */
function refreshToolLabels() {
  $('#themeBtn').textContent = root.dataset.theme === 'cyber' ? 'Tema: Cyberpunk' : 'Tema: Retro';
  $('#modeBtn').textContent = root.dataset.mode === 'dark' ? '🌙 Gelap' : '☀️ Terang';
  $('#modeBtn').setAttribute('aria-pressed', root.dataset.mode === 'dark');
}
function setupTheme() {
  $('#themeBtn').onclick = () => {
    root.dataset.theme = root.dataset.theme === 'cyber' ? 'retro' : 'cyber';
    store.set('iah_theme', root.dataset.theme);
    refreshToolLabels();
  };
  $('#modeBtn').onclick = () => {
    root.dataset.mode = root.dataset.mode === 'dark' ? 'light' : 'dark';
    store.set('iah_mode', root.dataset.mode);
    refreshToolLabels();
  };
  refreshToolLabels();
}

/* ---------- Clicker XP / Koin ---------- */
const game = Object.assign({ xp: 0, coins: 0, power: 1 }, store.get('iah_game', {}));
const costOf = () => 20 * game.power;
const levelOf = () => Math.floor(game.xp / 50) + 1;
function renderGame() {
  $('#xpBadge').textContent = `LV ${levelOf()} | ${game.xp} XP | ${game.coins} 🪙`;
  if (!$('#clickBtn')) return;
  $('#coins').textContent = game.coins;
  $('#xp').textContent = game.xp;
  $('#level').textContent = levelOf();
  $('#power').textContent = game.power;
  $('#cost').textContent = costOf();
  $('#bar').style.width = (game.xp % 50) * 2 + '%';
  $('#upgrade').disabled = game.coins < costOf();
}
function setupClicker() {
  renderGame();
  if (!$('#clickBtn')) return;
  $('#clickBtn').onclick = e => {
    const before = levelOf();
    game.xp += game.power;
    game.coins += game.power;
    store.set('iah_game', game);
    const p = document.createElement('span');
    p.className = 'pop';
    p.textContent = '+' + game.power;
    p.style.left = (e.clientX || innerWidth / 2) + 'px';
    p.style.top = (e.clientY || innerHeight / 2) + 'px';
    document.body.append(p);
    setTimeout(() => p.remove(), 800);
    if (levelOf() > before) $('#msg').textContent = `Naik ke level ${levelOf()}! Terus lanjut.`;
    renderGame();
  };
  $('#upgrade').onclick = () => {
    if (game.coins < costOf()) return;
    game.coins -= costOf();
    game.power++;
    store.set('iah_game', game);
    $('#msg').textContent = `Upgrade berhasil. Sekarang +${game.power} per klik.`;
    renderGame();
  };
  $('#reset').onclick = () => {
    if (!confirm('Reset semua XP, koin, dan upgrade?')) return;
    Object.assign(game, { xp: 0, coins: 0, power: 1 });
    store.set('iah_game', game);
    $('#msg').textContent = 'Skor direset. Mulai lagi dari nol.';
    renderGame();
  };
  $('#quickPlay').onclick = () => {
    $('#arcade').scrollIntoView({ behavior: 'smooth' });
    const b = $('#clickBtn');
    b.focus({ preventScroll: true });
    b.classList.add('shake');
    setTimeout(() => b.classList.remove('shake'), 400);
  };
}

/* ---------- Modal trailer ---------- */
function setupModal() {
  const m = $('#modal');
  if (!m) return;
  const close = () => { m.hidden = true; $('#trailerBtn').focus(); };
  $('#trailerBtn').onclick = () => { m.hidden = false; $('#closeModal').focus(); };
  $('#closeModal').onclick = close;
  m.onclick = e => { if (e.target === m) close(); };
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !m.hidden) close(); });
}

/* ---------- Galeri: filter, rating bintang, feedback ---------- */
function setupGallery() {
  const cards = $$('.card');
  if (!cards.length) return;
  const ratings = store.get('iah_ratings', {});

  const renderRating = card => {
    const id = card.dataset.id, mine = ratings[id] || 0;
    const seed = parseFloat(card.dataset.seed), n = parseInt(card.dataset.count, 10);
    const total = mine ? n + 1 : n;
    const avg = ((seed * n) + mine) / total;
    const box = $('.rating', card);
    box.innerHTML = [1, 2, 3, 4, 5].map(i =>
      `<button class="star ${i <= mine ? 'on' : ''}" data-v="${i}" aria-label="Beri ${i} bintang">★</button>`).join('') +
      `<span class="avg">${avg.toFixed(1)} / 5 (${total} suara)${mine ? ', kamu: ' + mine : ''}</span>`;
    $$('.star', box).forEach(b => b.onclick = () => {
      ratings[id] = parseInt(b.dataset.v, 10);
      store.set('iah_ratings', ratings);
      renderRating(card);
    });
  };
  cards.forEach(renderRating);

  $$('[data-filter]').forEach(b => b.onclick = () => {
    $$('[data-filter]').forEach(x => x.classList.toggle('active', x === b));
    cards.forEach(c => c.hidden = b.dataset.filter !== 'all' && c.dataset.cat !== b.dataset.filter);
  });

  const list = $('#fbList');
  const renderFb = () => {
    const items = store.get('iah_feedback', []);
    list.innerHTML = '';
    if (!items.length) { list.innerHTML = '<li class="muted">Belum ada feedback. Jadilah yang pertama.</li>'; return; }
    items.slice().reverse().forEach(f => {
      const li = document.createElement('li');
      const b = document.createElement('b'); b.textContent = f.name || 'Anonim';
      const s = document.createElement('small'); s.textContent = ' - ' + f.date;
      const p = document.createElement('div'); p.textContent = f.text;
      li.append(b, s, p);
      list.append(li);
    });
  };
  $('#fbSend').onclick = () => {
    const text = $('#fbText').value.trim();
    if (!text) { $('#fbText').focus(); return; }
    const items = store.get('iah_feedback', []);
    items.push({ name: $('#fbName').value.trim(), text, date: new Date().toLocaleDateString('id-ID') });
    store.set('iah_feedback', items);
    $('#fbText').value = '';
    renderFb();
  };
  $('#fbClear').onclick = () => {
    if (confirm('Hapus semua feedback tersimpan?')) { store.set('iah_feedback', []); renderFb(); }
  };
  renderFb();
}

document.addEventListener('DOMContentLoaded', () => {
  buildChrome();
  setupTheme();
  setupClicker();
  setupModal();
  setupGallery();
});
