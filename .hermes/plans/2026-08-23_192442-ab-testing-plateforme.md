# Plateforme A/B Testing (type A/B Tasty) — Plan d'implémentation

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Plateforme SaaS d'A/B testing visuel hébergée sur un nouveau site Netlify : snippet JS à coller sur les sites clients, dashboard avec résultats de conversion par variante, accès clients en magic link cloisonné par compte.

**Architecture:** Snippet `<script>` chargé depuis le domaine Netlify → récupère la config des expériences actives (`/api/config`) → assigne chaque visiteur à une variante (hash déterministe sticky) → applique les modifs visuelles (texte, image, style, CTA) → envoie les événements (assignment / vue / conversion) vers une Edge Function Netlify qui écrit dans Supabase. Le dashboard (Vite + React + Supabase Auth magic link) lit les agrégats et calcule le taux de conversion + gagnant (z-test deux proportions).

**Tech Stack:** TypeScript · Vite + React + Tailwind (dashboard) · SDK vanilla JS sans dépendance (snippet) · Netlify Edge/Functions · Supabase gratuit (Postgres + RLS + Auth OTP magic link) · Vitest pour les tests.

**Décisions validées par Florent :**
- Scope v1 : **modifs visuelles par script uniquement** (titres, couleurs, images, CTA). Redirections et tracking standalone : plus tard.
- Backend : **Supabase** (auth incluse, isolation par client via RLS).
- Connexion clients : **magic link e-mail**.
- Dashboard autorité sur : **taux de conversion par variante + gagnant**.

---

## Contexte et hypothèses

- ⚠️ Le dossier courant `aurea-move` est l'app Expo Mandala Pilates : **on n'y touche pas**. La plateforme est un projet neuf dans son propre dossier (proposé : `C:\Users\flore\Projects\ab-platform\`).
- Nouveau site Netlify à créer par Florent au moment du déploiement (phase 8) — jamais de déploiement sans validation explicite.
- Les sites clients intègrent **une seule ligne** de script ; aucune donnée personnelle collectée (visitor_id aléatoire anonyme).
- UI du dashboard en français.

## Schéma de données Supabase

```sql
create table accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

create table account_members (
  account_id uuid references accounts(id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin','viewer')), -- admin = Florent, viewer = client
  primary key (account_id, email)
);

create table experiments (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references accounts(id) on delete cascade,
  slug text unique not null,          -- utilisé par le snippet : data-exp="slug"
  name text not null,
  status text not null default 'draft' check (status in ('draft','running','stopped')),
  traffic_allocation int not null default 100,   -- % des visiteurs inclus
  variants jsonb not null,            -- [{"id":"A","name":"Contrôle","weight":50},{"id":"B","name":"Variante","weight":50}]
  edits jsonb not null default '[]',  -- [{"variantId":"B","selector":"h1","action":"text","value":"Nouveau titre"}]
  goals jsonb not null default '[]',  -- [{"id":"lead","type":"click","selector":"#cta"},{"id":"merci","type":"pageview","pattern":"/merci"}]
  created_at timestamptz default now()
);

create table events (
  id bigserial primary key,
  experiment_id uuid references experiments(id) on delete cascade,
  variant_id text not null,
  visitor_id text not null,
  type text not null check (type in ('assignment','conversion')),
  goal_id text,
  created_at timestamptz default now()
);
create index on events (experiment_id, type, variant_id);

-- RLS : chacun ne voit que les comptes dont il est membre (par e-mail auth.uid() -> users.email)
alter table accounts enable row level security;
-- (politiques détaillées dans supabase/migrations/001_init.sql, tâche 2)
```

Agrégation des résultats (vue ou requête directe) :

```sql
select variant_id,
       count(distinct case when type='assignment' then visitor_id end) as visitors,
       count(distinct case when type='conversion' then visitor_id end) as conversions
from events where experiment_id = $1 group by variant_id;
```

Statistique : z-test deux proportions → confiance % ; badge **Gagnant** si confiance ≥ 95 % ET ≥ 100 visiteurs/variante (seuil configurable). Sinon « Pas encore significatif ».

---

## Phase 1 — Fondations du projet

### Task 1.1 : Scaffold monorepo
**Files:** créer `C:\Users\flore\Projects\ab-platform\`
- `package.json` (workspaces npm : `sdk`, `functions`, `app`)
- `netlify.toml` (build `app/dist`, fonctions `netlify/functions`, redirections `/* -> /index.html` SPA)
- `tsconfig.base.json`, `.gitignore`, `README.md`

Vérification : `git init && git status` propre ; `npm install` sans erreur.

### Task 1.2 : App dashboard minimale qui build
**Files:** `app/` (Vite react-ts), `app/src/main.tsx`, `app/src/App.tsx` (« Ça marche ✨ »), Tailwind configuré.

Vérification : `npm run build` dans `app/` génère `dist/`.

### Task 1.3 : Tooling de tests
**Files:** racine `vitest.config.ts` (projects : sdk, app).

Vérification : `npm run test` passe (0 test → ok).

## Phase 2 — Supabase

### Task 2.1 : Migration SQL + RLS
**Files:** `supabase/migrations/001_init.sql` (schéma ci-dessus + politiques RLS :
- SELECT sur experiments/members : membre du compte (email = auth.email())
- INSERT/UPDATE/DELETE experiments : role='admin' du compte
- events : écriture **service role uniquement** (via Edge Function), lecture via agrégats côté admin)

Vérification : exécuter dans l'éditeur SQL Supabase (compte créé par Florent) ; tables + policies visibles.

### Task 2.2 : Seed de démo
**Files:** `supabase/seed_demo.sql` — 1 compte « Démo », 1 expérience running à 2 variantes.

Vérification : la requête d'agrégation renvoie des lignes avec des données fictives insérées manuellement.

## Phase 3 — API Netlify (Edge Functions)

### Task 3.1 : GET `/api/config` — config publique des expériences
**Files:** `functions/config.ts`
- Lit les expériences `status='running'` (clé anon + vue sécurisée `public_running_experiments` ne exposant QUE : slug, variants, edits, goals, traffic_allocation — jamais les autres comptes).
- Répond `application/javascript` définissant `window.__AB_CONFIG__`, en-têtes `Cache-Control: public, max-age=60` + CORS `*`.
- Test : `tests/functions/config.test.ts` — filtre status, shape JSON, pas de fuite inter-comptes.

Vérification : `npm run test` vert ; `netlify dev` puis `curl localhost:8888/api/config` renvoie le JS attendu.

### Task 3.2 : POST `/api/e` — ingestion d'événements
**Files:** `functions/collect.ts`
- Body `{slug, variantId, visitorId, type, goalId}` ; validation stricte ; upsert anti-doublon assignment (une ligne par visiteur/expérience : re-POST ignoré).
- Clé service role via variable d'env `SUPABASE_SERVICE_ROLE_KEY` (jamais côté client).
- Rate-limit basique (max ~30 req/IP/min, map mémoire) + réponse 204 vide.
- Tests : payload invalide → 400 ; doublon assignment → 1 seule ligne.

Vérification : `curl -X POST .../api/e -d '{...}'` puis SELECT dans Supabase montre la ligne ; doublon ignoré.

## Phase 4 — SDK `sdk/ab.js` (cœur produit)

### Task 4.1 : Assignation déterministe sticky
**Files:** `sdk/src/assign.ts`, test `sdk/test/assign.test.ts`
- `getVisitorId()` : localStorage `ab_vid` (UUID) sinon création ; miroir cookie 180 jours.
- `assign(exp)` : FNV-1a(`${slug}:${vid}`) → [0,1) ; < traffic_allocation/100 sinon exclu ; sinon répartition pondérée par `weight`. **Test TDD : même entrée → même variante toujours ; poids respectés sur 10k tirages simulés.**

### Task 4.2 : Moteur de modifs visuelles
**Files:** `sdk/src/apply.ts`, test `sdk/test/apply.test.ts` (jsdom)
- Actions supportées v1 : `text`, `html`, `style` (prop CSS:valeur), `attr` (src/href…), `image` (src+alt).
- Application quand DOM prêt (MutationObserver léger pour éléments tardifs, timeout 2 s) ; option anti-flicker par expérience (masquage des sélecteurs ciblés ≤ 150 ms max).
- Ne rien casser si le sélecteur est absent : silencieux.

### Task 4.3 : Tracking + objectifs de conversion
**Files:** `sdk/src/track.ts`, `sdk/src/index.ts` (entry IIFE), test `track.test.ts`
- Envoi assignment 1× (déjà dedup côté API), `navigator.sendBeacon` avec fallback `fetch(..., {keepalive:true})`.
- Goals : `click` (délégation d'événements sur sélecteur) et `pageview` (match pattern sur location.pathname) → POST `/api/e`.
- Entry point : charge `/api/config`, boucle sur les expériences, assigne, applique, tracke. Exposition `window.__AB__` pour debug (`__AB__.variant('slug')`).

Vérification : `npm run test` sdk 100 % vert ; page HTML de démo locale (`demo/index.html` avec 2 boutons) : la variante B change bien le titre, clic CTA remonte une conversion visible dans Supabase.

### Task 4.4 : Tag d'intégration
**Files:** `README.md` section intégration :

```html
<script async src="https://<domaine-netlify>/api/config"></script>
<script async src="https://<domaine-netlify>/sdk/ab.iife.js"></script>
```
(Le SDK est servi en fichier statique depuis le deploy Netlify — pas de build côté client.)

## Phase 5 — Dashboard : authentification magic link

### Task 5.1 : Client Supabase + garde de route
**Files:** `app/src/lib/supabase.ts`, `app/src/lib/AuthContext.tsx`, route protégée.

### Task 5.2 : Page Login (magic link)
**Files:** `app/src/pages/Login.tsx`
- Input e-mail → `supabase.auth.signInWithOtp({ email })` → écran « lien envoyé ✉️ ». Redirect URL configurée dans Supabase Auth (URL Netlify + localhost dev).

Vérification : en local, mail reçu (SMTP Supabase par défaut), clic du lien → session active → redirection `/experiments`.

## Phase 6 — Dashboard : gestion des expériences

### Task 6.1 : Liste des expériences
**Files:** `app/src/pages/Experiments.tsx` — cartes : nom, statut (badge), trafic, taux de conversion global, lien détail. Filtre par statut.

### Task 6.2 : Création/édition d'une expérience (wizard 4 étapes)
**Files:** `app/src/pages/ExperimentEdit.tsx`, composants `VariantList`, `EditsEditor`, `GoalsEditor`
1. Nom + slug auto
2. Variantes (+ poids, somme = 100 validée)
3. Modifs visuelles par variante (sélecteur CSS + action + valeur ; aide-mémoire des actions)
4. Objectifs (clic sélecteur / pageview pattern) + allocation de trafic
- Actions : Démarrer / Mettre en pause (status running↔paused→stopped), suppression si draft.
- **Validation explicite avant tout passage en `running`** (convention Florent).

Vérification : `npm run test` + parcours manuel : créer une expérience brouillon, la démarrer, la voir dans `/api/config`.

## Phase 7 — Dashboard : résultats

### Task 7.1 : Utilitaires statistiques
**Files:** `app/src/lib/stats.ts`, test `app/src/lib/stats.test.ts`
- `twoProportionZTest(c1,n1,c2,n2) → {confidence, lift}` ; pure, testée (cas connus : 50/1000 vs 60/1000 ≈ 71 %, etc.).

### Task 7.2 : Page détail résultat
**Files:** `app/src/pages/ExperimentResults.tsx`
- Par objectif : tableau variante | visiteurs | conversions | taux | lift vs contrôle | barre de confiance ; badge 🏆 **Gagnant** (≥95 % & ≥100 visiteurs/variante) sinon « Pas encore significatif ».
- Requête d'agrégation via RPC Postgres (`get_experiment_results`) sécurisée par RLS.

Vérification : seed de démo → chiffres affichés cohérents avec un calcul manuel.

## Phase 8 — Accès clients + déploiement (validation requise)

### Task 8.1 : Gestion des accès
**Files:** `app/src/pages/Access.tsx` (visible rôle admin seulement)
- Inviter un client : e-mail + compte(s) concerné(s) → INSERT `account_members(role='viewer')`.
- Un client se connecte en magic link et ne voit **que** ses expériences (RLS). Florent (admin) voit tout.

### Task 8.2 : Déploiement Netlify — ⚠️ étape avec validation de Florent
1. Florent crée le nouveau site Netlify (nom/domaine à choisir ensemble) et connecte le repo Git.
2. Variables d'env : `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
3. Redirects : `/api/config` et `/api/e` → fonctions ; reste → SPA.
4. Smoke tests réels post-déploiement : `/api/config` joignable depuis un site de démo externe, événements remontés, magic link reçu et fonctionnel, isolation vérifiée entre 2 comptes de test.
- **Rien n'est mis en ligne sans ton feu vert, et chaque étape est vérifiée en conditions réelles.**

## Phase 9 — Documentation

### Task 9.1 : Guide « intégrer chez un client »
**Files:** `docs/integration-client.md` — snippet, checklist (page test, objectif mesuré, durée mini selon trafic), FAQ (adblock, RGPD : aucun PII, visitor_id pseudonyme).

---

## Ordre d'exécution et jalons

| Jalon | Contenu | Démo possible |
|---|---|---|
| M1 | Phases 1–4 | Une page démo affiche 2 versions et compte les conversions |
| M2 | Phases 5–7 | Dashboard avec vraie expérience et résultats |
| M3 | Phases 8–9 | En ligne sur Netlify, client invité, snippet sur un vrai site |

## Risques et parades

- **Adblockers** bloquent parfois les beacons → envoi via chemin first-party `/api/e` + fallback fetch ; perte partielle acceptée (idem A/B Tasty).
- **Flicker** lors de l'application des modifs → option anti-flicker bornée à 150 ms.
- **Faible trafic client** → la significativité peut prendre des semaines : le dashboard affiche toujours les taux bruts + un état honnête « pas encore significatif » plutôt qu'un faux gagnant.
- **Sécurité** : clé service role uniquement dans les fonctions Netlify ; RLS testée avec 2 comptes de test avant mise en prod.
- **ITP/Safari** limite les cookies → localStorage en source de vérité, cookie en complément.

## Questions ouvertes (à trancher avant M3)

1. Nom de domaine / nom du nouveau site Netlify (ex. `abtest-escale.netlify.app`, custom domain ensuite) ?
2. Charte graphique du dashboard (neutre pro vs couleurs Escale Ads) ?
3. Marque blanche souhaitée pour les clients (leur logo, pas de mention de l'outil) ?
