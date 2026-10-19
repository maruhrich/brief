# Brief Défense & Géopolitique

Web-app installée sur l'écran d'accueil de l'iPhone. Chaque matin, avant 7h45 (heure de Singapour) :

1. **GitHub Actions** lance [brief.py](brief.py), qui lit une soixantaine de sources : flux RSS, plus des recherches Google News en anglais, français, japonais, coréen, chinois et indonésien, sur les dernières 24 h.
2. **Gemini** (offre gratuite de Google) trie, traduit et résume en français :
   - *L'essentiel*,
   - 13 rubriques,
   - « Pourquoi c'est important »,
   - *À surveiller*,
   - le lundi, la *Synthèse de la semaine*.
3. Le brief est publié sur **GitHub Pages**. À 7h45, [notify.py](notify.py) envoie la notification sur le téléphone.

Dans l'app : filtres par rubrique et par pays ou région, recherche sur 60 jours, favoris et partage.
Si l'IA est indisponible, l'app affiche quand même les titres bruts classés par rubrique.
Coût : 0 €. L'app n'utilise pas l'abonnement Claude.

## Modifier les sujets ou les sources

Tout se règle dans [config.yaml](config.yaml) :
- le profil,
- les rubriques (et leur nombre maximum de sujets),
- les flux RSS,
- les recherches Google News,
- les médias exclus,
- les modèles IA.

Pour tester les sources :

```bash
.venv/bin/python brief.py --sources
```

## Horaires

Dans [.github/workflows/brief.yml](.github/workflows/brief.yml), les lignes `cron` sont en heure UTC (Singapour = UTC+8) :
- `50 22 * * *` = génération à 06h50 ;
- `25 23 * * *` = rattrapage à 07h25 si GitHub a sauté le premier lancement.

L'heure de la notification se règle dans la dernière étape (`--at 07:45`).

## Commandes utiles (sur le Mac)

| Commande | Effet |
|---|---|
| `.venv/bin/python brief.py --dry-run` | génère le brief et l'affiche sans rien publier |
| `.venv/bin/python brief.py --no-ai --dry-run` | idem, sans appel à Gemini |
| `.venv/bin/python brief.py --sources` | teste chaque source |
| `gh workflow run brief.yml` | relance le brief du jour sur GitHub |

## Secrets (GitHub → Settings → Secrets and variables → Actions)

| Secret | Rôle |
|---|---|
| `GEMINI_API_KEY` | clé Gemini (aistudio.google.com/apikey, sans carte bancaire) |
| `VAPID_PRIVATE_KEY` | clé privée des notifications (la clé publique est dans [docs/app.js](docs/app.js)) |
| `PUSH_SUBSCRIPTION` | code copié depuis l'app (« Notifications » → « Copier le code ») |

Les mêmes valeurs servent aux tests locaux dans `.env`, qui n'est jamais publié.

## Installer l'app sur l'iPhone

1. Ouvrir l'adresse du site dans **Safari** → bouton *Partager* → *Sur l'écran d'accueil*.
2. Ouvrir l'app depuis l'icône, puis en bas : *Notifications* → *Activer* → *Copier le code*.
3. Enregistrer ce code comme secret `PUSH_SUBSCRIPTION`.

## Bon à savoir

- Le site est public mais exclu des moteurs de recherche. Il ne contient que des résumés d'actualités publiques.
- Les favoris restent sur le téléphone.
- Les résumés sont automatiques : vérifier la source avant de citer un chiffre.
- Sites payants (Janes, Nikkei, FT…) : seuls le titre et l'extrait sont lus.
