# 🤖 AGENT BRIEFING: Vacuum Sealer Guide

**Current Date:** December 1, 2025
**Project Status:** Active / Phase 1 Complete

## 🚀 Quick Start for AI Agents

If you are an AI agent starting on this project for the first time, **READ THIS FIRST.**

### 1. Project Identity

- **Name:** Vacuum Sealer Guide
- **Type:** Static Web Application (HTML/CSS/JS) + PWA
- **Goal:** A premium, scientifically-backed guide for vacuum sealing food, featuring a searchable recipe database.
- **Aesthetic:** Dark mode, glassmorphism, vibrant gradients, premium "Apple-like" feel.

### 2. Technical Architecture

- **Frontend:** Vanilla HTML5, CSS3 (Variables), JavaScript (ES6+).
- **Data Source:** Markdown files (`*.md`) in the root directory.
- **Build System:** `scripts/build-recipes.js` (Node.js).
  - **Workflow:** You edit Markdown -> Run Script -> `recipes.js` is generated -> App renders from JSON.
  - **DO NOT** edit `recipes.js` manually.
- **Mobile App:** Progressive Web App (PWA) generated via `scripts/build-mobile.js`.

### 3. Critical Rules & Standards

- **Recipe Format:** MUST follow the template in `Project_Standards.md`.
- **Food Safety:** Strict adherence to botulism prevention (no raw garlic/onions in long-term storage, etc.). See `Project_Standards.md`.
- **Code Style:** Clean, commented vanilla JS. No frameworks (React/Vue) unless explicitly requested.
- **Mobile First:** All UI changes must be responsive.

### 4. Key Files Map

- `index.html`: Main entry point. Contains hardcoded layout but dynamic meal cards.
- `main.js`: Core logic (Navigation, Filtering, Favorites, Modal rendering).
- `scripts/build-recipes.js`: The compiler. **Update `SOURCE_FILES` array here when adding new markdown files.**
- `scripts/build-mobile.js`: Generates the `mobile-build` folder for deployment.
- `docs/`: Contains all context, guides, and analysis.

### 5. Current Roadmap (Next Steps)

Refer to `docs/current_task_status.md` for the live checklist.

- **Immediate Priority:** Phase 2 - Vegetarian Recipes (Gap Analysis: Need 10-12 more).
- **Secondary:** Seafood Recipes (Need 6-8 more).
- **Tertiary:** Lamb & Game Meats.

### 6. How to Deploy/Build

1. **Update Content:** Edit Markdown.
2. **Build Data:** `node scripts/build-recipes.js`
3. **Build Mobile:** `node scripts/build-mobile.js`
4. **Deploy:** Upload `mobile-build` folder to host.

---
*End of Briefing. You are now ready to assist.*
