const fs = require('fs');

try {
    const fileContent = fs.readFileSync('./recipes.js', 'utf8');
    // Hacky but effective for this specific file structure:
    // It starts with comments, then "const recipes = [...];"
    // We strip the prefix and suffix to get the JSON array.
    const startMarker = 'const recipes = ';
    const startIndex = fileContent.indexOf(startMarker);

    if (startIndex === -1) {
        throw new Error('Could not find start of recipes array');
    }

    const jsonString = fileContent.substring(startIndex + startMarker.length).trim().replace(/;$/, '');
    const recipes = JSON.parse(jsonString);

    console.log(`--- Deep Audit Report ---`);
    console.log(`Total Recipes: ${recipes.length}`);

    // 1. Check for Empty Ingredients (Critical)
    const emptyIngredients = recipes.filter(r => !r.ingredients || r.ingredients.length === 0);
    if (emptyIngredients.length > 0) {
        console.log(`\n[CRITICAL] Recipes with NO ingredients: ${emptyIngredients.length}`);
        emptyIngredients.forEach(r => console.log(` - ${r.name} (${r.id})`));
    } else {
        console.log(`\n[PASS] All recipes have ingredient arrays.`);
    }

    // 2. Check for Missing Sections (Warning)
    const missingChefsTable = recipes.filter(r => !r.sections || !r.sections.chefs_table || r.sections.chefs_table.trim() === '');
    console.log(`\n[INFO] Recipes without 'Chef's Critique/Plating' (Chefs Table): ${missingChefsTable.length}`);

    // Log specifics if number is low, otherwise just count
    if (missingChefsTable.length > 0 && missingChefsTable.length < 10) {
        missingChefsTable.forEach(r => console.log(`   - Missing Chef Table: ${r.name}`));
    }


    const missingMasterclass = recipes.filter(r => !r.sections || !r.sections.masterclass || r.sections.masterclass.trim() === '');
    console.log(`[INFO] Recipes without 'Why This Meal Special/Pro Tips' (Masterclass): ${missingMasterclass.length}`);

    if (missingMasterclass.length > 0 && missingMasterclass.length < 10) {
        missingMasterclass.forEach(r => console.log(`   - Missing Masterclass: ${r.name}`));
    }

    // 3. Check for Suspicious Content
    const shortContent = recipes.filter(r => !r.content || r.content.length < 50);
    if (shortContent.length > 0) {
        console.log(`\n[WARNING] Recipes with remarkably short content (<50 chars):`);
        shortContent.forEach(r => console.log(` - ${r.name} (${r.id})`));
    }

    // 4. Check for 'undefined' or 'null' strings in output
    // Serialize to string to find these literals
    const jsonDump = JSON.stringify(recipes);
    const nullMatches = (jsonDump.match(/: "null"/g) || []).length;
    const undefinedMatches = (jsonDump.match(/: "undefined"/g) || []).length;

    if (nullMatches > 0 || undefinedMatches > 0) {
        console.log(`\n[WARNING] Found literal 'null' strings: ${nullMatches}`);
        console.log(`[WARNING] Found literal 'undefined' strings: ${undefinedMatches}`);
    }

    console.log(`\n--- End Report ---`);

} catch (err) {
    console.error("Failed to parse recipes.js:", err.message);
}
