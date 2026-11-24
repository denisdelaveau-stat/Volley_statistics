# Instructions d’installation — VolleyLive v1.28.0

## Package complet

Déployer le contenu complet du dossier `Volley_statistics_v1.28.0` à la racine de l’application en conservant l’arborescence.

Ouvrir l’application en ligne une fois afin d’installer le cache `volley-live-capture-v1.28.0`, puis fermer et rouvrir complètement la PWA.

## Mise à jour depuis v1.27.0

Extraire `Volley_statistics_v1.28.0_update_from_v1.27.0.zip`, puis exécuter :

```bash
python3 APPLY_UPDATE.py /chemin/vers/Volley_statistics_v1.27.0
```

Le programme vérifie la base v1.27.0, applique les fichiers ajoutés/modifiés et les suppressions, puis vérifie l’arbre cible v1.28.0.

Vérification seule :

```bash
python3 APPLY_UPDATE.py /chemin/vers/Volley_statistics_v1.28.0 --verify-only
```

## Contrôle rapide

1. Démarrer ou reprendre un match.
2. Vérifier les onglets FOCUS, SPEED+ et FLOW directement sous le score.
3. Sélectionner un joueur puis une action, changer de mode et vérifier que la sélection est conservée.
4. Choisir un résultat et vérifier l’enregistrement immédiat et le score.
5. Toucher Annuler et vérifier le retour au score précédent.
6. Ouvrir SETTINGS et vérifier qu’aucun choix FOCUS / SPEED+ / FLOW n’y figure.
7. Fermer et rouvrir la capture : le dernier mode runtime choisi doit être conservé.
