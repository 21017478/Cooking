# Vacuum Sealer Guide - Troubleshooting

## 🚨 Emergency: "The App is Broken!"

### Scenario 1: `index.html` is blank or mangled

**Cause**: Likely a failed AI edit or partial write.
**Fix**:

1. Go to `_archive/`.
2. Find the latest `Backup.html` (or `vacuum-app-deploy-ready.zip`).
3. Copy it to the root as `index.html`.
4. **Verify**: Open in browser.

### Scenario 2: Recipes are missing

**Cause**: `recipes.js` is empty or the build script failed.
**Fix**:

1. Open terminal in root `Vaccum` folder.
2. Run: `node src/scripts/build-recipes.js`
3. Check output for "Warning: File not found".
4. If a file is missing, check `src/data/` and ensure the filename matches `SOURCE_FILES` in `build-recipes.js`.

### Scenario 3: Hero Section is visible on all pages

**Cause**: Browser cache is holding onto old JavaScript.
**Fix**:

1. Open the app in the browser.
2. Press **Ctrl + F5** (Hard Refresh).
3. Click "Meal Ideas" to verify it disappears.

### Scenario 4: New Recipe not showing up

**Cause**: Header format in Markdown is incorrect.
**Fix**:

1. Open the markdown file.
2. Ensure the header looks like: `### 🍔 RECIPE 001: My Recipe`
3. Ensure there is a blank line after the header.
4. Run the build script again.

---

## 🔍 Debugging Tools

**Browser Console**:

* Press `F12` -> Console.
* Look for red errors.
* "recipes is not defined" -> `recipes.js` failed to load or is empty.

**File Hash Check**:

* To see if `main.js` has changed:

    ```powershell
    Get-FileHash main.js
    ```
