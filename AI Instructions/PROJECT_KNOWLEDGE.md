# Vacuum Sealer Guide - Project Knowledge & Lessons Learned

## 🧠 Core Philosophy

This project is a **Zero-Dependency, Offline-First** web application.

* **No Frameworks**: Vanilla HTML, CSS, and JavaScript.
* **No Build Step for UI**: `index.html` works directly in the browser.
* **Node.js for Data**: We use Node.js *only* to compile Markdown recipes into a JSON object (`recipes.js`).

---

## 🏗️ Architecture

### 1. The Data Pipeline

* **Source**: Markdown files in `src/data/` (e.g., `detailed-recipes.md`, `premium-meals-detailed.md`).
* **Compiler**: `src/scripts/build-recipes.js`.
* **Output**: `recipes.js` (Root directory).
* **Mechanism**: The script reads all markdown files, parses headers using Regex, and generates a global `recipes` array.

### 2. The Frontend

* **`index.html`**: The skeleton. Contains the layout, navigation, and empty containers for dynamic content.
* **`main.js`**: The brain.
  * Loads recipes from the global `recipes` array.
  * Handles navigation (SPA-like feel without routing).
  * Manages the "Favorites" system (localStorage).
  * **Crucial**: Controls the Hero Section visibility.

---

## ⚠️ Critical Lessons Learned (READ THIS)

### 1. The Fragility of `index.html`

**Issue**: We experienced repeated file corruption when using AI tools to "replace" parts of `index.html`.
**Lesson**:

* **Never** do partial string replacements on `index.html` if possible.
* **Always** prefer reading the full file, modifying it locally, and writing the full file back.
* **Backup**: Always keep a `Backup.html` in `_archive/` before making structural changes.

### 2. Hero Section Visibility

**Logic**: The Hero Section ("Master the Art...") must **only** appear on the "Benefits" page.
**Implementation**:

* It is NOT controlled by CSS classes alone.
* It is controlled by `main.js` in the `handleNavClick` function.
* **Code**:

    ```javascript
    const heroSection = document.querySelector('.hero');
    if (heroSection) {
        heroSection.style.display = (targetSectionId === 'benefits') ? 'block' : 'none';
    }
    ```

* **Gotcha**: If you edit the HTML structure of the hero, ensure the `.hero` class remains on the parent container, or this logic will break.

### 3. Recipe Parsing Regex

**Issue**: The build script relies on specific Markdown headers.
**Format**: `### 🍔 RECIPE 001: Name` or `## PREMIUM MEAL 001: Name`.
**Lesson**: If you add a new recipe and it doesn't show up:

* Check the header format.
* Ensure there is a newline after the header.
* Ensure the file is listed in the `SOURCE_FILES` array in `src/scripts/build-recipes.js`.

---

## 📝 Outstanding Tasks / Next Steps

### 1. Missing Filter Buttons

**Status**: The logic works, but the buttons are missing from the HTML.
**Task**: Add the following buttons to `index.html` inside `<div class="filter-bar">`:

```html
<button class="filter-btn" data-category="premium">💎 Premium</button>
<button class="filter-btn" data-category="vegetarian">🥗 Vegetarian</button>
<button class="filter-btn" data-category="breakfast">🍳 Breakfast</button>
<button class="filter-btn" data-category="dessert">🍰 Dessert</button>
```

**Location**: Insert after the "Vegetables" button.

### 2. Premium Images

**Status**: Premium recipes currently use generic emojis.
**Task**: Generate AI images for the 12 premium meals and link them in the markdown metadata or a separate mapping file.

---

## 🛠️ Common Commands

**Build Recipes**:

```bash
node src/scripts/build-recipes.js
```

**Restore Backup**:

```bash
Copy-Item "_archive/Backup.html" "index.html"
```
