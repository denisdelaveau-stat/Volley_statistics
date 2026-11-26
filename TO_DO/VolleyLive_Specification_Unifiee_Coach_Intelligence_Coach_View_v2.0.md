# VolleyLive — Spécification unifiée Coach Intelligence & Coach View

## Version consolidée 2.0

**Statut :** Spécification validée pour implémentation future  
**Produit :** VolleyLive  
**Périmètre :** Live Coach Intelligence, Coach View Configurator et profils Coach View  
**Type :** Spécification fonctionnelle, UX, architecture et critères d'acceptation  
**Priorité globale :** Haute  
**Source de vérité :** journal chronologique des actions du match  

---

## 1. Objet du document

Ce document constitue la **spécification unique de référence** issue des décisions validées dans la discussion. Il remplace les fichiers séparés consacrés à Live Coach Intelligence et au Coach View Configurator.

Il regroupe deux ensembles complémentaires :

1. **Live Coach Intelligence**, qui transforme les événements du match en KPI, tendances, patterns et insights contextualisés ;
2. **Coach View Configurator**, qui permet au coach de sélectionner ses besoins, leur importance, les interfaces à intégrer, leur ordre et les profils réutilisables.

Le principe produit commun est :

> **Le coach choisit ce qui compte. VolleyLive détecte ce qui mérite son attention et organise la meilleure manière de le voir.**

---

## 2. Décisions produit communes et obligatoires

- Le journal d'actions du match est la **seule source de vérité**.
- Les KPI et insights sont dérivés des événements, pas stockés comme une deuxième vérité métier.
- Aucun chiffre fictif ne doit être présenté comme une donnée réelle.
- Sans données, les compteurs calculables affichent `0` et les valeurs non calculables affichent `NA` en gris.
- Live Coach Intelligence signale des faits, tendances et corrélations, mais ne prend pas la décision à la place du coach.
- Aucune corrélation ne doit être formulée comme une causalité certaine.
- Les fonctions sont intégrées à `COACH VIEW`, `MATCH REPORTS` et à la bibliothèque de matchs selon leur usage.
- Aucune nouvelle section `ADVANCED STATISTICS` ne doit être créée.
- Les vues sont limitées à l'équipe de l'utilisateur lorsqu'elles comparent les joueurs ou les postes.
- Changer d'interface ou de profil en runtime ne doit ni recharger le match, ni interrompre la capture, ni modifier le journal d'actions.
- Masquer une interface ne désactive jamais son moteur analytique.
- Le score reste visible dans l'en-tête commun et ne dépend pas d'un onglet obligatoire.
- Sur tablette, les cibles tactiles doivent mesurer au moins `44 × 44 px`.

---

## 3. Architecture produit unifiée

```text
MATCH EVENT LOG
      │
      ├── KPI ENGINE
      ├── WINDOW ENGINE
      ├── PATTERN ENGINE
      ├── INSIGHT ENGINE
      │
      ├── COACH NEEDS CATALOG
      ├── NEED-TO-MODULE MAPPING
      ├── RECOMMENDATION ENGINE
      ├── TAB PRIORITY ENGINE
      ├── PROFILE STORE
      │
      └── COACH VIEW SHELL
             ├── common score header
             ├── visible tabs
             ├── MORE menu
             ├── active module
             └── runtime profile selector
```

---

# PARTIE I — LIVE COACH INTELLIGENCE

### 1. Objectif

Faire évoluer VolleyLive d'un outil de capture et de consultation statistique vers un assistant d'analyse de match en temps réel.

Le principe est simple :

> **Ne pas seulement afficher les statistiques. Détecter automatiquement ce qui mérite l'attention du coach maintenant.**

Le système doit exploiter exclusivement les données réelles du match, avec le journal chronologique des actions comme **source de vérité**. Aucune donnée de démonstration ne doit être présentée comme une observation réelle.

Cette fonctionnalité doit s'intégrer principalement dans **COACH VIEW**, sans créer une nouvelle section `ADVANCED STATISTICS`.

---

### 2. Vision produit

Chaîne de valeur cible :

`CAPTURE → MATCH EVENT LOG → LIVE KPI → CONTEXT → TREND DETECTION → COACH INSIGHT`

VolleyLive doit répondre à quatre questions pendant le match :

1. **Que se passe-t-il ?**
2. **Qu'est-ce qui vient de changer ?**
3. **Où se situe le problème ou l'opportunité ?**
4. **Quels éléments factuels expliquent cette observation ?**

Le système ne doit pas prendre la décision à la place du coach. Il doit attirer son attention sur des faits significatifs.

---

### 3. Principes UX

#### 3.1 Synthèse avant détail

COACH VIEW ne doit jamais devenir un cockpit saturé de KPI.

Règles :

- maximum **3 insights actifs** visibles simultanément ;
- priorité aux changements récents ;
- chaque insight doit être compréhensible en moins de 3 secondes ;
- accès au détail sur sélection ;
- aucun changement de navigation forcé lorsqu'un insight apparaît ;
- couleurs cohérentes avec le thème Coach View.

#### 3.2 Niveaux d'insight

| Niveau | Couleur | Usage |
|---|---|---|
| Critical | Rouge | Dégradation forte ayant un impact immédiat |
| Watch | Orange | Tendance émergente à surveiller |
| Opportunity | Vert | Faiblesse adverse ou tendance favorable exploitable |

#### 3.3 Données indisponibles

- valeur calculable mais sans événement : `0` ;
- valeur non calculable : `NA` ;
- `NA` affiché en gris ;
- ne jamais inventer une valeur pour compléter une vue.

---

## 4. Live Coach Assistant

### 4.1 Description

Le **Live Coach Assistant** est le moteur central. Il analyse en continu les événements du match et produit des observations courtes, explicables et contextualisées.

Exemple :

> **ROTATION R4 — WATCH**  
> Side-out : 42 % sur les 6 derniers passages.  
> Réception positive : 38 %.  
> #7 a reçu 5 des 7 derniers services adverses.

### 4.2 Structure d'un insight

```text
Insight
 ├─ id
 ├─ timestamp
 ├─ severity
 ├─ category
 ├─ team
 ├─ playerIds[]
 ├─ rotation
 ├─ title
 ├─ summary
 ├─ evidence[]
 ├─ comparisonWindow
 ├─ confidence
 └─ sourceEventIds[]
```

`sourceEventIds` est obligatoire afin que chaque insight soit traçable jusqu'aux actions qui l'ont produit.

### 4.3 Cycle de vie

Un insight peut avoir les états :

`NEW → ACTIVE → ACKNOWLEDGED → RESOLVED → ARCHIVED`

Un insight résolu ne doit plus occuper un emplacement prioritaire mais doit rester disponible dans la timeline du match.

---

## 5. Live Momentum Detector

### 5.1 Objectif

Détecter automatiquement les séries significatives sans obliger le coach à interpréter une simple courbe de momentum.

### 5.2 Détections initiales

#### Negative Run

Déclenchement configurable, valeur initiale recommandée :

- **3 points consécutifs perdus : Watch** ;
- **4 points ou plus consécutifs perdus : Critical**.

Le moteur doit rechercher les facteurs communs de la série :

- qualité de réception ;
- rotation ;
- serveur adverse ;
- joueur ciblé ;
- destination de passe ;
- efficacité d'attaque ;
- erreurs directes.

#### Positive Run

Même principe pour une série favorable. Une série positive n'est remontée que si une caractéristique exploitable est détectée.

#### Breakpoint Opportunity

Détecter une faiblesse récurrente adverse sur la rotation ou la fenêtre récente.

### 5.3 Fenêtres

Le moteur doit supporter :

- match entier ;
- set courant ;
- rotation courante ;
- N derniers rallys ;
- N derniers passages dans une rotation ;
- depuis timeout ;
- depuis substitution.

Le nombre `N` doit être configurable.

---

## 6. Serve Target Detection

### 6.1 Objectif

Identifier lorsqu'un joueur de VolleyLive est ciblé de manière inhabituelle au service adverse.

### 6.2 Métriques

Pour chaque receveur :

- nombre de services reçus ;
- part des services adverses reçus ;
- réception positive ;
- réception parfaite ;
- erreurs de réception ;
- évolution sur fenêtre récente.

### 6.3 Règle initiale proposée

Générer `WATCH` lorsqu'un joueur reçoit :

- au moins **5 services** sur une fenêtre de 10 services adverses ;
- et au moins **50 %** des services observés.

Le seuil doit rester configurable et ne doit être évalué qu'avec un échantillon minimum suffisant.

Exemple :

> **SERVE TARGET DETECTED**  
> #12 reçoit 7 des 10 derniers services adverses.  
> Réception positive #12 : 31 %.  
> Réception positive équipe : 54 %.

---

## 7. Rotation Intelligence

### 7.1 Objectif

Construire automatiquement le profil de chacune des six rotations et identifier leurs forces, faiblesses et évolutions.

### 7.2 KPI minimum

Pour R1 à R6 :

- side-out % ;
- breakpoint % ;
- réception positive % ;
- réception parfaite % ;
- attack efficiency ;
- points gagnés/perdus ;
- fautes directes ;
- distribution de passe ;
- nombre d'échantillons.

### 7.3 Explication causale prudente

Le système peut présenter une chaîne factuelle de corrélations observées mais ne doit pas affirmer une causalité non démontrée.

Exemple :

```text
R5 faible
 ↓
Réception positive en baisse
 ↓
Plus de passes hors système
 ↓
Concentration des attaques vers OH4
 ↓
Efficacité d'attaque plus faible
```

L'interface doit employer des formulations comme **« associé à »**, **« observé avec »** ou **« sur cette séquence »** plutôt que déclarer une cause certaine.

### 7.4 Comparaison

Comparer une rotation avec :

- les autres rotations du même match ;
- sa performance dans le set courant ;
- sa performance cumulée dans le match.

Une future extension pourra comparer plusieurs matchs, mais elle n'est pas nécessaire au MVP.

---

## 8. Rally DNA

### 8.1 Objectif

Transformer les événements du journal en séquences tactiques structurées permettant de rechercher des patterns.

Exemple :

```text
SERVE
→ RECEPTION ++
→ SET OH4
→ ATTACK +
→ POINT
```

### 8.2 Modèle

Chaque rally doit contenir :

- équipe au service ;
- rotation ;
- ordre chronologique des actions ;
- joueurs ;
- poste des joueurs ;
- qualité/résultat de chaque action ;
- résultat final du rally ;
- score avant/après.

### 8.3 Patterns recherchés

Première version :

- réception → destination de passe ;
- qualité de réception → efficacité d'attaque ;
- rotation → destination de passe ;
- destination de passe → résultat ;
- serveur → receveur ;
- joueur ciblé → qualité de réception ;
- type de situation → résultat du rally.

### 8.4 Seuil d'échantillon

Un pattern ne doit pas être présenté comme significatif avec un échantillon trop faible.

Valeur initiale recommandée :

- `< 3` occurrences : ne pas générer d'insight ;
- `3–5` : information faible, affichable uniquement en détail ;
- `>= 6` : éligible à un insight si l'écart est suffisamment important.

Ces valeurs doivent être configurables.

---

## 9. Position Compare Live

### 9.1 Sélecteur

COACH VIEW doit offrir :

`ALL | OH | MB | OPP | SETTER | LIBERO`

La comparaison concerne **uniquement l'équipe de l'utilisateur**.

### 9.2 KPI par poste

Les KPI doivent rester spécifiques au poste.

#### OH

- attack efficiency ;
- kills ;
- errors ;
- réception positive/perfect ;
- side-out contribution ;
- tendance récente.

#### MB

- attack efficiency ;
- kill % ;
- blocks / block touches ;
- quick attack usage ;
- tendance récente.

#### OPP

- attack efficiency ;
- kills ;
- errors ;
- breakpoint contribution ;
- tendance récente.

#### Setter

- distribution par zone/poste ;
- side-out après passe ;
- distribution sous réception positive/négative ;
- tendance récente.

#### Libero

- réception positive ;
- réception parfaite ;
- erreurs ;
- digs si disponibles dans le modèle ;
- tendance récente.

### 9.3 Trend

Chaque joueur peut recevoir un indicateur :

`↑ UP | → STABLE | ↓ DOWN`

Il doit être calculé par comparaison d'une fenêtre récente avec une référence du set ou du match. Aucun trend ne doit être affiché sous le nombre minimal d'échantillons configuré.

---

## 10. Since Timeout / Since Substitution

### 10.1 Objectif

Permettre de mesurer immédiatement ce qui s'est produit après un événement tactique identifiable.

### 10.2 Timeout

Après chaque timeout, créer automatiquement une fenêtre `SINCE_TIMEOUT`.

Afficher notamment :

- score depuis timeout ;
- points gagnés/perdus ;
- side-out ;
- breakpoint ;
- attack efficiency ;
- réception positive ;
- série en cours.

### 10.3 Substitution

Après une substitution, créer une fenêtre :

`SINCE_SUBSTITUTION(playerOut, playerIn)`

Le contexte doit rester associé à la substitution concernée même si d'autres changements interviennent ensuite.

### 10.4 Pas d'interprétation abusive

VolleyLive indique **ce qui s'est passé depuis** la décision. Il ne prétend pas que la décision est la cause du résultat.

---

## 11. Intelligent Alerts

### 11.1 Règles

Le moteur d'alertes utilise trois niveaux :

- `CRITICAL` ;
- `WATCH` ;
- `OPPORTUNITY`.

Chaque règle doit disposer de :

```text
ruleId
metric
scope
minimumSample
threshold
comparisonType
severity
cooldown
enabled
```

### 11.2 Anti-spam

Deux mécanismes sont indispensables :

#### Cooldown

Une même règle ne doit pas générer une nouvelle alerte à chaque rally.

Valeur initiale recommandée : **3 rallys** avant réévaluation, sauf aggravation de niveau.

#### Hysteresis

Le seuil de sortie d'une alerte doit être différent du seuil d'entrée afin d'éviter les oscillations.

Exemple :

- entrée en Watch : side-out `< 40 %` ;
- sortie : side-out `>= 47 %` avec échantillon suffisant.

---

## 12. Architecture fonctionnelle

```text
MATCH EVENT LOG
      │
      ├── KPI ENGINE
      │
      ├── WINDOW ENGINE
      │      ├─ recent rallies
      │      ├─ rotation
      │      ├─ since timeout
      │      └─ since substitution
      │
      ├── PATTERN ENGINE
      │      ├─ Rally DNA
      │      ├─ Serve Target
      │      └─ Rotation Intelligence
      │
      ├── INSIGHT ENGINE
      │
      └── COACH VIEW
             ├─ Insights
             ├─ Position Compare
             ├─ Rotation Detail
             └─ Timeline
```

Les KPI doivent être **dérivés du journal d'actions**, et non stockés comme seconde source de vérité.

---

## 13. Exigences temps réel

Après validation d'une action de capture :

1. ajout au journal ;
2. mise à jour du score ;
3. recalcul incrémental des KPI concernés ;
4. mise à jour des fenêtres ;
5. réévaluation des règles impactées ;
6. mise à jour de Coach View.

#### Cible UX

L'insight doit sembler instantané après la saisie. Cible recommandée pour le traitement local : **< 250 ms** sur l'appareil cible pour le recalcul d'un événement normal.

Le moteur doit privilégier le recalcul incrémental plutôt qu'un recalcul complet du match après chaque action.

---

## 14. Correction et annulation d'une action

Point critique : le moteur doit supporter la correction de la capture.

Si une action historique est modifiée ou supprimée :

- score recalculé si nécessaire ;
- KPI dépendants invalidés puis recalculés ;
- patterns recalculés ;
- insights devenus faux supprimés ou résolus ;
- fenêtres temporelles conservées avec cohérence chronologique.

Aucun insight ne doit rester affiché s'il repose sur des événements annulés.

---

## 15. Configuration

Les seuils analytiques doivent être centralisés dans une configuration et **ne pas être codés en dur dans l'interface**.

Exemple :

```json
{
  "liveCoach": {
    "maxVisibleInsights": 3,
    "negativeRunWatch": 3,
    "negativeRunCritical": 4,
    "serveTargetWindow": 10,
    "serveTargetMinimum": 5,
    "serveTargetRatio": 0.50,
    "alertCooldownRallies": 3,
    "patternMinimumSamples": 6
  }
}
```

Ces paramètres sont des valeurs initiales de développement. Ils devront être validés avec des matchs réels avant stabilisation.

---

## 16. Historique et Match Reports

Les insights générés pendant le match doivent pouvoir être conservés avec le match afin d'être réutilisés dans :

- Coach View ;
- Match Reports ;
- bibliothèque de matchs ;
- analyse post-match.

Le rapport doit distinguer :

- événements bruts ;
- KPI calculés ;
- insights générés pendant le match ;
- insights recalculés ultérieurement si l'algorithme évolue.

---

## 17. Périmètre MVP

### Phase 1 — Fondations

- Window Engine ;
- calcul incrémental ;
- modèle `Insight` ;
- moteur de règles ;
- gestion minimum sample ;
- cooldown/hysteresis ;
- correction/recalcul.

### Phase 2 — Premiers insights

- Negative Run ;
- Serve Target Detection ;
- Rotation Intelligence ;
- Since Timeout ;
- Since Substitution.

### Phase 3 — Analyse avancée

- Rally DNA ;
- détection de patterns ;
- Position Compare Live + tendances ;
- Opportunity detection.

### Phase 4 — Multi-match

- baseline joueur ;
- baseline rotation ;
- comparaison avec matchs précédents ;
- tendances saison.

---

## 18. Hors périmètre initial

Ne pas inclure dans le MVP :

- recommandation automatique de substitution ;
- instruction tactique prescriptive ;
- prédiction du vainqueur ;
- score de performance global artificiel ;
- statistiques basées sur des événements absents du journal ;
- données fictives destinées à remplir l'interface ;
- nouvelle page `ADVANCED STATISTICS`.

---

## 19. Critères d'acceptation globaux

La fonctionnalité est considérée exploitable lorsque :

1. tous les insights sont dérivables du JSON officiel du match ;
2. chaque insight est traçable vers ses événements sources ;
3. une correction d'action entraîne un résultat cohérent ;
4. aucune alerte n'est générée sous le minimum d'échantillons défini ;
5. maximum 3 insights sont simultanément prioritaires dans Coach View ;
6. `NA` est utilisé lorsqu'une métrique ne peut pas être calculée ;
7. le système ne présente jamais une corrélation comme une causalité certaine ;
8. timeout et substitution créent correctement leur fenêtre d'analyse ;
9. les seuils sont configurables ;
10. aucune donnée de démonstration n'est mélangée aux données réelles ;
11. l'analyse fonctionne pendant le match sans modifier le workflow de capture ;
12. les vues par poste restent limitées aux joueurs de l'équipe de l'utilisateur.

---

## 20. Principe directeur

La réussite de cette évolution ne se mesure pas au nombre de statistiques ajoutées.

Elle se mesure à la capacité de VolleyLive à faire apparaître **la bonne information, au bon moment, avec les faits qui permettent au coach de la comprendre**.

> **VolleyLive — Understand the match while it's happening.**

---

# PARTIE II — COACH VIEW CONFIGURATOR ET PROFILS

### 1. Objectif

Créer une interface de configuration permettant au coach de construire sa propre **COACH VIEW** à partir de ses priorités réelles.

Le coach doit pouvoir :

1. sélectionner, dans une checklist, les informations qu'il souhaite suivre ;
2. attribuer un niveau d'importance à chaque besoin sélectionné ;
3. obtenir automatiquement une proposition d'interfaces adaptées ;
4. accepter ou refuser chaque interface proposée ;
5. visualiser l'organisation résultante de COACH VIEW ;
6. ajuster manuellement l'ordre des onglets lorsque nécessaire ;
7. modifier cette configuration sans affecter les données du match.

Le positionnement initial des onglets doit être déterminé automatiquement par le niveau de priorité défini par le coach.

> Le coach ne choisit pas d'abord des écrans techniques. Il indique ce qui est important pour lui, puis VolleyLive lui propose les vues les plus pertinentes.

---

### 2. Principe directeur

Le configurateur suit le parcours :

`BESOINS DU COACH → IMPORTANCE → INTERFACES PROPOSÉES → SÉLECTION → ORDRE DES ONGLETS → APERÇU → VALIDATION`

La configuration ne doit pas imposer une structure unique à tous les coachs. Deux coachs ayant des priorités différentes doivent pouvoir obtenir deux COACH VIEW différentes à partir des mêmes données de match.

Le système reste assisté, mais jamais bloquant :

- VolleyLive **propose** les interfaces ;
- le coach choisit de les intégrer ou non ;
- VolleyLive calcule un ordre recommandé ;
- le coach peut ajuster cet ordre dans les limites définies par la présente spécification.

---

## 3. Accès au configurateur

### 3.1 Point d'entrée

Le configurateur est accessible depuis COACH VIEW via une action explicite :

`CONFIGURE COACH VIEW`

Cette action ouvre une section dédiée de configuration. Elle ne doit pas être confondue avec les paramètres généraux de VolleyLive.

### 3.2 Configuration et runtime

La configuration définit les vues disponibles et leur ordre par défaut. Elle ne doit pas empêcher le passage d'un onglet à l'autre pendant le match.

Le changement d'interface en runtime reste libre :

- aucun retour dans les Settings ;
- aucun rechargement du match ;
- aucune perte du contexte courant ;
- aucune modification du journal d'actions.

### 3.3 Modes d'accès

Le configurateur doit être accessible :

- avant le match ;
- depuis la bibliothèque de matchs ;
- pendant le match, via une action secondaire clairement séparée de la capture ;
- hors match, pour préparer un profil réutilisable.

Pendant un match, toute modification doit être appliquée sans interrompre le calcul des données live.

---

## 4. Parcours utilisateur

Le configurateur est organisé en cinq étapes.

### Étape 1 — Checklist des besoins

Le coach indique les sujets qu'il veut suivre.

### Étape 2 — Niveau d'importance

Chaque sujet sélectionné reçoit une priorité.

### Étape 3 — Interfaces proposées

VolleyLive recommande les interfaces correspondant à la checklist.

### Étape 4 — Composition et ordre

Le coach intègre ou exclut les interfaces proposées puis vérifie l'ordre des onglets.

### Étape 5 — Aperçu et validation

Le coach prévisualise la future COACH VIEW et enregistre la configuration.

Une progression doit être visible :

`1. NEEDS → 2. PRIORITIES → 3. VIEWS → 4. LAYOUT → 5. REVIEW`

---

## 5. Checklist des besoins du coach

### 5.1 Catégories initiales

La checklist doit être organisée par préoccupations métier, et non par nom d'écran.

#### Match Overview

- suivre le score et le set courant ;
- voir les séries de points ;
- suivre le momentum ;
- voir les alertes prioritaires ;
- consulter les derniers événements.

#### Rotations

- comparer les six rotations ;
- identifier la rotation la plus faible ;
- suivre le side-out par rotation ;
- suivre le breakpoint par rotation ;
- analyser la distribution d'attaque par rotation.

#### Players and Positions

- comparer les joueurs d'un même poste ;
- suivre un joueur précis ;
- comparer les OH de l'équipe ;
- comparer les MB de l'équipe ;
- comparer les OPP de l'équipe ;
- analyser le Setter ;
- analyser le Libero ;
- suivre la tendance récente des joueurs.

#### Reception and Serve

- identifier le joueur ciblé au service ;
- suivre la qualité de réception ;
- comparer les receveurs ;
- suivre l'efficacité du service ;
- identifier les zones ou cibles de service efficaces.

#### Attack and Distribution

- suivre l'efficacité d'attaque ;
- analyser les destinations de passe ;
- comparer l'efficacité par poste ;
- suivre les attaques en système et hors système ;
- identifier les schémas d'attaque récurrents.

#### Tactical Decisions

- mesurer la période depuis le dernier timeout ;
- mesurer la période depuis une substitution ;
- suivre l'impact factuel d'un changement ;
- identifier les opportunités tactiques ;
- consulter les patterns Rally DNA.

#### Errors and Discipline

- suivre les fautes directes ;
- identifier l'origine des points perdus ;
- suivre les erreurs par joueur ;
- suivre les erreurs par rotation ;
- distinguer les erreurs de service, réception et attaque.

### 5.2 Sélection

Chaque besoin est représenté par une ligne comportant :

- une case à cocher ;
- un libellé court ;
- une description facultative ;
- le niveau d'importance, activé lorsque la case est cochée.

Un besoin non sélectionné ne doit pas influencer les interfaces proposées.

### 5.3 Recherche et filtrage

Le configurateur doit permettre :

- la recherche textuelle ;
- le filtrage par catégorie ;
- l'affichage des seuls éléments sélectionnés ;
- l'affichage des besoins sans interface disponible.

---

## 6. Niveaux d'importance

### 6.1 Échelle

Chaque besoin sélectionné reçoit l'un des trois niveaux suivants :

| Niveau | Valeur | Signification |
|---|---:|---|
| Essential | 3 | Information centrale, accessible immédiatement |
| Important | 2 | Information utile, accessible rapidement |
| Secondary | 1 | Information complémentaire, disponible sans être prioritaire |

Le niveau par défaut après sélection est `IMPORTANT`.

### 6.2 Règles UX

- Le niveau doit être modifiable directement depuis la checklist.
- Le niveau ne doit pas être représenté seulement par une couleur.
- Un texte et une icône doivent compléter la couleur.
- Le changement de niveau doit recalculer immédiatement les recommandations et l'ordre proposé.

### 6.3 Couleurs recommandées

- `ESSENTIAL` : accent principal Coach View ;
- `IMPORTANT` : bleu secondaire ;
- `SECONDARY` : gris renforcé.

Ces couleurs indiquent une priorité de navigation. Elles ne doivent pas être confondues avec les niveaux d'alerte `CRITICAL`, `WATCH` et `OPPORTUNITY` de Live Coach Intelligence.

---

## 7. Catalogue des interfaces disponibles

Chaque interface disponible dans COACH VIEW doit être enregistrée dans un catalogue déclaratif.

### 7.1 Interfaces initiales

| Identifiant | Onglet proposé | Rôle principal |
|---|---|---|
| `overview` | OVERVIEW | Score, set, dynamique générale et synthèse |
| `live_insights` | INSIGHTS | Alertes et observations Live Coach Assistant |
| `momentum` | MOMENTUM | Séries, évolution et ruptures de dynamique |
| `rotations` | ROTATIONS | Comparaison R1 à R6 et détail de rotation |
| `position_compare` | POSITIONS | Comparaison par poste de l'équipe |
| `player_focus` | PLAYER | Analyse d'un joueur sélectionné |
| `reception` | RECEPTION | Réception, receveurs et ciblage adverse |
| `serve` | SERVE | Efficacité, cibles et séquences de service |
| `attack` | ATTACK | Efficacité et distribution d'attaque |
| `setter_distribution` | DISTRIBUTION | Choix du passeur et répartition des sets |
| `since_event` | SINCE EVENT | Depuis timeout ou substitution |
| `rally_dna` | RALLY DNA | Patterns de construction des rallys |
| `errors` | ERRORS | Fautes et origine des points perdus |
| `timeline` | TIMELINE | Historique chronologique des actions |

Les noms visibles doivent rester courts afin de préserver la lisibilité de la barre d'onglets.

### 7.2 Métadonnées d'une interface

```text
CoachViewModule
 ├─ id
 ├─ label
 ├─ shortLabel
 ├─ description
 ├─ category
 ├─ icon
 ├─ supportedNeeds[]
 ├─ primaryNeeds[]
 ├─ requiredData[]
 ├─ availabilityRule
 ├─ defaultEnabled
 ├─ mandatory
 ├─ minimumWidth
 ├─ compatibleDevices[]
 ├─ componentId
 └─ version
```

### 7.3 Disponibilité

Une interface peut être :

- `AVAILABLE` : toutes les données nécessaires sont prises en charge ;
- `PARTIAL` : une partie des KPI est disponible ;
- `UNAVAILABLE` : le modèle de données actuel ne permet pas de l'alimenter ;
- `FUTURE` : interface prévue mais non implémentée.

Une interface indisponible ne doit pas pouvoir être intégrée. Le configurateur doit expliquer la donnée manquante.

---

## 8. Moteur de recommandation des interfaces

### 8.1 Principe

Chaque besoin sélectionné est associé à une ou plusieurs interfaces du catalogue.

Exemple :

```text
Besoin : Identifier le joueur ciblé au service
  → RECEPTION, correspondance principale
  → INSIGHTS, correspondance complémentaire
  → PLAYER, correspondance complémentaire
```

### 8.2 Score de recommandation

Pour chaque interface :

```text
recommendationScore =
  Σ (importanceDuBesoin × forceDeCorrespondance)
  + bonusCouverture
  - pénalitéRedondance
```

Valeurs initiales :

- importance : Essential `3`, Important `2`, Secondary `1` ;
- correspondance principale : `3` ;
- correspondance complémentaire : `1` ;
- bonus si l'interface couvre au moins deux besoins sélectionnés : `+2` ;
- pénalité si une autre interface sélectionnée couvre mieux les mêmes besoins : `-1` à `-3`.

Ces valeurs doivent être configurables.

### 8.3 Exemple calculé

Checklist :

- comparer les rotations : `ESSENTIAL` ;
- identifier le joueur ciblé : `ESSENTIAL` ;
- suivre le momentum : `IMPORTANT` ;
- consulter la timeline : `SECONDARY`.

Proposition attendue :

1. `ROTATIONS` ;
2. `RECEPTION` ;
3. `INSIGHTS` ;
4. `MOMENTUM` ;
5. `TIMELINE`.

Cette proposition reste modifiable par le coach.

### 8.4 Explication de la proposition

Chaque interface proposée doit indiquer pourquoi elle est recommandée.

Exemple :

> **ROTATIONS — Highly recommended**  
> Couvre 3 besoins sélectionnés, dont 2 marqués Essential.

Le moteur ne doit pas être opaque. Les besoins couverts doivent être consultables.

---

## 9. Intégration ou exclusion des interfaces

### 9.1 Carte d'interface proposée

Chaque proposition affiche :

- nom de l'interface ;
- aperçu ou miniature ;
- score ou niveau de recommandation ;
- besoins couverts ;
- état des données nécessaires ;
- contrôle `INCLUDE / EXCLUDE` ;
- action `PREVIEW`.

### 9.2 Décision du coach

Le coach peut :

- intégrer une interface recommandée ;
- exclure une interface recommandée ;
- intégrer une interface disponible mais non recommandée ;
- revenir à la recommandation automatique.

Une exclusion manuelle doit être conservée tant que le coach ne demande pas explicitement un nouveau calcul complet.

### 9.3 Couverture perdue

Si l'exclusion d'une interface laisse un besoin `ESSENTIAL` sans couverture, VolleyLive doit afficher un avertissement non bloquant :

> Le besoin « Comparer les rotations » n'est plus couvert par aucune interface active.

Le coach peut malgré tout valider.

---

## 10. Positionnement automatique des onglets

### 10.1 Règle principale

Les onglets sont ordonnés selon la priorité des besoins qu'ils couvrent.

Ordre général :

1. interfaces couvrant des besoins `ESSENTIAL` ;
2. interfaces couvrant des besoins `IMPORTANT` ;
3. interfaces couvrant uniquement des besoins `SECONDARY` ;
4. interfaces ajoutées manuellement sans correspondance directe.

### 10.2 Calcul de priorité d'un onglet

```text
tabPriorityScore =
  highestCoveredImportance × 100
  + recommendationScore × 10
  + coverageCount
  + contextBonus
```

Le multiplicateur `100` garantit que le niveau d'importance domine le classement.

### 10.3 Bonus contextuels initiaux

- `OVERVIEW` : `+25` si score et synthèse sont sélectionnés ;
- `INSIGHTS` : `+20` si au moins un besoin Live Coach Intelligence est Essential ;
- `SINCE EVENT` : `+10` lorsqu'un timeout ou une substitution existe ;
- `PLAYER` : `+10` lorsqu'un joueur est épinglé ;
- `TIMELINE` : aucun bonus permanent.

Les bonus contextuels peuvent influencer l'ordre runtime, mais ne doivent pas réécrire durablement la configuration enregistrée.

### 10.4 Exemple

Configuration :

```text
ESSENTIAL : Rotations, Serve Target
IMPORTANT : Momentum, Position Compare
SECONDARY : Timeline
```

Ordre proposé :

```text
ROTATIONS | RECEPTION | INSIGHTS | MOMENTUM | POSITIONS | TIMELINE
```

### 10.5 Réorganisation manuelle

Le coach peut réordonner les onglets par glisser-déposer ou commandes clavier.

Une fois un déplacement manuel effectué :

- l'ordre devient `MANUAL` ;
- les priorités continuent d'être affichées ;
- VolleyLive ne modifie plus automatiquement l'ordre persistant ;
- un bouton `REAPPLY PRIORITY ORDER` permet de recalculer l'ordre.

### 10.6 Onglets fixes

Aucun onglet métier ne doit être rendu obligatoire par défaut, sauf décision produit ultérieure.

Si un accès permanent au score est nécessaire, le score doit rester dans l'en-tête commun plutôt que d'imposer l'onglet `OVERVIEW`.

---

## 11. Gestion de l'espace disponible

### 11.1 Barre d'onglets

Sur grand écran :

- afficher les onglets selon leur priorité ;
- conserver les libellés complets lorsque possible ;
- placer les onglets excédentaires dans `MORE`.

Sur tablette :

- afficher en priorité les 3 à 5 premiers onglets selon la largeur ;
- placer le reste dans `MORE` ;
- conserver l'onglet actif visible ;
- ne pas réduire les zones tactiles sous 44 × 44 px.

### 11.2 Menu MORE

Le menu `MORE` respecte le même ordre de priorité que la configuration.

Il ne doit pas devenir un stockage désordonné. Chaque entrée affiche :

- son icône ;
- son libellé ;
- son niveau d'importance ;
- éventuellement un badge live.

### 11.3 Onglet actif

Si une interface secondaire devient active depuis une alerte ou une navigation contextuelle, elle doit rester visible tant qu'elle est active, même si cela exige de déplacer temporairement un onglet moins prioritaire dans `MORE`.

---

## 12. Aperçu de COACH VIEW

### 12.1 Objectif

Avant validation, le coach doit voir une prévisualisation réaliste de :

- la barre d'onglets ;
- l'ordre proposé ;
- les vues incluses ;
- les vues exclues ;
- les éléments placés dans `MORE` ;
- le comportement tablette et grand écran.

### 12.2 Données d'aperçu

La prévisualisation peut utiliser des données clairement identifiées comme démonstration, uniquement dans le configurateur.

Ces données doivent :

- porter la mention `PREVIEW DATA` ;
- ne jamais être enregistrées dans le match ;
- ne jamais être mélangées aux données réelles ;
- être remplacées par `0` et `NA` lorsque le coach choisit un aperçu sans données de démonstration.

### 12.3 Validation

Le résumé final doit afficher :

- nombre de besoins sélectionnés ;
- répartition Essential / Important / Secondary ;
- interfaces incluses ;
- interfaces exclues ;
- besoins non couverts ;
- ordre final des onglets ;
- profil concerné.

---

## 13. Profils COACH VIEW

### 13.1 Objectif

Un **profil Coach View** est une configuration complète, nommée et réutilisable de COACH VIEW. Il mémorise :

- les besoins sélectionnés dans la checklist ;
- le niveau d'importance de chaque besoin ;
- les interfaces incluses et exclues ;
- l'ordre des onglets ;
- le mode d'ordre automatique ou manuel ;
- les préférences propres à chaque interface ;
- les filtres par défaut ;
- la portée d'application ;
- l'état de publication du profil.

Le profil permet de préparer plusieurs organisations sans reconstruire la vue avant chaque match.

> Un profil définit ce que le coach souhaite surveiller et comment il veut y accéder. Il ne modifie ni les données du match ni les moteurs de calcul.

### 13.2 Profils prédéfinis fournis par VolleyLive

VolleyLive doit fournir des profils de départ. Ils sont duplicables mais ne sont pas modifiables directement, afin de toujours conserver une base propre.

#### DEFAULT COACH VIEW

Usage : vue équilibrée pour un premier usage.

Ordre recommandé :

`OVERVIEW | INSIGHTS | ROTATIONS | POSITIONS | MOMENTUM | MORE`

Priorités initiales :

- Essential : score, alertes prioritaires, rotations ;
- Important : comparaison par poste, momentum ;
- Secondary : timeline, erreurs, Rally DNA.

#### LIVE MATCH

Usage : prise de décision rapide pendant le match.

Ordre recommandé :

`INSIGHTS | OVERVIEW | ROTATIONS | RECEPTION | SINCE EVENT | MORE`

Caractéristiques :

- maximum de vues immédiatement visibles ;
- priorité aux alertes, rotations, réception et décisions récentes ;
- analyses détaillées placées dans `MORE` ;
- aucun changement automatique permanent d'ordre pendant le match.

#### ROTATION FOCUS

Usage : identifier les passages faibles et comparer R1 à R6.

Ordre recommandé :

`ROTATIONS | INSIGHTS | ATTACK | RECEPTION | DISTRIBUTION | MORE`

Filtres initiaux :

- regroupement principal par rotation ;
- set courant sélectionné ;
- accès rapide au cumul match ;
- affichage du nombre d'échantillons avec chaque KPI.

#### RECEPTION FOCUS

Usage : suivre la qualité de réception et le ciblage adverse.

Ordre recommandé :

`RECEPTION | INSIGHTS | PLAYER | ROTATIONS | TIMELINE | MORE`

Filtres initiaux :

- équipe de l'utilisateur uniquement ;
- receveurs actifs en premier ;
- fenêtre récente et cumul du set visibles ;
- détection du joueur ciblé activée dans la vue.

#### POSITION COMPARE

Usage : comparer les joueurs de l'équipe pour un poste choisi.

Ordre recommandé :

`POSITIONS | PLAYER | INSIGHTS | ROTATIONS | MORE`

Filtres initiaux :

- dernier poste consulté mémorisé ;
- sélection disponible : `ALL | OH | MB | OPP | SETTER | LIBERO` ;
- KPI adaptés au poste ;
- tendance récente affichée seulement avec un échantillon suffisant.

#### TACTICAL DECISIONS

Usage : suivre factuellement les périodes après timeout et substitution.

Ordre recommandé :

`SINCE EVENT | INSIGHTS | MOMENTUM | ROTATIONS | TIMELINE | MORE`

Règle : la vue décrit ce qui s'est produit depuis la décision, sans attribuer automatiquement le résultat à cette décision.

#### POST-MATCH REVIEW

Usage : analyse après la rencontre, sans contrainte de consultation instantanée.

Ordre recommandé :

`OVERVIEW | TIMELINE | ROTATIONS | POSITIONS | RALLY DNA | ERRORS | MORE`

Ce profil peut afficher davantage d'onglets que les profils live, car l'urgence et la charge cognitive sont plus faibles.

### 13.3 Profils personnalisés

Le coach peut :

- créer un profil vide ;
- créer un profil à partir de la checklist ;
- dupliquer un profil prédéfini ;
- dupliquer un profil personnalisé ;
- renommer un profil ;
- ajouter une description courte ;
- définir une couleur ou une icône d'identification ;
- définir le profil comme profil par défaut ;
- archiver un profil ;
- supprimer un profil archivé non référencé ;
- réinitialiser sa composition selon les recommandations actuelles.

#### Règles de nommage

- nom obligatoire ;
- 40 caractères maximum ;
- unicité non obligatoire, mais VolleyLive avertit en cas de doublon ;
- identifiant technique stable et indépendant du nom visible.

### 13.4 Portée des profils

Un profil peut avoir l'une des portées suivantes :

| Portée | Usage |
|---|---|
| `GLOBAL` | Disponible pour toutes les équipes et tous les matchs |
| `TEAM` | Associé à une équipe particulière |
| `MATCH` | Associé à un match particulier |
| `SESSION` | Temporaire, valable uniquement pendant la session courante |

Ordre de résolution au chargement :

`SESSION → MATCH → TEAM → GLOBAL → SYSTEM DEFAULT`

La configuration la plus spécifique est appliquée.

### 13.5 Propriétaire et partage

Pour le MVP, un profil personnalisé appartient à l'utilisateur qui l'a créé.

Le modèle doit néanmoins prévoir :

- `ownerId` ;
- `visibility` ;
- `readOnly` ;
- `sourceProfileId` ;
- `createdBy` et `updatedBy`.

Valeurs de visibilité prévues :

`PRIVATE | TEAM | SHARED_READ_ONLY`

Le partage multi-utilisateur peut être livré ultérieurement. Un profil partagé en lecture seule doit être dupliqué avant modification.

### 13.6 Cycle de vie

Un profil personnalisé utilise les états :

`DRAFT → ACTIVE → ARCHIVED`

- `DRAFT` : configuration en cours, non proposée comme profil normal au lancement ;
- `ACTIVE` : profil sélectionnable et applicable ;
- `ARCHIVED` : conservé mais masqué des choix courants.

Les profils système utilisent l'état `SYSTEM` et restent en lecture seule.

### 13.7 Sélection rapide du profil

COACH VIEW doit afficher un sélecteur de profil accessible sans ouvrir les Settings.

Le sélecteur montre :

- le profil actif ;
- les profils récemment utilisés ;
- les profils d'équipe ;
- les profils globaux ;
- l'action `CONFIGURE COACH VIEW`.

Le coach peut changer de profil en runtime. Le changement :

- ne recharge pas le match ;
- ne modifie pas le journal d'actions ;
- ne désactive aucun moteur analytique ;
- conserve le score et le contexte live ;
- ouvre le premier onglet du nouveau profil, sauf si l'onglet courant y existe aussi.

### 13.8 Activation et modifications temporaires

Lorsqu'un profil est actif, le coach peut effectuer une modification temporaire de session :

- ajouter ou masquer un onglet ;
- changer l'ordre ;
- modifier un filtre ;
- épingler une interface.

VolleyLive doit alors proposer trois choix explicites :

1. `KEEP FOR THIS SESSION` ;
2. `SAVE TO CURRENT PROFILE` ;
3. `SAVE AS NEW PROFILE`.

Aucune modification temporaire ne doit écraser silencieusement le profil enregistré.

### 13.9 Préférences par interface

Un profil peut mémoriser des options propres aux modules.

Exemples :

- `POSITIONS` : poste sélectionné par défaut ;
- `ROTATIONS` : set courant ou cumul match ;
- `RECEPTION` : fenêtre récente utilisée ;
- `PLAYER` : joueur épinglé, si encore présent dans l'effectif ;
- `TIMELINE` : types d'actions visibles ;
- `INSIGHTS` : niveaux affichés ;
- `SINCE EVENT` : dernier événement ou choix manuel.

Une préférence devenue invalide doit revenir à une valeur sûre sans bloquer le profil.

### 13.10 Profil recommandé à la création d'un match

Lors de la préparation d'un match, VolleyLive peut proposer un profil selon cette logique déterministe :

1. profil explicitement associé au match ;
2. dernier profil utilisé avec cette équipe ;
3. profil par défaut de l'équipe ;
4. profil global par défaut ;
5. `DEFAULT COACH VIEW`.

Le système ne doit pas changer automatiquement de profil en cours de match en fonction des statistiques.

### 13.11 Import, export et compatibilité

Le format officiel VolleyLive doit permettre l'export et l'import d'un profil en JSON.

À l'import :

- valider la version du schéma ;
- vérifier les identifiants de modules ;
- signaler les modules inconnus ;
- conserver les références inconnues pour compatibilité future ;
- ne jamais importer de données de match avec le profil ;
- demander un nouveau nom en cas de conflit, ou proposer le remplacement explicitement.

Chaque profil contient `schemaVersion` et `appVersion`.

### 13.12 Historique et restauration

À chaque sauvegarde d'un profil actif :

- incrémenter `revision` ;
- conserver au minimum la version précédente localement ;
- permettre `UNDO LAST PROFILE CHANGE` ;
- enregistrer la date de modification.

Le MVP n'a pas besoin d'un historique complet illimité. Une restauration de la dernière version suffit.

### 13.13 Suppression

La suppression doit respecter les règles suivantes :

- un profil système ne peut pas être supprimé ;
- un profil actif ne peut pas être supprimé sans sélectionner un remplaçant ;
- un profil associé à un match historique est archivé plutôt que supprimé ;
- le profil global par défaut ne peut pas être supprimé sans remplacement ;
- la suppression nécessite une confirmation explicite.

### 13.14 État sans profil exploitable

Si aucun profil personnalisé n'est valide, VolleyLive applique `DEFAULT COACH VIEW`.

COACH VIEW ne doit jamais devenir inaccessible à cause d'une configuration corrompue, incomplète ou provenant d'une ancienne version.

---

## 14. Modèle de données

```json
{
  "coachViewProfile": {
    "id": "profile-live-match",
    "schemaVersion": 2,
    "appVersion": "future",
    "revision": 4,
    "name": "LIVE MATCH",
    "description": "Vue prioritaire pendant le match",
    "profileType": "CUSTOM",
    "status": "ACTIVE",
    "scope": "TEAM",
    "visibility": "PRIVATE",
    "ownerId": "user-id",
    "teamId": "team-a",
    "matchId": null,
    "sourceProfileId": "system-live-match",
    "readOnly": false,
    "isDefault": true,
    "needs": [
      {
        "needId": "compare-rotations",
        "selected": true,
        "importance": "ESSENTIAL"
      },
      {
        "needId": "detect-serve-target",
        "selected": true,
        "importance": "ESSENTIAL"
      }
    ],
    "modules": [
      {
        "moduleId": "rotations",
        "included": true,
        "source": "RECOMMENDED",
        "priorityScore": 938,
        "order": 1,
        "preferences": {
          "period": "CURRENT_SET",
          "showSampleSize": true
        }
      },
      {
        "moduleId": "reception",
        "included": true,
        "source": "RECOMMENDED",
        "priorityScore": 927,
        "order": 2,
        "preferences": {
          "window": 10,
          "teamScope": "OWN_TEAM"
        }
      }
    ],
    "layoutMode": "AUTO_PRIORITY",
    "sessionOverrides": [],
    "createdBy": "user-id",
    "updatedBy": "user-id",
    "createdAt": "ISO-8601",
    "updatedAt": "ISO-8601"
  }
}
```

### 14.1 Valeurs contrôlées

#### Importance

```text
ESSENTIAL | IMPORTANT | SECONDARY
```

#### Origine d'intégration

```text
RECOMMENDED | MANUAL | DEFAULT
```

#### Mode d'ordre

```text
AUTO_PRIORITY | MANUAL
```

#### Type de profil

```text
SYSTEM | CUSTOM
```

#### État du profil

```text
SYSTEM | DRAFT | ACTIVE | ARCHIVED
```

#### Portée

```text
GLOBAL | TEAM | MATCH | SESSION
```

#### Visibilité

```text
PRIVATE | TEAM | SHARED_READ_ONLY
```

---

## 15. Comportement runtime

### 15.1 Chargement

À l'ouverture de COACH VIEW :

1. rechercher un profil de session ;
2. sinon rechercher un profil de match ;
3. sinon rechercher un profil d'équipe ;
4. sinon appliquer le profil par défaut ;
5. vérifier les interfaces disponibles ;
6. construire la barre d'onglets ;
7. ouvrir le premier onglet disponible.

### 15.2 Interface indisponible

Si un module enregistré n'existe plus ou n'est plus compatible :

- ne pas bloquer COACH VIEW ;
- ignorer temporairement le module ;
- afficher un avertissement dans le configurateur ;
- conserver la référence afin de permettre une restauration ultérieure.

### 15.3 Données manquantes

Une interface incluse peut rester accessible même sans données suffisantes.

Elle doit alors afficher :

- `0` pour les compteurs calculables ;
- `NA` en gris pour les métriques non calculables ;
- une explication concise de l'information manquante.

### 15.4 Changement pendant le match

Si le coach modifie la configuration pendant le match :

- l'onglet actif reste affiché s'il est toujours inclus ;
- si l'onglet actif est exclu, ouvrir le premier onglet restant ;
- les données du match ne sont pas recalculées inutilement ;
- les moteurs analytiques continuent de fonctionner indépendamment de la visibilité des écrans.

Exclure `INSIGHTS` de la navigation ne doit donc pas désactiver Live Coach Intelligence.

---

## 16. Règles UX détaillées

### 16.1 Checklist

- cases suffisamment grandes pour une utilisation tactile ;
- sélection multiple ;
- priorité modifiable sans ouvrir une autre page ;
- compteur par catégorie ;
- bouton `SELECT NONE` par catégorie ;
- aucune action générale `SELECT ALL` par défaut, afin d'éviter une COACH VIEW surchargée.

### 16.2 Recommandations

Présenter trois groupes :

1. `HIGHLY RECOMMENDED` ;
2. `RECOMMENDED` ;
3. `OTHER AVAILABLE VIEWS`.

### 16.3 Composition

- liste ordonnée des onglets inclus ;
- zone séparée des interfaces exclues ;
- aperçu immédiat après intégration ou exclusion ;
- déplacement par glisser-déposer ;
- alternatives accessibles au clavier : `MOVE LEFT`, `MOVE RIGHT`, `MOVE TO START`, `MOVE TO END`.

### 16.4 Prévention de surcharge

À partir de 8 interfaces incluses, afficher un avertissement :

> Cette configuration contient de nombreux onglets. Les moins prioritaires seront accessibles depuis MORE sur tablette.

L'avertissement n'est pas bloquant.

---

## 17. Architecture fonctionnelle

```text
COACH NEEDS CATALOG
        │
        ├── CHECKLIST UI
        │       └── importance selection
        │
        ├── NEED-TO-MODULE MAPPING
        │
        ├── RECOMMENDATION ENGINE
        │       ├── coverage score
        │       ├── redundancy control
        │       └── availability control
        │
        ├── TAB PRIORITY ENGINE
        │       ├── auto order
        │       ├── runtime context bonus
        │       └── manual override
        │
        ├── PROFILE STORE
        │       ├── default
        │       ├── team
        │       ├── match
        │       └── session
        │
        └── COACH VIEW SHELL
                ├── visible tabs
                ├── MORE menu
                ├── active module
                └── runtime navigation
```

---

## 18. Stratégie d'implémentation

### Phase 1 — Catalogue et configuration

- catalogue des besoins ;
- catalogue des interfaces ;
- mapping besoin-interface ;
- checklist ;
- attribution des niveaux d'importance ;
- sauvegarde d'un profil unique.

### Phase 2 — Recommandation et onglets

- moteur de recommandation ;
- explication des recommandations ;
- intégration/exclusion ;
- calcul automatique de l'ordre ;
- barre d'onglets dynamique ;
- menu `MORE`.

### Phase 3 — Profils Coach View et personnalisation

- profils système en lecture seule ;
- création, duplication, renommage et archivage ;
- portée globale, équipe, match et session ;
- sélecteur rapide en runtime ;
- modifications temporaires sans écrasement silencieux ;
- préférences par interface ;
- ordre manuel et réapplication de l'ordre automatique ;
- restauration de la version précédente ;
- export et import JSON versionnés.

### Phase 4 — Adaptation contextuelle

- bonus runtime ;
- épinglage temporaire d'un onglet ;
- proposition d'une vue depuis un insight ;
- statistiques d'utilisation anonymisées localement, si cette fonction est validée ultérieurement.

---

## 19. Hors périmètre initial

Ne pas inclure dans le MVP :

- génération automatique d'une configuration par IA externe ;
- modification de la configuration à partir de données fictives ;
- activation/désactivation des moteurs de calcul selon les onglets visibles ;
- configuration des actions de capture ;
- changement automatique permanent de l'ordre sans consentement ;
- partage cloud de profils entre organisations ;
- recommandations basées sur une évaluation du coach.

---

## 20. Critères d'acceptation

La fonctionnalité est validée lorsque :

1. le coach peut sélectionner plusieurs besoins dans la checklist ;
2. chaque besoin sélectionné accepte un niveau Essential, Important ou Secondary ;
3. les besoins non sélectionnés n'influencent pas les recommandations ;
4. les interfaces proposées correspondent au mapping configuré ;
5. chaque recommandation indique les besoins couverts ;
6. le coach peut intégrer ou exclure chaque interface ;
7. une alerte apparaît si un besoin Essential n'est plus couvert ;
8. les onglets sont initialement classés selon le niveau d'importance ;
9. le coach peut passer en ordre manuel ;
10. l'ordre automatique peut être réappliqué ;
11. les onglets excédentaires apparaissent dans MORE ;
12. l'onglet actif reste visible autant que possible ;
13. la configuration est sauvegardée et restaurée ;
14. la configuration n'altère jamais les données du match ;
15. masquer une interface ne désactive pas son moteur analytique ;
16. les vues indisponibles sont expliquées et non sélectionnables ;
17. les KPI sans données respectent les règles `0` et `NA` ;
18. le changement de configuration peut être appliqué en runtime ;
19. la prévisualisation distingue clairement les données de démonstration ;
20. la configuration reste utilisable sur tablette avec des cibles tactiles d'au moins 44 × 44 px.
21. les profils système restent accessibles en lecture seule ;
22. un profil système peut être dupliqué en profil personnalisé ;
23. le profil actif peut être changé en runtime sans recharger le match ;
24. les modifications temporaires n'écrasent jamais silencieusement le profil ;
25. une modification peut être conservée pour la session, enregistrée ou sauvegardée comme nouveau profil ;
26. la résolution SESSION → MATCH → TEAM → GLOBAL → SYSTEM DEFAULT est respectée ;
27. une configuration invalide retombe sur DEFAULT COACH VIEW ;
28. les préférences propres aux interfaces sont sauvegardées ;
29. l'import contrôle la version du schéma et les modules inconnus ;
30. la dernière version sauvegardée d'un profil peut être restaurée ;
31. un profil actif ou par défaut ne peut pas être supprimé sans remplacement ;
32. les profils historiques référencés sont archivés plutôt que supprimés.

---

## 21. Exemple de configuration complète

### Checklist

| Besoin | Importance |
|---|---|
| Identifier la rotation la plus faible | Essential |
| Identifier le joueur ciblé au service | Essential |
| Comparer les OH | Important |
| Suivre le momentum | Important |
| Mesurer depuis le timeout | Important |
| Consulter la timeline | Secondary |

### Interfaces proposées

| Interface | État | Justification |
|---|---|---|
| ROTATIONS | Incluse | Couvre la priorité rotation Essential |
| RECEPTION | Incluse | Couvre le ciblage au service Essential |
| INSIGHTS | Incluse | Synthétise plusieurs besoins prioritaires |
| POSITIONS | Incluse | Permet la comparaison des OH |
| MOMENTUM | Incluse | Couvre la dynamique du match |
| SINCE EVENT | Incluse | Couvre l'analyse depuis timeout |
| TIMELINE | Exclue par le coach | Besoin secondaire non retenu dans la barre |
| RALLY DNA | Exclue | Non liée directement à la checklist actuelle |

### Ordre final suggéré

```text
ROTATIONS | RECEPTION | INSIGHTS | POSITIONS | MOMENTUM | SINCE EVENT
```

Sur tablette, selon la largeur disponible :

```text
ROTATIONS | RECEPTION | INSIGHTS | POSITIONS | MORE
```

Le menu `MORE` contient alors `MOMENTUM` et `SINCE EVENT`, dans cet ordre.

---

## 22. Améliorations consolidées intégrées

Cette version intègre les améliorations de robustesse et d'usage suivantes :

- distinction claire entre priorité de navigation et sévérité des alertes ;
- recommandations explicables, avec affichage des besoins couverts ;
- réduction de la redondance entre modules proposés ;
- avertissement lorsqu'un besoin Essential n'est plus couvert ;
- ordre automatique dominé par la priorité choisie par le coach ;
- ordre manuel protégé contre les réorganisations automatiques ;
- comportement tablette avec `MORE` et conservation de l'onglet actif ;
- changement de vue et de profil en runtime ;
- modifications temporaires séparées de la configuration persistante ;
- profils système, personnalisés, d'équipe, de match et de session ;
- fallback sûr en cas de profil invalide ;
- versionnement du format JSON ;
- conservation des références de modules futurs ou inconnus ;
- restauration de la dernière version ;
- disponibilité des moteurs analytiques indépendante de la visibilité des écrans ;
- gestion explicite de `0`, `NA` et des données de prévisualisation ;
- conception tactile avec zones actives d'au moins 44 × 44 px ;
- absence de données fictives dans les matchs réels ;
- score conservé dans l'en-tête commun plutôt que dépendant d'un onglet obligatoire.

---

## 23. Principe final

Le configurateur ne doit pas demander au coach de connaître l'architecture de VolleyLive.

Il doit partir de son vocabulaire et de ses préoccupations : rotations, réception, joueurs, momentum, timeout et erreurs. VolleyLive transforme ensuite ces choix en une COACH VIEW cohérente, priorisée et immédiatement exploitable.

> **Le coach choisit ce qui compte. VolleyLive organise la manière de le voir.**

---

# PARTIE III — INTÉGRATION DES DEUX SYSTÈMES

## 1. Relation entre insights et configuration

La checklist Coach View définit ce que le coach souhaite surveiller. Live Coach Intelligence continue néanmoins de calculer les informations compatibles avec les données disponibles, même si leurs interfaces ne sont pas visibles.

Lorsqu'un insight concerne une vue incluse dans le profil actif :

- l'insight peut proposer une action `OPEN VIEW` ;
- la vue cible s'ouvre sans modifier durablement l'ordre des onglets ;
- l'onglet actif reste visible, quitte à déplacer temporairement un onglet moins prioritaire dans `MORE`.

Lorsqu'un insight concerne une vue exclue :

- l'insight reste visible dans `INSIGHTS` si cet onglet est actif ;
- VolleyLive peut proposer `OPEN TEMPORARILY` ;
- la vue temporaire n'est pas ajoutée au profil sans consentement explicite ;
- le coach peut choisir `ADD TO CURRENT PROFILE` ou `KEEP FOR THIS SESSION`.

## 2. Priorité utilisateur et sévérité analytique

Deux notions restent strictement séparées :

- `ESSENTIAL | IMPORTANT | SECONDARY` décrit l'importance donnée par le coach à un besoin ou un onglet ;
- `CRITICAL | WATCH | OPPORTUNITY` décrit la nature d'un insight live.

Une alerte `CRITICAL` peut temporairement rendre son accès plus visible, mais ne doit pas réécrire l'ordre persistant du profil.

## 3. Séquence de traitement runtime

Après validation d'une action de match :

1. ajouter ou corriger l'événement dans le journal ;
2. mettre à jour le score ;
3. recalculer les KPI concernés ;
4. mettre à jour les fenêtres d'analyse ;
5. réévaluer les patterns et règles d'insight ;
6. classer les insights actifs ;
7. notifier les modules Coach View concernés ;
8. appliquer uniquement les adaptations temporaires autorisées ;
9. conserver intact le profil persistant sauf action explicite du coach.

## 4. Critères d'acceptation d'intégration

1. Un profil peut masquer une vue sans arrêter ses calculs.
2. Un insight peut ouvrir temporairement sa vue détaillée.
3. L'ouverture contextuelle ne modifie pas l'ordre sauvegardé.
4. Le coach peut intégrer explicitement la vue au profil courant.
5. Les priorités du coach et les sévérités analytiques ne sont jamais confondues visuellement.
6. Une correction d'action met à jour les insights et toutes les vues concernées.
7. Le changement de profil conserve le match, le score, les événements et les calculs en cours.
8. Les profils et insights utilisent le même format officiel d'identifiants d'équipe, joueur, rotation et événement.
9. Une vue sans échantillon suffisant n'affiche pas de tendance trompeuse.
10. Le fallback `DEFAULT COACH VIEW` garantit toujours un accès utilisable au match.

---

# PARTIE IV — PLAN D'IMPLÉMENTATION CONSOLIDÉ

## Phase 1 — Fondations de données et de configuration

- stabiliser le JSON officiel du match ;
- garantir les identifiants stables d'événements ;
- créer KPI Engine et Window Engine ;
- créer les catalogues de besoins et de modules ;
- implémenter `0`, `NA` et les minimums d'échantillons ;
- créer le modèle versionné `CoachViewProfile`.

## Phase 2 — Coach View configurable

- checklist et niveaux d'importance ;
- mapping besoin-interface ;
- recommandation explicable ;
- intégration et exclusion des vues ;
- ordre automatique et manuel ;
- menu `MORE` responsive ;
- profil système `DEFAULT COACH VIEW`.

## Phase 3 — Premiers insights live

- modèle `Insight` traçable ;
- Negative Run ;
- Serve Target Detection ;
- Rotation Intelligence ;
- Since Timeout ;
- Since Substitution ;
- cooldown et hystérésis.

## Phase 4 — Profils Coach View complets

- profils système ;
- profils personnalisés ;
- portées global, équipe, match et session ;
- sélecteur runtime ;
- préférences par interface ;
- session overrides ;
- restauration de la dernière révision ;
- import et export JSON.

## Phase 5 — Analyse avancée et intégration contextuelle

- Rally DNA ;
- Position Compare Live et tendances ;
- Opportunity Detection ;
- ouverture contextuelle des vues depuis les insights ;
- archivage des insights dans Match Reports ;
- compatibilité multi-match future.

---

# PARTIE V — DEFINITION OF DONE GLOBALE

La version est considérée terminée lorsque :

1. les exigences et critères d'acceptation des deux parties sont satisfaits ;
2. toutes les données affichées sont traçables vers le journal d'actions ;
3. les corrections et annulations produisent un état cohérent ;
4. aucune donnée de démonstration n'est mélangée aux données réelles ;
5. la navigation reste utilisable pendant la capture live ;
6. les profils peuvent être changés sans rechargement du match ;
7. les recommandations d'interfaces sont explicables ;
8. l'ordre manuel n'est jamais écrasé silencieusement ;
9. les insights restent factuels et non prescriptifs ;
10. l'expérience tablette respecte les contraintes tactiles et de lisibilité ;
11. le document JSON est versionné et rétrocompatible selon les règles définies ;
12. les tests couvrent les calculs, seuils, corrections, profils, fallbacks et transitions runtime.

---

## Principe final

> **VolleyLive ne cherche pas à afficher le plus de statistiques. Il fait apparaître la bonne information, au bon moment, dans une Coach View organisée selon les priorités réelles du coach.**
