const TZ = 'Asia/Singapore';
const BRIEF_HOUR = '7h45';
// Clé publique des notifications (la clé privée est un secret GitHub)
const VAPID_PUBLIC_KEY = 'BIds3bAY7ofJm7_1fsQDrNJD4iJxrSz3PfF-7kn2L1dZJflIG4ozsM0xOJZp3gUBMcVnffQiC4Q-hPTTIpM_LIk';
const REGIONS = ['Asie du Nord-Est', 'Asie du Sud-Est', 'Asie du Sud', 'Océanie', 'Europe', 'Russie-Ukraine',
  'Moyen-Orient', 'Afrique', 'Amériques', 'Monde'];

const $ = (sel) => document.querySelector(sel);
const state = {
  view: 'brief',          // brief | search | favs
  current: null,          // brief affiché
  index: { dates: [], hebdo: [], rubriques: [] },
  viewingLatest: true,
  filter: { rub: '', place: '' },
  search: null,           // index de recherche (chargé à la demande)
};

// ── Outils ───────────────────────────────────────

function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style') el.style.cssText = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false || kid === '') continue;
    el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  }
  return el;
}

const safeUrl = (u) => (/^https?:\/\//i.test(u || '') ? u : '#');
const capitalize = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const rubColor = (id) => `--c: var(--c-${id || 'none'}, var(--accent))`;
const rubTitle = (id) => (state.index.rubriques.find((r) => r.id === id) || {}).titre || '';

function todaySG() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

function shortDate(iso) {
  const d = new Date(iso + 'T12:00:00Z');
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(d);
}

async function getJSON(path) {
  const res = await fetch(path, { cache: 'no-store' });
  if (!res.ok) throw new Error(`${path} : ${res.status}`);
  return res.json();
}

function store(key, value) {
  try {
    if (value === undefined) return JSON.parse(localStorage.getItem(key) || 'null');
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) { /* stockage indisponible */ }
  return null;
}

// ── Favoris ──────────────────────────────────────

const favs = () => store('favs') || [];
const favId = (date, it) => `${date}|${it.titre}`;
const isFav = (id) => favs().some((f) => f.id === id);

function toggleFav(date, it, btn) {
  const id = favId(date, it);
  const list = favs();
  const next = isFav(id) ? list.filter((f) => f.id !== id) : [{ id, date, item: it }, ...list];
  store('favs', next);
  if (btn) {
    btn.classList.toggle('on', isFav(id));
    btn.setAttribute('aria-label', isFav(id) ? 'Retirer des favoris' : 'Ajouter aux favoris');
  }
  updateFavCount();
  if (state.view === 'favs') renderFavs();
}

function updateFavCount() {
  const n = favs().length;
  $('#fav-count').textContent = n || '';
  $('#fav-count').hidden = !n;
}

async function share(it) {
  const url = (it.liens || [])[0]?.url || location.href;
  const text = `${it.emoji ? it.emoji + ' ' : ''}${it.titre}\n${it.resume || ''}`;
  try {
    if (navigator.share) await navigator.share({ title: it.titre, text, url });
    else {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      toast('Copié dans le presse-papiers');
    }
  } catch (e) { /* partage annulé */ }
}

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { t.hidden = true; }, 2200);
}

// ── Rendu d'un sujet ─────────────────────────────

const ICON_STAR = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.9z" fill="var(--star-fill)" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';
const ICON_SHARE = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 15V3.5M7.5 8 12 3.5 16.5 8M6 12H5v8.5h14V12h-1" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function iconBtn(svg, label, onclick, extraClass) {
  const b = h('button', { class: `act ${extraClass || ''}`, type: 'button', 'aria-label': label, onclick });
  b.innerHTML = svg;
  return b;
}

function sources(links) {
  return (links || []).map((l) =>
    h('a', { class: 'src', href: safeUrl(l.url), target: '_blank', rel: 'noopener', title: l.titre || '' }, `${l.source} ↗`));
}

function itemBody(it, date, opts = {}) {
  const fav = iconBtn(ICON_STAR, 'Ajouter aux favoris', (e) => toggleFav(date, it, e.currentTarget), 'star');
  fav.classList.toggle('on', isFav(favId(date, it)));
  return [
    opts.label && h('p', { class: 'item-label', style: rubColor(it.rubrique) }, h('span', { class: 'dot' }), opts.label),
    h('h3', null, it.emoji && h('span', { class: 'emoji', 'aria-hidden': 'true' }, it.emoji), it.titre),
    it.resume && h('p', { class: 'resume' }, it.resume),
    it.pourquoi && h('p', { class: 'why' }, h('span', { class: 'why-label' }, 'Pourquoi c’est important'), it.pourquoi),
    h('div', { class: 'item-foot' },
      h('div', { class: 'foot-info' }, (it.pays || []).map((p) => h('span', { class: 'tag' }, p)), sources(it.liens)),
      h('div', { class: 'foot-actions' }, fav, iconBtn(ICON_SHARE, 'Partager', () => share(it)))),
  ];
}

// ── Vue « brief » ────────────────────────────────

function allItems(b) {
  const out = (b.essentiel || []).map((it) => ({ it, rub: it.rubrique, top: true }));
  for (const r of b.rubriques || []) for (const it of r.items) out.push({ it, rub: r.id, top: false });
  return out;
}

function matches(it, rub) {
  const { rub: fr, place } = state.filter;
  if (fr && (it.rubrique || rub) !== fr) return false;
  if (place) {
    const [kind, value] = [place.slice(0, 1), place.slice(2)];
    if (kind === 'r' && it.region !== value) return false;
    if (kind === 'p' && !(it.pays || []).includes(value)) return false;
  }
  return true;
}

function renderFilters(b) {
  const items = allItems(b);
  const counts = {};
  for (const { it, rub } of items) counts[it.rubrique || rub] = (counts[it.rubrique || rub] || 0) + 1;

  const chips = $('#chips');
  chips.replaceChildren(
    h('button', { class: `chip ${state.filter.rub ? '' : 'active'}`, type: 'button', onclick: () => setFilter({ rub: '' }) }, 'Tout'),
    ...(b.rubriques || []).filter((r) => counts[r.id]).map((r) =>
      h('button', {
        class: `chip ${state.filter.rub === r.id ? 'active' : ''}`, type: 'button', style: rubColor(r.id),
        onclick: () => setFilter({ rub: state.filter.rub === r.id ? '' : r.id }),
      }, h('span', { class: 'dot' }), r.titre, h('b', null, counts[r.id]))));

  const regions = new Map();
  const pays = new Map();
  for (const { it } of items) {
    if (it.region) regions.set(it.region, (regions.get(it.region) || 0) + 1);
    for (const p of it.pays || []) pays.set(p, (pays.get(p) || 0) + 1);
  }
  const sel = $('#place');
  sel.replaceChildren(
    h('option', { value: '' }, '🌏 Toutes régions'),
    regions.size && h('optgroup', { label: 'Régions' },
      REGIONS.filter((r) => regions.has(r)).map((r) =>
        h('option', { value: `r:${r}`, selected: state.filter.place === `r:${r}` }, `${r} (${regions.get(r)})`))),
    pays.size && h('optgroup', { label: 'Pays' },
      [...pays.keys()].sort((a, c) => a.localeCompare(c, 'fr')).map((p) =>
        h('option', { value: `p:${p}`, selected: state.filter.place === `p:${p}` }, `${p} (${pays.get(p)})`))));
  $('#filters').hidden = !items.length;
  $('#place').hidden = !regions.size && !pays.size;
  $('#place').classList.toggle('active', !!state.filter.place);
}

function setFilter(patch) {
  Object.assign(state.filter, patch);
  renderBriefContent(state.current);
}

function renderHebdo(b) {
  const box = $('#hebdo');
  const w = b.hebdo;
  box.replaceChildren();
  box.hidden = !w;
  if (!w) return;
  box.append(h('details', { class: 'hebdo' },
    h('summary', null,
      h('span', { class: 'hebdo-head' },
        h('span', { class: 'hebdo-title' }, '📊 Synthèse de la semaine'), h('span', { class: 'chev', 'aria-hidden': 'true' }, '▾')),
      w.accroche && h('span', { class: 'hebdo-accroche' }, w.accroche)),
    h('ol', { class: 'hebdo-list' }, (w.tendances || []).map((t) => h('li', null,
      h('h3', null, t.emoji && h('span', { class: 'emoji' }, t.emoji), t.titre),
      h('p', { class: 'resume' }, t.resume),
      h('div', { class: 'foot-info' }, sources(t.liens))))),
    (w.a_suivre || []).length && h('div', null,
      h('h4', null, 'À suivre cette semaine'),
      h('ul', { class: 'watch-list' }, w.a_suivre.map((a) => h('li', null, h('span', { class: 'when' }, a.quand), h('span', null, a.quoi)))))));
}

function renderBriefContent(b) {
  renderFilters(b);
  const filtering = state.filter.rub || state.filter.place;

  const top = (b.essentiel || []).filter((it) => matches(it, it.rubrique));
  const ess = $('#essentiel');
  ess.replaceChildren();
  ess.hidden = !top.length;
  if (top.length) {
    ess.append(h('h2', { class: 'section-title' }, 'L’essentiel',
      top.length > 1 && h('span', { class: 'hint' }, `${top.length} sujets · glisse →`)),
      h('ol', null, top.map((it) => h('li', { style: rubColor(it.rubrique) }, itemBody(it, b.date, { label: rubTitle(it.rubrique) })))));
  }

  const box = $('#rubriques');
  box.replaceChildren();
  let shown = top.length;
  for (const r of b.rubriques || []) {
    const items = r.items.filter((it) => matches(it, r.id));
    if (!items.length) continue;
    shown += items.length;
    box.append(h('details', { class: 'rubrique', id: `r-${r.id}`, open: true, style: rubColor(r.id) },
      h('summary', null,
        h('span', { class: 'dot' }), h('h2', null, r.titre),
        h('span', { class: 'count' }, items.length), h('span', { class: 'chev', 'aria-hidden': 'true' }, '▾')),
      items.map((it) => h('article', { class: 'item' }, itemBody(it, b.date)))));
  }
  if (filtering && !shown) box.append(h('p', { class: 'empty' }, 'Aucun sujet pour ce filtre aujourd’hui.'));

  const watch = $('#watch');
  const list = filtering ? [] : (b.a_surveiller || []);
  watch.replaceChildren();
  watch.hidden = !list.length;
  if (list.length) {
    watch.append(h('h2', { class: 'section-title' }, 'À surveiller'),
      h('ul', { class: 'watch-list' }, list.map((w) => h('li', null,
        h('span', { class: 'when' }, w.quand), h('span', null, w.quoi, ' ', sources(w.liens))))));
  }
}

function renderBanner(b) {
  const msgs = [];
  if (state.viewingLatest && b.date < todaySG()) {
    msgs.push(`Le brief d’aujourd’hui n’est pas encore publié (il arrive avant ${BRIEF_HOUR}). Voici celui du ${b.date_fr}.`);
  } else if (!state.viewingLatest) {
    msgs.push(`Archive du ${b.date_fr}.`);
  }
  if (b.mode === 'brut') msgs.push('Résumé IA indisponible ce jour-là : titres bruts classés par rubrique.');
  if (!navigator.onLine) msgs.push('Hors connexion : dernier brief enregistré.');
  $('#banner').textContent = msgs.join(' ');
  $('#banner').hidden = !msgs.length;
}

function renderArchive() {
  const { dates, hebdo } = state.index;
  const cur = state.current;
  const list = dates.length ? dates : [cur.date];
  $('#archive-select').replaceChildren(...list.map((d, i) =>
    h('option', { value: i === 0 ? '' : d, selected: cur.date === d },
      `${(hebdo || []).includes(d) ? '📊 ' : ''}${shortDate(d)}${i === 0 ? ' (dernier)' : ''}`)));
  const lastWeekly = (hebdo || [])[0];
  const link = $('#hebdo-link');
  link.hidden = !lastWeekly || !!cur.hebdo;
  if (lastWeekly) link.textContent = `📊 Dernière synthèse de la semaine (${shortDate(lastWeekly)})`;
  link.onclick = () => load(lastWeekly === state.index.dates[0] ? undefined : lastWeekly);
}

function render(b) {
  state.current = b;
  $('#title').textContent = capitalize((b.date_fr || b.date).replace(/ \d{4}$/, ''));
  $('#updated').textContent = `Mis à jour à ${b.genere_le.slice(11, 16).replace(':', 'h')} · heure de Singapour`;
  $('#accroche').textContent = b.accroche || '';
  renderBanner(b);
  renderHebdo(b);
  renderBriefContent(b);
  renderArchive();

  const s = b.stats || {};
  const by = b.mode === 'ia' ? `Résumé par l’IA Gemini (${b.modele}).` : 'Sans résumé IA.';
  $('#meta').replaceChildren(
    h('p', null, `${s.articles ?? '?'} articles analysés · ${s.sources ?? '?'} sources · ${by}`),
    h('p', null, 'Résumés automatiques : vérifie la source avant de citer un chiffre.'));
}

// ── Vue « recherche » ────────────────────────────

async function runSearch(q) {
  const box = $('#search-results');
  const terms = norm(q).split(/\s+/).filter(Boolean);
  if (!terms.length) {
    box.replaceChildren(h('p', { class: 'empty' }, 'Cherche un pays, un système, un industriel… dans les briefs des 60 derniers jours.'));
    return;
  }
  if (!state.search) {
    box.replaceChildren(h('p', { class: 'empty' }, 'Chargement des archives…'));
    try { state.search = await getJSON('data/search.json'); } catch (e) {
      box.replaceChildren(h('p', { class: 'empty' }, 'Archives indisponibles hors connexion.'));
      return;
    }
  }
  const hits = state.search.filter((r) => {
    const hay = norm([r.t, r.s, r.w, (r.p || []).join(' '), r.g, rubTitle(r.r), (r.l || []).map((l) => l.source).join(' ')].join(' '));
    return terms.every((t) => hay.includes(t));
  }).slice(0, 150);

  if (!hits.length) {
    box.replaceChildren(h('p', { class: 'empty' }, 'Aucun résultat.'));
    return;
  }
  const groups = new Map();
  for (const r of hits) {
    if (!groups.has(r.d)) groups.set(r.d, []);
    groups.get(r.d).push(r);
  }
  box.replaceChildren(
    h('p', { class: 'result-count' }, `${hits.length} résultat${hits.length > 1 ? 's' : ''}`),
    ...[...groups].map(([d, rows]) => h('section', { class: 'result-day' },
      h('h2', { class: 'section-title' }, capitalize(shortDate(d))),
      rows.map((r) => {
        const it = { emoji: r.e, titre: r.t, resume: r.s, pourquoi: r.w, pays: r.p, region: r.g, rubrique: r.r, liens: r.l };
        return h('article', { class: 'item card' }, itemBody(it, d, { label: rubTitle(r.r) }));
      }))));
}

// ── Vue « favoris » ──────────────────────────────

function renderFavs() {
  const list = favs();
  const box = $('#favs-list');
  if (!list.length) {
    box.replaceChildren(h('p', { class: 'empty' }, 'Aucun favori. Touche l’étoile d’un sujet pour le garder ici.'));
    return;
  }
  box.replaceChildren(...list.map((f) => h('article', { class: 'item card' },
    h('p', { class: 'fav-date' }, capitalize(shortDate(f.date))),
    itemBody(f.item, f.date, { label: rubTitle(f.item.rubrique) }))));
}

// ── Navigation entre vues ────────────────────────

function show(view) {
  state.view = view;
  $('#view-brief').hidden = view !== 'brief';
  $('#view-search').hidden = view !== 'search';
  $('#view-favs').hidden = view !== 'favs';
  $('#back').hidden = view === 'brief';
  $('#btn-search').classList.toggle('on', view === 'search');
  $('#btn-favs').classList.toggle('on', view === 'favs');
  if (view === 'search') {
    runSearch($('#q').value);
    setTimeout(() => $('#q').focus(), 50);
  }
  if (view === 'favs') renderFavs();
  window.scrollTo({ top: 0 });
}

// ── Notifications ────────────────────────────────

function b64ToBytes(b64) {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

const standalone = () => navigator.standalone || matchMedia('(display-mode: standalone)').matches;

async function renderNotif() {
  const status = $('#notif-status');
  const btn = $('#notif-btn');
  const code = $('#notif-code');
  btn.hidden = true;
  code.hidden = true;
  const isIOS = /iPhone|iPad/.test(navigator.userAgent);

  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    status.textContent = isIOS && !standalone()
      ? 'Ajoute d’abord l’app à l’écran d’accueil (Partager → Sur l’écran d’accueil), puis ouvre-la depuis l’icône pour activer les notifications.'
      : 'Notifications non disponibles sur cet appareil.';
    return;
  }
  if (Notification.permission === 'denied') {
    status.textContent = 'Notifications refusées. Pour les réactiver : Réglages → Notifications → Brief.';
    return;
  }
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (sub && store('pushSent')) {
    status.textContent = `Activées sur cet appareil ✓ Tu recevras le brief chaque matin à ${BRIEF_HOUR}.`;
    btn.textContent = 'Afficher le code';
    btn.hidden = false;
    btn.onclick = () => showCode(sub);
    return;
  }
  if (sub) {
    showCode(sub);
    return;
  }
  status.textContent = `Reçois une notification chaque matin à ${BRIEF_HOUR} quand le brief est prêt.`;
  btn.textContent = 'Activer les notifications';
  btn.hidden = false;
  btn.onclick = async () => {
    try {
      if (await Notification.requestPermission() !== 'granted') return renderNotif();
      const s = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(VAPID_PUBLIC_KEY) });
      showCode(s);
    } catch (e) {
      status.textContent = `Activation impossible : ${e.message}`;
    }
  };
}

function showCode(sub) {
  const json = JSON.stringify(sub);
  $('#notif-status').textContent = 'Dernière étape (une seule fois) : copie ce code et envoie-le à Claude sur ton Mac. Il l’enregistrera sur GitHub.';
  const code = $('#notif-code');
  code.hidden = false;
  code.value = json;
  const btn = $('#notif-btn');
  btn.hidden = false;
  btn.textContent = 'Copier le code';
  btn.onclick = async () => {
    try { await navigator.clipboard.writeText(json); } catch (e) { code.select(); document.execCommand('copy'); }
    store('pushSent', true);
    toast('Code copié');
  };
}

// ── Chargement ───────────────────────────────────

async function load(date) {
  const btn = $('#refresh');
  btn.classList.add('loading');
  try {
    const [index, brief] = await Promise.all([
      getJSON('data/index.json').catch(() => state.index),
      getJSON(date ? `data/archive/${date}.json` : 'data/latest.json'),
    ]);
    state.index = { dates: [], hebdo: [], rubriques: [], ...index };
    state.viewingLatest = !date;
    state.search = null;
    if (!date) state.filter = { rub: '', place: '' };
    render(brief);
    if (state.view !== 'brief') show('brief');
    else window.scrollTo({ top: 0 });
  } catch (err) {
    $('#updated').textContent = 'Impossible de charger le brief.';
    $('#banner').textContent = navigator.onLine
      ? 'Aucun brief publié pour le moment. Le premier arrivera au prochain lancement automatique.'
      : 'Pas de connexion et aucun brief enregistré.';
    $('#banner').hidden = false;
  } finally {
    btn.classList.remove('loading');
  }
  if (navigator.clearAppBadge) navigator.clearAppBadge().catch(() => {});
}

$('#refresh').addEventListener('click', () => load());
$('#btn-search').addEventListener('click', () => show(state.view === 'search' ? 'brief' : 'search'));
$('#btn-favs').addEventListener('click', () => show(state.view === 'favs' ? 'brief' : 'favs'));
$('#back').addEventListener('click', () => show('brief'));
$('#place').addEventListener('change', (e) => setFilter({ place: e.target.value }));
$('#archive-select').addEventListener('change', (e) => load(e.target.value || undefined));
let searchTimer;
$('#q').addEventListener('input', (e) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => runSearch(e.target.value), 180);
});

// Quand on rouvre l'app le matin, on recharge si le brief affiché n'est plus celui du jour.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  if (navigator.clearAppBadge) navigator.clearAppBadge().catch(() => {});
  if (state.viewingLatest && state.current && state.current.date !== todaySG()) load();
});

// Astuce d'installation (seulement dans le navigateur, pas dans l'app installée)
if (!standalone() && !store('installTipClosed')) {
  $('#install-tip').hidden = false;
  $('#install-close').addEventListener('click', () => {
    $('#install-tip').hidden = true;
    store('installTipClosed', true);
  });
}

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').then(renderNotif).catch(renderNotif);
else renderNotif();
updateFavCount();
load();
