# Studio Quiz — Twitch Live

Application web de quiz pour stream Twitch : **console modérateur** (régie) + **overlay live** temps réel, construite avec React, TailwindCSS et Supabase.

## Fonctionnalités

- **Dashboard modérateur** — look « Broadcast TV » (fond `#0B1120`, Cabinet Grotesk + Satoshi)
- **Génération de question** — tirage aléatoire parmi les questions non utilisées, filtrable par difficulté
- **Double validation** — clic sur une réponse = présélection locale (surbrillance ambre) ; rien n'est envoyé au live sans clic sur **« Confirmer la réponse »** (+ bouton **Annuler**)
- **Joker 50/50** — avec sa propre confirmation avant activation
- **Moniteur retour live** + **journal régie** horodaté
- **Overlay public** temps réel (`?view=overlay`) pour OBS (source navigateur)
- **Mode démo** intégré si Supabase n'est pas configuré

## Étape 1 — Base de données Supabase

1. Créez un projet sur [supabase.com](https://supabase.com)
2. Ouvrez **SQL Editor** et exécutez le script [`supabase/schema.sql`](supabase/schema.sql) : il crée les tables `questions` et `game_state`, active le temps réel, pose les politiques RLS et insère 12 questions de démarrage.
3. Copiez `.env.example` vers `.env` et renseignez :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_MODERATOR_PIN` (code d'accès régie, défaut `2026`)

## Étape 2 — Lancement

```bash
npm install
npm run dev
```

- Console modérateur : `http://localhost:5173/` (code PIN requis)
- Overlay live (OBS) : `http://localhost:5173/?view=overlay`

## Structure

```
supabase/schema.sql          → schéma + seed (Étape 1)
src/
  lib/supabase.js            → client Supabase (+ détection mode démo)
  hooks/useStudio.js         → état du studio : tirage, validation, joker, live
  components/
    ModeratorDashboard.jsx   → console modérateur (Étape 2)
    LiveOverlay.jsx          → overlay public temps réel
    PinGate.jsx              → sas d'accès par code PIN
  data/demoQuestions.js      → questions du mode démo
```

## Sécurité

- La console est protégée par un code PIN côté client (appoint).
- En production, connectez le modérateur via **Supabase Auth** et restreignez les politiques d'écriture à `authenticated` (voir commentaires dans `schema.sql`).
