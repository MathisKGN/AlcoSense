# Carnet de tests E2E — AlcoSense

Document de référence avant implémentation Playwright. Tous les cas sont rédigés en français, du point de vue comportement utilisateur visible dans le navigateur.

## Comment lire ce document

| Champ | Signification |
|-------|----------------|
| **ID** | Identifiant stable (`E2E-###`) pour lier le test automatisé |
| **Priorité** | **P0** = bloquant release / sécurité produit · **P1** = important · **P2** = confort / régression secondaire |
| **Tag** | Zone fonctionnelle ou type de parcours |

**Total : 180 cas** (dont 33 parcours **Persona** : utilisateur qui a bu, confus, pressé ou irrationnel).

**Prérequis techniques communs (à appliquer lors du codage, pas des cas à part)** :
- Figurer l’horloge système (`clock` Playwright) pour les scénarios dépendant du temps.
- Pas de mock du moteur de calcul : vraie app, vrais clics.
- Viewport par défaut mobile **375×667** sauf mention « desktop » ou « tablette ».

---

## Liste à plat

### Chargement, shell et navigation

- **E2E-001** [P0] [Shell] Au premier chargement, le titre « AlcoSense » est visible dans l’en-tête.
- **E2E-002** [P2] [Shell] Le point animé (pulse) est présent dans l’en-tête.
- **E2E-003** [P1] [Shell] Le pied de page affiche « © 2026 AlcoSense ».
- **E2E-004** [P0] [Shell] Le pied de page affiche « Estimation indicative ».
- **E2E-005** [P0] [Shell] La page se charge sans erreur réseau bloquante (HTTP 200 sur la page d’accueil).
- **E2E-006** [P0] [Shell] Après hydratation, le contenu principal est visible (pas d’écran blanc prolongé).
- **E2E-007** [P1] [Shell] Le défilement permet d’atteindre « Configuration profil ».
- **E2E-008** [P1] [Shell] Le défilement permet d’atteindre « Courbe dans le temps ».
- **E2E-009** [P2] [Shell] L’en-tête reste fixe en haut pendant le scroll.
- **E2E-010** [P2] [Shell] Le pied de page reste fixe en bas pendant le scroll.
- **E2E-011** [P0] [Shell] Sur mobile 375×667, le bloc Estimation n’est pas masqué sous l’en-tête.
- **E2E-012** [P1] [Shell] Sur mobile, le contenu du bas n’est pas masqué sous le pied de page (safe-area).
- **E2E-013** [P0] [Shell] Rechargement (F5) : l’application se recharge sans erreur.
- **E2E-014** [P1] [Shell] Navigation arrière / avant du navigateur : cohérence avec les données persistées.
- **E2E-015** [P0] [Shell] Build avec chemin de base (GitHub Pages) : page et assets se chargent.

### État initial (première visite, stockage vide)

- **E2E-016** [P0] [État initial] Sans données sauvegardées, le taux affiché est `0,00` g/L (virgule décimale).
- **E2E-017** [P0] [État initial] Sans consommation, le texte « Aucune boisson ajoutée » est visible.
- **E2E-018** [P1] [État initial] Le badge compteur des consommations affiche `0`.
- **E2E-019** [P0] [État initial] Sans verre, le statut est « Apte à la conduite ».
- **E2E-020** [P0] [État initial] Sans verre et conducteur classique, la limite affichée est `0,5` g/L.
- **E2E-021** [P0] [État initial] Sans verre, le message de conduite est « Tu peux conduire ».
- **E2E-022** [P1] [État initial] La section « Courbe dans le temps » est visible.
- **E2E-023** [P1] [État initial] La courbe mentionne la limite légale `0,5` g/L par défaut.
- **E2E-024** [P1] [État initial] Le genre « Homme » est visuellement sélectionné par défaut.
- **E2E-025** [P1] [État initial] Le poids affiché par défaut est `75 kg`.
- **E2E-026** [P1] [État initial] L’estomac « À jeun » est sélectionné par défaut.
- **E2E-027** [P1] [État initial] Le toggle « Jeune conducteur » est désactivé par défaut.

### Profil — genre

- **E2E-028** [P1] [Profil] Clic sur « Femme » : le bouton Femme devient actif.
- **E2E-029** [P1] [Profil] Clic Femme puis Homme : Homme redevient actif.
- **E2E-030** [P0] [Profil] Avec les mêmes verres, changer de genre modifie le taux affiché.
- **E2E-031** [P1] [Profil] Le genre choisi est conservé après rechargement.

### Profil — poids

- **E2E-032** [P1] [Profil] Le curseur de poids est manipulable.
- **E2E-033** [P1] [Profil] Curseur à `40 kg` : le libellé affiche `40 kg`.
- **E2E-034** [P1] [Profil] Curseur à `150 kg` : le libellé affiche `150 kg`.
- **E2E-035** [P0] [Profil] À consommation identique, augmenter le poids diminue le taux affiché.
- **E2E-036** [P1] [Profil] Le poids est conservé après rechargement.

### Profil — estomac

- **E2E-037** [P1] [Profil] Les trois états estomac sont visibles avec leurs libellés.
- **E2E-038** [P1] [Profil] Sélection « A grignoté » : carte visuellement active.
- **E2E-039** [P1] [Profil] Sélection « Repas complet » : les autres cartes ne restent pas actives.
- **E2E-040** [P0] [Profil] Mêmes verres, passage « À jeun » → « Repas complet » : l’heure de conduite possible est plus tardive ou le pic plus étalé (comportement visible sur résumé ou courbe).
- **E2E-041** [P1] [Profil] L’état estomac est conservé après rechargement.

### Profil — jeune conducteur

- **E2E-042** [P0] [Profil] Activer « Jeune conducteur » : la limite affichée passe à `0,2` g/L.
- **E2E-043** [P1] [Profil] Le switch visuel reflète l’état activé.
- **E2E-044** [P0] [Profil] Désactiver le toggle : la limite repasse à `0,5` g/L.
- **E2E-045** [P0] [Profil] Jeune conducteur + une bière récente : statut plus strict qu’en conducteur classique (même scénario horaire).
- **E2E-046** [P1] [Profil] Le flag jeune permis est conservé après rechargement.

### Ajout rapide — presets

- **E2E-047** [P0] [Ajout] Clic « Bière » : une entrée apparaît dans la liste.
- **E2E-048** [P1] [Ajout] Clic « Vin » : entrée libellée Vin.
- **E2E-049** [P1] [Ajout] Clic « Shot » : entrée Shot.
- **E2E-050** [P1] [Ajout] Clic « Cocktail » : entrée Cocktail.
- **E2E-051** [P1] [Ajout] Clic « Spiritueux » : entrée Spiritueux.
- **E2E-052** [P1] [Ajout] Bière ajoutée : volume initial `25` cl.
- **E2E-053** [P1] [Ajout] Bière ajoutée : degré initial `5` %.
- **E2E-054** [P1] [Ajout] Vin ajouté : volume `12,5` cl et degré `12` %.
- **E2E-055** [P1] [Ajout] Shot ajouté : volume `3` cl et degré `40` %.
- **E2E-056** [P1] [Ajout] L’heure du verre est au format HH:MM cohérent avec l’heure système (à ±1 min près si horloge réelle).
- **E2E-057** [P1] [Ajout] Cinq types différents ajoutés : le compteur affiche `5`.
- **E2E-058** [P2] [Ajout] Défilement horizontal de la rangée d’ajout : tous les boutons restent cliquables.
- **E2E-059** [P1] [Ajout] Double clic rapide sur « Bière » : deux entrées distinctes.

### Liste des consommations — affichage

- **E2E-060** [P2] [Liste] Chaque entrée affiche l’icône du type de boisson.
- **E2E-061** [P1] [Liste] Chaque entrée affiche le libellé français du type.
- **E2E-062** [P1] [Liste] L’ordre d’affichage suit l’ordre d’ajout.
- **E2E-063** [P1] [Liste] Le compteur s’incrémente à chaque ajout.
- **E2E-064** [P1] [Liste] Le compteur se décrémente à chaque suppression.

### Liste — édition volume et degré

- **E2E-065** [P1] [Liste] Modifier le volume en cl met à jour le taux affiché.
- **E2E-066** [P1] [Liste] Saisir `0` cl : le volume ne devient pas négatif.
- **E2E-067** [P1] [Liste] Volume très élevé : le taux augmente de façon visible.
- **E2E-068** [P1] [Liste] Réduire le volume : le taux diminue.
- **E2E-069** [P1] [Liste] Degré à `0` : le taux tend vers zéro (à horloge fixe après élimination).
- **E2E-070** [P1] [Liste] Degré à `100` : valeur plafonnée, pas de crash.
- **E2E-071** [P2] [Liste] Augmenter le degré augmente le pic sur la courbe.

### Liste — édition heure

- **E2E-072** [P0] [Liste] Reculer l’heure d’un verre de plusieurs heures (horloge fixe) : le taux « maintenant » baisse par rapport à l’heure « maintenant » laissée par défaut.
- **E2E-073** [P0] [Liste] Verre horodaté à l’heure courante : statut « Absorption en cours » ou taux encore en montée possible.
- **E2E-074** [P2] [Liste] Changement d’heure sans crash (y compris autour de minuit, horloge simulée).

### Liste — suppression et réinitialisation

- **E2E-075** [P1] [Liste] Supprimer un verre : l’entrée disparaît.
- **E2E-076** [P1] [Liste] Supprimer le dernier verre : retour à « Aucune boisson ajoutée ».
- **E2E-077** [P0] [Liste] Réinitialiser (icône refresh) : toute la liste est vidée.
- **E2E-078** [P1] [Liste] Après reset avec 3 verres : compteur à `0`.
- **E2E-079** [P0] [Liste] Reset ne remet pas le profil aux valeurs par défaut.
- **E2E-080** [P1] [Liste] Après reset, rechargement : liste toujours vide.

### Résumé du taux — affichage

- **E2E-081** [P1] [Résumé] Le libellé « Estimation » est visible.
- **E2E-082** [P1] [Résumé] L’unité « g/L » est affichée.
- **E2E-083** [P0] [Résumé] Le séparateur décimal est une virgule (format français).
- **E2E-084** [P0] [Résumé] La ligne « Limite X g/L » suit le profil (0,5 ou 0,2).

### Résumé du taux — statuts métier

- **E2E-085** [P0] [Résumé] Sans verre : « Apte à la conduite ».
- **E2E-086** [P0] [Résumé] Shot récent, estomac vide, profil homme 75 kg (horloge fixe) : « Conduite interdite » ou « Absorption en cours », pas « Apte ».
- **E2E-087** [P0] [Résumé] Taux ≥ limite : « Conduite interdite ».
- **E2E-088** [P0] [Résumé] Taux entre 80 % et 100 % de la limite : « Proche du seuil ».
- **E2E-089** [P0] [Résumé] Absorption non terminée : « Absorption en cours ».
- **E2E-090** [P0] [Résumé] Sous le seuil et élimination terminée (horloge fixe) : « Tu peux conduire ».
- **E2E-091** [P0] [Résumé] Conduite future connue : texte « Conduite possible à HH:MM ».
- **E2E-092** [P1] [Résumé] Compte à rebours « dans X h YY min » cohérent avec l’heure affichée.
- **E2E-093** [P0] [Résumé] Scénario sans heure fiable sous 24 h : message « Pas d’heure fiable sous 24 h — ne conduis pas sur cette estimation ».
- **E2E-094** [P1] [Résumé] Après ajout d’un verre, le résumé se met à jour sans rechargement (`aria-live`).

### Courbe de projection

- **E2E-095** [P1] [Courbe] Titre « Courbe dans le temps » visible.
- **E2E-096** [P1] [Courbe] Sous-titre limite aligné sur le profil.
- **E2E-097** [P1] [Courbe] Sans verre : courbe à zéro sur la fenêtre affichée.
- **E2E-098** [P1] [Courbe] Avec verres : tracé de courbe visible (SVG non vide).
- **E2E-099** [P2] [Courbe] Ligne de seuil légale visible.
- **E2E-100** [P1] [Courbe] Légende « Début » avec heure du premier verre.
- **E2E-101** [P1] [Courbe] Légende « Maintenant » avec heure courante.
- **E2E-102** [P1] [Courbe] Légende « Conduite » ou « Sous le seuil » selon le cas.
- **E2E-103** [P1] [Courbe] Changement d’estomac modifie la forme de la courbe (scénario comparatif).
- **E2E-104** [P2] [Courbe] Fenêtre longue : graduations lisibles sans chevauchement critique.

### Persistance (stockage local)

- **E2E-105** [P0] [Persistance] Profil modifié + rechargement : genre, poids, jeune permis restaurés.
- **E2E-106** [P0] [Persistance] Verres ajoutés + rechargement : liste identique.
- **E2E-107** [P1] [Persistance] Estomac modifié + rechargement : sélection restaurée.
- **E2E-108** [P2] [Persistance] Clé profil contient un JSON valide après interaction.
- **E2E-109** [P2] [Persistance] Clé boissons mise à jour à chaque ajout / suppression.
- **E2E-110** [P1] [Persistance] Donnée profil corrompue (JSON invalide) : démarrage avec défauts, sans crash.
- **E2E-111** [P1] [Persistance] Stockage partiel (profil seul) : boissons vides, profil fusionné.
- **E2E-112** [P2] [Persistance] Mode navigation privée : l’app fonctionne ; absence de persistance acceptée sans erreur.

### Scénarios réalistes (parcours rationnels)

- **E2E-113** [P0] [Parcours] Apéro : 2 bières espacées (horloge fixe) → pas « Apte » au moment critique.
- **E2E-114** [P0] [Parcours] Repas complet + 3 vins : comportement plus favorable qu’à jeun (pic plus tardif ou taux actuel plus bas à instant donné).
- **E2E-115** [P0] [Parcours] Shot à l’heure courante après élimination partielle : le compte à rebours de conduite repart ou le statut se durcit.
- **E2E-116** [P1] [Parcours] Ajout cocktail puis suppression : retour à un état cohérent si c’était le seul verre.
- **E2E-117** [P0] [Parcours] Femme 55 kg, jeune permis, 1 bière : seuil `0,2` et statut plus strict qu’homme 90 kg classique.
- **E2E-118** [P0] [Parcours] Soirée longue (6+ verres, horloge fixe) : pas de crash ; message 24 h ou heure de conduite affichée.
- **E2E-119** [P0] [Parcours] Verres la veille, « maintenant » le lendemain matin (horloge fixe) : taux matinal > 0 tant que l’élimination n’est pas terminée.
- **E2E-120** [P1] [Parcours] Degré 0 sur tous les verres : « Tu peux conduire » maintenu.
- **E2E-121** [P1] [Parcours] Enchaînement config → ajout → édition → reset → nouveau profil → nouvel ajout : état final cohérent.

### Accessibilité et clavier

- **E2E-122** [P2] [A11y] Focus clavier sur les boutons d’ajout rapide.
- **E2E-123** [P2] [A11y] Focus clavier sur Homme / Femme.
- **E2E-124** [P2] [A11y] Curseur poids utilisable au clavier.
- **E2E-125** [P2] [A11y] Cartes estomac activables au clavier.
- **E2E-126** [P2] [A11y] Toggle jeune conducteur activable au clavier.
- **E2E-127** [P2] [A11y] Champ volume : libellé accessible « Volume en centilitres ».
- **E2E-128** [P2] [A11y] Bouton reset : « Réinitialiser les consommations ».
- **E2E-129** [P2] [A11y] Bouton supprimer verre : « Supprimer ce verre ».

### Responsive et tactile

- **E2E-130** [P2] [Responsive] Liste de 10+ verres : scroll fluide, suppression toujours possible.
- **E2E-131** [P2] [Responsive] Rotation paysage mobile : pas de chevauchement illisible header / contenu.
- **E2E-132** [P2] [Responsive] Tablette 768px : colonne centrée, pas de débordement horizontal.
- **E2E-133** [P2] [Responsive] Grand écran : contenu limité en largeur (`max-w-md`).

### Temps réel (horloge)

- **E2E-134** [P1] [Temps] Avancer l’horloge de 60 min (mock) : le taux affiché diminue sans action utilisateur.
- **E2E-135** [P1] [Temps] Verre à l’heure courante : la courbe montre une phase de montée puis de descente sur la fenêtre.

### Robustesse technique

- **E2E-136** [P1] [Robustesse] Saisie invalide dans le champ volume : pas de crash, état stable.
- **E2E-137** [P1] [Robustesse] Valeur aberrante dans le degré : plafonnée ou ignorée, pas de crash.
- **E2E-138** [P2] [Robustesse] Spam du bouton reset (20 clics) : application stable.
- **E2E-139** [P1] [Robustesse] Après premier chargement, utilisation hors ligne : pas d’appel réseau obligatoire supplémentaire.
- **E2E-140** [P2] [Robustesse] Aucune requête vers un serveur métier (hors assets statiques).

### CI et cible de déploiement

- **E2E-141** [P0] [CI] Suite exécutable contre `npm run preview` (build local).
- **E2E-142** [P0] [CI] Suite exécutable contre l’URL GitHub Pages avec chemin de base du dépôt.
- **E2E-143** [P1] [CI] Échec du job si un test P0 échoue.
- **E2E-144** [P2] [CI] Capture d’écran et trace conservées en cas d’échec.

### Régression visuelle (smoke)

- **E2E-145** [P2] [Visuel] Icônes Material des verres affichées (pas de glyphes cassés).
- **E2E-146** [P2] [Visuel] Cartes type « glass-card » visibles.
- **E2E-147** [P2] [Visuel] Bouton genre actif en couleur primaire.

---

## Parcours Persona — utilisateur qui a bu, confus ou irrationnel

Ces cas complètent la liste ci-dessus. Ils ciblent les erreurs humaines et la lecture partielle, pas le « bon chemin » seul.

### Premier regard et lecture partielle

- **E2E-148** [P0] [Persona] Ouverture en milieu de soirée sans rien configurer : après 3 bières ajoutées vite, le statut n’est pas « Apte à la conduite ».
- **E2E-149** [P0] [Persona] Mobile sans scroll : le bloc Estimation, le titre de statut et la ligne sur la conduite sont visibles dans le premier écran.
- **E2E-150** [P0] [Persona] L’utilisateur ne descend pas au profil : estomac reste « À jeun » alors qu’il a mangé — le test documente un taux plus élevé qu’avec « Repas complet » (risque produit : sous-estimation de l’absorption si l’utilisateur ne configure pas).
- **E2E-151** [P0] [Persona] Jeune conducteur non activé alors qu’il l’est en réalité : une bière peut afficher « Proche du seuil » ou « Apte » avec limite `0,5` au lieu du régime `0,2` (risque produit explicite dans le rapport de test).
- **E2E-152** [P0] [Persona] Ne lit que le gros chiffre : le test vérifie que le titre de statut (« Conduite interdite », etc.) est sur le même écran que le chiffre sans scroll (mobile).

### Oubli, double saisie, mauvais type

- **E2E-153** [P0] [Persona] Oubli d’avoir déjà saisi : 2 clics « Bière » consécutifs → compteur `2`, taux plus élevé qu’avec 1 bière (comportement attendu : double comptage si l’utilisateur ne corrige pas).
- **E2E-154** [P1] [Persona] Ne sait pas le type : enchaîne Vin, puis Bière, puis Shot en 10 secondes → 3 entrées, taux cumulé cohérent, pas de crash.
- **E2E-155** [P1] [Persona] Ferme l’onglet et rouvre (rechargement) : les verres sont toujours là (pas de « repartir de zéro » silencieux qui ferait croire qu’il n’a rien bu).
- **E2E-156** [P0] [Persona] Corrige l’oubli en supprimant une entrée en trop : le taux baisse immédiatement.

### Heure et quantité incohérentes

- **E2E-157** [P0] [Persona] Verres pris il y a 2 h mais heure laissée par défaut (maintenant) : taux actuel **surestimé** par rapport au scénario où l’heure est reculée de 2 h (horloge fixe, même nombre de verres).
- **E2E-158** [P0] [Persona] Tente de « corriger » en mettant une heure très ancienne sans comprendre : taux actuel **sous-estimé** vs scénario honnête (risque produit : message trop rassurant).
- **E2E-159** [P1] [Persona] Un seul shot enregistré alors que le scénario métier en simule six (six ajouts) : statut « Conduite interdite » ou message long délai, jamais « Tu peux conduire » immédiat après le sixième.
- **E2E-160** [P1] [Persona] Champ volume vidé puis resaisi au hasard (`1` puis `50`) : pas de crash, taux fini cohérent avec la dernière valeur.

### Maladresse, reset, profil faux

- **E2E-161** [P0] [Persona] Clic sur réinitialiser en croyant « actualiser » : liste vide, taux retombe vers `0,00`, message « Tu peux conduire » **uniquement** si plus aucun verre (pas d’ancien taux élevé affiché).
- **E2E-162** [P1] [Persona] Supprime le premier verre au lieu du dernier : le taux change ; il reste au moins une entrée si d’autres verres existent.
- **E2E-163** [P1] [Persona] Curseur poids glissé accidentellement à `40 kg` : taux augmente ; remise à `75 kg` : taux redescend (réversible).
- **E2E-164** [P1] [Persona] Change le genre « pour voir » puis ne revient pas : le taux reste calculé avec le dernier genre choisi (pas de reset automatique).
- **E2E-165** [P0] [Persona] Profil volontairement faux (femme 55 kg, jeune permis) vs profil « optimiste » (homme 90 kg, classique) avec **même** série de verres : le premier scénario affiche un statut plus strict ou un délai de conduite plus long.

### Spam, chaos, survie

- **E2E-166** [P0] [Persona] 15 clics rapides sur « Bière » : compteur `15`, page utilisable, pas de gel visible.
- **E2E-167** [P0] [Persona] En 30 secondes : change estomac, ajoute 2 verres, modifie un degré, active jeune permis, recharge la page → pas de crash, taux et liste cohérents après reload.
- **E2E-168** [P1] [Persona] Recharge la page 5 fois de suite en espérant « faire baisser » le taux sans rien changer : le taux reste identique à horloge fixe (pas de bug magique).
- **E2E-169** [P2] [Persona] Deux onglets : ajout dans l’onglet A, rechargement onglet B → après reload B reflète les données (cohérence stockage local).

### Messages de conduite — ne pas se faire piéger

- **E2E-170** [P0] [Persona] Taux au-dessus de la limite : le texte « Tu peux conduire » n’apparaît **pas**.
- **E2E-171** [P0] [Persona] Taux sous la limite mais absorption en cours : pas « Tu peux conduire » ; « Absorption en cours » ou délai affiché.
- **E2E-172** [P0] [Persona] Soirée lourde (horloge fixe, scénario 24 h) : le message « Pas d’heure fiable sous 24 h… » apparaît ; « Tu peux conduire » n’apparaît pas.
- **E2E-173** [P1] [Persona] Pied de page « Estimation indicative » toujours visible après scroll maximal (rappel légal présent).

### Parcours nommés (scénarios bout-en-bout Persona)

- **E2E-174** [P0] [Persona · Parcours] **« Déjà ivre, premier regard »** — Horloge fixe, 3 bières à l’heure courante, estomac par défaut : statut « Conduite interdite » ou « Absorption en cours » ; chiffre et alerte visibles sans scroll.
- **E2E-175** [P0] [Persona · Parcours] **« J’ai oublié combien »** — 4 ajouts dont 2 doublons bière, suppression d’une entrée : le taux baisse mais reste > 0 tant qu’il reste des verres.
- **E2E-176** [P0] [Persona · Parcours] **« Je me suis planté sur l’heure »** — Même verre, heure « maintenant » vs heure −3 h (horloge fixe) : les deux taux affichés sont différents ; le cas « maintenant » est ≥ au cas « il y a 3 h ».
- **E2E-177** [P0] [Persona · Parcours] **« Reset par accident »** — 3 verres → reset → liste vide et taux `0,00` ; pas de statut « Conduite interdite » résiduel.
- **E2E-178** [P0] [Persona · Parcours] **« Profil faux vs honnête »** — Comparaison A (55 kg, femme, jeune permis, 1 bière) vs B (90 kg, homme, classique, 1 bière) : A plus strict que B.
- **E2E-179** [P0] [Persona · Parcours] **« Spam et survie »** — 15 bières + scroll jusqu’au profil + reload : compteur et liste restaurés, pas de crash.
- **E2E-180** [P0] [Persona · Parcours] **« Soirée longue simplifiée »** — 8 verres, heures étalées sur la soirée (horloge fixe) : soit « Conduite possible à… », soit message 24 h ; jamais valeur `NaN` ni bloc vide.

---

## Synthèse des priorités

| Priorité | Nombre (approx.) | Rôle |
|----------|------------------|------|
| **P0** | ~62 | Sécurité message conduite, persistance, persona critique, CI |
| **P1** | ~72 | Fonctionnel complet, parcours réalistes |
| **P2** | ~46 | A11y, visuel, confort |

## Mapping suggéré pour le code

```
e2e/
  smoke/          → E2E-001 à E2E-027, E2E-141 à E2E-144
  profil/         → E2E-028 à E2E-046
  consommations/  → E2E-047 à E2E-080
  resume/         → E2E-081 à E2E-094
  courbe/         → E2E-095 à E2E-104
  persistance/    → E2E-105 à E2E-112
  parcours/       → E2E-113 à E2E-121
  persona/        → E2E-148 à E2E-180
```

## Limites assumées (hors scope E2E)

- Compréhension cognitive réelle de l’utilisateur ivre.
- Décision de prendre le volant malgré l’app.
- Conditions lumineuses d’un bar, fatigue visuelle, taille de police système OS.

Ces points relèvent de tests utilisateurs manuels ou sessions terrain, en complément de ce carnet.

---

*Dernière mise à jour : génération initiale du carnet (180 cas, E2E-001 à E2E-180).*
