"""Envoie la notification « Brief du jour » sur le téléphone (Web Push).

Lit l'abonnement du téléphone (secret PUSH_SUBSCRIPTION, copié depuis l'app)
et la clé privée VAPID (secret VAPID_PRIVATE_KEY). Sans eux, ne fait rien.

Usage :
    python notify.py              envoie tout de suite
    python notify.py --at 07:45   attend 07h45 (heure de Singapour) puis envoie
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
from datetime import datetime
from zoneinfo import ZoneInfo

from brief import DATA, JOURS, load_env, log

TZ = ZoneInfo("Asia/Singapore")
MAX_WAIT_MIN = 90
MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août",
        "septembre", "octobre", "novembre", "décembre"]


def wait_until(hhmm: str) -> None:
    now = datetime.now(TZ)
    hour, minute = map(int, hhmm.split(":"))
    target = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
    delay = (target - now).total_seconds()
    if 0 < delay <= MAX_WAIT_MIN * 60:
        log(f"Attente jusqu'à {hhmm} ({int(delay // 60)} min)…")
        time.sleep(delay)


def jour_fr(date_str: str) -> str:
    """« 2026-11-20 » → « Vendredi 20 novembre »."""
    d = datetime.strptime(date_str, "%Y-%m-%d")
    return f"{JOURS[d.weekday()].capitalize()} {'1er' if d.day == 1 else d.day} {MOIS[d.month - 1]}"


def message(brief: dict) -> dict:
    """Notification en français (langue par défaut de l'app)."""
    titre = lambda it: (it.get("fr") or {}).get("titre") or it["titre"]  # noqa: E731
    titres = [f"{it.get('emoji', '')} {titre(it)}".strip() for it in brief.get("essentiel", [])[:3]]
    if not titres:
        titres = [titre(it) for r in brief.get("rubriques", []) for it in r["items"][:1]][:3]
    body = "\n".join(titres)
    nouveaux = sum(len(r["items"]) for r in brief.get("rubriques", []))
    if nouveaux:
        body += f"\n📚 +{nouveaux} nouveaux sujets dans ta pile"
    if brief.get("hebdo"):
        body = "📊 Synthèse de la semaine incluse\n" + body
    return {"title": f"Brief · {jour_fr(brief['date'])}", "body": body[:350], "url": "./"}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--at", help="heure d'envoi HH:MM (heure de Singapour)")
    args = parser.parse_args()
    load_env()

    raw_subs = os.environ.get("PUSH_SUBSCRIPTION", "").strip()
    private_key = os.environ.get("VAPID_PRIVATE_KEY", "").strip()
    if not raw_subs or not private_key:
        log("Notifications non configurées (PUSH_SUBSCRIPTION / VAPID_PRIVATE_KEY absents) : rien à envoyer.")
        return 0

    from pywebpush import WebPushException, webpush

    subs = json.loads(raw_subs)
    subs = subs if isinstance(subs, list) else [subs]
    brief = json.loads((DATA / "latest.json").read_text())
    if brief["date"] != datetime.now(TZ).strftime("%Y-%m-%d"):
        log("Le brief publié n'est pas celui du jour : pas de notification.")
        return 0

    if args.at:
        wait_until(args.at)

    payload = json.dumps(message(brief), ensure_ascii=False)
    sub_claim = os.environ.get("VAPID_SUB") or "https://github.com"
    sent = 0
    for sub in subs:
        try:
            webpush(sub, payload, vapid_private_key=private_key,
                    vapid_claims={"sub": sub_claim}, ttl=6 * 3600)
            sent += 1
        except WebPushException as exc:
            status = getattr(exc.response, "status_code", "?")
            log(f"⚠ Envoi refusé (HTTP {status}). Si 404/410 : réactive les notifications dans l'app.")
    log(f"Notification envoyée à {sent}/{len(subs)} appareil(s).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
