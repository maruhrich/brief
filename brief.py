"""Brief quotidien défense & géopolitique.

Collecte les flux RSS et recherches Google News de config.yaml, demande à Gemini
de trier / traduire / résumer en français, puis écrit le résultat dans docs/data/
(lu par la web-app). Sans clé Gemini ou en cas d'erreur, publie une version
« brute » (titres classés par rubrique) pour que le brief arrive quand même.
Le jour choisi (lundi par défaut), ajoute une synthèse des 7 derniers briefs.

Usage :
    python brief.py                 génère le brief du jour
    python brief.py --skip-if-done  ne fait rien si le brief du jour existe déjà
    python brief.py --no-ai         version brute, sans appel à Gemini
    python brief.py --dry-run       affiche le résultat sans écrire de fichier
    python brief.py --sources       teste chaque source et affiche le nombre d'articles
    python brief.py --hebdo         force la synthèse de la semaine (test)
"""
from __future__ import annotations

import argparse
import calendar
import html
import json
import os
import re
import sys
import time
import urllib.parse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

import feedparser
import requests
import yaml

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "docs" / "data"
ARCHIVE = DATA / "archive"
KEEP_DAYS = 60
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 "
      "(KHTML, like Gecko) Version/17.0 Safari/605.1.15")
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
GNEWS_EDITIONS = {
    "en": ("en-SG", "SG", "SG:en"),
    "fr": ("fr", "FR", "FR:fr"),
    "ja": ("ja", "JP", "JP:ja"),
    "ko": ("ko", "KR", "KR:ko"),
    "zh-TW": ("zh-TW", "TW", "TW:zh-Hant"),
    "id": ("id", "ID", "ID:id"),
}
REGIONS = ["North-East Asia", "South-East Asia", "South Asia", "Oceania", "Europe", "Russia-Ukraine",
           "Middle East", "Africa", "Americas", "Global"]
JOURS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"]
DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August",
          "September", "October", "November", "December"]


def log(msg: str) -> None:
    print(msg, flush=True)


def load_env() -> None:
    """Charge un éventuel fichier .env local (jamais publié) pour les tests sur le Mac."""
    env = ROOT / ".env"
    if not env.exists():
        return
    for line in env.read_text().splitlines():
        if "=" in line and not line.lstrip().startswith("#"):
            key, value = line.split("=", 1)
            if value.strip():
                os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def date_label(d: datetime) -> str:
    return f"{DAYS[d.weekday()]} {d.day} {MONTHS[d.month - 1]} {d.year}"


# ── Collecte ─────────────────────────────────────────────────

def clean_text(raw: str, limit: int = 240) -> str:
    text = re.sub(r"<[^>]+>", " ", raw or "")
    text = re.sub(r"\s+", " ", html.unescape(text)).strip()
    return text if len(text) <= limit else text[:limit].rsplit(" ", 1)[0] + "…"


def title_key(title: str) -> str:
    return re.sub(r"\W+", "", title.lower())[:80]


def gnews_url(query: str, lang: str) -> str:
    hl, gl, ceid = GNEWS_EDITIONS.get(lang, GNEWS_EDITIONS["en"])
    q = urllib.parse.quote_plus(f"{query} when:1d")
    return f"https://news.google.com/rss/search?q={q}&hl={hl}&gl={gl}&ceid={ceid}"


def allowed_host(href: str, allowed: tuple) -> bool:
    host = (urllib.parse.urlparse(href or "").hostname or "").lower()
    if host.startswith("www."):
        host = host[4:]
    return any(host == d or host.endswith("." + d) for d in allowed)


def list_feeds(cfg: dict) -> list[dict]:
    feeds = [{"nom": s["nom"], "url": s["url"], "rubrique": s.get("rubrique"),
              "max": cfg["max_par_flux"], "google": False}
             for s in cfg.get("sources", [])]
    allowed = tuple(d.lower() for d in cfg.get("google_news_medias") or [])
    for r in cfg.get("recherches", []):
        lang = r.get("langue", "en")
        feeds.append({"nom": f"Google News ({lang}) : {r['q']}", "url": gnews_url(r["q"], lang),
                      "rubrique": r.get("rubrique"), "max": cfg["max_par_recherche"],
                      "google": True, "langue": lang, "allowed": allowed})
    return feeds


def fetch_feed(feed: dict, since: datetime) -> tuple[dict, list[dict], str | None]:
    try:
        resp = requests.get(feed["url"], headers={"User-Agent": UA}, timeout=25)
        resp.raise_for_status()
        parsed = feedparser.parse(resp.content)
    except Exception as exc:  # une source en panne ne doit pas bloquer le brief
        return feed, [], str(exc)[:120]

    articles = []
    for entry in parsed.entries:
        if len(articles) >= feed["max"]:
            break
        if feed["google"] and feed["allowed"] and not allowed_host((entry.get("source") or {}).get("href"), feed["allowed"]):
            continue  # média hors de la liste google_news_medias
        title = clean_text(entry.get("title", ""), 300)
        link = entry.get("link", "")
        if not title or not link.startswith("http"):
            continue
        stamp = entry.get("published_parsed") or entry.get("updated_parsed")
        published = datetime.fromtimestamp(calendar.timegm(stamp), timezone.utc) if stamp else None
        if published and published < since:
            continue
        source = feed["nom"]
        summary = clean_text(entry.get("summary", ""))
        if feed["google"]:
            # Titre Google News = « Titre - Média » ; le résumé ne fait que répéter le titre.
            source = (entry.get("source") or {}).get("title") or "Google News"
            if title.endswith(f" - {source}"):
                title = title[: -len(source) - 3]
            # « ABC News - Breaking News, Latest… » → « ABC News »
            source = re.split(r"\s[-|–—:]\s", source)[0].strip(" |") or source
            summary = ""
        if summary and title_key(summary).startswith(title_key(title)[:40]):
            summary = ""
        articles.append({
            "titre": title,
            "resume": summary,
            "source": source,
            "url": link,
            "date": published.isoformat() if published else None,
            "langue": feed.get("langue"),
            "rubrique": feed["rubrique"],
        })
    return feed, articles, None


def collect(cfg: dict, verbose: bool = False) -> tuple[list[dict], int]:
    since = datetime.now(timezone.utc) - timedelta(hours=cfg["heures"])
    feeds = list_feeds(cfg)
    with ThreadPoolExecutor(max_workers=8) as pool:
        results = list(pool.map(lambda f: fetch_feed(f, since), feeds))

    excluded = {s.lower() for s in cfg.get("sources_exclues") or []}
    seen_titles, seen_urls, articles, ok = set(), set(), [], 0
    for feed, items, error in results:
        if error:
            log(f"  ✗ {feed['nom']} — {error}")
            continue
        ok += 1
        if verbose:
            log(f"  ✓ {len(items):3d}  {feed['nom']}")
        for a in items:
            key = title_key(a["titre"])
            if key in seen_titles or a["url"] in seen_urls or a["source"].lower() in excluded:
                continue
            seen_titles.add(key)
            seen_urls.add(a["url"])
            articles.append(a)

    articles.sort(key=lambda a: a["date"] or "", reverse=True)
    articles = articles[: cfg["max_articles_ia"]]
    for i, a in enumerate(articles, 1):
        a["id"] = i
    return articles, ok


# ── Appel à Gemini ───────────────────────────────────────────

def parse_json(text: str) -> dict:
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start, end = text.find("{"), text.rfind("}")
        return json.loads(text[start: end + 1])


def call_gemini(cfg: dict, system: str, user: str, schema: dict, api_key: str) -> tuple[dict, str]:
    errors = []
    for model in cfg["modeles"]:
        use_schema, retried = True, False
        while True:
            gen = {"responseMimeType": "application/json"}
            if use_schema:
                gen["responseSchema"] = schema
            body = {
                "systemInstruction": {"parts": [{"text": system}]},
                "contents": [{"role": "user", "parts": [{"text": user}]}],
                "generationConfig": gen,
            }
            try:
                resp = requests.post(GEMINI_URL.format(model=model), json=body, timeout=300,
                                     headers={"x-goog-api-key": api_key})
            except requests.RequestException as exc:
                errors.append(f"{model}: {exc}")
                if retried:
                    break
                retried = True
                time.sleep(10)
                continue
            if resp.status_code == 200:
                try:
                    parts = resp.json()["candidates"][0]["content"]["parts"]
                    text = "".join(p.get("text", "") for p in parts if not p.get("thought"))
                    return parse_json(text), model
                except (KeyError, IndexError, ValueError) as exc:
                    errors.append(f"{model}: réponse illisible ({exc})")
                    log(f"  Gemini {errors[-1]}")
                    break
            errors.append(f"{model}: HTTP {resp.status_code} {resp.text[:200]}")
            log(f"  Gemini {errors[-1]}")
            if resp.status_code in (401, 403):
                raise RuntimeError("Clé Gemini refusée : " + errors[-1])
            if resp.status_code == 400 and use_schema:
                use_schema = False  # schéma refusé → on réessaie en JSON libre
                continue
            if resp.status_code in (429, 500, 502, 503, 504) and not retried:
                retried = True  # quota minute ou surcharge : on patiente une fois
                time.sleep(20)
                continue
            break  # sinon (404, quota du jour épuisé…) → modèle suivant
    raise RuntimeError("Gemini indisponible : " + " | ".join(errors[-3:]))


# ── Brief du jour ────────────────────────────────────────────

def item_schema(rubrique_ids: list[str]) -> dict:
    return {
        "type": "object",
        "properties": {
            "emoji": {"type": "string", "description": "A single emoji illustrating the story"},
            "titre": {"type": "string", "description": "Short headline"},
            "resume": {"type": "string", "description": "2 short factual sentences (40 words max)"},
            "pourquoi": {"type": "string", "description": "1 short sentence (20 words max) on why it matters to the reader, or empty"},
            "pays": {"type": "array", "items": {"type": "string"}, "description": "Countries involved"},
            "region": {"type": "string", "enum": REGIONS},
            "rubrique": {"type": "string", "enum": rubrique_ids},
            "refs": {"type": "array", "items": {"type": "integer"}, "description": "Numbers of the source articles"},
            "suite_de": {"type": "string", "description": "P… number of the previously published story this follows up, or empty"},
        },
        "required": ["emoji", "titre", "resume", "pourquoi", "pays", "region", "rubrique", "refs", "suite_de"],
    }


def brief_schema(cfg: dict) -> dict:
    ids = [r["id"] for r in cfg["rubriques"]]
    item = item_schema(ids)
    return {
        "type": "object",
        "properties": {
            "accroche": {"type": "string", "description": "1 to 2 sentences summing up the morning"},
            "essentiel": {"type": "array", "items": item},
            "rubriques": {"type": "object", "properties": {i: {"type": "array", "items": item} for i in ids},
                          "required": ids},
            "a_surveiller": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "quand": {"type": "string", "description": "Date or timing, e.g. \"24 Oct\" or \"this week\""},
                        "quoi": {"type": "string"},
                        "refs": {"type": "array", "items": {"type": "integer"}},
                    },
                    "required": ["quand", "quoi", "refs"],
                },
            },
        },
        "required": ["accroche", "essentiel", "rubriques", "a_surveiller"],
    }


def recent_items(date_str: str, days: int) -> list[dict]:
    """Sujets des derniers briefs IA (hors aujourd'hui), du plus récent au plus ancien."""
    out = []
    for f in sorted(ARCHIVE.glob("*.json"), reverse=True):
        if days <= 0:
            break
        if f.stem >= date_str:
            continue
        days -= 1
        b = json.loads(f.read_text())
        if b.get("mode") != "ia":
            continue
        for it in b.get("essentiel", []) + [i for r in b.get("rubriques", []) for i in r["items"]]:
            out.append({**it, "date": b["date"], "id": it.get("id") or f"{b['date']}|{it['titre']}"})
    return out


def build_prompt(cfg: dict, articles: list[dict], today: datetime,
                 previous: list[dict]) -> tuple[str, str]:
    rubriques = "\n".join(f"- {r['id']} ({r['titre']}, 0 to {r.get('max', 4)} stories): {r['consigne'].strip()}"
                          for r in cfg["rubriques"])
    system = f"""You are a strategic intelligence analyst. Every morning you write a news brief in {cfg['langue']} that can be read in 10 minutes at most: be concise.

Reader: {cfg['profil'].strip()}

Rules:
- Use ONLY the articles provided. Never invent a fact, figure or date.
- Each story lists in "refs" the numbers of the articles used. Merge articles about the same event into a single story.
- Write everything in {cfg['langue']} (articles may be in English, French, Japanese, Korean, Chinese, Indonesian…).
- Factual, neutral tone. If information comes from a single party (e.g. a government), say so ("according to Beijing…").
- Leave out: crime stories, sport, celebrities, advertising, dubious sources, local stories with no strategic significance.
- "essentiel": the 3 to 5 most important events of the day, all topics combined, with their section. Do not repeat them in the sections.
- In the sections, keep only what matters: about {cfg.get('sujets_par_jour', 15)} stories in total (excluding "essentiel"), never exceeding each section's maximum, most important first. A section may stay empty. Each story appears only once.
- The reader may already have read the stories published in recent days (list P…). Do not republish them unless there is a new development. If there is one, write the story focusing on what is new and put the previous story's number in "suite_de" (e.g. "P12"). Otherwise "suite_de" is empty.
- "emoji": one sober emoji illustrating the story (e.g. 🚀 missile, 🛡️ air defence, 🛩️ aviation, 🚢 navy, 🛰️ satellite, 📝 contract, 💰 budget, 🗳️ election, 🤝 diplomacy, ⚠️ tension, 🇸🇬 Singapore).
- "region": the main region concerned.
- "resume": 2 short sentences, 40 words max. Straight to the facts.
- "pourquoi": one concrete sentence (20 words max) on what is at stake for the reader (regional security, air defence, market, Singapore…), only for roughly one story in three, the most important ones. Otherwise leave empty.
- "a_surveiller": 0 to 5 upcoming milestones mentioned in the articles (votes, summits, exercises, decisions…).

Sections:
{rubriques}"""

    lines = []
    for a in articles:
        lang = f" [{a['langue']}]" if a.get("langue") and a["langue"] != "en" else ""
        line = f"[{a['id']}] {a['source']}{lang} — {a['titre']}"
        if a["resume"]:
            line += f"\n    {a['resume']}"
        lines.append(line)
    user = (f"Today is {date_label(today)} (Singapore time). "
            f"Here are {len(articles)} articles published in the last {cfg['heures']} hours. "
            f"Write today's brief in the requested JSON format.\n\n" + "\n".join(lines))
    if previous:
        prev = "\n".join(f"[P{n}] ({p['date']}) {p['titre']} — {p.get('resume', '')[:140]}"
                         for n, p in enumerate(previous, 1))
        user += "\n\nStories already published in recent days:\n" + prev
    return system, user


def links_for(refs, by_id: dict) -> list[dict]:
    links, seen = [], set()
    for ref in refs or []:
        try:
            a = by_id.get(int(ref))
        except (TypeError, ValueError):
            continue
        if a and a["source"] not in seen:  # un seul lien par média
            seen.add(a["source"])
            links.append({"source": a["source"], "url": a["url"], "titre": a["titre"]})
    return links[:4]


def finalize_items(items, by_id: dict, cfg: dict, rubrique: str | None = None,
                   previous: dict | None = None) -> list[dict]:
    ids = {r["id"] for r in cfg["rubriques"]}
    out = []
    for it in items or []:
        links = links_for(it.get("refs"), by_id)
        if not links or not it.get("titre"):
            continue  # pas de source vérifiable → on écarte
        prev = (previous or {}).get((it.get("suite_de") or "").strip().upper())
        out.append({
            "suite": bool(prev),
            "remplace": prev["id"] if prev else None,
            "emoji": (it.get("emoji") or "").strip()[:8],
            "titre": it["titre"].strip(),
            "resume": (it.get("resume") or "").strip(),
            "pourquoi": (it.get("pourquoi") or "").strip(),
            "pays": [p for p in it.get("pays") or [] if p][:4],
            "region": it.get("region") if it.get("region") in REGIONS else "",
            "rubrique": rubrique or (it.get("rubrique") if it.get("rubrique") in ids else ""),
            "liens": links,
        })
    return out


def ai_brief(cfg: dict, articles: list[dict], today: datetime, api_key: str, previous: list[dict]) -> dict:
    system, user = build_prompt(cfg, articles, today, previous)
    log(f"Appel Gemini ({len(articles)} articles, {len(previous)} sujets déjà publiés, ~{len(user) // 4000}k tokens)…")
    raw, model = call_gemini(cfg, system, user, brief_schema(cfg), api_key)
    by_id = {a["id"]: a for a in articles}
    prev = {f"P{n}": p for n, p in enumerate(previous, 1)}
    sections = raw.get("rubriques") or {}
    return {
        "mode": "ia",
        "modele": model,
        "accroche": (raw.get("accroche") or "").strip(),
        "essentiel": finalize_items(raw.get("essentiel"), by_id, cfg, None, prev)[:5],
        "rubriques": [{"id": r["id"], "titre": r["titre"],
                       "items": finalize_items(sections.get(r["id"]), by_id, cfg, r["id"], prev)[: r.get("max", 4)]}
                      for r in cfg["rubriques"]],
        "a_surveiller": [{"quand": w.get("quand", ""), "quoi": w.get("quoi", ""),
                          "liens": links_for(w.get("refs"), by_id)}
                         for w in raw.get("a_surveiller") or [] if w.get("quoi")][:5],
    }


# ── Synthèse de la semaine ───────────────────────────────────

def weekly_due(cfg: dict, now: datetime) -> bool:
    day = str(cfg.get("synthese_hebdo", "non")).lower()
    days = JOURS if day in JOURS else [d.lower() for d in DAYS]
    return day in days and now.weekday() == days.index(day)


def weekly_brief(cfg: dict, date_str: str, api_key: str) -> dict | None:
    past = []
    for f in sorted(ARCHIVE.glob("*.json"), reverse=True):
        if f.stem < date_str:
            past.append(json.loads(f.read_text()))
        if len(past) == 7:
            break
    if len(past) < 3:
        log("Synthèse hebdo : moins de 3 briefs disponibles, on attend la semaine prochaine.")
        return None

    entries, lines = {}, []
    for b in reversed(past):
        titles = {r["id"]: r["titre"] for r in b.get("rubriques", [])}
        items = list(b.get("essentiel", [])) + [it for r in b.get("rubriques", []) for it in r["items"]]
        for it in items:
            n = len(entries) + 1
            entries[n] = it
            rub = titles.get(it.get("rubrique"), "")
            lines.append(f"[{n}] ({b['date']}, {rub}) {it['titre']} : {it.get('resume', '')}")

    system = f"""You are a strategic intelligence analyst. Write, in {cfg['langue']}, the summary of the past week
based on the daily briefs provided.

Reader: {cfg['profil'].strip()}

Rules:
- Use ONLY the stories provided. Invent nothing.
- "tendances": 5 to 7 underlying trends of the week (not just a list of events): what changed, what is accelerating, weak signals. Each lists the numbers of the stories used in "refs".
- "a_suivre": 3 to 5 things to watch in the coming week.
- Factual tone, short sentences."""
    user = "Stories from the latest briefs:\n\n" + "\n".join(lines)
    schema = {
        "type": "object",
        "properties": {
            "accroche": {"type": "string", "description": "The week in 2 sentences"},
            "tendances": {"type": "array", "items": {
                "type": "object",
                "properties": {
                    "emoji": {"type": "string"},
                    "titre": {"type": "string"},
                    "resume": {"type": "string", "description": "2 to 4 sentences"},
                    "refs": {"type": "array", "items": {"type": "integer"}},
                },
                "required": ["emoji", "titre", "resume", "refs"],
            }},
            "a_suivre": {"type": "array", "items": {
                "type": "object",
                "properties": {"quand": {"type": "string"}, "quoi": {"type": "string"}},
                "required": ["quand", "quoi"],
            }},
        },
        "required": ["accroche", "tendances", "a_suivre"],
    }
    log(f"Synthèse hebdo ({len(past)} briefs, {len(entries)} sujets)…")
    raw, _ = call_gemini(cfg, system, user, schema, api_key)

    def links(refs):
        out, seen = [], set()
        for ref in refs or []:
            try:
                it = entries.get(int(ref))
            except (TypeError, ValueError):
                continue
            for l in (it or {}).get("liens", [])[:1]:
                if l["url"] not in seen:
                    seen.add(l["url"])
                    out.append(l)
        return out[:4]

    return {
        "periode": f"{past[-1]['date']} → {past[0]['date']}",
        "accroche": (raw.get("accroche") or "").strip(),
        "tendances": [{"emoji": t.get("emoji", ""), "titre": t["titre"], "resume": t.get("resume", ""),
                       "liens": links(t.get("refs"))} for t in raw.get("tendances") or [] if t.get("titre")][:7],
        "a_suivre": [{"quand": a.get("quand", ""), "quoi": a["quoi"]}
                     for a in raw.get("a_suivre") or [] if a.get("quoi")][:5],
    }


# ── Version brute (sans IA) ──────────────────────────────────

def default_rubrique(cfg: dict) -> str:
    ids = [r["id"] for r in cfg["rubriques"]]
    return "monde" if "monde" in ids else ids[-1]


def classify(article: dict, cfg: dict) -> str:
    text = f" {article['titre']} {article['resume']} ".lower()
    for r in cfg["rubriques"]:
        if any(k.lower() in text for k in r.get("mots_cles") or []):
            return r["id"]
    return article.get("rubrique") or default_rubrique(cfg)


def raw_brief(cfg: dict, articles: list[dict], reason: str) -> dict:
    groups = {r["id"]: [] for r in cfg["rubriques"]}
    for a in articles:
        groups.setdefault(classify(a, cfg), []).append(a)
    return {
        "mode": "brut",
        "modele": None,
        "erreur": reason,
        "accroche": "",  # l'app affiche déjà un bandeau « Résumé IA indisponible »
        "essentiel": [],
        "rubriques": [{"id": r["id"], "titre": r["titre"], "items": [
            {"emoji": "", "titre": a["titre"], "resume": a["resume"], "pourquoi": "", "pays": [], "region": "",
             "rubrique": r["id"], "liens": [{"source": a["source"], "url": a["url"], "titre": a["titre"]}]}
            for a in groups[r["id"]][:6]]} for r in cfg["rubriques"]],
        "a_surveiller": [],
    }


# ── Écriture ─────────────────────────────────────────────────

def write_outputs(brief: dict, date_str: str, cfg: dict) -> None:
    ARCHIVE.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(brief, ensure_ascii=False, indent=1)
    (ARCHIVE / f"{date_str}.json").write_text(payload)
    (DATA / "latest.json").write_text(payload)

    cutoff = (datetime.strptime(date_str, "%Y-%m-%d") - timedelta(days=KEEP_DAYS)).strftime("%Y-%m-%d")
    last_rub = default_rubrique(cfg)
    dates, hebdo, rows, pile = [], [], [], []
    for f in sorted(ARCHIVE.glob("*.json"), reverse=True):
        if f.stem < cutoff:
            f.unlink()
            continue
        b = json.loads(f.read_text())
        dates.append(b["date"])
        # Pile « À lire » : tous les sujets IA des derniers jours (l'app retire ceux déjà lus)
        if len(dates) <= cfg.get("pile_jours", 7) and b.get("mode") == "ia":
            for it in b.get("essentiel", []) + [i for r in b.get("rubriques", []) for i in r["items"]]:
                pile.append({**it, "date": b["date"], "id": it.get("id") or f"{b['date']}|{it['titre']}",
                             "rubrique": it.get("rubrique") or last_rub})
        if b.get("hebdo"):
            hebdo.append(b["date"])
        # Index de recherche : une ligne compacte par sujet
        for it in b.get("essentiel", []) + [it for r in b.get("rubriques", []) for it in r["items"]]:
            rows.append({"d": b["date"], "r": it.get("rubrique", ""), "e": it.get("emoji", ""),
                         "t": it["titre"], "s": it.get("resume", ""), "w": it.get("pourquoi", ""),
                         "p": it.get("pays", []), "g": it.get("region", ""),
                         "l": [{"source": l["source"], "url": l["url"]} for l in it.get("liens", [])[:3]]})
    index = {"dates": dates, "hebdo": hebdo,
             "rubriques": [{"id": r["id"], "titre": r["titre"]} for r in cfg["rubriques"]]}
    (DATA / "index.json").write_text(json.dumps(index, ensure_ascii=False, indent=1))
    (DATA / "search.json").write_text(json.dumps(rows, ensure_ascii=False, separators=(",", ":")))
    (DATA / "pile.json").write_text(json.dumps(pile, ensure_ascii=False, separators=(",", ":")))


def set_output(**values) -> None:
    path = os.environ.get("GITHUB_OUTPUT")
    if path:
        with open(path, "a") as fh:
            for k, v in values.items():
                fh.write(f"{k}={v}\n")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--skip-if-done", action="store_true")
    parser.add_argument("--no-ai", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--sources", action="store_true")
    parser.add_argument("--hebdo", action="store_true")
    args = parser.parse_args()

    load_env()
    cfg = yaml.safe_load((ROOT / "config.yaml").read_text())
    now = datetime.now(ZoneInfo(cfg["fuseau"]))
    date_str = now.strftime("%Y-%m-%d")
    set_output(generated="false", date=date_str)

    if args.skip_if_done and (ARCHIVE / f"{date_str}.json").exists():
        log(f"Le brief du {date_str} existe déjà, rien à faire.")
        return 0

    log(f"Collecte des sources ({date_label(now)})…")
    articles, ok_feeds = collect(cfg, verbose=args.sources)
    log(f"{len(articles)} articles uniques depuis {ok_feeds} sources.")
    if args.sources:
        return 0
    if not articles:
        log("Aucun article récupéré : on ne publie rien.")
        return 1

    api_key = os.environ.get("GEMINI_API_KEY", "")
    use_ai = api_key and not args.no_ai
    if not use_ai:
        brief = raw_brief(cfg, articles, "No-AI mode" if args.no_ai else "GEMINI_API_KEY missing")
    else:
        try:
            previous = recent_items(date_str, cfg.get("memoire_jours", 3))
            brief = ai_brief(cfg, articles, now, api_key, previous)
        except Exception as exc:
            log(f"⚠ {exc}")
            brief = raw_brief(cfg, articles, str(exc)[:300])

    hebdo = None
    if use_ai and (args.hebdo or weekly_due(cfg, now)):
        try:
            hebdo = weekly_brief(cfg, date_str, api_key)
        except Exception as exc:  # la synthèse ne doit jamais bloquer le brief du jour
            log(f"⚠ Synthèse hebdo : {exc}")

    for it in brief["essentiel"] + [i for r in brief["rubriques"] for i in r["items"]]:
        it["id"] = f"{date_str}|{it['titre']}"  # identifiant stable (lu / favori)

    brief = {
        "date": date_str,
        "date_label": date_label(now),
        "genere_le": now.isoformat(timespec="seconds"),
        **brief,
        "hebdo": hebdo,
        "stats": {"articles": len(articles), "sources": ok_feeds},
    }

    if args.dry_run:
        print(json.dumps(brief, ensure_ascii=False, indent=1))
        return 0

    write_outputs(brief, date_str, cfg)
    set_output(generated="true", date=date_str)
    n = len(brief["essentiel"]) + sum(len(r["items"]) for r in brief["rubriques"])
    log(f"Brief du {date_str} écrit ({brief['mode']}, {n} sujets{', + synthèse hebdo' if hebdo else ''}).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
