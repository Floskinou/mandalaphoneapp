# Mandala Yoga & Pilates — MVP iPhone

Application officielle Mandala Yoga & Pilates, inspirée du **périmètre fonctionnel** des applications de coaching sans reprendre la marque, les textes ni les visuels d’Asana Rebel.

## MVP inclus

- onboarding : prénom, objectif et niveau ;
- plan hebdomadaire personnalisé ;
- catalogue avec recherche et filtres ;
- lecteur vidéo plein écran et Picture in Picture ;
- programmes guidés et défis avec progression ;
- favoris persistants ;
- paywall mensuel/annuel de démonstration ;
- état local persistant avec AsyncStorage ;
- identité Mandala issue de `mandala-pilates.com`, iPhone/iPad/Android/Web ;
- six vidéos challenge du compte Instagram officiel `@mandalayogapilates`, stockées localement pour le prototype.

L’application est **multiplateforme par conception** : un seul code produit les versions iPhone et Android, qui restent toujours identiques. Voir `PLATFORMS.md`.

> Le bouton d’essai active seulement le mode premium local. Il ne déclenche aucun paiement réel.

## Lancer le projet

```bash
npm install
npm start
```

Puis scanner le QR code avec Expo Go, ou lancer le rendu web :

```bash
npm run web
```

## Contrôles qualité

```bash
npm test
npm run typecheck
npx expo export --platform web
```

## Préparer un build iPhone depuis Windows

1. Installer/configurer EAS : `npx eas-cli login`.
2. Lier le projet : `npx eas-cli build:configure`.
3. Créer un build de test : `npx eas-cli build --platform ios --profile preview`.
4. Pour TestFlight, disposer d’un compte Apple Developer actif puis utiliser le profil `production`.

Aucun build ni envoi App Store n’est effectué automatiquement.

## Build Android

```bash
npx eas-cli@latest build --platform android --profile production
```

Le profil `production` Android produit un `.aab` signé pour Google Play ; le profil `preview` produit un `.apk` installable directement pour tester. EAS gère le keystore Android lors du premier build.

## Étapes production restantes

- remplacer le nom provisoire, l’icône et les contenus ;
- brancher Supabase (comptes, catalogue, progression multi-appareils) ;
- brancher RevenueCat et les produits App Store Connect ;
- ajouter analytics consentis, notifications et Apple Santé ;
- tester achats sandbox, restauration d’achat, hors-ligne et accessibilité ;
- préparer politique de confidentialité et fiche App Store.

Voir `CONTENT_GUIDE.md` pour ajouter les futurs contenus.
