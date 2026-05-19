# PRD — Searchidian
**Version :** 0.2.0  
**Auteur :** Franck Walden  
**Dernière mise à jour :** 2026-05-19  
**Statut :** En développement actif

---

## 1. Vue d'ensemble

Searchidian est une application menubar macOS (Electron) qui permet de **rechercher instantanément dans tous ses vaults Obsidian** sans ouvrir Obsidian. Elle vit dans la barre de menus, s'ouvre avec un raccourci global, affiche les résultats avec preview live, et ouvre le fichier directement dans l'application de son choix.

---

## 2. Problème

Les utilisateurs d'Obsidian qui gèrent plusieurs vaults n'ont aucun moyen rapide de **retrouver une note sans savoir dans quel vault elle se trouve**. La recherche native d'Obsidian est limitée au vault ouvert. Quitter son flux de travail pour ouvrir Obsidian, naviguer vers le bon vault, puis chercher est lent et interruptif.

---

## 3. Utilisateurs cibles

| Profil | Description |
|--------|-------------|
| **Power user Obsidian** | Plusieurs vaults, notes volumineuses, besoin de retrouver rapidement |
| **Knowledge worker** | Prise de notes intensive, croise souvent différents projets |
| **Développeur / créatif** | Habitude des outils menubar, apprécie la rapidité clavier |

**Non-cible :** utilisateurs avec un seul vault et peu de notes — la recherche native Obsidian suffit.

---

## 4. Proposition de valeur

> "Retrouve n'importe quelle note dans tous tes vaults en moins de 2 secondes, sans quitter ce que tu fais."

- **Vitesse** : recherche via ripgrep, résultats en < 100 ms typiquement
- **Non-intrusif** : vit dans la menubar, pas de Dock, raccourci global
- **Multi-vault** : agrège tous les vaults Obsidian automatiquement
- **Preview sur place** : lit le contenu sans ouvrir Obsidian

---

## 5. Fonctionnalités actuelles (v0.2.0)

### 5.1 Recherche
- Moteur : **ripgrep** (bundlé via `@vscode/ripgrep`)
- Détection automatique des vaults via `~/Library/Application Support/obsidian/obsidian.json`
- Ranking : title match en premier, puis tri par nombre d'occurrences dans le body
- Requête multi-mots : AND implicite (un ripgrep par mot en parallèle, intersection)
- Requête entre guillemets : word-boundary regex (`\bterme\b`)
- Smart-case automatique

### 5.2 Résultats
- Titre du fichier + badge nombre de matchs + nom du vault
- Snippet du premier match
- Mode compact (titres seuls) pour les listes denses
- Navigation clavier : ↑↓ pour parcourir, Enter pour ouvrir, Escape pour fermer

### 5.3 Preview
- Pane gauche redimensionnable (splitter drag, position mémorisée)
- **Cadenas** : fige la preview sur un fichier (hover ne la met plus à jour)
- **Bouton "Ouvrir le fichier"** : ouvre le fichier actuellement prévisualisé dans l'app par défaut
- Header fixe avec titre + contrôles
- Stepper de matchs (▲/▼ ou Shift+↑/↓)
- Toggle visibilité des highlights (persisté)
- Slider de taille de police 80%–200% (persisté)
- Scroll vers le premier match automatique

### 5.4 Interaction liste → preview
- Clic gauche : charge la preview
- Clic droit : menu contextuel avec "Afficher la prévisualisation" / "Ouvrir le fichier"
- Hover (si cadenas déverrouillé) : charge la preview avec délai 80 ms

### 5.5 Ouverture de fichier
- Ouverture via `obsidian://` URL scheme si Obsidian est l'app par défaut
- Ouverture via `open -a AppName.app` pour toute autre app sélectionnée

### 5.6 Settings (⚙)
- **Vaults** : activer/désactiver des vaults du scope de recherche
- **Launch at startup** : toggle démarrage automatique
- **Applications Markdown** : liste des apps détectées + custom, radio button pour le défaut, persistance de l'ordre et des suppressions
- **Toggle FR/EN** : langue de l'interface, détection automatique selon la langue système
- **Footer** : numéro de version, "Voir les logs", "Signaler un bug"
- **Mise à jour** : banner avec release notes + "Installer et redémarrer" / "Plus tard"

### 5.7 Système
- Raccourci global : **⌘⇧Space**
- Dark mode natif
- Fenêtre sans chrome, transparente, toujours au-dessus
- Hauteur de fenêtre auto-adaptée au contenu
- Cache preview (50 fichiers max, LRU)
- Persistance : `settings.json` (userData) + localStorage

---

## 6. Flux utilisateur principal

```
⌘⇧Space
   │
   ▼
Fenêtre apparaît → focus sur le champ de recherche
   │
   ▼
Frappe la query (debounce 150 ms)
   │
   ▼
Résultats listés à droite
   │
   ├── Hover résultat → preview live à gauche (si cadenas OFF)
   ├── Click résultat → charge preview
   ├── ↑↓ → navigue dans la liste
   └── Enter → ouvre dans l'app par défaut
   │
   ▼
Escape → fenêtre se cache
```

---

## 7. Exigences non-fonctionnelles

| Exigence | Cible |
|----------|-------|
| Temps de réponse recherche | < 200 ms pour 50 000 fichiers |
| Empreinte mémoire au repos | < 80 MB |
| Démarrage de l'app | < 1 s |
| Taille du bundle distribué | < 120 MB (DMG universel) |
| Compatibilité macOS | 12 Monterey et supérieur |
| Windows / Linux | Via GitHub Actions CI (non testé par l'auteur) |

---

## 8. Distribution & mises à jour

- **Packaging** : electron-builder, DMG universel (arm64 + x64)
- **Signature** : ad-hoc (sans Apple Developer Program), premier lancement via clic droit > Ouvrir
- **CI/CD** : GitHub Actions — build Mac/Win/Linux déclenché sur tag `v*`
- **Auto-update** : electron-updater, vérification silencieuse 8 s après lancement, consentement explicite de l'utilisateur avec release notes
- **Logs** : electron-log → `~/Library/Logs/Searchidian/main.log`
- **Bug report** : bouton → GitHub Issue pré-rempli (version, OS)
- **Modèle économique** : gratuit + Ko-fi (pas de freemium, pas de tracking)

---

## 9. Roadmap

### v0.3 — Stabilisation & cross-platform
- [ ] Tests sur macOS Intel
- [ ] Build Windows validé (SmartScreen warning documenté)
- [ ] Build Linux AppImage validé
- [ ] Gestion des erreurs ripgrep (vault inaccessible, fichier trop grand)
- [ ] Raccourci global configurable

### v0.4 — UX avancée
- [ ] Preview Markdown rendu (au lieu de texte brut)
- [ ] Historique des recherches récentes
- [ ] Filtres : par vault, par date de modification, par tag Obsidian
- [ ] Résultats groupés par vault (toggle)
- [ ] Aperçu du chemin complet dans la preview

### v1.0 — Feature-complete
- [ ] App stable, testée, documentée
- [ ] Changelog complet
- [ ] README multilingue
- [ ] Support des recherches dans les pièces jointes (PDF, images avec OCR)

### Long terme — Recherche sémantique (RAG)
- [ ] Index embeddings local (`transformers.js`)
- [ ] Vecteurs persistés dans userData
- [ ] Mode `/ask` : retrieval top-k + réponse LLM local ou API

---

## 10. Hors scope

- Édition de notes depuis Searchidian
- Synchronisation de vaults
- Application mobile native
- Gestion de vault (création, suppression)
- Support des formats non-Markdown (Word, Notion export, etc.)

---

## 11. Dépendances techniques clés

| Package | Rôle |
|---------|------|
| `electron` ^32 | Runtime desktop |
| `@vscode/ripgrep` ^1.15 | Moteur de recherche |
| `electron-builder` ^25 | Packaging & distribution |
| `electron-updater` ^6.3 | Auto-update |
| `electron-log` ^5.2 | Logging |

---

## 12. Métriques de succès

| Métrique | Cible v1.0 |
|----------|------------|
| Téléchargements | > 500 |
| Issues GitHub actives | < 5 bugs ouverts |
| Ko-fi supporters | > 20 |
| Temps de réponse moyen (p95) | < 300 ms |
| Note utilisateurs (si applicable) | ≥ 4/5 |
