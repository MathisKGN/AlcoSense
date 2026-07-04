# AlcoSense

Estimateur d'alcoolémie (taux d'alcool dans le sang) basé sur la **formule de Widmark**.
Application web mobile-first : on renseigne son profil et ses consommations, l'app estime
le taux courant, trace la courbe dans le temps et indique l'heure à partir de laquelle la
conduite redevient possible.

> ⚠️ **Estimation indicative uniquement.** Les résultats ne remplacent pas un éthylotest et
> ne doivent jamais servir de base pour décider de conduire.

## Fonctionnalités

- **Profil** : genre, poids, état de l'estomac, jeune conducteur (limite 0,2 vs 0,5 g/L)
- **Consommations** : presets (bière, vin, shot, cocktail, spiritueux), volume/degré/heure éditables
- **Estimation temps réel** : taux courant, statut (apte / proche du seuil / absorption / interdit)
- **Heure de reprise de conduite** ou message « pas d'heure fiable sous 24 h »
- **Courbe de projection** dans le temps
- **Persistance locale** (localStorage) — aucune donnée envoyée sur un serveur

## Stack technique

SvelteKit 2 · Svelte 5 (runes) · TypeScript · Tailwind CSS 4 · adapter-static (site statique).

## Développement

```sh
npm install
npm run dev          # serveur de dev
```

## Tests

```sh
npm test             # tests unitaires (Vitest) — moteur Widmark + formatters
npm run test:e2e     # tests end-to-end (Playwright) — parcours critiques P0
npm run check        # vérification TypeScript / Svelte
```

Le carnet des cas de test E2E (180 cas) est documenté dans `e2e/carnet-tests-e2e.md`.

## Build & déploiement

```sh
npm run build        # génère le site statique dans build/
npm run preview      # prévisualise le build de prod
```

Le déploiement vers **GitHub Pages** est automatisé via `.github/workflows/deploy.yml`
(à chaque push sur `main` : tests → build → déploiement).
