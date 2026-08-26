# Remplacer les contenus de démonstration

Tous les contenus visibles sont centralisés dans `src/data/content.ts`. Le prototype contient six Reels du compte Instagram officiel `@mandalayogapilates`, téléchargés via la connexion propriétaire et conservés dans `assets/mandala/challenges/`.

Le logo et les photos d’ambiance proviennent du site officiel `mandala-pilates.com`. Le fichier `assets/mandala/challenges/metadata.json` conserve les légendes, dates et permaliens Instagram sources.

## Séance vidéo

Chaque objet `Workout` accepte :

- `id` : identifiant stable et unique ;
- `title` et `subtitle` ;
- `duration` en minutes ;
- `level` : `beginner`, `intermediate` ou `advanced` ;
- `category` : Yoga, Fitness, Mobilité ou Respiration ;
- `goals` : `strength`, `energy`, `mobility`, `relaxation` ;
- `image` : URL HTTPS d’une couverture horizontale ;
- `video` : URL HTTPS du fichier ou flux vidéo ;
- `premium` : accès réservé à l’abonnement ;
- `calories` : estimation indicative.

## Programmes et défis

Les tableaux `programs` et `challenges` référencent les séances par leurs `workoutIds`. Il suffit donc d’ajouter les séances, puis de composer les listes d’identifiants.

## Recommandations avant production

1. Héberger les vidéos sur Mux, Cloudflare Stream ou Bunny Stream plutôt que dans le bundle final ; les fichiers locaux servent au prototype hors CMS.
2. Ajouter un CMS (Supabase est prévu pour le MVP) afin de publier les contenus sans nouvelle version App Store.
3. Prévoir vignettes WebP/AVIF, sous-titres `.vtt`, durée, coach, contre-indications et variantes de difficulté.
4. Ne publier que des contenus dont vous détenez les droits.
5. Faire relire les mentions santé et contre-indications par un professionnel compétent.
