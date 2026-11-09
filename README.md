# Portfolio 3D interactif

Portfolio personnel en 3D temps réel, réalisé avec **TypeScript** et **Babylon.js**. L'utilisateur arrive sur un écran d'accueil, puis entre dans une scène 3D (un bureau) où il explore des objets cliquables qui renvoient vers mes projets et mon profil.

> **Projet de 2023, non maintenu.**
> Ce portfolio a été réalisé début 2023, à une période où je débutais en Babylon.js et en développement web 3D. Il est conservé pour montrer mon parcours : certaines informations (liens, contenus, versions des dépendances) ne sont plus à jour, et le projet n'a pas été optimisé.

## Aperçu

- **Écran d'accueil** : un bouton qui lance la transition vers la scène principale.
- **Transition entre scènes** : fondu au noir réalisé avec un **shader GLSL** écrit à la main et appliqué en post-process (`PostProcess` Babylon.js, paramètre `fadeLevel`).
- **Scène 3D interactive** : caméra orbitale (rotation et zoom limités), objets mis en surbrillance au survol (`HighlightLayer`), halo lumineux (`GlowLayer`).
- **Objets interactifs** :
  - l'ordinateur affiche une image de mon portfolio ;
  - le bloc-notes ouvre une fenêtre « About Me » ;
  - la borne d'arcade renvoie vers mon profil itch.io.
- **Interface** : boutons et fenêtres réalisés avec `@babylonjs/gui`.

## Technologies

- TypeScript, Babylon.js 5.57 (`core`, `gui`, `loaders`)
- GLSL (shader de fondu)
- Modèles 3D au format glTF / GLB
- Webpack et `ts-loader`, ESLint

## Pistes d'amélioration

- Mise à jour vers une version récente de Babylon.js.
- Transitions plus riches entre les scènes (zoom, mouvement de caméra, combinaisons d'effets) à la place du fondu simple.
- Compression des modèles et des textures, chargement progressif.
- Refactorisation du code (séparation des scènes, de l'interface et des interactions).
- Adaptation mobile et tactile.

## Auteure

Ibtihal Baaziz
