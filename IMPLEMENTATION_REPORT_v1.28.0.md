# Rapport d’implémentation — VolleyLive v1.28.0

## Base

Implémentation réalisée sur le package complet VolleyLive v1.27.0. Le périmètre porte sur la saisie live ; les vues Coach, Spectator, Match Library et les exports restent alimentés par le même historique officiel.

## Architecture

- `runtime-input.js` fournit le contrôleur partagé, les trois layouts, la machine d’état, la validation, le verrou transactionnel, les préférences runtime et la conservation d’état lors d’un changement de mode.
- `runtime-input.css` fournit le thème capture, les cibles tactiles, le terrain compact, les grilles fixes et les adaptations téléphone/tablette/desktop.
- `index.html` charge le contrôleur runtime et enrichit la transaction d’événement existante avec les champs canoniques, sans dupliquer le moteur de score.
- `sw.js` met en cache les nouveaux assets et incrémente le cache PWA en v1.28.0.

## Correction produit impérative

Le choix FOCUS / SPEED+ / FLOW est exclusivement accessible dans l’interface de capture :

1. onglets permanents sous le score ;
2. menu de capture accessible par le bouton en haut à droite.

SETTINGS ne contient aucun sélecteur de mode runtime. Les préférences sont stockées séparément dans `volleyCapture.runtimeInput.preferences.v1`.

Le changement de mode ne réinitialise pas une saisie en cours :

- sans auteur : la destination reste à l’étape Joueur ;
- auteur sélectionné : la destination affiche l’étape Action ;
- auteur et action sélectionnés : la destination affiche l’étape Résultat ;
- le match, le score et les événements stockés ne sont pas réécrits.

## Transaction d’événement

Le moteur existant reste l’autorité pour le score et les règles de set. Chaque événement runtime reçoit avant écriture un identifiant `eventId`. Une écriture avec le même identifiant est rejetée. Le résultat entraîne une écriture immédiate ; l’interface compare le nombre d’événements avant/après pour confirmer le succès. En cas d’échec, la sélection est conservée.

L’annulation appelle la transaction historique existante : suppression du dernier événement, reconstruction du score et de la rotation, puis réinitialisation de l’interface.

## Compatibilité

Les clés historiques (`action`, `result`, `player`, `scoreA`, `scoreB`, `winningTeam`) sont conservées pour les vues et statistiques existantes. Les champs runtime canoniques sont ajoutés sans migration des anciens matchs.

## Validation

- 13 scénarios d’acceptation runtime réussis.
- 127 tests approuvés réussis.
- Les anciens tests d’interface visant le pavé « quick capture » v1.6.x sont remplacés par `tests/test_runtime_input_v1_28.py`, car cette interface est intentionnellement supprimée.
- Vérification visuelle : FOCUS téléphone, SPEED+ tablette, FLOW desktop et FLOW empilé sur téléphone.
