const TZ = 'Asia/Singapore';
// Clé publique des notifications (la clé privée est un secret GitHub)
const VAPID_PUBLIC_KEY = 'BIds3bAY7ofJm7_1fsQDrNJD4iJxrSz3PfF-7kn2L1dZJflIG4ozsM0xOJZp3gUBMcVnffQiC4Q-hPTTIpM_LIk';
const REGIONS = ['North-East Asia', 'South-East Asia', 'South Asia', 'Oceania', 'Europe', 'Russia-Ukraine',
  'Middle East', 'Africa', 'Americas', 'Global'];
const READ_KEEP_DAYS = 45;
// « Ask AI » : appel direct à Gemini depuis le téléphone, avec la clé gardée sur l'appareil
// Flash-Lite d'abord : ~2 s par réponse au lieu de ~14 s avec Flash
const AI_MODELS = ['gemini-flash-lite-latest', 'gemini-3.5-flash-lite', 'gemini-flash-latest'];
const AI_READER = 'a European defence industry professional based in Singapore, specialised in air defence';

// ── Langue : français par défaut, bouton F / E en haut (sans recharger la page) ──
const I18N = {
  fr: {
    kicker: 'Défense & Géopo', back: 'Retour au brief', search: 'Rechercher', favs: 'Favoris', refresh: 'Actualiser',
    langSwitch: 'Switch to English', langLetter: 'F', sections: 'Rubriques', placeAria: 'Filtrer par région ou pays',
    prevBriefs: 'Briefs précédents', askAI: 'Demander à l’IA', searchPh: 'Patriot, Taïwan, Thales…', close: 'Fermer',
    askPh: 'Pose une question sur ce sujet…', askSend: 'Envoyer', hour: '7h45',
    installTip: 'Pour l’ajouter à l’écran d’accueil : touche <strong>Partager</strong>, puis <strong>« Sur l’écran d’accueil »</strong>.',
    markRead: 'Marquer comme lu', addFav: 'Ajouter aux favoris', removeFav: 'Retirer des favoris', askStory: 'Demander à l’IA sur ce sujet',
    markedRead: 'Marqué comme lu', undo: 'Annuler', new: 'Nouveau', yesterday: 'Hier', daysAgo: (n) => `Il y a ${n} jours`,
    update: '🔄 Suite', all: 'Tout', allRegions: '🌏 Toutes les régions', regions: 'Régions', countries: 'Pays',
    essentialsToday: 'L’essentiel du jour', essentials: 'L’essentiel', swipe: (n) => `${n} sujets · glisse →`,
    comingUp: 'À surveiller', toRead: 'À lire', unread: (n) => `${n} non lu${n > 1 ? 's' : ''}`,
    emptyFilter: 'Rien à lire pour ce filtre.', caughtUp: '🎉 Tout est lu', tomorrow: 'Les nouveaux sujets arrivent demain matin.',
    hideRead: 'Masquer les sujets lus', showRead: (n) => `Afficher ${n} sujet${n > 1 ? 's' : ''} lu${n > 1 ? 's' : ''}`,
    noStories: 'Aucun sujet pour ce filtre.', weekly: '📊 Synthèse de la semaine', toWatchWeek: 'À suivre cette semaine',
    notYet: (h, d) => `Le brief d’aujourd’hui n’est pas encore publié (il arrive avant ${h}). Voici celui du ${d}.`,
    archiveOf: (d) => `Archive du ${d} (brief complet de ce jour-là).`,
    rawMode: 'Résumé IA indisponible ce jour-là : titres bruts classés par rubrique.',
    offline: 'Hors connexion : dernier brief enregistré.', today: ' (aujourd’hui)',
    lastWeekly: (d) => `📊 Dernière synthèse de la semaine (${d})`,
    byAI: (m) => `Résumé par l’IA Gemini (${m}).`, noAI: 'Sans résumé IA.',
    stats: (a, s, by) => `${a} articles analysés · ${s} sources · ${by}`,
    checkSource: 'Résumés et traduction automatiques : vérifie la source avant de citer un chiffre.',
    searchHint: 'Cherche un pays, un système, un industriel… dans les briefs des 60 derniers jours.',
    loadingArchives: 'Chargement des archives…', archivesOffline: 'Archives indisponibles hors connexion.',
    noResults: 'Aucun résultat.', results: (n) => `${n} résultat${n > 1 ? 's' : ''}`,
    noFavs: 'Pas encore de favoris. Touche l’étoile d’un sujet pour le garder ici.',
    aiOn: 'Ta clé Gemini est enregistrée sur ce téléphone ✓ Touche ? sur un sujet pour poser une question.',
    aiOff: 'Touche ? sur un sujet pour interroger Gemini. Il faut ta clé Gemini gratuite, gardée uniquement sur ce téléphone.',
    removeKey: 'Supprimer la clé', addKey: 'Ajouter la clé Gemini', keyRemoved: 'Clé supprimée de ce téléphone',
    keyPh: 'Colle ta clé API Gemini',
    keyIntro: 'Cette fonction utilise ta clé Gemini gratuite. Colle-la une fois : elle reste sur ce téléphone, jamais sur le site public.',
    badKey: 'Ça ne ressemble pas à une clé Gemini', keySaved: 'Clé enregistrée sur ce téléphone', saveKey: 'Enregistrer la clé',
    getKey: 'Pour en obtenir une : ', noCard: ' (sans carte bancaire).', setupAsk: 'Configurer l’IA',
    suggestions: ['Donne-moi le contexte', 'Qu’est-ce que ça change pour la défense aérienne ?', 'Que peut-il se passer ensuite ?', 'Qui sont les acteurs clés ?'],
    readSrc: 'Lu : ', link: 'lien', aiTimeout: 'Gemini n’a pas répondu à temps. Réessaie.', noConn: 'Pas de connexion.',
    keyRefused: 'Ta clé Gemini a été refusée. Vérifie-la dans « Demander à l’IA » en bas de la page.',
    quota: 'Quota gratuit Gemini atteint pour le moment. Réessaie plus tard.', aiErr: (s) => `Erreur Gemini (${s}).`,
    aiEmpty: 'Gemini a renvoyé une réponse vide.', noAnswer: 'Pas de réponse',
    notifIOS: 'Ajoute d’abord l’app à l’écran d’accueil (Partager → Sur l’écran d’accueil), puis ouvre-la depuis l’icône pour activer les notifications.',
    notifNone: 'Les notifications ne sont pas disponibles sur cet appareil.',
    notifBlocked: 'Les notifications sont bloquées. Pour les autoriser : Réglages → Notifications → Brief.',
    notifOn: (h) => `Activées sur cet appareil ✓ Tu recevras le brief chaque matin à ${h}.`, showCode: 'Afficher le code',
    notifOffer: (h) => `Reçois une notification chaque matin à ${h} quand le brief est prêt.`, turnOn: 'Activer les notifications',
    notifFail: (m) => `Impossible de les activer : ${m}`, copyCode: 'Copier le code', codeCopied: 'Code copié',
    lastStep: 'Dernière étape (une seule fois) : copie ce code et envoie-le à Claude sur ton Mac, qui l’enregistrera sur GitHub.',
    noBrief: 'Aucun brief publié pour l’instant. Le premier arrivera au prochain passage automatique.',
    noBriefOffline: 'Pas de connexion et aucun brief enregistré.',
  },
  en: {
    kicker: 'Defence & Geopolitics', back: 'Back to the brief', search: 'Search', favs: 'Favourites', refresh: 'Refresh',
    langSwitch: 'Passer en français', langLetter: 'E', sections: 'Sections', placeAria: 'Filter by region or country',
    prevBriefs: 'Previous briefs', askAI: 'Ask AI', searchPh: 'Patriot, Taiwan, Thales…', close: 'Close',
    askPh: 'Ask about this story…', askSend: 'Ask', hour: '7:45',
    installTip: 'To add it to your home screen: tap <strong>Share</strong>, then <strong>“Add to Home Screen”</strong>.',
    markRead: 'Mark as read', addFav: 'Add to favourites', removeFav: 'Remove from favourites', askStory: 'Ask AI about this story',
    markedRead: 'Marked as read', undo: 'Undo', new: 'New', yesterday: 'Yesterday', daysAgo: (n) => `${n} days ago`,
    update: '🔄 Update', all: 'All', allRegions: '🌏 All regions', regions: 'Regions', countries: 'Countries',
    essentialsToday: 'Today’s essentials', essentials: 'Essentials', swipe: (n) => `${n} stories · swipe →`,
    comingUp: 'Coming up', toRead: 'To read', unread: (n) => `${n} unread`,
    emptyFilter: 'Nothing to read for this filter.', caughtUp: '🎉 You’re all caught up', tomorrow: 'New stories arrive tomorrow morning.',
    hideRead: 'Hide read stories', showRead: (n) => `Show ${n} read ${n === 1 ? 'story' : 'stories'}`,
    noStories: 'No stories for this filter.', weekly: '📊 Weekly summary', toWatchWeek: 'To watch this week',
    notYet: (h, d) => `Today’s brief isn’t out yet (it arrives before ${h}). Showing ${d}.`,
    archiveOf: (d) => `Archive: ${d} (full brief of that day).`,
    rawMode: 'AI summary unavailable that day: raw headlines by section.',
    offline: 'Offline: showing the last saved brief.', today: ' (today)',
    lastWeekly: (d) => `📊 Latest weekly summary (${d})`,
    byAI: (m) => `Summarised by Gemini AI (${m}).`, noAI: 'No AI summary.',
    stats: (a, s, by) => `${a} articles analysed · ${s} sources · ${by}`,
    checkSource: 'Automatic summaries: check the source before quoting a figure.',
    searchHint: 'Search for a country, a system, a company… across the last 60 days of briefs.',
    loadingArchives: 'Loading archives…', archivesOffline: 'Archives unavailable offline.',
    noResults: 'No results.', results: (n) => `${n} result${n === 1 ? '' : 's'}`,
    noFavs: 'No favourites yet. Tap the star on a story to keep it here.',
    aiOn: 'Your Gemini key is saved on this phone ✓ Tap ? on any story to ask a question.',
    aiOff: 'Tap ? on any story to ask Gemini about it. It needs your free Gemini key, stored only on this phone.',
    removeKey: 'Remove key', addKey: 'Add Gemini key', keyRemoved: 'Key removed from this phone',
    keyPh: 'Paste your Gemini API key',
    keyIntro: 'Ask AI uses your free Gemini key. Paste it once: it stays on this phone only, never in the public site.',
    badKey: 'That doesn’t look like a Gemini key', keySaved: 'Key saved on this phone', saveKey: 'Save key',
    getKey: 'Get one at ', noCard: ' (no card needed).', setupAsk: 'Set up Ask AI',
    suggestions: ['Give me the background', 'What does it mean for air defence?', 'What could happen next?', 'Who are the key players?'],
    readSrc: 'Read: ', link: 'link', aiTimeout: 'Gemini didn’t answer in time. Try again.', noConn: 'No connection.',
    keyRefused: 'Your Gemini key was refused. Check it in “Ask AI” at the bottom of the page.',
    quota: 'Free Gemini quota reached for now. Try again later.', aiErr: (s) => `Gemini error (${s}).`,
    aiEmpty: 'Gemini returned an empty answer.', noAnswer: 'No answer',
    notifIOS: 'Add the app to your home screen first (Share → Add to Home Screen), then open it from the icon to turn on notifications.',
    notifNone: 'Notifications aren’t available on this device.',
    notifBlocked: 'Notifications are blocked. To allow them: Settings → Notifications → Brief.',
    notifOn: (h) => `On for this device ✓ You’ll get the brief every morning at ${h}.`, showCode: 'Show code',
    notifOffer: (h) => `Get a notification every morning at ${h} when the brief is ready.`, turnOn: 'Turn on notifications',
    notifFail: (m) => `Couldn’t turn them on: ${m}`, copyCode: 'Copy code', codeCopied: 'Code copied',
    lastStep: 'Last step (once only): copy this code and send it to Claude on your Mac, who will save it on GitHub.',
    noBrief: 'No brief published yet. The first one will arrive at the next automatic run.',
    noBriefOffline: 'No connection and no saved brief.',
  },
};
const REGION_FR = {
  'North-East Asia': 'Asie du Nord-Est', 'South-East Asia': 'Asie du Sud-Est', 'South Asia': 'Asie du Sud',
  Oceania: 'Océanie', Europe: 'Europe', 'Russia-Ukraine': 'Russie-Ukraine', 'Middle East': 'Moyen-Orient',
  Africa: 'Afrique', Americas: 'Amériques', Global: 'Monde',
};

const $ = (sel) => document.querySelector(sel);
const state = {
  lang: 'fr',             // fr | en (bouton F / E)
  view: 'brief',          // brief | search | favs
  current: null,          // brief affiché (dernier ou archive)
  pile: [],               // sujets des 7 derniers jours (pile « À lire »)
  index: { dates: [], hebdo: [], rubriques: [] },
  viewingLatest: true,
  filter: { rub: '', place: '' },
  showRead: false,
  search: null,           // index de recherche (chargé à la demande)
  lus: {},                // id → date de lecture
  ask: null,              // { it, date, history: [] } pour le panneau « Ask AI »
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
const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const isFr = () => state.lang === 'fr';
// Texte d'interface dans la langue choisie
function t(key, ...args) {
  const v = I18N[state.lang][key] ?? I18N.en[key];
  return typeof v === 'function' ? v(...args) : v;
}
// Texte d'un sujet : version française si elle existe, sinon l'anglais d'origine
const tr = (obj, field) => (isFr() && obj?.fr?.[field]) || obj?.[field] || '';
const locale = () => (isFr() ? 'fr-FR' : 'en-US');
const regionName = (r) => (isFr() && REGION_FR[r]) || r;
const rubColor = (id) => `--c: var(--c-${id || 'none'}, var(--accent))`;
const rubOrder = () => (state.index.rubriques.length ? state.index.rubriques
  : (state.current?.rubriques || []).map((r) => ({ id: r.id, titre: r.titre })));
const rubName = (r) => (isFr() && r.titre_fr) || r.titre || '';
const rubTitle = (id) => rubName(rubOrder().find((r) => r.id === id) || {});
const itemId = (it, date) => it.id || `${date}|${it.titre}`; // toujours le titre anglais : stable entre langues

function todaySG() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

function shortDate(iso) {
  const d = new Date(iso + 'T12:00:00Z');
  return new Intl.DateTimeFormat(locale(), { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(d);
}

// « 2026-10-19 » → « Lundi 19 octobre » / « Monday, October 19 »
function fullDate(iso, capital = true) {
  const d = new Date(iso + 'T12:00:00Z');
  const s = new Intl.DateTimeFormat(locale(), { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(d);
  return capital ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

// « 2026-10-19 » → « October 19 » (pour l'IA)
function longDate(iso) {
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' }).format(new Date(iso + 'T12:00:00Z'));
}

function dayLabel(date, ref) {
  const days = Math.round((new Date(ref + 'T12:00:00Z') - new Date(date + 'T12:00:00Z')) / 864e5);
  if (days <= 0) return { text: t('new'), isNew: true };
  return { text: days === 1 ? t('yesterday') : t('daysAgo', days), isNew: false };
}

async function getJSON(path) {
  const res = await fetch(path, { cache: 'no-store' });
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json();
}

function store(key, value) {
  try {
    if (value === undefined) return JSON.parse(localStorage.getItem(key) || 'null');
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch (e) { /* stockage indisponible */ }
  return null;
}

function toast(msg, actionLabel, action) {
  const t = $('#toast');
  t.replaceChildren(h('span', null, msg), actionLabel && h('button', {
    class: 'toast-btn', type: 'button',
    onclick: () => { t.hidden = true; action(); },
  }, actionLabel));
  t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { t.hidden = true; }, actionLabel ? 4500 : 2200);
}

// ── Lu / non lu ──────────────────────────────────

function loadRead() {
  const m = store('lus') || {};
  const cutoff = Date.now() - READ_KEEP_DAYS * 864e5;
  for (const k of Object.keys(m)) if (m[k] < cutoff) delete m[k];
  state.lus = m;
}

const isRead = (id) => !!state.lus[id];

function setRead(ids, read) {
  for (const id of ids) {
    if (read) state.lus[id] = Date.now();
    else delete state.lus[id];
  }
  store('lus', state.lus);
}

function onCheck(id, btn) {
  const el = btn.closest('[data-id]');
  const read = !isRead(id);
  setRead([id], read);
  btn.classList.toggle('on', read);
  if (el) el.classList.toggle('is-read', read);
  const inPile = el && el.dataset.pile;
  if (!inPile) return;
  if (read && !state.showRead) {
    el.classList.add('leaving');
    setTimeout(renderBriefContent, 260);
    toast(t('markedRead'), t('undo'), () => { setRead([id], false); renderBriefContent(); });
  } else {
    renderBriefContent();
  }
}

// ── Favoris ──────────────────────────────────────

const favs = () => store('favs') || [];
const isFav = (id) => favs().some((f) => f.id === id);

// Garde une copie de la photo d'un favori sur le téléphone (Wikipédia autorise la copie)
async function keepFavImage(url, keep) {
  if (!url || !('caches' in window)) return;
  try {
    const cache = await caches.open(FAV_IMAGES);
    if (keep) await cache.add(new Request(url, { mode: 'cors' }));
    else if (!favs().some((f) => f.item.visuel?.image === url)) await cache.delete(url);
  } catch (e) { /* hors connexion : la photo reste chargée depuis Wikipédia */ }
}

function toggleFav(date, it, btn) {
  const id = itemId(it, date);
  const list = favs();
  const adding = !isFav(id);
  const next = adding ? [{ id, date, item: it }, ...list] : list.filter((f) => f.id !== id);
  store('favs', next);
  keepFavImage(it.visuel?.image, adding);
  if (btn) {
    btn.classList.toggle('on', isFav(id));
    btn.setAttribute('aria-label', isFav(id) ? t('removeFav') : t('addFav'));
  }
  if (state.view === 'favs') renderFavs();
}

// ── Rendu d'un sujet ─────────────────────────────

const ICON_CHECK = '<svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="var(--check-fill, none)" stroke="currentColor" stroke-width="1.6"/><path d="M8.2 12.3l2.6 2.6 5-5.2" fill="none" stroke="var(--check-stroke, currentColor)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_STAR = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.9z" fill="var(--star-fill)" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';
const ICON_ASK = '<svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M9.6 9.6a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="12" cy="16.6" r="1" fill="currentColor"/></svg>';

function iconBtn(svg, label, onclick, extraClass) {
  const b = h('button', { class: `act ${extraClass || ''}`, type: 'button', 'aria-label': label, onclick });
  b.innerHTML = svg;
  return b;
}

function sources(links) {
  return (links || []).map((l) => h('a', {
    class: 'src', href: safeUrl(l.url), target: '_blank', rel: 'noopener', title: l.titre || '',
  }, `${l.source} ↗`));
}

// Photo d'identification (plateforme ou personne) tirée de Wikipédia, seulement sur certains sujets
const FAV_IMAGES = 'fav-images';

function visuelEl(v) {
  if (!v || !v.image) return null;
  return h('a', { class: `visuel ${v.type === 'person' ? 'person' : ''}`, href: safeUrl(v.page), target: '_blank', rel: 'noopener' },
    h('img', { src: v.image, alt: v.nom, loading: 'lazy', referrerpolicy: 'no-referrer', onerror: (e) => e.currentTarget.parentElement.remove() }),
    h('span', { class: 'visuel-cap' }, h('b', null, v.nom), v.description && h('span', null, v.description)));
}

function itemBody(it, date, opts = {}) {
  const id = itemId(it, date);
  const check = iconBtn(ICON_CHECK, t('markRead'), (e) => onCheck(id, e.currentTarget), 'check');
  check.classList.toggle('on', isRead(id));
  const fav = iconBtn(ICON_STAR, isFav(id) ? t('removeFav') : t('addFav'), (e) => toggleFav(date, it, e.currentTarget), 'star');
  fav.classList.toggle('on', isFav(id));
  const labels = [
    opts.label && h('span', { class: 'label-rub' }, h('span', { class: 'dot' }), opts.label),
    opts.day && h('span', { class: `badge-day ${opts.day.isNew ? 'new' : ''}` }, opts.day.text),
    it.suite && h('span', { class: 'badge-suite' }, t('update')),
  ].filter(Boolean);
  const vis = visuelEl(it.visuel);
  return [
    labels.length && h('p', { class: 'item-label', style: rubColor(it.rubrique) }, labels),
    vis,
    h('h3', null, it.emoji && h('span', { class: 'emoji', 'aria-hidden': 'true' }, it.emoji), tr(it, 'titre')),
    it.resume && h('p', { class: 'resume' }, tr(it, 'resume')),
    h('div', { class: 'item-foot' },
      h('div', { class: 'foot-info' }, sources(it.liens)),
      h('div', { class: 'foot-actions' }, check, fav, iconBtn(ICON_ASK, t('askStory'), () => openAsk(it, date), 'ask'))),
  ];
}

function itemEl(it, date, opts = {}) {
  const id = itemId(it, date);
  return h('article', {
    class: `item ${isRead(id) ? 'is-read' : ''} ${opts.card ? 'card' : ''}`,
    'data-id': id, 'data-pile': opts.pile ? '1' : null,
  }, itemBody(it, date, opts));
}

// ── Filtres ──────────────────────────────────────

function matches(it) {
  const { rub, place } = state.filter;
  if (rub && it.rubrique !== rub) return false;
  if (place) {
    const value = place.slice(2);
    if (place[0] === 'r' && it.region !== value) return false;
    if (place[0] === 'p' && !(it.pays || []).includes(value)) return false;
  }
  return true;
}

function renderFilters(list) {
  const counts = {};
  for (const it of list) counts[it.rubrique] = (counts[it.rubrique] || 0) + 1;
  $('#chips').replaceChildren(
    h('button', { class: `chip ${state.filter.rub ? '' : 'active'}`, type: 'button', 'data-rub': '', onclick: () => setFilter({ rub: '' }) }, t('all')),
    ...rubOrder().filter((r) => counts[r.id]).map((r) => h('button', {
      class: `chip ${state.filter.rub === r.id ? 'active' : ''}`, type: 'button', style: rubColor(r.id), 'data-rub': r.id,
      onclick: () => setFilter({ rub: state.filter.rub === r.id ? '' : r.id }),
    }, h('span', { class: 'dot' }), rubName(r), h('b', null, counts[r.id]))));

  const regions = new Map();
  const pays = new Map();
  const paysName = new Map(); // nom anglais (filtre) → nom affiché
  for (const it of list) {
    if (it.region) regions.set(it.region, (regions.get(it.region) || 0) + 1);
    (it.pays || []).forEach((p, i) => {
      pays.set(p, (pays.get(p) || 0) + 1);
      const fr = isFr() && it.fr?.pays?.[i];
      if (fr || !paysName.has(p)) paysName.set(p, fr || p);
    });
  }
  $('#place').replaceChildren(
    h('option', { value: '' }, t('allRegions')),
    regions.size && h('optgroup', { label: t('regions') },
      REGIONS.filter((r) => regions.has(r)).map((r) =>
        h('option', { value: `r:${r}`, selected: state.filter.place === `r:${r}` }, `${regionName(r)} (${regions.get(r)})`))),
    pays.size && h('optgroup', { label: t('countries') },
      [...pays.keys()].sort((a, c) => paysName.get(a).localeCompare(paysName.get(c), state.lang)).map((p) =>
        h('option', { value: `p:${p}`, selected: state.filter.place === `p:${p}` }, `${paysName.get(p)} (${pays.get(p)})`))));
  const active = state.filter.rub || state.filter.place;
  $('#chips').hidden = !list.length && !active;
  $('#place').hidden = (!regions.size && !pays.size && !state.filter.place) || $('#chips').hidden;
  $('#place').classList.toggle('active', !!state.filter.place);
}

function setFilter(patch) {
  Object.assign(state.filter, patch);
  renderBriefContent();
  // Si on a changé de rubrique depuis la barre collée en haut, on revient au début de la liste
  const anchor = $('#pile-head').hidden ? $('#place') : $('#pile-head');
  const y = anchor.getBoundingClientRect().top + window.scrollY - $('.top').offsetHeight - 8;
  if (window.scrollY > y) window.scrollTo({ top: y });
}

// ── Barre des rubriques collée en haut : met en avant la rubrique en cours de lecture ──

function setHeaderHeight() {
  document.documentElement.style.setProperty('--header-h', `${$('.top').offsetHeight}px`);
}

function highlightChip(id) {
  const bar = $('#chips');
  bar.classList.toggle('has-current', !state.filter.rub && id != null);
  for (const c of bar.querySelectorAll('.chip')) {
    const on = !state.filter.rub && id != null && c.dataset.rub === id;
    if (on && !c.classList.contains('current')) {
      bar.scrollLeft = c.offsetLeft - (bar.clientWidth - c.clientWidth) / 2;
    }
    c.classList.toggle('current', on);
  }
}

// Rubrique en cours = la dernière dont le titre est passé sous la barre collée en haut
function updateCurrentSection() {
  const line = $('.top').offsetHeight + $('#chips').offsetHeight + 60; // titre arrivé juste sous la barre
  let current = null;
  for (const sec of document.querySelectorAll('#rubriques .rubrique')) {
    if (sec.getBoundingClientRect().top - line <= 0) current = sec;
    else break;
  }
  highlightChip(current ? current.id.slice(2) : null);
}

let scrollTick = false;
window.addEventListener('scroll', () => {
  if (scrollTick) return;
  scrollTick = true;
  requestAnimationFrame(() => { scrollTick = false; updateCurrentSection(); });
}, { passive: true });

// ── Sections ─────────────────────────────────────

function renderEssentiel(b) {
  const items = (b.essentiel || []).filter((it) => state.viewingLatest || matches(it));
  const box = $('#essentiel');
  box.replaceChildren();
  box.hidden = !items.length;
  if (!items.length) return;
  box.append(
    h('h2', { class: 'section-title' }, state.viewingLatest ? t('essentialsToday') : t('essentials'),
      items.length > 1 && h('span', { class: 'hint' }, t('swipe', items.length))),
    h('ol', null, items.map((it) => {
      const id = itemId(it, b.date);
      return h('li', { style: rubColor(it.rubrique), 'data-id': id, class: isRead(id) ? 'is-read' : '' },
        itemBody(it, b.date, { label: rubTitle(it.rubrique) }));
    })));
}

function renderSections(groups, opts) {
  const box = $('#rubriques');
  box.replaceChildren();
  let shown = 0;
  for (const r of rubOrder()) {
    const items = groups[r.id] || [];
    if (!items.length) continue;
    shown += items.length;
    box.append(h('details', { class: 'rubrique', id: `r-${r.id}`, open: true, style: rubColor(r.id) },
      h('summary', null,
        h('span', { class: 'dot' }), h('h2', null, rubName(r)),
        h('span', { class: 'chev', 'aria-hidden': 'true' }, '▾')),
      items.map(({ it, date }) => itemEl(it, date, {
        pile: opts.pile, day: opts.pile ? dayLabel(date, state.current.date) : null,
      }))));
  }
  return shown;
}

function renderWatch(list, frList) {
  const watch = $('#watch');
  watch.replaceChildren();
  watch.hidden = !list.length;
  if (!list.length) return;
  const loc = (i, k) => (isFr() && frList?.[i]?.[k]) || list[i][k];
  watch.append(h('h2', { class: 'section-title' }, t('comingUp')),
    h('ul', { class: 'watch-list' }, list.map((w, i) => h('li', null,
      h('span', { class: 'when' }, loc(i, 'quand')), h('span', null, loc(i, 'quoi'), ' ', sources(w.liens))))));
}

// Vue du jour : L'essentiel + pile « À lire » (sujets non lus des 7 derniers jours)
function renderLatest() {
  const b = state.current;
  const essIds = new Set((b.essentiel || []).map((it) => itemId(it, b.date)));
  const replaced = new Set(state.pile.filter((p) => p.remplace).map((p) => p.remplace));
  const pool = state.pile.filter((p) => !essIds.has(p.id) && !replaced.has(p.id));
  const unread = pool.filter((p) => !isRead(p.id));
  const list = state.showRead ? pool : unread;

  renderEssentiel(b);
  renderFilters(list);

  const filtered = list.filter(matches).sort((a, c) => c.date.localeCompare(a.date));
  const head = $('#pile-head');
  head.hidden = false;
  head.replaceChildren(
    h('h2', null, t('toRead'), h('span', { class: 'pile-count' }, unread.length ? t('unread', unread.length) : '')));

  const groups = {};
  const known = new Set(rubOrder().map((r) => r.id));
  for (const p of filtered) {
    const rub = known.has(p.rubrique) ? p.rubrique : (known.has('monde') ? 'monde' : rubOrder()[0]?.id);
    (groups[rub] = groups[rub] || []).push({ it: p, date: p.date });
  }
  const shown = renderSections(groups, { pile: true });
  if (!shown) {
    $('#rubriques').append(state.filter.rub || state.filter.place
      ? h('p', { class: 'empty' }, t('emptyFilter'))
      : h('div', { class: 'done' }, h('strong', null, t('caughtUp')), t('tomorrow')));
  }

  const readCount = pool.length - unread.length;
  const btn = $('#show-read');
  btn.hidden = !readCount;
  btn.textContent = state.showRead ? t('hideRead') : t('showRead', readCount);
  renderWatch(state.filter.rub || state.filter.place ? [] : (b.a_surveiller || []), b.fr?.a_surveiller);
}

// Vue d'archive : le brief complet d'un jour passé
function renderDay() {
  const b = state.current;
  const all = [...(b.essentiel || []).map((it) => ({ ...it, rubrique: it.rubrique || '' })),
    ...(b.rubriques || []).flatMap((r) => r.items.map((it) => ({ ...it, rubrique: r.id })))];
  renderEssentiel(b);
  renderFilters(all);
  $('#pile-head').hidden = true;
  $('#show-read').hidden = true;
  const groups = {};
  for (const r of b.rubriques || []) {
    groups[r.id] = r.items.map((it) => ({ ...it, rubrique: r.id })).filter(matches).map((it) => ({ it, date: b.date }));
  }
  const shown = renderSections(groups, { pile: false });
  if (!shown && (state.filter.rub || state.filter.place)) $('#rubriques').append(h('p', { class: 'empty' }, t('noStories')));
  renderWatch(state.filter.rub || state.filter.place ? [] : (b.a_surveiller || []), b.fr?.a_surveiller);
}

function renderBriefContent() {
  if (!state.current) return;
  if (state.viewingLatest) renderLatest();
  else renderDay();
  updateCurrentSection();
}

function renderHebdo(b) {
  const box = $('#hebdo');
  const w = b.hebdo;
  box.replaceChildren();
  box.hidden = !w;
  if (!w) return;
  const wf = isFr() ? w.fr || {} : {};
  const tf = (i, k) => wf.tendances?.[i]?.[k] || w.tendances[i][k];
  const af = (i, k) => wf.a_suivre?.[i]?.[k] || w.a_suivre[i][k];
  box.append(h('details', { class: 'hebdo' },
    h('summary', null,
      h('span', { class: 'hebdo-head' },
        h('span', { class: 'hebdo-title' }, t('weekly')), h('span', { class: 'chev', 'aria-hidden': 'true' }, '▾')),
      w.accroche && h('span', { class: 'hebdo-accroche' }, wf.accroche || w.accroche)),
    h('ol', { class: 'hebdo-list' }, (w.tendances || []).map((x, i) => h('li', null,
      h('h3', null, x.emoji && h('span', { class: 'emoji' }, x.emoji), tf(i, 'titre')),
      h('p', { class: 'resume' }, tf(i, 'resume')),
      h('div', { class: 'foot-info' }, sources(x.liens))))),
    (w.a_suivre || []).length && h('div', null,
      h('h4', null, t('toWatchWeek')),
      h('ul', { class: 'watch-list' }, w.a_suivre.map((a, i) => h('li', null, h('span', { class: 'when' }, af(i, 'quand')), h('span', null, af(i, 'quoi'))))))));
}

function renderBanner(b) {
  const msgs = [];
  if (state.viewingLatest && b.date < todaySG()) {
    msgs.push(t('notYet', t('hour'), fullDate(b.date, !isFr())));
  } else if (!state.viewingLatest) {
    msgs.push(t('archiveOf', fullDate(b.date, !isFr())));
  }
  if (b.mode === 'brut') msgs.push(t('rawMode'));
  if (!navigator.onLine) msgs.push(t('offline'));
  $('#banner').textContent = msgs.join(' ');
  $('#banner').hidden = !msgs.length;
}

function renderArchive() {
  const { dates, hebdo } = state.index;
  const cur = state.current;
  const list = dates.length ? dates : [cur.date];
  $('#archive-select').replaceChildren(...list.map((d, i) =>
    h('option', { value: i === 0 ? '' : d, selected: cur.date === d && (i === 0) === state.viewingLatest },
      `${(hebdo || []).includes(d) ? '📊 ' : ''}${shortDate(d)}${i === 0 ? t('today') : ''}`)));
  const lastWeekly = (hebdo || [])[0];
  const link = $('#hebdo-link');
  link.hidden = !lastWeekly || !!cur.hebdo;
  if (lastWeekly) link.textContent = t('lastWeekly', shortDate(lastWeekly));
  link.onclick = () => load(lastWeekly === state.index.dates[0] ? undefined : lastWeekly);
}

function render(b) {
  state.current = b;
  $('#title').textContent = fullDate(b.date);
  setHeaderHeight();
  // Accroche : 3 puces (les anciens briefs ont une phrase simple)
  const hookEn = Array.isArray(b.accroche) ? b.accroche : (b.accroche ? [b.accroche] : []);
  const hook = isFr() && b.fr?.accroche?.length ? b.fr.accroche : hookEn;
  $('#accroche').replaceChildren(...(hook.length ? [h('ul', null, hook.map((t) => h('li', null, t)))] : []));
  renderBanner(b);
  renderHebdo(b);
  renderBriefContent();
  renderArchive();

  const s = b.stats || {};
  const by = b.mode === 'ia' ? t('byAI', b.modele) : t('noAI');
  $('#meta').replaceChildren(
    h('p', null, t('stats', s.articles ?? '?', s.sources ?? '?', by)),
    h('p', null, t('checkSource')));
}

// ── Vue « recherche » ────────────────────────────

async function runSearch(q) {
  const box = $('#search-results');
  const terms = norm(q).split(/\s+/).filter(Boolean);
  if (!terms.length) {
    box.replaceChildren(h('p', { class: 'empty' }, t('searchHint')));
    return;
  }
  if (!state.search) {
    box.replaceChildren(h('p', { class: 'empty' }, t('loadingArchives')));
    try { state.search = await getJSON('data/search.json'); } catch (e) {
      box.replaceChildren(h('p', { class: 'empty' }, t('archivesOffline')));
      return;
    }
  }
  const hits = state.search.filter((r) => {
    const hay = norm([r.t, r.s, r.tf, r.sf, r.w, (r.p || []).join(' '), r.g, rubTitle(r.r), (r.l || []).map((l) => l.source).join(' ')].join(' '));
    return terms.every((t) => hay.includes(t));
  }).slice(0, 150);

  if (!hits.length) {
    box.replaceChildren(h('p', { class: 'empty' }, t('noResults')));
    return;
  }
  const groups = new Map();
  for (const r of hits) {
    if (!groups.has(r.d)) groups.set(r.d, []);
    groups.get(r.d).push(r);
  }
  box.replaceChildren(
    h('p', { class: 'result-count' }, t('results', hits.length)),
    ...[...groups].map(([d, rows]) => h('section', { class: 'result-day' },
      h('h2', { class: 'section-title' }, shortDate(d)),
      rows.map((r) => {
        const it = { emoji: r.e, titre: r.t, resume: r.s, fr: r.tf ? { titre: r.tf, resume: r.sf } : null, pays: r.p, region: r.g, rubrique: r.r, liens: r.l };
        return itemEl(it, d, { card: true, label: rubTitle(r.r) });
      }))));
}

// ── Vue « favoris » ──────────────────────────────

function renderFavs() {
  const list = favs();
  const box = $('#favs-list');
  if (!list.length) {
    box.replaceChildren(h('p', { class: 'empty' }, t('noFavs')));
    return;
  }
  box.replaceChildren(...list.map((f) => {
    // Favoris enregistrés avant la traduction : on reprend la version française de la pile si elle existe
    const item = f.item.fr ? f.item : { ...f.item, fr: state.pile.find((p) => p.id === f.id)?.fr };
    return h('div', null,
      h('p', { class: 'fav-date' }, shortDate(f.date)),
      itemEl(item, f.date, { card: true, label: rubTitle(f.item.rubrique) }));
  }));
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
  if (view === 'brief') renderBriefContent();
  window.scrollTo({ top: 0 });
}

// ── Ask AI ───────────────────────────────────────

const aiKey = () => store('geminiKey') || '';

function renderAiSettings() {
  const has = !!aiKey();
  $('#ai-status').textContent = has ? t('aiOn') : t('aiOff');
  const btn = $('#ai-key-btn');
  btn.textContent = has ? t('removeKey') : t('addKey');
  btn.onclick = () => {
    if (has) {
      store('geminiKey', null);
      toast(t('keyRemoved'));
      renderAiSettings();
    } else {
      openAsk(null);
    }
  };
}

function keyForm() {
  const input = h('input', { type: 'password', placeholder: t('keyPh'), autocomplete: 'off', class: 'key-input' });
  return h('div', { class: 'ask-setup' },
    h('p', null, t('keyIntro')),
    input,
    h('button', {
      class: 'primary-btn', type: 'button',
      onclick: () => {
        const k = input.value.trim();
        if (k.length < 20) { toast(t('badKey')); return; }
        store('geminiKey', k);
        renderAiSettings();
        if (state.ask) renderAsk(); else closeAsk();
        toast(t('keySaved'));
      },
    }, t('saveKey')),
    h('p', { class: 'small-print' }, t('getKey'), h('a', { href: 'https://aistudio.google.com/apikey', target: '_blank', rel: 'noopener' }, 'aistudio.google.com/apikey'), t('noCard')));
}

function openAsk(it, date) {
  state.ask = it ? { it, date, history: [], busy: false } : null;
  $('#ask-title').textContent = it ? `${it.emoji ? it.emoji + ' ' : ''}${tr(it, 'titre')}` : t('setupAsk');
  renderAsk();
  $('#ask').hidden = false;
  document.body.classList.add('sheet-open');
  if (it && aiKey()) setTimeout(() => $('#ask-input').focus(), 250);
}

function closeAsk() {
  $('#ask').hidden = true;
  document.body.classList.remove('sheet-open');
  state.ask = null;
}

// Mise en forme simple et sûre (texte uniquement) : paragraphes, puces, **gras**
function formatAnswer(text) {
  const inline = (line) => line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/).map((part) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) return h('strong', null, part.slice(2, -2));
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) return h('em', null, part.slice(1, -1));
    return part;
  });
  const out = [];
  let list = null;
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    const bullet = line.match(/^[-*•]\s+(.*)/);
    if (bullet) {
      if (!list) { list = h('ul'); out.push(list); }
      list.append(h('li', null, inline(bullet[1])));
    } else {
      list = null;
      if (line) out.push(h('p', null, inline(line.replace(/^#+\s*/, ''))));
    }
  }
  return out;
}

function renderAsk() {
  const body = $('#ask-body');
  const form = $('#ask-form');
  const a = state.ask;
  if (!aiKey() || !a) {
    body.replaceChildren(keyForm());
    form.hidden = true;
    return;
  }
  form.hidden = false;
  const bubbles = a.history.map((m) => (m.role === 'user'
    ? h('div', { class: 'bubble q' }, m.display)
    : h('div', { class: `bubble a ${m.error ? 'error' : ''}` }, formatAnswer(m.text),
      (m.sources || []).length && h('p', { class: 'ask-sources' }, t('readSrc'),
        m.sources.map((s) => h('a', { href: safeUrl(s.uri), target: '_blank', rel: 'noopener' }, s.title || t('link')))))));
  body.replaceChildren(...[
    !a.history.length && h('div', { class: 'ask-intro' },
      h('p', null, tr(a.it, 'resume')),
      h('div', { class: 'ask-chips' }, t('suggestions').map((q) => h('button', { class: 'chip', type: 'button', onclick: () => ask(q) }, q)))),
    ...bubbles,
    a.busy && h('div', { class: 'bubble a thinking' }, h('span'), h('span'), h('span')),
  ].filter(Boolean));
  body.scrollTop = body.scrollHeight;
}

function storyContext(it, date) {
  return [
    `Story from the reader's brief (${longDate(date)}): ${tr(it, 'titre')}`,
    it.resume && `Summary: ${tr(it, 'resume')}`,
    (it.pays || []).length && `Countries: ${it.pays.join(', ')}`,
    (it.liens || []).length && `Source articles:\n${it.liens.map((l) => `- ${l.source}: ${l.url}`).join('\n')}`,
  ].filter(Boolean).join('\n');
}

async function callGemini(contents) {
  const system = `You are a defence and geopolitics analyst. The reader is ${AI_READER}. She is asking about a story from her morning news brief.
Answer in ${isFr() ? 'French' : 'British English'}, clearly and concisely (under 150 words unless she asks for more), with short paragraphs or bullet points.
Write dates as ${isFr() ? '"19 octobre"' : '"October 19" (month then day)'}, never as 2026-10-19.
Be factual and neutral, separate facts from analysis, and say when you are not sure. You can read the source articles; beyond them, rely on your own knowledge (only if it matters, mention briefly that it may not cover the very latest events).`;
  let lastError = t('noAnswer');
  for (const model of AI_MODELS) {
    for (const withTools of [true, false]) {
      const body = { systemInstruction: { parts: [{ text: system }] }, contents };
      if (withTools) body.tools = [{ url_context: {} }]; // lecture des articles (la recherche web n'est pas gratuite)
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 90000);
      let res;
      try {
        res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': aiKey() },
          body: JSON.stringify(body),
          signal: ctrl.signal,
        });
      } catch (e) {
        throw new Error(navigator.onLine ? t('aiTimeout') : t('noConn'));
      } finally {
        clearTimeout(timer);
      }
      if (res.ok) {
        const data = await res.json();
        const cand = (data.candidates || [])[0] || {};
        const text = (cand.content?.parts || []).filter((p) => !p.thought).map((p) => p.text || '').join('').trim();
        const read = (cand.urlContextMetadata?.urlMetadata || [])
          .filter((u) => /SUCCESS/.test(u.urlRetrievalStatus || '')).map((u) => u.retrievedUrl);
        if (text) return { text, read };
        lastError = t('aiEmpty');
        continue;
      }
      if (res.status === 400 || res.status === 401 || res.status === 403) {
        const msg = await res.text();
        if (/API key|API_KEY|permission/i.test(msg)) throw new Error(t('keyRefused'));
      }
      lastError = res.status === 429 ? t('quota') : t('aiErr', res.status);
      if (res.status === 404) break; // modèle indisponible → suivant
    }
  }
  throw new Error(lastError);
}

async function ask(question) {
  const a = state.ask;
  if (!a || a.busy || !question.trim()) return;
  const first = !a.history.length;
  a.history.push({ role: 'user', display: question, text: first ? `${storyContext(a.it, a.date)}\n\nQuestion: ${question}` : question });
  a.busy = true;
  renderAsk();
  const contents = a.history.filter((m) => !m.error).map((m) => ({ role: m.role, parts: [{ text: m.text }] }));
  try {
    const { text, read } = await callGemini(contents);
    const sources = (a.it.liens || []).filter((l) => read.includes(l.url)).map((l) => ({ uri: l.url, title: l.source }));
    a.history.push({ role: 'model', text, sources });
  } catch (e) {
    a.history.push({ role: 'model', text: e.message, error: true });
  }
  a.busy = false;
  if (state.ask === a) renderAsk();
}

$('#ask-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const q = $('#ask-input').value;
  $('#ask-input').value = '';
  ask(q);
});
document.querySelectorAll('#ask [data-close]').forEach((el) => el.addEventListener('click', closeAsk));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#ask').hidden) closeAsk(); });

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
  btn.hidden = true;
  $('#notif-code').hidden = true;
  const isIOS = /iPhone|iPad/.test(navigator.userAgent);

  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    status.textContent = isIOS && !standalone() ? t('notifIOS') : t('notifNone');
    return;
  }
  if (Notification.permission === 'denied') {
    status.textContent = t('notifBlocked');
    return;
  }
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (sub && store('pushSent')) {
    status.textContent = t('notifOn', t('hour'));
    btn.textContent = t('showCode');
    btn.hidden = false;
    btn.onclick = () => showCode(sub);
    return;
  }
  if (sub) {
    showCode(sub);
    return;
  }
  status.textContent = t('notifOffer', t('hour'));
  btn.textContent = t('turnOn');
  btn.hidden = false;
  btn.onclick = async () => {
    try {
      if (await Notification.requestPermission() !== 'granted') return renderNotif();
      const s = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(VAPID_PUBLIC_KEY) });
      showCode(s);
    } catch (e) {
      status.textContent = t('notifFail', e.message);
    }
  };
}

function showCode(sub) {
  const json = JSON.stringify(sub);
  $('#notif-status').textContent = t('lastStep');
  const code = $('#notif-code');
  code.hidden = false;
  code.value = json;
  const btn = $('#notif-btn');
  btn.hidden = false;
  btn.textContent = t('copyCode');
  btn.onclick = async () => {
    try { await navigator.clipboard.writeText(json); } catch (e) { code.select(); document.execCommand('copy'); }
    store('pushSent', true);
    toast(t('codeCopied'));
  };
}

// ── Chargement ───────────────────────────────────

function pileFromBrief(b) {
  return [...(b.essentiel || []), ...(b.rubriques || []).flatMap((r) => r.items.map((it) => ({ ...it, rubrique: r.id })))]
    .map((it) => ({ ...it, date: b.date, id: itemId(it, b.date), rubrique: it.rubrique || 'monde' }));
}

const RELOAD_AFTER_MS = 3 * 3600e3;
const startedAt = Date.now();

async function load(date) {
  const btn = $('#refresh');
  btn.classList.add('loading');
  try {
    const [index, brief, pile] = await Promise.all([
      getJSON('data/index.json').catch(() => state.index),
      getJSON(date ? `data/archive/${date}.json` : 'data/latest.json'),
      date ? Promise.resolve(null) : getJSON('data/pile.json').catch(() => null),
    ]);
    state.index = { dates: [], hebdo: [], rubriques: [], ...index };
    state.viewingLatest = !date;
    if (!date) state.pile = pile || pileFromBrief(brief);
    state.search = null;
    state.filter = { rub: '', place: '' };
    render(brief);
    if (state.view !== 'brief') show('brief');
    else window.scrollTo({ top: 0 });
  } catch (err) {
    $('#banner').textContent = navigator.onLine ? t('noBrief') : t('noBriefOffline');
    $('#banner').hidden = false;
  } finally {
    btn.classList.remove('loading');
  }
  if (navigator.clearAppBadge) navigator.clearAppBadge().catch(() => {});
}

// ── Changement de langue sans recharger : on reste sur le même article ──

function applyStaticText() {
  document.documentElement.lang = state.lang;
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-label]').forEach((el) => el.setAttribute('aria-label', t(el.dataset.i18nLabel)));
  document.querySelectorAll('[data-i18n-ph]').forEach((el) => el.setAttribute('placeholder', t(el.dataset.i18nPh)));
  document.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
  $('#btn-lang').textContent = t('langLetter');
}

// Premier sujet visible sous la barre du haut, et sa position à l'écran
function scrollAnchor() {
  if (window.scrollY < 8) return null;
  const view = $(`#view-${state.view}`);
  const line = $('.top').offsetHeight + (state.view === 'brief' && !$('#chips').hidden ? $('#chips').offsetHeight : 0);
  const el = [...view.querySelectorAll('[data-id]')].find((e) => e.getBoundingClientRect().bottom > line + 8);
  return el ? { id: el.dataset.id, top: el.getBoundingClientRect().top } : { y: window.scrollY };
}

function restoreAnchor(a) {
  if (!a) return;
  const el = a.id && [...$(`#view-${state.view}`).querySelectorAll('[data-id]')].find((e) => e.dataset.id === a.id);
  window.scrollTo({ top: el ? window.scrollY + el.getBoundingClientRect().top - a.top : a.y ?? window.scrollY });
}

function setLang(lang) {
  if (lang === state.lang) return;
  const anchor = scrollAnchor();
  const carousel = $('#essentiel ol')?.scrollLeft || 0;
  const hebdoOpen = !!$('#hebdo details')?.open;
  state.lang = lang;
  store('lang', lang);
  applyStaticText();
  if (state.current) render(state.current);
  if (hebdoOpen && $('#hebdo details')) $('#hebdo details').open = true;
  if ($('#essentiel ol')) $('#essentiel ol').scrollLeft = carousel;
  if (state.view === 'search') runSearch($('#q').value);
  if (state.view === 'favs') renderFavs();
  renderAiSettings();
  renderNotif();
  restoreAnchor(anchor);
  updateCurrentSection();
}

window.addEventListener('resize', setHeaderHeight);
$('#btn-lang').addEventListener('click', () => setLang(isFr() ? 'en' : 'fr'));
$('#refresh').addEventListener('click', () => load());
$('#btn-search').addEventListener('click', () => show(state.view === 'search' ? 'brief' : 'search'));
$('#btn-favs').addEventListener('click', () => show(state.view === 'favs' ? 'brief' : 'favs'));
$('#back').addEventListener('click', () => show('brief'));
$('#place').addEventListener('change', (e) => setFilter({ place: e.target.value }));
$('#archive-select').addEventListener('change', (e) => load(e.target.value || undefined));
$('#show-read').addEventListener('click', () => { state.showRead = !state.showRead; renderBriefContent(); });
let searchTimer;
$('#q').addEventListener('input', (e) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => runSearch(e.target.value), 180);
});

// Quand on rouvre l'app le matin, on recharge si le brief affiché n'est plus celui du jour.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  if (navigator.clearAppBadge) navigator.clearAppBadge().catch(() => {});
  if (Date.now() - startedAt > RELOAD_AFTER_MS && navigator.onLine) { location.reload(); return; }
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

state.lang = store('lang') === 'en' ? 'en' : 'fr';
applyStaticText();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').then(renderNotif).catch(renderNotif);
else renderNotif();
loadRead();
renderAiSettings();
load();
