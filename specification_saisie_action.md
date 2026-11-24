
## VolleyLive — Spécification des modes de saisie runtime
  
**Document :** Spécification fonctionnelle et UX**Produit :** VolleyLive**Périmètre :** Saisie live des événements de match**Modes couverts :** FOCUS, SPEED+, FLOW**Statut :** Base de conception validée pour implémentation**Langue de l’interface :** Français, avec libellés configurables

### 1. Objectif
  
VolleyLive doit proposer trois interfaces de saisie différentes, sélectionnables dans les options, tout en produisant strictement les mêmes événements métier.  
Les trois modes utilisent le même parcours logique :Auteur de l’action → Action → Résultat → Enregistrement immédiat  
Les différences portent uniquement sur l’organisation visuelle et le niveau de permanence du contexte :
- **FOCUS** : une seule décision par écran ;
- **SPEED+** : terrain permanent et zone de commande contextuelle ;
- **FLOW** : joueur, action et résultat visibles simultanément.

#### 1.1 Objectifs UX communs
- permettre une saisie standard en **3 pressions maximum** ;
- réduire les erreurs de saisie pendant un rally ;
- rendre les commandes accessibles sur téléphone et tablette ;
- conserver une position fixe pour chaque action ;
- utiliser la mémoire musculaire ;
- permettre la saisie d’une action adverse ;
- permettre de changer de joueur à chaque étape ;
- mettre à jour le score après chaque événement pertinent ;
- permettre l’annulation atomique de l’événement et de son impact sur le score ;
- ne jamais injecter de données de démonstration dans le match réel.

### 2. Principes communs aux trois modes

### 2.1 Modèle de saisie
  
Chaque interaction complète doit produire un événement canonique indépendant du mode d’interface :{
  "id": "evt\_unique\_id",
  "timestamp": "2026-11-24T18:45:12.000Z",
  "setNumber": 2,
  "authorSide": "HOME",
  "playerId": "player\_8",
  "playerNumber": 8,
  "playerRole": "OH",
  "action": "ATTACK",
  "status": "POSITIVE",
  "scoreBefore": {
    "home": 18,
    "away": 16
  },
  "scoreAfter": {
    "home": 19,
    "away": 16
  },
  "inputMode": "FOCUS"
}  
Pour une action adverse :{
  "authorSide": "AWAY",
  "playerId": null,
  "playerNumber": null,
  "playerRole": "OPPONENT",
  "action": "ATTACK",
  "status": "POSITIVE"
}  
Le bouton **A** représente l’adversaire générique. Il ne doit pas être enregistré comme un joueur de l’effectif local.

### 2.2 Valeurs d’action
  
Les libellés visibles en français correspondent aux valeurs canoniques suivantes :
<table>
<tr>
<th>  
Libellé UI
</th>
<th>  
Valeur JSON
</th>
</tr>
<tr>
<td>  
SERVICE
</td>
<td>  
SERVE
</td>
</tr>
<tr>
<td>  
RÉCEPTION
</td>
<td>  
RECEPTION
</td>
</tr>
<tr>
<td>  
PASSE
</td>
<td>  
SET
</td>
</tr>
<tr>
<td>  
ATTAQUE
</td>
<td>  
ATTACK
</td>
</tr>
<tr>
<td>  
BLOCK
</td>
<td>  
BLOCK
</td>
</tr>
<tr>
<td>  
DÉFENSE
</td>
<td>  
DEFENCE
</td>
</tr>
<tr>
<td>  
RELANCE
</td>
<td>  
RELANCE
</td>
</tr>
</table>


### 2.3 Valeurs de résultat

<table>
<tr>
<th>  
Libellé UI
</th>
<th>  
Valeur JSON
</th>
<th>  
Couleur
</th>
</tr>
<tr>
<td>  
POSITIF
</td>
<td>  
POSITIVE
</td>
<td>  
Vert
</td>
</tr>
<tr>
<td>  
NEUTRE
</td>
<td>  
NEUTRAL
</td>
<td>  
Bleu-gris
</td>
</tr>
<tr>
<td>  
ERREUR
</td>
<td>  
ERROR
</td>
<td>  
Rouge
</td>
</tr>
</table>

  
Le choix du résultat enregistre immédiatement l’événement. Aucun bouton **Valider** ne doit être ajouté.

### 2.4 Grille fixe d’actions
  
La position des actions ne doit jamais changer, quel que soit le joueur, le rôle ou le mode :SERVICE      RÉCEPTION      PASSE
ATTAQUE      BLOCK          DÉFENSE
RELANCE sur toute la largeur  
Cette géographie doit rester identique dans FOCUS, SPEED+ et FLOW.

### 2.5 Codes couleur des familles d’action
  
Les couleurs de famille doivent rester discrètes. Elles identifient les actions sans concurrencer les couleurs de résultat.
<table>
<tr>
<th>  
Famille
</th>
<th>  
Actions
</th>
<th>  
Traitement
</th>
</tr>
<tr>
<td>  
Mise en jeu
</td>
<td>  
SERVICE
</td>
<td>  
Accent violet
</td>
</tr>
<tr>
<td>  
Construction
</td>
<td>  
RÉCEPTION, PASSE
</td>
<td>  
Accent cyan
</td>
</tr>
<tr>
<td>  
Offensive
</td>
<td>  
ATTAQUE, BLOCK
</td>
<td>  
Accent ambre fin, sans grand aplat orange
</td>
</tr>
<tr>
<td>  
Défensive
</td>
<td>  
DÉFENSE, RELANCE
</td>
<td>  
Accent bleu acier
</td>
</tr>
</table>


#### Règle impérative
  
**ATTAQUE et BLOCK ne doivent pas apparaître sous forme de grands carrés orange.** Utiliser un fond bleu marine commun aux actions, avec un liseré supérieur, une bordure ou une légère lueur ambre.

### 2.6 Couleurs des rôles

<table>
<tr>
<th>  
Rôle
</th>
<th>  
Code
</th>
<th>  
Couleur
</th>
</tr>
<tr>
<td>  
Opposite
</td>
<td>  
OPP
</td>
<td>  
Bleu pastel
</td>
</tr>
<tr>
<td>  
Middle Blocker
</td>
<td>  
MB
</td>
<td>  
Vert pastel
</td>
</tr>
<tr>
<td>  
Outside Hitter
</td>
<td>  
OH
</td>
<td>  
Rouge/rose pastel
</td>
</tr>
<tr>
<td>  
Libero
</td>
<td>  
LIB
</td>
<td>  
Gris pastel
</td>
</tr>
<tr>
<td>  
Setter
</td>
<td>  
SET
</td>
<td>  
Jaune pastel
</td>
</tr>
<tr>
<td>  
Adversaire
</td>
<td>  
A
</td>
<td>  
Noir, lettre blanche
</td>
</tr>
</table>

  
Le signe **A** doit apparaître dans un cercle noir sous la sélection des six joueurs, avec le libellé **Adversaire**.

### 2.7 Actions préférentielles par rôle
  
Les actions préférentielles sont mises en évidence, mais ne doivent être ni déplacées ni automatiquement sélectionnées.
<table>
<tr>
<th>  
Rôle
</th>
<th>  
Actions mises en avant
</th>
</tr>
<tr>
<td>  
OPP
</td>
<td>  
SERVICE, ATTAQUE, BLOCK
</td>
</tr>
<tr>
<td>  
MB
</td>
<td>  
SERVICE, ATTAQUE, BLOCK
</td>
</tr>
<tr>
<td>  
OH
</td>
<td>  
SERVICE, RÉCEPTION, ATTAQUE
</td>
</tr>
<tr>
<td>  
LIB
</td>
<td>  
RÉCEPTION, DÉFENSE, RELANCE
</td>
</tr>
<tr>
<td>  
SET
</td>
<td>  
SERVICE, PASSE, DÉFENSE
</td>
</tr>
<tr>
<td>  
Adversaire
</td>
<td>  
Toutes les actions accessibles avec importance visuelle uniforme
</td>
</tr>
</table>


#### Traitement visuel
- bouton préférentiel : luminosité renforcée, bordure cyan ou familiale plus nette, légère lueur ;
- bouton secondaire : toujours lisible et utilisable, contraste réduit modérément ;
- bouton sélectionné : contour blanc clair ;
- aucune étoile obligatoire ;
- aucun changement de taille ;
- aucun changement de position ;
- aucune action ne doit être désactivée sur la seule base du poste.

### 2.8 Changement de joueur
  
La commande **Changer de joueur** doit être disponible à toutes les étapes pertinentes :
- sélection du joueur : un autre joueur ou **A** peut être choisi directement ;
- sélection de l’action : bouton **Changer de joueur** visible ;
- sélection du résultat : bouton **Changer de joueur** visible ;
- en FLOW : un autre joueur peut être touché directement à tout moment avant l’enregistrement.  
Le changement de joueur :
- annule la sélection intermédiaire courante ;
- ne crée aucun événement ;
- ne modifie pas le score ;
- ne modifie pas l’historique ;
- revient à l’étape de sélection d’auteur.

### 2.9 Score dynamique
  
Le score est affiché en permanence dans le header :HOME 18 – 16 AWAY     S2  
Le composant de saisie ne doit pas contenir une logique de score indépendante de VolleyLive. Il doit demander au moteur de match d’évaluer l’événement.

#### API logique recommandée
const scoreImpact = scoringEngine.evaluate(event, matchState);
const nextState = scoringEngine.apply(scoreImpact, matchState);

#### Comportement minimal attendu
- événement donnant un point à HOME : incrémenter HOME ;
- événement donnant un point à AWAY : incrémenter AWAY ;
- événement sans impact direct : score inchangé ;
- comportement inversé lorsque l’auteur est AWAY ;
- changement de set géré par le moteur de match, pas par l’UI ;
- le score affiché doit provenir de l’état réel du match après application.

#### Règle de démonstration uniquement
  
Une maquette autonome peut utiliser temporairement :
- SERVICE, ATTAQUE ou BLOCK positif : point à l’auteur ;
- ERREUR : point à l’équipe opposée ;
- NEUTRE : score inchangé.  
Cette approximation ne doit pas être conservée dans la version de production si le moteur réel utilise une logique plus complète.

### 2.10 Historique et annulation
  
Le pied d’écran affiche au minimum le dernier événement :Dernière : #3 · PASSE +  
Pour l’adversaire :Dernière : A · ATTAQUE ×  
Le bouton **Annuler** doit effectuer une transaction atomique :
- supprimer le dernier événement ;
- restaurer scoreBefore ;
- restaurer l’état du set, du service et de la rotation si ces données ont changé ;
- actualiser les statistiques dérivées ;
- revenir à l’état initial du mode de saisie.

## 3. Mode FOCUS

### 3.1 Finalité
  
FOCUS est le mode le plus guidé. Une seule question est présentée à la fois. Il est recommandé pour :
- les nouveaux utilisateurs ;
- les smartphones ;
- les contextes où la prévention des erreurs prime sur la vitesse maximale.

### 3.2 Structure persistante
  
Les éléments suivants restent affichés sur les trois écrans :
- marque VolleyLive ;
- score ;
- numéro du set ;
- bouton menu ;
- historique du dernier événement ;
- bouton Annuler.  
Seule la zone centrale change.

### 3.3 Écran 1 — Qui joue ?

#### Contenu
- titre **Qui joue ?** ;
- panneau cyan contenant six tuiles de joueurs en grille 3 × 2 ;
- chaque tuile affiche le numéro et le rôle ;
- couleurs pastel par rôle ;
- cercle noir **A** sous les joueurs ;
- libellé **Adversaire** sous le cercle.

#### Interaction
- toucher une tuile sélectionne le joueur et ouvre l’écran Action ;
- toucher **A** sélectionne authorSide = AWAY et ouvre l’écran Action ;
- aucune confirmation intermédiaire.

### 3.4 Écran 2 — Quelle action ?

#### Contenu
- puce compacte #8 · OH ou A · ADVERSAIRE ;
- bouton **Changer de joueur** ;
- titre **Quelle action ?** ;
- grille fixe de sept actions ;
- actions préférentielles éclairées selon le rôle ;
- aucune tuile joueur ni aucun terrain.

#### Interaction
- toucher une action ouvre l’écran Résultat ;
- **Changer de joueur** revient à l’écran 1 ;
- aucune action n’est présélectionnée automatiquement.

### 3.5 Écran 3 — Quel résultat ?

#### Contenu
- puce compacte #8 · ATTAQUE ou A · ATTAQUE ;
- bouton **Retour** ;
- bouton **Changer de joueur** ;
- titre **Quel résultat ?** ;
- trois boutons pleine largeur : POSITIF, NEUTRE, ERREUR ;
- mention **Enregistrement immédiat**.

#### Interaction
- **Retour** revient à l’écran Action en conservant l’auteur ;
- **Changer de joueur** revient à l’écran 1 et efface l’action sélectionnée ;
- toucher un résultat enregistre immédiatement l’événement ;
- après succès, retour automatique à l’écran 1.

### 3.6 Machine d’état FOCUS
PLAYER\_SELECTION
  ├─ selectPlayer → ACTION\_SELECTION
  └─ selectOpponent → ACTION\_SELECTION
ACTION\_SELECTION
  ├─ selectAction → RESULT\_SELECTION
  └─ changePlayer → PLAYER\_SELECTION
RESULT\_SELECTION
  ├─ back → ACTION\_SELECTION
  ├─ changePlayer → PLAYER\_SELECTION
  └─ selectResult → COMMIT → PLAYER\_SELECTION

## 4. Mode SPEED+

### 4.1 Finalité
  
SPEED+ conserve le contexte spatial du terrain et remplace uniquement le panneau de commande. Il est recommandé pour :
- les utilisateurs réguliers ;
- la saisie intensive ;
- les tablettes et téléphones suffisamment larges ;
- les opérateurs qui associent rapidement joueur et position sur le terrain.

### 4.2 Structure
  
L’écran affiche en permanence :
- header et score ;
- mini-terrain orange ;
- six marqueurs de joueurs aux positions 3 × 2 ;
- ligne pointillée avant/arrière ;
- cercle noir **A** sous le terrain ;
- panneau contextuel ;
- historique et Annuler.  
Aucun filet ne doit être affiché.

### 4.3 État initial
  
Le panneau contextuel invite à sélectionner un joueur ou **A**.Touchez un joueur ou A pour saisir une action

### 4.4 Après sélection de l’auteur
- le joueur sélectionné reçoit un contour blanc ;
- **A** reçoit le même traitement lorsqu’il est sélectionné ;
- le terrain reste visible ;
- le panneau contextuel affiche la grille fixe des actions ;
- les actions préférentielles sont renforcées ;
- un bouton **Changer de joueur** est affiché.

### 4.5 Après sélection de l’action
- le terrain reste visible ;
- le joueur ou **A** reste identifié ;
- le panneau contextuel remplace les actions par POSITIF, NEUTRE et ERREUR ;
- les boutons occupent la même zone générale que la grille d’actions ;
- **Retour** permet de revoir les actions ;
- **Changer de joueur** reste disponible.

### 4.6 Enregistrement
  
Après le résultat :
- l’événement est créé ;
- le moteur de score est appelé ;
- le score est actualisé ;
- l’historique est actualisé ;
- un feedback court est affiché, par exemple ✓ #8 · ATTAQUE + ;
- la sélection est réinitialisée.  
Le feedback ne doit pas bloquer la prochaine saisie.

### 4.7 Machine d’état SPEED+
IDLE\_WITH\_COURT
  └─ selectAuthor → COURT\_WITH\_ACTIONS
COURT\_WITH\_ACTIONS
  ├─ selectOtherAuthor → COURT\_WITH\_ACTIONS
  ├─ selectAction → COURT\_WITH\_RESULTS
  └─ changePlayer → IDLE\_WITH\_COURT
COURT\_WITH\_RESULTS
  ├─ back → COURT\_WITH\_ACTIONS
  ├─ changePlayer → IDLE\_WITH\_COURT
  └─ selectResult → COMMIT → IDLE\_WITH\_COURT

### 4.8 Gestes experts
  
Les gestes de glissement ne font pas partie du périmètre initial obligatoire. Ils peuvent être ajoutés ultérieurement derrière une option **Gestes experts**, après mesure du taux d’erreur.

## 5. Mode FLOW

### 5.1 Finalité
  
FLOW montre simultanément toutes les étapes. Il vise la vitesse maximale et la mémoire musculaire. Il est recommandé pour :
- les utilisateurs expérimentés ;
- les tablettes en paysage ;
- les écrans larges ;
- les opérateurs souhaitant éviter tout changement d’écran.

### 5.2 Organisation
  
Les trois blocs sont visibles sur un même axe horizontal :JOUEUR \| ACTION \| RÉSULTAT  
Les centres verticaux des trois blocs doivent être alignés, même si leurs contenus ont des hauteurs différentes.  
Répartition indicative sur écran large :
- Joueur : 30 % ;
- Action : 45 % ;
- Résultat : 25 %.  
Sur écran étroit, les blocs peuvent s’empiler verticalement sans changer l’ordre du parcours.

### 5.3 Bloc Joueur
- mini-terrain orange ;
- six marqueurs 3 × 2 ;
- ligne pointillée avant/arrière ;
- cercle noir **A** sous le mini-terrain ;
- couleurs pastel par rôle ;
- sélection par contour blanc.  
Le bouton **Changer de joueur** peut prendre la forme d’un accès direct aux autres marqueurs : toucher un autre joueur ou **A** remplace immédiatement la sélection avant validation.

### 5.4 Bloc Action
- grille fixe identique à FOCUS ;
- fonds bleu marine ;
- accents de couleur par famille ;
- aucun grand carré orange ;
- actions préférentielles renforcées après sélection de l’auteur ;
- actions secondaires toujours accessibles ;
- action sélectionnée entourée de blanc.  
Avant la sélection d’un auteur, toutes les actions restent visibles avec une saturation intermédiaire, mais ne déclenchent aucune sélection valide.

### 5.5 Bloc Résultat
  
Trois boutons verticaux :
- POSITIF ;
- NEUTRE ;
- ERREUR.  
Avant la sélection d’un auteur et d’une action :
- boutons visibles ;
- état atténué ;
- interaction désactivée.  
Après sélection de l’action :
- boutons pleinement actifs ;
- toucher un résultat enregistre immédiatement l’événement.

### 5.6 Parcours
Tap joueur ou A → Tap action → Tap résultat  
Aucun élément ne change de position entre les étapes.  
Après enregistrement :
- feedback visuel de 300 à 650 ms maximum ;
- score actualisé ;
- historique actualisé ;
- auteur et action réinitialisés ;
- interface immédiatement disponible.

### 5.7 Machine d’état FLOW
EMPTY
  └─ selectAuthor → AUTHOR\_SELECTED
AUTHOR\_SELECTED
  ├─ selectOtherAuthor → AUTHOR\_SELECTED
  ├─ selectAction → ACTION\_SELECTED
  └─ clear → EMPTY
ACTION\_SELECTED
  ├─ selectOtherAuthor → AUTHOR\_SELECTED
  ├─ selectOtherAction → ACTION\_SELECTED
  ├─ selectResult → COMMIT → EMPTY
  └─ clear → EMPTY

## 6. Options utilisateur
  
Ajouter dans les options :OPTIONS
└── Saisie runtime
    ├── Mode de saisie
    │   ├── FOCUS
    │   ├── SPEED+
    │   └── FLOW
    ├── Mettre en avant les actions par poste
    │   ├── Activé
    │   └── Désactivé
    └── Feedback haptique
        ├── Activé
        └── Désactivé  
Le mode sélectionné doit être persisté dans les préférences locales de l’utilisateur, sans modifier le format du match.  
Valeur par défaut recommandée :
- téléphone : FOCUS ;
- tablette : SPEED+ ;
- ne jamais changer automatiquement le mode sans consentement.

## 7. Architecture recommandée

### 7.1 Composants communs
RuntimeInputController
├── ScoreHeader
├── PlayerSelector
├── OpponentSelector
├── FixedActionGrid
├── ResultSelector
├── LastEventBar
├── UndoAction
├── FocusInputLayout
├── SpeedInputLayout
└── FlowInputLayout

### 7.2 État partagé
interface RuntimeInputState {
  mode: 'FOCUS' \| 'SPEED' \| 'FLOW';
  selectedSide: 'HOME' \| 'AWAY' \| null;
  selectedPlayerId: string \| null;
  selectedRole: PlayerRole \| 'OPPONENT' \| null;
  selectedAction: MatchAction \| null;
  selectedStatus: ActionStatus \| null;
  pending: boolean;
  lastCommittedEventId: string \| null;
}

### 7.3 Séparation des responsabilités
- l’UI collecte auteur, action et résultat ;
- le contrôleur valide la cohérence ;
- le moteur d’événements crée l’événement canonique ;
- le moteur de score calcule l’impact ;
- le store de match applique la transaction ;
- les statistiques se recalculent à partir de l’historique réel ;
- le mode d’interface n’influence jamais les données métier.

## 8. Validation et erreurs

### 8.1 Garde-fous
- impossible d’enregistrer sans auteur ;
- impossible d’enregistrer sans action ;
- impossible d’enregistrer sans résultat ;
- double tap rapide sur un résultat ne doit créer qu’un événement ;
- verrou transactionnel pendant l’enregistrement ;
- en cas d’échec, conserver la sélection et afficher une erreur non bloquante ;
- ne pas modifier le score si l’événement n’est pas enregistré.

### 8.2 Idempotence
  
Chaque événement doit recevoir un identifiant unique avant l’écriture. Une nouvelle tentative avec le même identifiant ne doit pas dupliquer l’événement ni le point.

### 8.3 Conflits
  
Si le match est modifié simultanément :
- détecter la différence de version ;
- recharger l’état courant ;
- réévaluer l’événement ;
- appliquer ou demander une résolution selon la politique VolleyLive.

## 9. Accessibilité et ergonomie
- cible tactile minimale : **48 × 48 px** ;
- cible recommandée en live : **64 px ou plus** ;
- contraste conforme à WCAG 2.2 AA lorsque possible ;
- ne pas transmettre une information uniquement par la couleur ;
- ajouter libellé, contour et état sélectionné ;
- focus clavier visible ;
- textes accessibles aux lecteurs d’écran ;
- feedback haptique bref facultatif après enregistrement ;
- absence d’animation bloquante ;
- transition FOCUS recommandée : **80 à 120 ms maximum** ;
- mise à jour visuelle après tap : objectif **moins de 100 ms**.

## 10. Responsive design

### Téléphone portrait
- FOCUS recommandé ;
- SPEED+ autorisé avec terrain compact ;
- FLOW empilé verticalement si la largeur est insuffisante.

### Tablette paysage
- FLOW affiche les trois blocs sur un même axe ;
- SPEED+ conserve terrain et panneau côte à côte ou superposés selon la hauteur ;
- FOCUS conserve un panneau central compact.

### Seuil indicatif
@media (max-width: 620px) {
  /\* FLOW passe de trois colonnes à une pile verticale \*/
}  
Le seuil final doit être déterminé par la largeur réellement disponible et la taille minimale des cibles, plutôt que par le type d’appareil.

## 11. Instrumentation UX recommandée
  
Mesurer localement, sans contenu personnel inutile :
- durée entre sélection auteur et enregistrement ;
- nombre de retours ;
- nombre de changements de joueur ;
- nombre d’annulations ;
- taux de taps invalides ;
- mode utilisé ;
- taille d’écran ;
- action sélectionnée parmi les préférentielles ou secondaires.  
Ces données doivent permettre de comparer les modes sur :
- rapidité médiane ;
- erreurs par 100 événements ;
- annulations par set ;
- temps d’apprentissage ;
- préférence utilisateur.

## 12. Tests d’acceptation

### Scénario A — Action locale positive
Étant donné un score HOME 18 - 16 AWAY
Et le joueur #8 OH sélectionné
Quand l’utilisateur choisit ATTAQUE puis POSITIF
Alors un événement HOME/#8/ATTACK/POSITIVE est créé
Et le moteur de score est exécuté
Et le score affiché correspond au nouvel état du match
Et l’interface revient à la sélection de l’auteur

### Scénario B — Action adverse
Étant donné que le bouton A est sélectionné
Quand l’utilisateur choisit SERVICE puis POSITIF
Alors l’auteur de l’événement est AWAY
Et aucun joueur local n’est associé
Et le score est recalculé du point de vue de l’adversaire

### Scénario C — Changement de joueur
Étant donné que #8 puis ATTAQUE sont sélectionnés
Quand l’utilisateur choisit Changer de joueur
Alors aucun événement n’est créé
Et le score reste inchangé
Et l’interface revient à la sélection de l’auteur

### Scénario D — Annulation
Étant donné qu’un événement vient d’être enregistré
Quand l’utilisateur choisit Annuler
Alors le dernier événement est supprimé
Et le score précédent est restauré
Et les statistiques dérivées sont recalculées

### Scénario E — Actions préférentielles
Étant donné que #6 LIB est sélectionné
Alors RÉCEPTION, DÉFENSE et RELANCE sont renforcées visuellement
Et toutes les autres actions restent accessibles
Et aucune action ne change de position
Et aucune action n’est automatiquement sélectionnée

### Scénario F — Cohérence inter-modes
Étant donné les modes FOCUS, SPEED+ et FLOW
Quand la même séquence auteur/action/résultat est saisie dans chaque mode
Alors les trois événements métier produits sont équivalents
À l’exception de la propriété technique inputMode

## 13. Critères de validation finale
  
La fonctionnalité est validée lorsque :
- les trois modes sont sélectionnables dans les options ;
- FOCUS suit trois écrans distincts ;
- SPEED+ conserve le terrain visible ;
- FLOW affiche les trois blocs centrés sur le même axe en largeur suffisante ;
- le bouton noir **A** est disponible dans les trois modes ;
- la grille d’actions est identique et fixe dans les trois modes ;
- les préférences par rôle ne déplacent ni ne présélectionnent aucune action ;
- le changement de joueur est disponible à chaque étape ;
- le score provient du moteur réel de match ;
- Annuler restaure événement et score ;
- aucune grande tuile orange n’est utilisée pour ATTAQUE ou BLOCK ;
- les trois modes produisent le même format JSON ;
- l’interface reste utilisable au toucher sur téléphone et tablette ;
- aucun indicateur ne dépend de données de démonstration en production.

### 14. Décision produit recommandée
- **FOCUS** : mode recommandé pour découvrir l’application et pour téléphone ;
- **SPEED+** : mode recommandé pour la saisie régulière en match ;
- **FLOW** : mode expert pour tablette et mémoire musculaire ;
- conserver les trois modes sur un moteur métier commun ;
- utiliser FOCUS comme référence visuelle compacte ;
- conserver la grille fixe et les mêmes codes couleur dans les trois modes.