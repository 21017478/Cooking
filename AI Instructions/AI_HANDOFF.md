# Vacuum Sealer Guide - Project Handoff

## Overview

This is a complete, standalone web application for a Vacuum Sealer Guide. It includes an interactive HTML app, a build system for generating recipe data from Markdown files, and a structured set of recipe source files.

## Directory Structure

```
Vaccum/
├── index.html              # Main application entry point (Open this in browser)
├── main.js                 # Core application logic (Navigation, Filtering, Favorites)
├── recipes.js              # AUTO-GENERATED data file containing all recipes
├── icon.png                # Application icon
├── Project_Standards.md    # Coding standards and guidelines
├── src/
│   ├── data/               # Source Markdown files for recipes
│   │   ├── complete-food-ideas.md
│   │   ├── detailed-recipes.md
│   │   ├── premium-meals-detailed.md
│   │   └── ... (other category files)
│   └── scripts/            # Build scripts
│       └── build-recipes.js # Node.js script to compile markdown -> recipes.js
├── docs/                   # Documentation
└── _archive/               # Old backups and unused files (Ignore these)
```

## How to Develop

1. **Edit Content**: Modify the Markdown files in `src/data/`.
2. **Build Data**: Run `node src/scripts/build-recipes.js` from the root `Vaccum` directory.
    * This parses the markdown files and updates `recipes.js`.
3. **Test**: Open `index.html` in a web browser. No server required (it uses local `recipes.js`).

## Key Files

* **`index.html`**: The UI structure. Contains the filter bar and empty containers for dynamic content.
* **`main.js`**: Handles the logic. It reads the global `recipes` array from `recipes.js` and renders meal cards.
* **`src/scripts/build-recipes.js`**: The bridge between content and code. It uses Regex to parse recipe headers (e.g., `### 🍔 RECIPE 001: Name`) and metadata.

## Notes for Next AI

* **Do not edit `recipes.js` manually.** Always update the markdown source and run the build script.
* **`_archive` folder** contains previous iterations and backups. You can safely ignore it unless you need to recover something.
* The app is designed to be **offline-first** and **zero-dependency** (vanilla HTML/CSS/JS).
