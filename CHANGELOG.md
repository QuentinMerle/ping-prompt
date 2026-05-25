# 📖 Carnet de Bord (Changelog)

Ce document retrace l'historique des mises à jour et l'évolution du développement de **Agentic Pong**.

---

## 🚀 Version 1.2.0 - "Mind Games & Chaos" (Aujourd'hui)

Une mise à jour majeure axée sur l'interface, la complexité du moteur de jeu et l'intelligence prédictive.

### ✨ Nouveautés & Fonctionnalités
- **Mode Multi-Puck (Mode Flipper)** : Ajout d'un nouveau bonus ultra-rare (🪩 12.5% de drop rate). Clone le palet en deux autres palets avec des trajectoires aléatoires. Le premier qui marque stoppe la manche !
- **Prescience Physique (Brain.js)** : L'IA ne se contente plus d'analyser vos tirs pour parler. Elle anticipe physiquement vos actions et pré-positionne sa raquette avant même que le palet n'ait passé la ligne médiane. Bienvenue dans les feintes et les "Mind Games".
- **Refonte totale du HUD (Game UI Layout)** : 
  - Le score est maintenant centré en haut.
  - La boîte de dialogue de Neural Core (Phi-3) est alignée en haut à droite avec une taille dynamique.
  - Le moniteur télémétrique de Brain.js est solidement ancré en bas à gauche.
  - Symétrie et espace : le jeu vidéo ressemble enfin à un cockpit d'arcade ou une interface eSport.

### 🛠️ Corrections de Bugs & Qualité de Vie (QoL)
- **Fix (Z-Index des clics)** : Correction d'un bug majeur (Safari/Chrome) où l'effet visuel CRT (scanlines) avalait les clics de la souris. Les interfaces sont passées au tout premier plan (`z-index: 1000`).
- **Fix (Gel de l'IA)** : Le bonus "Freeze" (❄️) impacte désormais correctement le moteur physique de l'IA (via le `controlModifier`), réduisant concrètement sa capacité d'accélération à 15%.
- **Fallback WebGPU** : Ajout d'un système de sécurité. Si l'utilisateur n'a pas de carte graphique supportant WebGPU, le téléchargement massif de Phi-3 est annulé au profit d'une "Dummy AI" locale (offline), évitant ainsi le crash du navigateur.

---

## 🏁 Version 1.0.0 - "Initial Release"
- Création du moteur physique (Collisions élastiques, Friction).
- Intégration de WebLLM (Phi-3-mini) et du système de triches (Function Calling).
- Intégration de Brain.js (Réseau de neurones local).
- Système de bonus basique (Speed, Freeze, Size).
- Direction Artistique (Voxel wireframe, Néons, Effets CRT).
