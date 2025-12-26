# 📘 Developer Guide & Maintenance Manual

**Project:** Vacuum Sealer Guide Web App & PWA
**Last Updated:** December 1, 2025

This document provides technical guidance for maintaining, expanding, and deploying the Vacuum Sealer Guide project.

---

## 🥘 Recipe Management

### How to Add New Recipes

The project uses a **Markdown-to-JSON** build system. You do NOT edit `recipes.js` directly.

1. **Create/Edit Markdown File:**
    - Navigate to the root directory.
    - Open an existing recipe file (e.g., `tier2-pork-detailed.md`) or create a new one.
    - **CRITICAL:** Follow the template in `Project_Standards.md`.
    - Use the format: `### 🥓 RECIPE ID-001: Recipe Name`

2. **Register New Files (If applicable):**
    - If you created a *new* `.md` file, you must add it to the `SOURCE_FILES` array in `scripts/build-recipes.js`.

3. **Build the Database:**
    - Open a terminal in the project root.
    - Run: `node scripts/build-recipes.js`
    - This parses all markdown files and regenerates `recipes.js`.

4. **Verify:**
    - Open `index.html` in your browser.
    - The new recipes should appear automatically under "All Ideas" and their respective categories.

---

## 📱 Mobile App (PWA) Updates

The mobile app is a Progressive Web App (PWA) generated from the main website source.

### How to Update the App

Whenever you change recipes or code, you must regenerate the mobile build.

1. **Run the Mobile Build Script:**
    - Open a terminal in the project root.
    - Run: `node scripts/build-mobile.js`
    - This will:
        - Clean the `mobile-build` folder.
        - Copy the latest `recipes.js`, `main.js`, and `index.html`.
        - Inject PWA tags (manifest, service worker).
        - Update the `manifest.json` with screenshots.

2. **Deploy:**
    - Upload the contents of `mobile-build` (or the `vacuum-app-deploy-ready.zip`) to your hosting provider (Netlify, GitHub Pages, etc.).

3. **Update on Phone:**
    - Users simply need to close and reopen the app (or refresh the page) to get the latest version.

---

## 🏗️ Project Architecture

### Core Files

- **`index.html`**: The main structure. Contains the layout and UI elements.
  - *Note:* Meal cards are rendered dynamically; do not hardcode them here.
- **`main.js`**: The application logic.
  - Handles navigation, filtering, favorites, and dynamic recipe rendering (`renderMealCards`).
- **`recipes.js`**: The database.
  - **DO NOT EDIT MANUALLY.** This is auto-generated.
- **`scripts/build-recipes.js`**: The compiler.
  - Reads Markdown files -> Regex parsing -> Outputs JSON.
- **`scripts/build-mobile.js`**: The PWA generator.
  - Packages the app for mobile distribution.

### Directory Structure

```
/
├── scripts/              # Build automation scripts
├── mobile-build/         # Generated PWA ready for deployment
├── apk-project/          # Generated Android project source
├── docs/                 # Documentation (Standards, Changelogs)
├── *.md                  # Recipe source files
├── index.html            # Main entry point
├── main.js               # App logic
└── recipes.js            # Generated data
```

---

## ⚠️ Troubleshooting

**Issue: New recipes aren't showing up.**

- **Check:** Did you run `node scripts/build-recipes.js`?
- **Check:** Is the markdown file listed in `scripts/build-recipes.js`?
- **Check:** Does the recipe title follow the strict format `### 🥓 RECIPE ID: Name`?

**Issue: App isn't updating on phone.**

- **Check:** Did you run `node scripts/build-mobile.js`?
- **Check:** Did you deploy the *new* files to the server?
- **Try:** Clear browser cache on the phone.
