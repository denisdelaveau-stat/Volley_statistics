# VolleyLive v1.28.0 — saisie runtime FOCUS, SPEED+ et FLOW

## Nouveautés

- Trois modes de saisie partageant le même contrôleur métier :
  - **FOCUS** : Joueur → Action → Résultat, une décision par écran ;
  - **SPEED+** : terrain toujours visible et panneau contextuel ;
  - **FLOW** : Joueur, Action et Résultat visibles simultanément.
- Le mode se change **directement pendant la capture**, depuis les onglets FOCUS / SPEED+ / FLOW ou le menu de capture.
- Le mode n’est pas proposé dans SETTINGS et n’altère pas le format du match.
- Un changement de mode conserve le match, le score, l’historique, l’auteur et l’action déjà sélectionnés.
- Résultat enregistré immédiatement, sans bouton Valider.
- Bouton adversaire générique **A**, disponible dans les trois modes sans créer de joueur local.
- Grille d’actions fixe : SERVICE, RÉCEPTION, PASSE / ATTAQUE, BLOCK, DÉFENSE / RELANCE.
- Actions préférentielles mises en évidence selon le poste, sans déplacement, présélection ni blocage.
- Annulation atomique du dernier événement et de son impact sur le score.
- Protection contre le double tap et identifiant d’événement idempotent.

## Événement runtime

Les événements conservent les propriétés historiques utilisées par VolleyLive et ajoutent les champs canoniques :

- `eventId`, `setNumber`, `authorSide` ;
- `playerId`, `playerNumber`, `playerRole` ;
- `actionCode`, `status` ;
- `scoreBefore`, `scoreAfter` ;
- `inputMode`, `schemaVersion`.

Les trois modes produisent les mêmes données métier ; seule la propriété technique `inputMode` varie.

## Ergonomie et accessibilité

- Cibles tactiles de 64 px ou plus sur les commandes principales.
- Rôles identifiés par libellé et couleur pastel.
- Résultats POSITIF / NEUTRE / ERREUR identifiés par texte, symbole et couleur.
- FLOW passe en pile verticale sur écran étroit.
- SPEED+ utilise un terrain compact sans filet.
- FOCUS est la valeur initiale sur téléphone ; SPEED+ sur largeur supérieure, puis le choix utilisateur est mémorisé dans une préférence runtime séparée.
- Option de feedback haptique et activation/désactivation de la mise en avant par poste depuis le menu de capture.

## Validation

- 13 tests d’acceptation dédiés aux trois modes et au changement runtime.
- 127 tests approuvés réussis sur la capture runtime, Coach View, Match Library, Spectator View, rapports, format JSON, PWA et navigation.
- Contrôles syntaxiques JavaScript réussis.
- Captures vérifiées en 390 × 844, 820 × 1000 et 1180 × 820.
- Aucun débordement horizontal aux trois largeurs validées.
