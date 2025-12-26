/**
 * VacuPrep - Main Application Logic
 * Phase 2: Clean Dark Mode PWA with Universal Favoriting
 */

document.addEventListener('DOMContentLoaded', function () {
    initializeApp();
});

// ==========================================
// GLOBAL STATE
// ==========================================
const AppState = {
    favorites: [],
    notes: {},
    customRecipes: [],
    hiddenRecipes: [],
    weekPlan: {},
    shoppingList: [],
    theme: 'dark',
    activeSection: 'favorites',
    searchQuery: '',
    editingRecipeId: null,
    deletingRecipeId: null,
    hidingRecipeId: null,
    currentSuggestion: null,
    suggestType: null
};

// ==========================================
// INITIALIZATION
// ==========================================
// ==========================================
// INITIALIZATION
// ==========================================
function initializeApp() {
    // 1. Load Data
    loadFavorites();
    loadNotes();
    loadTheme();
    loadCustomRecipes();
    loadHiddenRecipes();
    loadWeekPlan();
    loadShoppingList();

    // 2. Render UI
    renderRecipeCards();
    renderFavorites();
    renderWeekPlanner();
    renderShoppingList();

    // 3. Setup Interactions
    setupEventListeners();
}

function setupEventListeners() {
    setupNavigation();
    setupFiltering();
    setupSearch();
    setupTipPinning();
    setupRecipeModal();
    setupFavoriteReordering();
    setupThemeToggle();
    setupRecipeForm();
    setupPlanner();
    setupShopping();
    setupSuggest();
    setupInstallPrompt();
    setupBackup();
}

// ==========================================
// FAVORITES SYSTEM (Universal)
// ==========================================
function loadFavorites() {
    AppState.favorites = safeJSONParse('vacuprep_favorites', []);
}

function saveFavorites() {
    localStorage.setItem('vacuprep_favorites', JSON.stringify(AppState.favorites));
}

function addFavorite(item) {
    // item: { id: string, type: 'recipe' | 'tip', name: string, icon: string, meta?: string }
    if (!AppState.favorites.find(f => f.id === item.id)) {
        AppState.favorites.push(item);
        saveFavorites();
        renderFavorites();
        updateFavoriteButtons();
    }
}

function removeFavorite(id) {
    AppState.favorites = AppState.favorites.filter(f => f.id !== id);
    saveFavorites();
    renderFavorites();
    updateFavoriteButtons();
}

function isFavorite(id) {
    return AppState.favorites.some(f => f.id === id);
}

function reorderFavorites(fromIndex, toIndex) {
    const item = AppState.favorites.splice(fromIndex, 1)[0];
    AppState.favorites.splice(toIndex, 0, item);
    saveFavorites();
    renderFavorites();
}

// ==========================================
// RENDER FAVORITES LIST
// ==========================================
function renderFavorites() {
    const container = document.getElementById('favorites-container');
    if (!container) return;

    if (AppState.favorites.length === 0) {
        container.innerHTML = `
            <div class="favorites-empty">
                <div class="favorites-empty-icon">⭐</div>
                <h3>No favorites yet</h3>
                <p>Pin recipes and tips from the other sections<br>to build your personalized quick-access list.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="favorites-list" id="favorites-list">
            ${AppState.favorites.map((fav, index) => `
                <div class="favorite-item" data-id="${fav.id}" data-index="${index}" draggable="true">
                    <span class="favorite-drag-handle">⋮⋮</span>
                    <span class="favorite-icon">${fav.icon || '📌'}</span>
                    <div class="favorite-content">
                        <div class="favorite-title">${fav.name}</div>
                        <div class="favorite-meta">
                            <span class="favorite-type ${fav.type}">${fav.type}</span>
                            ${fav.meta ? `<span> · ${fav.meta}</span>` : ''}
                        </div>
                    </div>
                    <button class="favorite-remove" data-id="${fav.id}" title="Remove from favorites">✕</button>
                </div>
            `).join('')}
        </div>
    `;

    // Add click handlers for favorite items
    container.querySelectorAll('.favorite-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (e.target.classList.contains('favorite-remove') ||
                e.target.classList.contains('favorite-drag-handle')) return;

            const fav = AppState.favorites.find(f => f.id === item.dataset.id);
            if (fav && fav.type === 'recipe') {
                showRecipeDetail(fav.name);
            } else if (fav && fav.type === 'tip') {
                // Navigate to guides and highlight the tip
                navigateToSection('guides');
                setTimeout(() => {
                    const tipCard = document.querySelector(`[data-tip-id="${fav.id}"]`);
                    if (tipCard) {
                        tipCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        tipCard.style.boxShadow = '0 0 0 2px var(--primary)';
                        setTimeout(() => tipCard.style.boxShadow = '', 2000);
                    }
                }, 300);
            }
        });
    });

    // Add remove handlers
    container.querySelectorAll('.favorite-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeFavorite(btn.dataset.id);
        });
    });
}

// ==========================================
// FAVORITE REORDERING (Drag & Drop)
// ==========================================
function setupFavoriteReordering() {
    let draggedItem = null;
    let draggedIndex = -1;

    document.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('favorite-item')) {
            draggedItem = e.target;
            draggedIndex = parseInt(e.target.dataset.index);
            e.target.style.opacity = '0.5';
        }
    });

    document.addEventListener('dragend', (e) => {
        if (draggedItem) {
            draggedItem.style.opacity = '1';
            draggedItem = null;
            draggedIndex = -1;
        }
    });

    document.addEventListener('dragover', (e) => {
        e.preventDefault();
        const target = e.target.closest('.favorite-item');
        if (target && target !== draggedItem) {
            const rect = target.getBoundingClientRect();
            const after = e.clientY > rect.top + rect.height / 2;
            target.style.borderTop = after ? '' : '2px solid var(--primary)';
            target.style.borderBottom = after ? '2px solid var(--primary)' : '';
        }
    });

    document.addEventListener('dragleave', (e) => {
        const target = e.target.closest('.favorite-item');
        if (target) {
            target.style.borderTop = '';
            target.style.borderBottom = '';
        }
    });

    document.addEventListener('drop', (e) => {
        e.preventDefault();
        const target = e.target.closest('.favorite-item');
        if (target && draggedItem && target !== draggedItem) {
            target.style.borderTop = '';
            target.style.borderBottom = '';
            const toIndex = parseInt(target.dataset.index);
            if (draggedIndex !== -1 && toIndex !== draggedIndex) {
                reorderFavorites(draggedIndex, toIndex);
            }
        }
    });
}

// ==========================================
// RECIPE CARDS
// ==========================================
function renderRecipeCards() {
    const grid = document.getElementById('recipe-grid');
    if (!grid) return;

    grid.innerHTML = '';

    // Combine built-in recipes with custom recipes, filter out hidden ones
    const builtInRecipes = (typeof recipes !== 'undefined' ? recipes : [])
        .filter(r => !AppState.hiddenRecipes.includes(r.id));

    const allRecipes = [
        ...builtInRecipes,
        ...AppState.customRecipes
    ];

    allRecipes.forEach(recipe => {
        const card = document.createElement('div');
        card.className = 'recipe-card show' + (recipe.isCustom ? ' custom' : ' builtin');
        card.dataset.category = recipe.category;
        card.dataset.recipeId = recipe.id;
        card.dataset.name = recipe.name;

        const isFav = isFavorite(recipe.id);

        card.innerHTML = `
            ${recipe.isCustom ? '<span class="recipe-custom-badge">Custom</span>' : ''}
            <div class="recipe-card-header">
                <span class="recipe-category-badge">${recipe.category}</span>
                <button class="recipe-favorite-btn ${isFav ? 'active' : ''}" 
                        data-recipe-id="${recipe.id}" 
                        data-recipe-name="${recipe.name}"
                        data-recipe-icon="${recipe.image || '🍽️'}"
                        title="${isFav ? 'Remove from favorites' : 'Add to favorites'}">
                    ${isFav ? '★' : '☆'}
                </button>
            </div>
            <div class="recipe-title">
                <span class="recipe-emoji">${recipe.image || '🍽️'}</span>
                <span>${recipe.name}</span>
            </div>
            <p class="recipe-description">${recipe.description || 'Delicious vacuum-sealed meal prep recipe.'}</p>
            <div class="recipe-meta">
                <span>⏱️ ${recipe.prepTime || 'Varies'}</span>
                <span>❄️ ${recipe.totalTime || 'See recipe'}</span>
            </div>
            <div class="recipe-card-actions">
                <button class="recipe-card-action edit" data-id="${recipe.id}" data-custom="${recipe.isCustom || false}" title="Edit">✏️</button>
                <button class="recipe-card-action delete" data-id="${recipe.id}" data-name="${recipe.name}" data-custom="${recipe.isCustom || false}" title="${recipe.isCustom ? 'Delete' : 'Hide'}">🗑️</button>
            </div>
        `;

        // Click to open modal (or edit for custom)
        card.addEventListener('click', (e) => {
            if (e.target.classList.contains('recipe-favorite-btn')) return;
            if (e.target.classList.contains('recipe-card-action')) return;

            if (recipe.isCustom) {
                // Show custom recipe in a simpler view (or could open edit form)
                showCustomRecipeDetail(recipe);
            } else {
                showRecipeDetail(recipe.name);
            }
        });

        // Favorite button
        const favBtn = card.querySelector('.recipe-favorite-btn');
        favBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const recipeId = favBtn.dataset.recipeId;
            if (isFavorite(recipeId)) {
                removeFavorite(recipeId);
            } else {
                addFavorite({
                    id: recipeId,
                    type: 'recipe',
                    name: favBtn.dataset.recipeName,
                    icon: favBtn.dataset.recipeIcon,
                    meta: recipe.category
                });
            }
        });

        // Edit button - for custom: opens form, for built-in: duplicates then opens form
        const editBtn = card.querySelector('.recipe-card-action.edit');
        editBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            const isCustom = editBtn.dataset.custom === 'true';
            if (isCustom) {
                openRecipeForm(recipe.id);
            } else {
                // Duplicate built-in to custom, hide original, open form
                editBuiltInRecipe(recipe);
            }
        });

        // Delete button - for custom: deletes, for built-in: hides (with confirmation)
        const deleteBtn = card.querySelector('.recipe-card-action.delete');
        deleteBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            const isCustom = deleteBtn.dataset.custom === 'true';
            if (isCustom) {
                openDeleteModal(recipe.id, recipe.name);
            } else {
                openHideModal(recipe.id, recipe.name);
            }
        });

        grid.appendChild(card);
    });

    // Update note badges
    updateNoteBadges();
}

// Show custom recipe detail
function showCustomRecipeDetail(recipe) {
    const modal = document.getElementById('recipeModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalTabs = document.getElementById('modalTabs');
    const modalBody = document.getElementById('modalBody');

    modalTitle.textContent = recipe.name;
    modalTabs.innerHTML = '';

    let content = '';

    if (recipe.description) {
        content += `<p>${recipe.description}</p>`;
    }

    if (recipe.ingredients && recipe.ingredients.length) {
        content += '<h3>Ingredients</h3><ul>';
        recipe.ingredients.forEach(i => {
            content += `<li>${i}</li>`;
        });
        content += '</ul>';
    }

    if (recipe.steps && recipe.steps.length) {
        content += '<h3>Instructions</h3><ol>';
        recipe.steps.forEach(s => {
            content += `<li>${s}</li>`;
        });
        content += '</ol>';
    }

    if (recipe.vacuumTips) {
        content += `<h3>Vacuum Sealing Tips</h3><p>${recipe.vacuumTips}</p>`;
    }

    modalBody.innerHTML = content || '<p>No details available.</p>';

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function updateFavoriteButtons() {
    // Update recipe cards
    document.querySelectorAll('.recipe-favorite-btn').forEach(btn => {
        const recipeId = btn.dataset.recipeId;
        const isFav = isFavorite(recipeId);
        btn.classList.toggle('active', isFav);
        btn.textContent = isFav ? '★' : '☆';
        btn.title = isFav ? 'Remove from favorites' : 'Add to favorites';
    });

    // Update tip pin buttons
    document.querySelectorAll('.tip-pin-btn').forEach(btn => {
        const tipCard = btn.closest('.tip-card');
        if (tipCard) {
            const tipId = tipCard.dataset.tipId;
            const isFav = isFavorite(tipId);
            btn.classList.toggle('active', isFav);
        }
    });
}

// ==========================================
// CATEGORY FILTERING
// ==========================================
function setupFiltering() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active states
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            // Trigger combined filter
            filterRecipes();
        });
    });
}

// ==========================================
// TIP PINNING
// ==========================================
function setupTipPinning() {
    document.querySelectorAll('.tip-pin-btn').forEach(btn => {
        const tipCard = btn.closest('.tip-card');
        if (!tipCard) return;

        const tipId = tipCard.dataset.tipId;
        const titleEl = tipCard.querySelector('.tip-title');
        const tipName = titleEl ? titleEl.textContent.trim() : 'Tip';
        const icon = tipName.match(/^[\p{Emoji}]/u)?.[0] || '💡';

        // Set initial state
        if (isFavorite(tipId)) {
            btn.classList.add('active');
        }

        btn.addEventListener('click', () => {
            if (isFavorite(tipId)) {
                removeFavorite(tipId);
            } else {
                addFavorite({
                    id: tipId,
                    type: 'tip',
                    name: tipName,
                    icon: icon,
                    meta: tipCard.classList.contains('safety') ? 'Safety' : 'Best Practice'
                });
            }
        });
    });
}

// ==========================================
// NAVIGATION
// ==========================================
function setupNavigation() {
    // Desktop navigation
    document.querySelectorAll('.desktop-nav-btn').forEach(btn => {
        btn.addEventListener('click', () => navigateToSection(btn.dataset.section));
    });

    // Mobile bottom navigation
    document.querySelectorAll('.bottom-nav-btn').forEach(btn => {
        btn.addEventListener('click', () => navigateToSection(btn.dataset.section));
    });
}

function navigateToSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));

    // Show target section
    const target = document.getElementById(sectionId);
    if (target) {
        target.classList.add('active');
        AppState.activeSection = sectionId;
    }

    // Update nav buttons
    document.querySelectorAll('.desktop-nav-btn, .bottom-nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.section === sectionId);
    });

    // Scroll to top
    document.querySelector('main').scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================
// FILTERING
// ==========================================
function setupFiltering() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.dataset.category;

            // Update active button
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Filter cards
            document.querySelectorAll('.recipe-card').forEach(card => {
                if (category === 'all' || card.dataset.category === category) {
                    card.classList.add('show');
                } else {
                    card.classList.remove('show');
                }
            });
        });
    });
}

// ==========================================
// RECIPE MODAL
// ==========================================
function setupRecipeModal() {
    const modal = document.getElementById('recipeModal');
    const closeBtn = document.getElementById('modalClose');

    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
}

function closeModal() {
    const modal = document.getElementById('recipeModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function showRecipeDetail(recipeIdentifier) {
    const modal = document.getElementById('recipeModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalTabs = document.getElementById('modalTabs');
    const modalBody = document.getElementById('modalBody');

    if (!modal || !modalTitle || !modalBody) return;

    // Normalize the identifier
    const normalizedIdentifier = recipeIdentifier
        .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
        .replace(/[^\w\s-]/g, '')
        .trim()
        .toLowerCase();

    let recipeData = null;
    if (typeof recipes !== 'undefined') {
        // Try exact ID match
        recipeData = recipes.find(r => r.id && r.id.toLowerCase() === normalizedIdentifier);

        // Fallback: exact name match
        if (!recipeData) {
            recipeData = recipes.find(r => r.name === recipeIdentifier);
        }

        // Fallback: normalized name match
        if (!recipeData) {
            recipeData = recipes.find(r => {
                const normalizedName = r.name
                    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
                    .replace(/[^\w\s-]/g, '')
                    .trim()
                    .toLowerCase();
                return normalizedName === normalizedIdentifier ||
                    normalizedName.includes(normalizedIdentifier) ||
                    normalizedIdentifier.includes(normalizedName);
            });
        }
    }

    const displayTitle = recipeData ? recipeData.name : recipeIdentifier;
    modalTitle.textContent = displayTitle;

    // Build tabs if recipe has sections
    if (recipeData && recipeData.sections) {
        const sections = recipeData.sections;
        const tabOrder = ['essentials', 'masterclass', 'chefs_table', 'nutrition'];
        const tabNames = {
            essentials: 'Essentials',
            masterclass: 'Masterclass',
            chefs_table: "Chef's Table",
            nutrition: 'Nutrition'
        };

        let tabsHtml = '';
        let contentHtml = '';
        let firstTab = true;

        tabOrder.forEach(key => {
            if (sections[key]) {
                tabsHtml += `<button class="modal-tab-btn ${firstTab ? 'active' : ''}" data-tab="${key}">${tabNames[key]}</button>`;
                contentHtml += `<div class="modal-tab-content ${firstTab ? 'active' : ''}" data-tab-content="${key}">${sections[key]}</div>`;
                firstTab = false;
            }
        });

        modalTabs.innerHTML = tabsHtml;
        modalBody.innerHTML = contentHtml;

        // Tab click handlers
        modalTabs.querySelectorAll('.modal-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                modalTabs.querySelectorAll('.modal-tab-btn').forEach(b => b.classList.remove('active'));
                modalBody.querySelectorAll('.modal-tab-content').forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                modalBody.querySelector(`[data-tab-content="${btn.dataset.tab}"]`)?.classList.add('active');
            });
        });
    } else {
        modalTabs.innerHTML = '';
        modalBody.innerHTML = '<p>Recipe details not available.</p>';
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// ==========================================
// THEME TOGGLE
// ==========================================
function loadTheme() {
    try {
        const stored = localStorage.getItem('vacuprep_theme');
        AppState.theme = stored || 'dark';
        applyTheme();
    } catch (e) {
        AppState.theme = 'dark';
    }
}

function applyTheme() {
    if (AppState.theme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        document.querySelector('#theme-toggle')?.textContent && (document.querySelector('#theme-toggle').textContent = '☀️');
    } else {
        document.documentElement.removeAttribute('data-theme');
        document.querySelector('#theme-toggle')?.textContent && (document.querySelector('#theme-toggle').textContent = '🌙');
    }
}

function setupThemeToggle() {
    const toggleBtn = document.getElementById('theme-toggle');
    if (!toggleBtn) return;

    // Set initial icon
    toggleBtn.textContent = AppState.theme === 'light' ? '☀️' : '🌙';

    toggleBtn.addEventListener('click', () => {
        AppState.theme = AppState.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('vacuprep_theme', AppState.theme);
        applyTheme();
    });
}

// ==========================================
// SEARCH FUNCTIONALITY
// ==========================================
function setupSearch() {
    const searchInput = document.getElementById('recipe-search');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        AppState.searchQuery = e.target.value.toLowerCase().trim();
        filterRecipes();
    });
}

function filterRecipes() {
    const cards = document.querySelectorAll('.recipe-card');
    const query = AppState.searchQuery;
    const activeCategory = document.querySelector('.filter-btn.active')?.dataset.category || 'all';

    cards.forEach(card => {
        const name = (card.dataset.name || '').toLowerCase();
        const category = card.dataset.category || '';
        const description = (card.querySelector('.recipe-description')?.textContent || '').toLowerCase();

        // Category filter
        let matchesCategory = activeCategory === 'all' || category.includes(activeCategory);

        // Search filter
        let matchesSearch = !query ||
            name.includes(query) ||
            description.includes(query) ||
            category.includes(query);

        if (matchesCategory && matchesSearch) {
            card.classList.add('show');
        } else {
            card.classList.remove('show');
        }
    });
}

// ==========================================
// RECIPE NOTES
// ==========================================


function saveNotes() {
    localStorage.setItem('vacuprep_notes', JSON.stringify(AppState.notes));
}

function getNote(recipeId) {
    return AppState.notes[recipeId] || '';
}

function setNote(recipeId, note) {
    if (note.trim()) {
        AppState.notes[recipeId] = note.trim();
    } else {
        delete AppState.notes[recipeId];
    }
    saveNotes();
    // Update note badges on cards
    updateNoteBadges();
}

function updateNoteBadges() {
    document.querySelectorAll('.recipe-card').forEach(card => {
        const recipeId = card.dataset.name;
        const existingBadge = card.querySelector('.recipe-note-badge');

        if (AppState.notes[recipeId]) {
            if (!existingBadge) {
                const badge = document.createElement('span');
                badge.className = 'recipe-note-badge';
                badge.textContent = '📝';
                card.appendChild(badge);
            }
        } else if (existingBadge) {
            existingBadge.remove();
        }
    });
}

// ==========================================
// CUSTOM RECIPES SYSTEM
// ==========================================


function saveCustomRecipes() {
    localStorage.setItem('vacuprep_custom_recipes', JSON.stringify(AppState.customRecipes));
}

// ==========================================
// HIDDEN RECIPES SYSTEM
// ==========================================


function saveHiddenRecipes() {
    localStorage.setItem('vacuprep_hidden_recipes', JSON.stringify(AppState.hiddenRecipes));
}

function hideBuiltInRecipe(id) {
    if (!AppState.hiddenRecipes.includes(id)) {
        AppState.hiddenRecipes.push(id);
        saveHiddenRecipes();
        renderRecipeCards();
    }
}

function unhideBuiltInRecipe(id) {
    AppState.hiddenRecipes = AppState.hiddenRecipes.filter(r => r !== id);
    saveHiddenRecipes();
    renderRecipeCards();
}

function editBuiltInRecipe(recipe) {
    // Create a custom copy of the built-in recipe
    const customCopy = {
        id: 'custom-' + Date.now(),
        name: recipe.name,
        category: recipe.category,
        image: recipe.image || getCategoryEmoji(recipe.category),
        description: recipe.description || '',
        prepTime: recipe.prepTime || 'N/A',
        totalTime: recipe.totalTime || 'N/A',
        isCustom: true,
        ingredients: recipe.ingredients || [],
        steps: recipe.steps || [],
        vacuumTips: recipe.vacuumTips || '',
        originalId: recipe.id, // Track which recipe this was cloned from
        createdAt: new Date().toISOString()
    };

    AppState.customRecipes.push(customCopy);
    saveCustomRecipes();

    // Hide the original
    hideBuiltInRecipe(recipe.id);

    // Open the form to edit
    openRecipeForm(customCopy.id);
}

function openHideModal(recipeId, recipeName) {
    const modal = document.getElementById('deleteConfirmModal');
    const nameSpan = document.getElementById('deleteRecipeName');
    const title = modal.querySelector('.modal-title');

    AppState.hidingRecipeId = recipeId;
    AppState.deletingRecipeId = null;
    nameSpan.textContent = recipeName;
    title.textContent = 'Hide Recipe?';
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function getCategoryEmoji(category) {
    const emojis = {
        beef: '🥩', chicken: '🍗', lamb: '🍖', pork: '🥓',
        seafood: '🦐', vegetables: '🥦', vegetarian: '🥗',
        breakfast: '🍳', dessert: '🍰', other: '🍽️'
    };
    return emojis[category] || '🍽️';
}

function createCustomRecipe(data) {
    const recipe = {
        id: 'custom-' + Date.now(),
        name: data.name,
        category: data.category,
        image: getCategoryEmoji(data.category),
        description: data.description || '',
        prepTime: data.prepTime || 'N/A',
        totalTime: data.cookTime || 'N/A',
        isCustom: true,
        ingredients: data.ingredients.split('\n').filter(i => i.trim()),
        steps: data.steps.split('\n').filter(s => s.trim()),
        vacuumTips: data.vacuumTips || '',
        createdAt: new Date().toISOString()
    };

    AppState.customRecipes.push(recipe);
    saveCustomRecipes();
    renderRecipeCards();
    return recipe;
}

function updateCustomRecipe(id, data) {
    const index = AppState.customRecipes.findIndex(r => r.id === id);
    if (index === -1) return false;

    AppState.customRecipes[index] = {
        ...AppState.customRecipes[index],
        name: data.name,
        category: data.category,
        image: getCategoryEmoji(data.category),
        description: data.description || '',
        prepTime: data.prepTime || 'N/A',
        totalTime: data.cookTime || 'N/A',
        ingredients: data.ingredients.split('\n').filter(i => i.trim()),
        steps: data.steps.split('\n').filter(s => s.trim()),
        vacuumTips: data.vacuumTips || '',
        updatedAt: new Date().toISOString()
    };

    saveCustomRecipes();
    renderRecipeCards();
    return true;
}

function deleteCustomRecipe(id) {
    AppState.customRecipes = AppState.customRecipes.filter(r => r.id !== id);
    saveCustomRecipes();
    renderRecipeCards();
}

function getCustomRecipeById(id) {
    return AppState.customRecipes.find(r => r.id === id);
}

// ==========================================
// RECIPE FORM HANDLING
// ==========================================
function setupRecipeForm() {
    const fab = document.getElementById('addRecipeFab');
    const formModal = document.getElementById('recipeFormModal');
    const formClose = document.getElementById('formModalClose');
    const cancelBtn = document.getElementById('cancelRecipeForm');
    const form = document.getElementById('recipeForm');
    const deleteModal = document.getElementById('deleteConfirmModal');
    const cancelDelete = document.getElementById('cancelDelete');
    const confirmDelete = document.getElementById('confirmDelete');

    if (!fab || !formModal || !form) return;

    // Open form for new recipe
    fab.addEventListener('click', () => {
        openRecipeForm();
    });

    // Close form
    formClose?.addEventListener('click', closeRecipeForm);
    cancelBtn?.addEventListener('click', closeRecipeForm);
    formModal.addEventListener('click', (e) => {
        if (e.target === formModal) closeRecipeForm();
    });

    // Form submit
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const data = {
            name: document.getElementById('recipeName').value.trim(),
            category: document.getElementById('recipeCategory').value,
            prepTime: document.getElementById('recipePrepTime').value.trim(),
            cookTime: document.getElementById('recipeCookTime').value.trim(),
            description: document.getElementById('recipeDescription').value.trim(),
            ingredients: document.getElementById('recipeIngredients').value.trim(),
            steps: document.getElementById('recipeSteps').value.trim(),
            vacuumTips: document.getElementById('recipeVacuumTips').value.trim()
        };

        const editId = document.getElementById('recipeEditId').value;

        if (editId) {
            updateCustomRecipe(editId, data);
        } else {
            createCustomRecipe(data);
        }

        closeRecipeForm();
    });

    // Delete confirmation
    cancelDelete?.addEventListener('click', closeDeleteModal);
    deleteModal?.addEventListener('click', (e) => {
        if (e.target === deleteModal) closeDeleteModal();
    });

    confirmDelete?.addEventListener('click', () => {
        if (AppState.hidingRecipeId) {
            // Hide built-in recipe
            hideBuiltInRecipe(AppState.hidingRecipeId);
            closeDeleteModal();
        } else if (AppState.deletingRecipeId) {
            // Delete custom recipe
            deleteCustomRecipe(AppState.deletingRecipeId);
            closeDeleteModal();
        }
    });
}

function openRecipeForm(recipeId = null) {
    const formModal = document.getElementById('recipeFormModal');
    const title = document.getElementById('formModalTitle');
    const form = document.getElementById('recipeForm');

    form.reset();
    document.getElementById('recipeEditId').value = '';

    if (recipeId) {
        const recipe = getCustomRecipeById(recipeId);
        if (recipe) {
            title.textContent = 'Edit Recipe';
            document.getElementById('recipeEditId').value = recipeId;
            document.getElementById('recipeName').value = recipe.name;
            document.getElementById('recipeCategory').value = recipe.category;
            document.getElementById('recipePrepTime').value = recipe.prepTime || '';
            document.getElementById('recipeCookTime').value = recipe.totalTime || '';
            document.getElementById('recipeDescription').value = recipe.description || '';
            document.getElementById('recipeIngredients').value = (recipe.ingredients || []).join('\n');
            document.getElementById('recipeSteps').value = (recipe.steps || []).join('\n');
            document.getElementById('recipeVacuumTips').value = recipe.vacuumTips || '';
        }
    } else {
        title.textContent = 'Add Recipe';
    }

    AppState.editingRecipeId = recipeId;
    formModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeRecipeForm() {
    const formModal = document.getElementById('recipeFormModal');
    formModal.classList.remove('active');
    document.body.style.overflow = '';
    AppState.editingRecipeId = null;
}

function openDeleteModal(recipeId, recipeName) {
    const modal = document.getElementById('deleteConfirmModal');
    const nameSpan = document.getElementById('deleteRecipeName');
    const title = modal.querySelector('.modal-title');

    AppState.deletingRecipeId = recipeId;
    AppState.hidingRecipeId = null;
    nameSpan.textContent = recipeName;
    title.textContent = 'Delete Recipe?';
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeDeleteModal() {
    const modal = document.getElementById('deleteConfirmModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    AppState.deletingRecipeId = null;
    AppState.hidingRecipeId = null;
}

// ==========================================
// EXPORT / IMPORT
// ==========================================
function exportCustomRecipes() {
    const data = JSON.stringify(AppState.customRecipes, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vacuprep-custom-recipes.json';
    a.click();
    URL.revokeObjectURL(url);
}

function parseRecipeText(text) {
    // Smart parser for pasted recipe text
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length === 0) return null;

    const recipe = {
        name: '',
        category: 'other',
        prepTime: '',
        cookTime: '',
        description: '',
        ingredients: [],
        steps: []
    };

    let section = 'name';

    for (const line of lines) {
        const lower = line.toLowerCase();

        // Detect section headers
        if (lower.includes('ingredient')) {
            section = 'ingredients';
            continue;
        }
        if (lower.includes('step') || lower.includes('instruction') || lower.includes('method')) {
            section = 'steps';
            continue;
        }
        if (lower.includes('prep') && lower.includes(':')) {
            recipe.prepTime = line.split(':')[1]?.trim() || '';
            continue;
        }
        if (lower.includes('cook') && lower.includes(':')) {
            recipe.cookTime = line.split(':')[1]?.trim() || '';
            continue;
        }

        // First line is usually the name
        if (!recipe.name && section === 'name') {
            recipe.name = line;
            section = 'description';
            continue;
        }

        // Add to appropriate section
        if (section === 'ingredients') {
            recipe.ingredients.push(line.replace(/^[-•*]\s*/, ''));
        } else if (section === 'steps') {
            recipe.steps.push(line.replace(/^\d+[.)]\s*/, ''));
        } else if (section === 'description' && !recipe.description) {
            recipe.description = line;
        }
    }

    return recipe;
}

// ==========================================
// WEEK PLANNER SYSTEM
// ==========================================


function saveWeekPlan() {
    localStorage.setItem('vacuprep_week_plan', JSON.stringify(AppState.weekPlan));
}

function getWeekDates() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    const days = [];
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        days.push({
            name: dayNames[i],
            dateKey: date.toISOString().split('T')[0],
            dateDisplay: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
        });
    }
    return days;
}

function renderWeekPlanner() {
    const container = document.getElementById('week-planner');
    if (!container) return;

    const days = getWeekDates();
    container.innerHTML = days.map(day => {
        const meals = AppState.weekPlan[day.dateKey] || [];
        const mealsHtml = meals.length > 0
            ? meals.map((meal, idx) => `
                <div class="meal-item">
                    <span class="meal-icon">${meal.icon || '🍽️'}</span>
                    <div class="meal-info">
                        <div class="meal-name">${meal.name}</div>
                        <div class="meal-servings">${meal.servings} servings</div>
                    </div>
                    <button class="meal-remove" data-day="${day.dateKey}" data-idx="${idx}">✕</button>
                </div>
            `).join('')
            : `<div class="day-empty">No meals planned</div>`;

        return `
            <div class="day-card" data-date="${day.dateKey}">
                <div class="day-header">
                    <div>
                        <span class="day-name">${day.name}</span>
                        <span class="day-date">${day.dateDisplay}</span>
                    </div>
                    <button class="add-meal-btn" data-day="${day.dateKey}">+ Add</button>
                </div>
                <div class="day-meals">
                    ${mealsHtml}
                </div>
            </div>
        `;
    }).join('');

    // Event listeners for add/remove
    container.querySelectorAll('.add-meal-btn').forEach(btn => {
        btn.addEventListener('click', () => openAddMealModal(btn.dataset.day));
    });

    container.querySelectorAll('.meal-remove').forEach(btn => {
        btn.addEventListener('click', () => removeMealFromDay(btn.dataset.day, parseInt(btn.dataset.idx)));
    });
}

function addMealToDay(dateKey, recipe, servings = 4) {
    if (!AppState.weekPlan[dateKey]) {
        AppState.weekPlan[dateKey] = [];
    }

    // Use smart extractor
    const ingredients = extractIngredientsFromRecipe(recipe);

    AppState.weekPlan[dateKey].push({
        recipeId: recipe.id || recipe.name,
        name: recipe.name,
        icon: recipe.image || '🍽️',
        servings: servings,
        ingredients: ingredients
    });
    saveWeekPlan();
    renderWeekPlanner();
}

function removeMealFromDay(dateKey, index) {
    if (AppState.weekPlan[dateKey]) {
        AppState.weekPlan[dateKey].splice(index, 1);
        if (AppState.weekPlan[dateKey].length === 0) {
            delete AppState.weekPlan[dateKey];
        }
        saveWeekPlan();
        renderWeekPlanner();
    }
}

function clearWeekPlan() {
    AppState.weekPlan = {};
    saveWeekPlan();
    renderWeekPlanner();
}

function openAddMealModal(dateKey) {
    // Simple prompt for now - could be enhanced with a proper modal
    const allRecipes = [
        ...(typeof recipes !== 'undefined' ? recipes : []),
        ...AppState.customRecipes
    ].filter(r => !AppState.hiddenRecipes.includes(r.id));

    // Create a quick-select modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'addMealModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px;">
            <div class="modal-header">
                <h2 class="modal-title">Add Meal</h2>
                <button class="modal-close" id="addMealClose">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Servings</label>
                    <select id="mealServings" class="form-input">
                        <option value="2">2 servings</option>
                        <option value="4" selected>4 servings</option>
                        <option value="6">6 servings</option>
                        <option value="8">8 servings</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Select Recipe</label>
                    <div style="max-height: 300px; overflow-y: auto;">
                        ${allRecipes.map(r => `
                            <div class="meal-select-item" data-recipe-id="${r.id}" style="display:flex;align-items:center;gap:0.75rem;padding:0.75rem;background:var(--bg-elevated);border-radius:8px;margin-bottom:0.5rem;cursor:pointer;">
                                <span style="font-size:1.5rem;">${r.image || '🍽️'}</span>
                                <span>${r.name}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    // Close handlers
    modal.querySelector('#addMealClose').addEventListener('click', () => {
        modal.remove();
        document.body.style.overflow = '';
    });
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
            document.body.style.overflow = '';
        }
    });

    // Recipe selection
    modal.querySelectorAll('.meal-select-item').forEach(item => {
        item.addEventListener('click', () => {
            const recipeId = item.dataset.recipeId;
            const recipe = allRecipes.find(r => r.id === recipeId);
            const servings = parseInt(document.getElementById('mealServings').value);
            if (recipe) {
                addMealToDay(dateKey, recipe, servings);
            }
            modal.remove();
            document.body.style.overflow = '';
        });
    });
}

function setupPlanner() {
    renderWeekPlanner();

    const clearBtn = document.getElementById('clearWeekBtn');
    const generateBtn = document.getElementById('generateListBtn');

    clearBtn?.addEventListener('click', () => {
        if (confirm('Clear all meals from this week?')) {
            clearWeekPlan();
        }
    });

    generateBtn?.addEventListener('click', () => {
        generateShoppingList();
        // Navigate to shopping section
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.getElementById('shopping')?.classList.add('active');
        document.querySelectorAll('[data-section]').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('[data-section="shopping"]').forEach(b => b.classList.add('active'));
    });
}

// ==========================================
// SHOPPING LIST SYSTEM
// ==========================================
// In loadNotes
function loadNotes() {
    AppState.notes = safeJSONParse('vacuprep_notes', {});
}

// In loadCustomRecipes
function loadCustomRecipes() {
    AppState.customRecipes = safeJSONParse('vacuprep_custom_recipes', []);
}

// In loadHiddenRecipes
function loadHiddenRecipes() {
    AppState.hiddenRecipes = safeJSONParse('vacuprep_hidden_recipes', []);
}

// In loadWeekPlan
function loadWeekPlan() {
    AppState.weekPlan = safeJSONParse('vacuprep_week_plan', {});
}

// In loadShoppingList
function loadShoppingList() {
    AppState.shoppingList = safeJSONParse('vacuprep_shopping_list', []);
}

function saveShoppingList() {
    localStorage.setItem('vacuprep_shopping_list', JSON.stringify(AppState.shoppingList));
}

function renderShoppingList() {
    const container = document.getElementById('shopping-list');
    if (!container) return;

    if (AppState.shoppingList.length === 0) {
        container.innerHTML = `
            <div class="shopping-empty">
                <div class="shopping-empty-icon">🛒</div>
                <h3>No items yet</h3>
                <p>Add meals to your planner and generate a shopping list, or add items manually.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = AppState.shoppingList.map((item, idx) => `
        <div class="shopping-item ${item.checked ? 'checked' : ''}" data-idx="${idx}">
            <div class="shopping-checkbox" data-idx="${idx}">${item.checked ? '✓' : ''}</div>
            <div class="shopping-item-info">
                <div class="shopping-item-name">${item.name}</div>
                <div class="shopping-item-qty">${item.qty}</div>
            </div>
            <button class="shopping-item-edit" data-idx="${idx}">✏️</button>
            <button class="shopping-item-delete" data-idx="${idx}">🗑️</button>
        </div>
    `).join('');

    // Event listeners
    container.querySelectorAll('.shopping-checkbox').forEach(cb => {
        cb.addEventListener('click', () => toggleShoppingItem(parseInt(cb.dataset.idx)));
    });

    container.querySelectorAll('.shopping-item-edit').forEach(btn => {
        btn.addEventListener('click', () => editShoppingItem(parseInt(btn.dataset.idx)));
    });

    container.querySelectorAll('.shopping-item-delete').forEach(btn => {
        btn.addEventListener('click', () => deleteShoppingItem(parseInt(btn.dataset.idx)));
    });
}

function generateShoppingList() {
    const itemsMap = new Map();

    // Re-verify specific built-in recipes if ingredients are missing in the plan
    // This handles old plans or cases where extraction was skipped
    const allRecipes = [
        ...(typeof recipes !== 'undefined' ? recipes : []),
        ...AppState.customRecipes
    ];

    Object.values(AppState.weekPlan).forEach(dayMeals => {
        dayMeals.forEach(meal => {
            let ingredients = meal.ingredients || [];

            // If no ingredients stored, try to re-fetch recipe and extract
            if (ingredients.length === 0) {
                const originalRecipe = allRecipes.find(r => r.id === meal.recipeId || r.name === meal.name);
                if (originalRecipe) {
                    ingredients = extractIngredientsFromRecipe(originalRecipe);
                    // Update the meal in the plan so we don't need to do this again
                    meal.ingredients = ingredients;
                }
            }

            // Add to map
            ingredients.forEach(ing => {
                const normalized = ing.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
                if (!normalized) return;

                if (itemsMap.has(normalized)) {
                    const existing = itemsMap.get(normalized);
                    existing.count = (existing.count || 1) + 1;
                    // Keep the name that has the most capitalization/niceness? Just keep first for now.
                } else {
                    itemsMap.set(normalized, {
                        name: ing,
                        qty: meal.servings > 4 ? 'Large batch' : '1 batch',
                        count: 1,
                        checked: false
                    });
                }
            });
        });
    });

    // Save potentially updated plan (if we backfilled ingredients)
    saveWeekPlan();

    // Convert to array
    AppState.shoppingList = Array.from(itemsMap.values());
    if (AppState.shoppingList.length === 0) {
        alert("No ingredients found for planned meals. Please check the recipes.");
    }

    saveShoppingList();
    renderShoppingList();
}

function addShoppingItem(name, qty = '') {
    AppState.shoppingList.push({
        name: name,
        qty: qty || 'as needed',
        checked: false,
        isCustom: true
    });
    saveShoppingList();
    renderShoppingList();
}

function toggleShoppingItem(index) {
    if (AppState.shoppingList[index]) {
        AppState.shoppingList[index].checked = !AppState.shoppingList[index].checked;
        saveShoppingList();
        renderShoppingList();
    }
}

function editShoppingItem(index) {
    const item = AppState.shoppingList[index];
    if (!item) return;

    const newName = prompt('Item name:', item.name);
    if (newName === null) return;

    const newQty = prompt('Quantity:', item.qty);
    if (newQty === null) return;

    item.name = newName || item.name;
    item.qty = newQty || item.qty;
    saveShoppingList();
    renderShoppingList();
}

function deleteShoppingItem(index) {
    AppState.shoppingList.splice(index, 1);
    saveShoppingList();
    renderShoppingList();
}

function clearCheckedItems() {
    AppState.shoppingList = AppState.shoppingList.filter(item => !item.checked);
    saveShoppingList();
    renderShoppingList();
}

function setupShopping() {
    renderShoppingList();

    const addBtn = document.getElementById('addShoppingItemBtn');
    const clearBtn = document.getElementById('clearCheckedBtn');

    addBtn?.addEventListener('click', () => {
        const name = prompt('Item name:');
        if (name) {
            const qty = prompt('Quantity (optional):');
            addShoppingItem(name, qty);
        }
    });

    clearBtn?.addEventListener('click', () => {
        clearCheckedItems();
    });
}

// ==========================================
// SUGGEST SYSTEM
// ==========================================
function getAllAvailableRecipes() {
    return [
        ...(typeof recipes !== 'undefined' ? recipes : []),
        ...AppState.customRecipes
    ].filter(r => !AppState.hiddenRecipes.includes(r.id));
}

function getFavoriteRecipes() {
    const favIds = AppState.favorites.filter(f => f.type === 'recipe').map(f => f.id);
    const allRecipes = getAllAvailableRecipes();
    return allRecipes.filter(r => favIds.includes(r.id) || favIds.includes(r.name));
}

function getQuickRecipes() {
    const allRecipes = getAllAvailableRecipes();
    return allRecipes.filter(r => {
        const prep = r.prepTime || '';
        const match = prep.match(/(\d+)/);
        if (match) {
            return parseInt(match[1]) <= 30;
        }
        return false;
    });
}

function pickRandomRecipe(recipeList) {
    if (recipeList.length === 0) return null;
    return recipeList[Math.floor(Math.random() * recipeList.length)];
}

function displaySuggestion(recipe, title = 'Suggested Recipe') {
    if (!recipe) {
        AppState.currentSuggestion = null;
        return;
    }

    AppState.currentSuggestion = recipe;

    const resultDiv = document.getElementById('suggest-result');
    const titleEl = document.getElementById('suggest-result-title');
    const contentEl = document.getElementById('suggest-result-content');

    if (!resultDiv) return;

    titleEl.textContent = title;
    contentEl.innerHTML = `
        <div class="suggest-result-recipe">
            <span class="recipe-emoji">${recipe.image || '🍽️'}</span>
            <div class="recipe-info">
                <h4>${recipe.name}</h4>
                <div class="recipe-meta">
                    ${recipe.category || 'Meal'} • ${recipe.prepTime || 'Varies'}
                </div>
            </div>
        </div>
    `;
    resultDiv.classList.remove('hidden');
}

function fillWeekWithSuggestions() {
    const allRecipes = getAllAvailableRecipes();
    const favorites = getFavoriteRecipes();
    const days = getWeekDates();

    // Clear current week
    AppState.weekPlan = {};

    // Fill each day - prioritize favorites
    days.forEach((day, idx) => {
        // 60% chance of favorite if available, otherwise random
        let recipe;
        if (favorites.length > 0 && Math.random() < 0.6) {
            recipe = pickRandomRecipe(favorites);
        } else {
            recipe = pickRandomRecipe(allRecipes);
        }

        if (recipe) {
            addMealToDay(day.dateKey, recipe, 4);
        }
    });

    // Navigate to planner
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById('planner')?.classList.add('active');
    document.querySelectorAll('[data-section]').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('[data-section="planner"]').forEach(b => b.classList.add('active'));
}

function setupSuggest() {
    document.querySelectorAll('.suggest-card').forEach(card => {
        card.addEventListener('click', () => {
            const type = card.dataset.type;
            if (!type) return; // Guard against non-action cards

            AppState.suggestType = type;

            let recipeList = [];
            let title = 'Suggested Recipe';

            switch (type) {
                case 'favorites':
                    recipeList = getFavoriteRecipes();
                    title = '⭐ From Your Favorites';
                    if (recipeList.length === 0) {
                        recipeList = getAllAvailableRecipes();
                        title = 'Try adding some favorites first! Here\'s a random pick:';
                    }
                    displaySuggestion(pickRandomRecipe(recipeList), title);
                    break;

                case 'quick':
                    recipeList = getQuickRecipes();
                    title = '⚡ Quick Meal';
                    if (recipeList.length === 0) {
                        recipeList = getAllAvailableRecipes();
                        title = 'Quick meal (all recipes):';
                    }
                    displaySuggestion(pickRandomRecipe(recipeList), title);
                    break;

                case 'random':
                    recipeList = getAllAvailableRecipes();
                    title = '🎲 Random Pick';
                    displaySuggestion(pickRandomRecipe(recipeList), title);
                    break;

                case 'week':
                    fillWeekWithSuggestions();
                    return;
            }
        });
    });

    document.getElementById('suggestAgainBtn')?.addEventListener('click', () => {
        // Re-trigger the same type
        const type = AppState.suggestType;
        if (type) {
            document.querySelector(`.suggest-btn[data-type="${type}"]`)?.click();
        }
    });

    document.getElementById('addToPlannerBtn')?.addEventListener('click', () => {
        if (AppState.currentSuggestion) {
            // Add to today or let user pick day
            const days = getWeekDates();
            const today = new Date().toISOString().split('T')[0];
            addMealToDay(today, AppState.currentSuggestion, 4);
            alert(`Added "${AppState.currentSuggestion.name}" to today's plan!`);
        }
    });
}

// ==========================================
// UTILITIES
// ==========================================
function safeJSONParse(key, fallback) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
    } catch (e) {
        console.warn('JSON Parse Error for key:', key, e);
        return fallback;
    }
}

function extractIngredientsFromRecipe(recipe) {
    // Phase 5: Standardized Data
    // Use the pre-parsed ingredients array if available
    if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
        return recipe.ingredients;
    }
    return [];
}

// ==========================================
// PWA INSTALL PROMPT
// ==========================================
let deferredPrompt;

function setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent Chrome 67 and earlier from automatically showing the prompt
        e.preventDefault();
        // Stash the event so it can be triggered later.
        deferredPrompt = e;
        // Update UI to notify the user they can add to home screen
        showInstallBanner();
    });
}

function showInstallBanner() {
    // Only show if not dismissed
    if (localStorage.getItem('vacuprep_install_dismissed')) return;

    const banner = document.createElement('div');
    banner.className = 'install-banner';
    banner.innerHTML = `
        <div class="install-content">
            <strong>Install App</strong>
            <p>Add to home screen for offline access</p>
        </div>
        <div class="install-actions">
            <button class="btn-dismiss">✕</button>
            <button class="btn-install">Install</button>
        </div>
    `;

    document.body.appendChild(banner);

    // Trigger reflow
    banner.offsetHeight;
    banner.classList.add('visible');

    banner.querySelector('.btn-install').addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                deferredPrompt = null;
            }
            banner.classList.remove('visible');
            setTimeout(() => banner.remove(), 300);
        }
    });

    banner.querySelector('.btn-dismiss').addEventListener('click', () => {
        banner.classList.remove('visible');
        setTimeout(() => banner.remove(), 300);
        localStorage.setItem('vacuprep_install_dismissed', 'true');
    });
}

// ==========================================
// DATA BACKUP
// ==========================================
function setupBackup() {
    const backupBtn = document.getElementById('backup-btn');
    if (backupBtn) {
        backupBtn.addEventListener('click', () => {
            if (confirm('Download a backup of all your data (recipes, plans, lists)?')) {
                exportAllData();
            }
        });
    }
}

function exportAllData() {
    const data = {
        version: 1,
        timestamp: new Date().toISOString(),
        weekPlan: AppState.weekPlan,
        shoppingList: AppState.shoppingList,
        favorites: AppState.favorites,
        customRecipes: AppState.customRecipes,
        notes: AppState.notes,
        hiddenRecipes: AppState.hiddenRecipes,
        dismissedInstall: localStorage.getItem('vacuprep_install_dismissed')
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vacuprep-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}
