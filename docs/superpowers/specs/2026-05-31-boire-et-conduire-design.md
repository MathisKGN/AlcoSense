# Boire & Conduire — Design

**Date :** 2026-05-31
**Statut :** Validé (design), en attente revue spec

## Objectif

Site web simple qui suit la consommation d'alcool et estime **quand l'utilisateur
peut reconduire** (taux repassé sous le seuil légal). Projet portfolio : simple,
fun, technos modernes, déployé en live.

## Stack

- **Svelte 5** (runes : `$state`, `$derived`, `$effect`) + **SvelteKit** + **Vite**.
- **`adapter-static`** → site 100 % statique.
- **GitHub Pages** via workflow **GitHub Actions** (build + publish auto sur push `main`).
- Aucun backend. Toutes les données restent dans le navigateur (`localStorage`).
- La commande exacte de scaffold (`npx sv create`) et les versions seront vérifiées
  sur la doc officielle au moment de l'implémentation.

## Données & persistance

Tout en `localStorage`, rien n'est envoyé sur un serveur (cohérent avec le sujet
sensible des données).

**Profil** (saisi une fois, mémorisé) :
- `poids` (kg)
- `sexe` : homme / femme → coefficient de Widmark `r` (0,68 H / 0,55 F)
- `jeunePermis` (checkbox) → seuil légal : **0,2 g/L** si coché, sinon **0,5 g/L**

**Consommations** : liste de verres. Chaque verre =
- `type` (bière / vin / shot / cocktail / spiritueux)
- `volume` (ml) et `degre` (% vol) — préremplis selon le type, éditables
- `heure` de consommation (par défaut = maintenant, modifiable)

## Types de conso (préréglages éditables)

| Type | Volume | Degré |
|------|--------|-------|
| Bière | 25 cl | 5° |
| Vin | 12,5 cl | 12° |
| Shot | 3 cl | 40° |
| Cocktail | 10 cl | 15° |
| Spiritueux | 4 cl | 40° |

## Calcul de l'alcoolémie (Widmark)

**Alcool pur d'un verre (g)** :
```
alcool_g = volume_ml × (degre / 100) × 0,789
```
(0,789 = densité de l'éthanol)

**Phase de montée** : après chaque verre, l'alcool n'est pas absorbé
instantanément. On modélise simplement une **montée linéaire sur 30 min** :
la contribution d'un verre passe de 0 à son max entre `heure` et `heure + 30 min`,
puis reste pleine.

Soit `t` = minutes écoulées depuis la consommation du verre :
- si `t < 0` : contribution = 0 (verre dans le futur)
- si `0 ≤ t < 30` : fraction absorbée = `t / 30`
- si `t ≥ 30` : fraction absorbée = 1

**Contribution d'un verre au taux brut (g/L)**, avant élimination :
```
c_max = alcool_g / (poids_kg × r)
c(t)  = c_max × fraction_absorbée(t)
```

**Élimination** : le corps élimine l'alcool à `β = 0,15 g/L/h`. L'élimination
s'applique sur l'alcool **déjà absorbé**. Taux total à l'instant courant :
```
taux = max(0, Σ c_i(t_i) − β × t_global)
```
où `t_global` est le temps écoulé depuis le **premier** verre (en heures),
borné à ≥ 0. On ne descend jamais sous 0.

> Note d'implémentation : pour rester juste pendant la phase de montée, on calcule
> le taux par échantillonnage du temps (le pic n'est pas forcément à l'instant
> présent). L'estimation de l'heure de conduite se fait en avançant le temps minute
> par minute (ou par dichotomie) jusqu'à ce que `taux ≤ seuil`.

## Sortie

- **Taux actuel estimé** en g/L, avec code couleur :
  - vert : sous le seuil → OK pour conduire
  - orange : proche du seuil
  - rouge : au-dessus → ne pas conduire
- **« Tu peux conduire à HH:MM »** (et « dans X h Y min »), ou
  **« Tu peux conduire »** si déjà sous le seuil.
- Liste des verres ajoutés avec suppression individuelle.
- Bouton **Reset** (vide les consos, garde le profil).

## Disclaimer

Affiché en permanence : estimation **indicative**, ne remplace **jamais** un
éthylotest. Le métabolisme varie selon les personnes, l'état de santé, la fatigue,
les médicaments, etc. En cas de doute : ne pas conduire.

## Design visuel

Soigné et fun : palette cohérente, feedback visuel clair (vert/orange/rouge selon
le taux), interface agréable et lisible. Responsive mobile (cas d'usage = soirée,
téléphone en main).

## Découpage en composants (isolation)

- `lib/widmark.ts` — calcul pur (alcool d'un verre, taux à instant t, heure de
  conduite). **Aucune dépendance UI**, testable seul.
- `lib/storage.ts` — lecture/écriture `localStorage` (profil + consos).
- `lib/types.ts` — types Profil, Conso, presets.
- `lib/stores.svelte.ts` — état réactif (profil, liste consos) via runes.
- Composants UI : formulaire profil, ajout de conso, liste des consos, panneau
  résultat. Chacun a une responsabilité unique.

## Tests

- Tests unitaires sur `widmark.ts` (vitest) : cas connus (1 bière, à jeun,
  montée à 30 min, retour sous seuil, file vide → taux 0).

## Hors scope (YAGNI)

- Comptes utilisateurs / sync multi-appareils.
- Historique des soirées passées.
- Notifications.
- Géoloc / appel taxi.
