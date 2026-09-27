# Déploiement — Vercel + OBS

Guide pas à pas pour héberger le Studio Quiz sur Vercel et afficher l'overlay dans OBS.

## 1. Préparer le code

Le projet est déjà prêt pour Vercel :

- `vercel.json` — réécriture SPA pour que `/overlay` fonctionne en production
- `src/App.jsx` — routage : `/` = console modérateur, `/overlay` = overlay public
- Variables d'environnement : `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_MODERATOR_PIN`

Fusionnez votre branche de travail dans `main` (via la pull request), puis passez à l'étape 2.

## 2. Déployer sur Vercel

1. Allez sur [vercel.com](https://vercel.com) et connectez-vous avec GitHub.
2. **Add New… → Project → Import** le dépôt `qvgd-`.
3. Le framework **Vite** est détecté automatiquement, ne changez rien au build.
4. Ouvrez **Environment Variables** et ajoutez :
   | Variable | Valeur | Où la trouver |
   |---|---|---|
   | `VITE_SUPABASE_URL` | `https://xxxxx.supabase.co` | Supabase → Project Settings → API |
   | `VITE_SUPABASE_ANON_KEY` | clé `anon` / `publishable` | Supabase → Project Settings → API |
   | `VITE_MODERATOR_PIN` | ex. `2026` | code d'accès de votre choix pour la régie |
5. Cliquez **Deploy**. Vercel vous donne une URL de production, ex. `https://qvgd.vercel.app`.

Vos deux liens :

- 🎛️ **Console modérateur** : `https://qvgd.vercel.app/` (code PIN requis)
- 📺 **Overlay live** : `https://qvgd.vercel.app/overlay`

> 💡 Astuce : une fois déployé, le bloc **« Sortie OBS »** du dashboard affiche le lien exact et le copie en 1 clic.

## 3. Lien personnalisé (domaine perso)

Pour avoir un beau lien à vous (ex. `quiz.votredomaine.fr`) :

1. Sur Vercel : ouvrez le projet → **Settings → Domains → Add**.
2. Entrez votre domaine (ex. `quiz.votredomaine.fr`) et validez.
3. Vercel affiche un enregistrement DNS à créer : ajoutez un **CNAME** `quiz` → `cname.vercel-dns.com` chez votre registrar (OVH, Cloudflare, etc.).
4. Attendez la propagation (quelques minutes) : Vercel affiche « Valid Configuration » et le certificat HTTPS est automatique.

L'overlay devient alors `https://quiz.votredomaine.fr/overlay` — c'est ce lien à mettre dans OBS.

## 4. Ajouter l'overlay dans OBS

### Plein écran (scène « Quiz » dédiée)

1. OBS → **Sources → + → Navigateur → Créer** (« Overlay Quiz »).
2. **URL** : `https://VOTRE-APP.vercel.app/overlay`
3. **Largeur 1920, Hauteur 1080**, FPS 30.
4. Cochez **« Arrêter la source quand elle n'est pas visible »** (économise les ressources).
5. OK — pilotez ensuite depuis la console modérateur (téléphone, tablette ou 2ᵉ écran).

### Bandeau bas transparent (par-dessus votre jeu)

1. Même procédure, avec l'URL : `https://VOTRE-APP.vercel.app/overlay?transparent=1&layout=lower`
2. **Largeur 1920, Hauteur 1080** (le bandeau est ancré en bas, le reste est transparent).
3. Positionnez/redimensionnez la source dans votre scène de jeu.

### Pendant le live

- **Rafraîchir** le cache OBS si besoin : clic droit sur la source → Propriétés → « Rafraîchir le cache de la page actuelle ».
- Chaque question/réponse/joker confirmé dans la console apparaît **instantanément** dans OBS via Supabase Realtime.
- Gardez la console modérateur ouverte sur un 2ᵉ écran : le **moniteur retour live** montre ce que les viewers voient.

## 5. Check-list avant le stream

- [ ] Script `supabase/schema.sql` exécuté (tables + seed + temps réel)
- [ ] Variables d'environnement renseignées sur Vercel (puis **Redeploy** si ajoutées après coup)
- [ ] Overlay testé dans un onglet navigateur (`/overlay` affiche « Le quiz commence bientôt »)
- [ ] Question testée depuis la console → visible sur l'overlay
- [ ] Source navigateur ajoutée dans OBS avec la bonne URL
- [ ] Stock de questions suffisant (sinon : bouton « Réinitialiser le stock »)
