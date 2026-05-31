# AlcoSense — Design

**Date :** 2026-05-31
**Statut :** Validé (design + spec)

> **Nom du produit :** AlcoSense (nom affiché dans l'UI). Le dépôt s'appelle
> « Boire & Conduire ».

## Objectif

Site web simple qui suit la consommation d'alcool et estime **quand l'utilisateur
peut reconduire** (taux repassé sous le seuil légal). Projet portfolio : simple,
fun, technos modernes, déployé en live.

**Mobile First.** L'expérience est conçue d'abord pour mobile (colonne unique,
zones tactiles larges, marges latérales de 24px). Le site doit aussi fonctionner
correctement sur desktop/tablette (layout centré, largeur max ~448px / `max-w-md`
comme la maquette), mais le mobile est la cible prioritaire pour le design et les
tests.

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
- `sexe` : homme / femme → coefficient de Widmark `r` (**0,70 H / 0,60 F**)
- `jeunePermis` (checkbox) → seuil légal : **0,2 g/L** si coché, sinon **0,5 g/L**

**État estomac** (réglage de session, près de la saisie) : vide / a grignoté /
repas complet → ajuste la durée de la phase de montée (voir calcul).

**Consommations** : liste de verres. Chaque verre =
- `type` (bière / vin / shot / cocktail / spiritueux)
- `volume` (ml) et `degre` (% vol) — préremplis selon le type, **éditables inline**
- `heure` de consommation (par défaut = maintenant, modifiable)

Ajout via **quick-add** (un bouton par type, presets ci-dessous). Une fois ajouté,
chaque verre expose en édition inline : `volume`, `degre` et `heure`. La
suppression est individuelle.

## Types de conso (préréglages éditables)

| Type | Volume | Degré |
|------|--------|-------|
| Bière | 25 cl | 5° |
| Vin | 12,5 cl | 12° |
| Shot | 3 cl | 40° |
| Cocktail | 10 cl | 15° |
| Spiritueux | 4 cl | 40° |

## Calcul de l'alcoolémie (Widmark)

On utilise **uniquement la formule métrique** (A en grammes, poids en kg, taux en
g/L). 

**Alcool pur d'un verre (g)** :
```
alcool_g = volume_ml × (degre / 100) × 0,789
```
(0,789 = densité de l'éthanol)

**Phase de montée** : après chaque verre, l'alcool n'est pas absorbé
instantanément. On modélise une **montée linéaire** dont la durée dépend de l'état
de l'estomac (réglage de session) :

| État estomac | Durée de montée |
|--------------|-----------------|
| Estomac vide | 30 min |
| A grignoté | 60 min |
| Repas complet | 90 min |

La contribution d'un verre passe de 0 à son max entre `heure` et
`heure + durée_montée`, puis reste pleine. Soit `t` = minutes écoulées depuis la
consommation du verre et `m` = durée de montée :
- si `t < 0` : contribution = 0 (verre dans le futur)
- si `0 ≤ t < m` : fraction absorbée = `t / m`
- si `t ≥ m` : fraction absorbée = 1

**Contribution d'un verre au taux brut (g/L)**, avant élimination :
```
c_max = alcool_g / (poids_kg × r)
c(t)  = c_max × fraction_absorbée(t)
```

**Élimination** : le corps élimine l'alcool à `β = 0,15 g/L/h`, uniquement sur
l'alcool **déjà absorbé et présent** dans le sang. On **intègre le taux pas à
pas** (minute par minute) depuis le premier verre : à chaque minute on ajoute
l'alcool nouvellement absorbé et on retranche l'élimination, en **bornant à 0 à
chaque pas** :
```
taux(t) = max(0, taux(t−1) + Δabsorbé(t) − β/60)
```
Le clamp à 0 **à chaque pas** (et non une soustraction unique `β × temps_total`)
est volontaire : il empêche l'élimination de « capitaliser » du crédit pendant
les périodes où le taux est déjà à 0 (trou sobre dans la soirée). Une forme close
`max(0, Σ c_i − β × t_global)` afficherait à tort 0 g/L pour un verre bu plusieurs
heures après un précédent déjà éliminé — sous-estimation **dangereuse** pour une
app dont c'est précisément le sujet. On ne descend jamais sous 0.

> Note d'implémentation : pour rester juste pendant la phase de montée, on calcule
> le taux par échantillonnage du temps (le pic n'est pas forcément à l'instant
> présent). L'**heure de conduite** est le moment **après lequel le taux reste
> sous le seuil** : on cherche le *dernier* instant où `taux > seuil` sur les 24h
> à venir, +1 min. (Renvoyer le *premier* instant sous le seuil serait faux pendant
> la montée : on serait « apte » juste avant que le pic dépasse le seuil.)

> **Temps absolu (passage de minuit).** Une heure de verre seule (`HH:MM`) est
> ambiguë sur 24h. À chaque calcul, on résout chaque `heure` en **instant absolu**
> relatif à `maintenant` : l'occurrence la plus récente **≤ maintenant** (donc la
> veille au soir si l'heure est postérieure à l'heure courante). Le modèle travaille
> alors en minutes **absolues monotones**, ce qui rend correct un verre bu à 23:30
> consulté à 00:30. Hypothèse : tous les verres datent des **dernières 24h**.

> **État estomac rétroactif.** L'état estomac est un réglage **de session** unique :
> changer l'état recalcule la phase de montée de **tous** les verres. Accepté pour
> le MVP (cohérent avec la spec) — pas d'état estomac par verre.

## Sortie

- **Taux actuel estimé** en g/L, avec code couleur (3 zones) :
  - **vert** : `taux < 80 % du seuil` **et** le pic à venir ne dépassera pas le
    seuil → « Tu peux conduire ».
  - **orange** : soit `taux ≥ 80 % du seuil` (proche), soit `taux < seuil` mais le
    pic à venir **dépassera** le seuil (= absorption en cours, « tu vas bientôt être
    au-dessus »).
  - **rouge** : `taux ≥ seuil` → ne pas conduire.
- **Message principal** dérivé de l'heure de conduite :
  - si déjà et durablement sous le seuil → **« Tu peux conduire »**.
  - sinon → **« Tu peux conduire à HH:MM »** (et « dans X h Y min »).
- **Graphique « Projection Temporelle »** : courbe du taux estimé de maintenant
  jusqu'au retour sous le seuil, avec une ligne pointillée marquant le seuil légal.
  La courbe est dérivée du même modèle Widmark (échantillonnage du taux dans le
  temps), pas une simple droite. Affiche le temps restant avant sobriété.
- Liste des verres ajoutés avec suppression individuelle.
- Bouton **Reset** (vide les consos, garde le profil).

## Disclaimer

Aucun disclaimer

## Design visuel

Maquette ici : `/Maquette_Design` (`screen.png` + `code.html` + `DESIGN.md`).

Style : **Minimalist Glassmorphism** (cf. `DESIGN.md`) — cartes en verre dépoli
(`backdrop-filter: blur`), grands rayons, boutons en pilule, contraste de graisses
typographiques fort (BAC en Inter Thin 100, labels en Semibold). Palette
« Studio White » : émeraude = zone sûre, corail/rouge = zone danger. Tokens de
couleur, typo, rayons et espacements définis dans `DESIGN.md` (frontmatter).

> ⚠️ **`code.html` est un prototype visuel, pas une référence de calcul.** Son JS
> simplifie l'alcoolémie (densité 0,8, pas de phase de montée, courbe = droite). En
> cas de conflit, **la section « Calcul » de cette spec fait foi** (densité 0,789,
> phase de montée selon l'estomac, élimination, échantillonnage). On reprend le
> look de la maquette, pas sa logique.

## Découpage en composants (isolation)

- `lib/widmark.ts` — calcul pur (alcool d'un verre, taux à instant t, heure de
  conduite). **Aucune dépendance UI**, testable seul.
- `lib/storage.ts` — lecture/écriture `localStorage` (profil + consos).
- `lib/types.ts` — types Profil, Conso, presets.
- `lib/stores.svelte.ts` — état réactif (profil, liste consos) via runes.
- Composants UI : panneau résultat (BAC + statut), graphique de projection,
  quick-add de conso, liste des consos (édition/suppression), formulaire profil
  (genre, poids, estomac, jeune permis). Chacun a une responsabilité unique.

`lib/widmark.ts` expose aussi une fonction d'**échantillonnage** (taux à chaque pas
de temps sur un intervalle) qui sert à la fois au calcul de l'heure de conduite et
au tracé du graphique de projection.

## Tests

- Tests unitaires sur `widmark.ts` (vitest) : cas connus (1 bière, à jeun,
  montée à 30 min, retour sous seuil, file vide → taux 0).

## Hors scope (YAGNI)

- Comptes utilisateurs / sync multi-appareils.
- Historique des soirées passées.
- Notifications.
- Géoloc / appel taxi.
