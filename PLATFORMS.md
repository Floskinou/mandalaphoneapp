# Une seule application, deux plateformes

Ce projet produit **une seule application** déployée sur **iPhone et Android**. Il n’existe pas de code séparé par plateforme : chaque modification demandée est appliquée une fois, puis vérifiée sur les deux cibles.

## Pourquoi les deux versions restent identiques

- **Un seul code** React Native + Expo SDK 57 : `App.tsx` et `src/` sont partagés par iOS et Android.
- **Un seul catalogue** de contenus : `src/data/content.ts` alimente les deux applications.
- **Un seul état persistant** : la clé AsyncStorage `@mandala-pilates/state-v1` est la même sur les deux plateformes.
- **Une seule identité** : `com.mandalapilates.app` sert de `bundleIdentifier` iOS et de `package` Android.
- **Un numéro de version unique** : le champ `version` d’`app.json` s’applique aux deux stores ; seuls les compteurs techniques diffèrent (`buildNumber` côté iOS, `versionCode` côté Android, auto-incrémentés par EAS).

## Vérifications après chaque modification

```bash
npm test            # tests métier partagés
npm run typecheck   # TypeScript strict
npx expo export --platform web   # contrôle de bundle rapide
```

Puis, avant chaque mise en production :

```bash
npx eas-cli@latest build --platform ios --profile production
npx eas-cli@latest build --platform android --profile production
```

ou en une seule commande :

```bash
npx eas-cli@latest build --platform all --profile production
```

## Différences attendues et normales

| Sujet | iOS | Android |
|---|---|---|
| Fichier livré | `.ipa` | `.aab` |
| Compteur technique | `buildNumber` | `versionCode` |
| Boutique | App Store | Google Play |
| Achats intégrés | StoreKit / RevenueCat | Play Billing / RevenueCat |
| Barre système | SafeArea iOS | barre d’état Android |

Tout le reste — écrans, contenus, fonctionnalités, design, logique — est strictement identique.
