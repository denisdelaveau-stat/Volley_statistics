# VolleyLive — Live Coach Intelligence

## Spécification fonctionnelle pour implémentation future

**Statut :** Future implementation  
**Produit :** VolleyLive  
**Type :** Spécification fonctionnelle et technique  
**Priorité globale :** Haute  

---

## 1. Objectif

Faire évoluer VolleyLive d'un outil de capture et de consultation statistique vers un assistant d'analyse de match en temps réel.

Le principe est simple :

> **Ne pas seulement afficher les statistiques. Détecter automatiquement ce qui mérite l'attention du coach maintenant.**

Le système doit exploiter exclusivement les données réelles du match, avec le journal chronologique des actions comme **source de vérité**. Aucune donnée de démonstration ne doit être présentée comme une observation réelle.

Cette fonctionnalité doit s'intégrer principalement dans **COACH VIEW**, sans créer une nouvelle section `ADVANCED STATISTICS`.

---

## 2. Vision produit

Chaîne de valeur cible :

`CAPTURE → MATCH EVENT LOG → LIVE KPI → CONTEXT → TREND DETECTION → COACH INSIGHT`

VolleyLive doit répondre à quatre questions pendant le match :

1. **Que se passe-t-il ?**
2. **Qu'est-ce qui vient de changer ?**
3. **Où se situe le problème ou l'opportunité ?**
4. **Quels éléments factuels expliquent cette observation ?**

Le système ne doit pas prendre la décision à la place du coach. Il doit attirer son attention sur des faits significatifs.

---

## 3. Principes UX

### 3.1 Synthèse avant détail

COACH VIEW ne doit jamais devenir un cockpit saturé de KPI.

Règles :

- maximum **3 insights actifs** visibles simultanément ;
- priorité aux changements récents ;
- chaque insight doit être compréhensible en moins de 3 secondes ;
- accès au détail sur sélection ;
- aucun changement de navigation forcé lorsqu'un insight apparaît ;
- couleurs cohérentes avec le thème Coach View.

### 3.2 Niveaux d'insight

| Niveau | Couleur | Usage |
|---|---|---|
| Critical | Rouge | Dégradation forte ayant un impact immédiat |
| Watch | Orange | Tendance émergente à surveiller |
| Opportunity | Vert | Faiblesse adverse ou tendance favorable exploitable |

### 3.3 Données indisponibles

- valeur calculable mais sans événement : `0` ;
- valeur non calculable : `NA` ;
- `NA` affiché en gris ;
- ne jamais inventer une valeur pour compléter une vue.

---

# 4. Live Coach Assistant

## 4.1 Description

Le **Live Coach Assistant** est le moteur central. Il analyse en continu les événements du match et produit des observations courtes, explicables et contextualisées.

Exemple :

> **ROTATION R4 — WATCH**  
> Side-out : 42 % sur les 6 derniers passages.  
> Réception positive : 38 %.  
> #7 a reçu 5 des 7 derniers services adverses.

## 4.2 Structure d'un insight

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

## 4.3 Cycle de vie

Un insight peut avoir les états :

`NEW → ACTIVE → ACKNOWLEDGED → RESOLVED → ARCHIVED`

Un insight résolu ne doit plus occuper un emplacement prioritaire mais doit rester disponible dans la timeline du match.

---

# 5. Live Momentum Detector

## 5.1 Objectif

Détecter automatiquement les séries significatives sans obliger le coach à interpréter une simple courbe de momentum.

## 5.2 Détections initiales

### Negative Run

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

### Positive Run

Même principe pour une série favorable. Une série positive n'est remontée que si une caractéristique exploitable est détectée.

### Breakpoint Opportunity

Détecter une faiblesse récurrente adverse sur la rotation ou la fenêtre récente.

## 5.3 Fenêtres

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

# 6. Serve Target Detection

## 6.1 Objectif

Identifier lorsqu'un joueur de VolleyLive est ciblé de manière inhabituelle au service adverse.

## 6.2 Métriques

Pour chaque receveur :

- nombre de services reçus ;
- part des services adverses reçus ;
- réception positive ;
- réception parfaite ;
- erreurs de réception ;
- évolution sur fenêtre récente.

## 6.3 Règle initiale proposée

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

# 7. Rotation Intelligence

## 7.1 Objectif

Construire automatiquement le profil de chacune des six rotations et identifier leurs forces, faiblesses et évolutions.

## 7.2 KPI minimum

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

## 7.3 Explication causale prudente

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

## 7.4 Comparaison

Comparer une rotation avec :

- les autres rotations du même match ;
- sa performance dans le set courant ;
- sa performance cumulée dans le match.

Une future extension pourra comparer plusieurs matchs, mais elle n'est pas nécessaire au MVP.

---

# 8. Rally DNA

## 8.1 Objectif

Transformer les événements du journal en séquences tactiques structurées permettant de rechercher des patterns.

Exemple :

```text
SERVE
→ RECEPTION ++
→ SET OH4
→ ATTACK +
→ POINT
```

## 8.2 Modèle

Chaque rally doit contenir :

- équipe au service ;
- rotation ;
- ordre chronologique des actions ;
- joueurs ;
- poste des joueurs ;
- qualité/résultat de chaque action ;
- résultat final du rally ;
- score avant/après.

## 8.3 Patterns recherchés

Première version :

- réception → destination de passe ;
- qualité de réception → efficacité d'attaque ;
- rotation → destination de passe ;
- destination de passe → résultat ;
- serveur → receveur ;
- joueur ciblé → qualité de réception ;
- type de situation → résultat du rally.

## 8.4 Seuil d'échantillon

Un pattern ne doit pas être présenté comme significatif avec un échantillon trop faible.

Valeur initiale recommandée :

- `< 3` occurrences : ne pas générer d'insight ;
- `3–5` : information faible, affichable uniquement en détail ;
- `>= 6` : éligible à un insight si l'écart est suffisamment important.

Ces valeurs doivent être configurables.

---

# 9. Position Compare Live

## 9.1 Sélecteur

COACH VIEW doit offrir :

`ALL | OH | MB | OPP | SETTER | LIBERO`

La comparaison concerne **uniquement l'équipe de l'utilisateur**.

## 9.2 KPI par poste

Les KPI doivent rester spécifiques au poste.

### OH

- attack efficiency ;
- kills ;
- errors ;
- réception positive/perfect ;
- side-out contribution ;
- tendance récente.

### MB

- attack efficiency ;
- kill % ;
- blocks / block touches ;
- quick attack usage ;
- tendance récente.

### OPP

- attack efficiency ;
- kills ;
- errors ;
- breakpoint contribution ;
- tendance récente.

### Setter

- distribution par zone/poste ;
- side-out après passe ;
- distribution sous réception positive/négative ;
- tendance récente.

### Libero

- réception positive ;
- réception parfaite ;
- erreurs ;
- digs si disponibles dans le modèle ;
- tendance récente.

## 9.3 Trend

Chaque joueur peut recevoir un indicateur :

`↑ UP | → STABLE | ↓ DOWN`

Il doit être calculé par comparaison d'une fenêtre récente avec une référence du set ou du match. Aucun trend ne doit être affiché sous le nombre minimal d'échantillons configuré.

---

# 10. Since Timeout / Since Substitution

## 10.1 Objectif

Permettre de mesurer immédiatement ce qui s'est produit après un événement tactique identifiable.

## 10.2 Timeout

Après chaque timeout, créer automatiquement une fenêtre `SINCE_TIMEOUT`.

Afficher notamment :

- score depuis timeout ;
- points gagnés/perdus ;
- side-out ;
- breakpoint ;
- attack efficiency ;
- réception positive ;
- série en cours.

## 10.3 Substitution

Après une substitution, créer une fenêtre :

`SINCE_SUBSTITUTION(playerOut, playerIn)`

Le contexte doit rester associé à la substitution concernée même si d'autres changements interviennent ensuite.

## 10.4 Pas d'interprétation abusive

VolleyLive indique **ce qui s'est passé depuis** la décision. Il ne prétend pas que la décision est la cause du résultat.

---

# 11. Intelligent Alerts

## 11.1 Règles

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

## 11.2 Anti-spam

Deux mécanismes sont indispensables :

### Cooldown

Une même règle ne doit pas générer une nouvelle alerte à chaque rally.

Valeur initiale recommandée : **3 rallys** avant réévaluation, sauf aggravation de niveau.

### Hysteresis

Le seuil de sortie d'une alerte doit être différent du seuil d'entrée afin d'éviter les oscillations.

Exemple :

- entrée en Watch : side-out `< 40 %` ;
- sortie : side-out `>= 47 %` avec échantillon suffisant.

---

# 12. Architecture fonctionnelle

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

# 13. Exigences temps réel

Après validation d'une action de capture :

1. ajout au journal ;
2. mise à jour du score ;
3. recalcul incrémental des KPI concernés ;
4. mise à jour des fenêtres ;
5. réévaluation des règles impactées ;
6. mise à jour de Coach View.

### Cible UX

L'insight doit sembler instantané après la saisie. Cible recommandée pour le traitement local : **< 250 ms** sur l'appareil cible pour le recalcul d'un événement normal.

Le moteur doit privilégier le recalcul incrémental plutôt qu'un recalcul complet du match après chaque action.

---

# 14. Correction et annulation d'une action

Point critique : le moteur doit supporter la correction de la capture.

Si une action historique est modifiée ou supprimée :

- score recalculé si nécessaire ;
- KPI dépendants invalidés puis recalculés ;
- patterns recalculés ;
- insights devenus faux supprimés ou résolus ;
- fenêtres temporelles conservées avec cohérence chronologique.

Aucun insight ne doit rester affiché s'il repose sur des événements annulés.

---

# 15. Configuration

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

# 16. Historique et Match Reports

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

# 17. Périmètre MVP

## Phase 1 — Fondations

- Window Engine ;
- calcul incrémental ;
- modèle `Insight` ;
- moteur de règles ;
- gestion minimum sample ;
- cooldown/hysteresis ;
- correction/recalcul.

## Phase 2 — Premiers insights

- Negative Run ;
- Serve Target Detection ;
- Rotation Intelligence ;
- Since Timeout ;
- Since Substitution.

## Phase 3 — Analyse avancée

- Rally DNA ;
- détection de patterns ;
- Position Compare Live + tendances ;
- Opportunity detection.

## Phase 4 — Multi-match

- baseline joueur ;
- baseline rotation ;
- comparaison avec matchs précédents ;
- tendances saison.

---

# 18. Hors périmètre initial

Ne pas inclure dans le MVP :

- recommandation automatique de substitution ;
- instruction tactique prescriptive ;
- prédiction du vainqueur ;
- score de performance global artificiel ;
- statistiques basées sur des événements absents du journal ;
- données fictives destinées à remplir l'interface ;
- nouvelle page `ADVANCED STATISTICS`.

---

# 19. Critères d'acceptation globaux

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

# 20. Principe directeur

La réussite de cette évolution ne se mesure pas au nombre de statistiques ajoutées.

Elle se mesure à la capacité de VolleyLive à faire apparaître **la bonne information, au bon moment, avec les faits qui permettent au coach de la comprendre**.

> **VolleyLive — Understand the match while it's happening.**
