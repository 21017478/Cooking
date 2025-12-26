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
    theme: 'dark',
    activeSection: 'favorites',
    searchQuery: ''
};

// ==========================================
// INITIALIZATION
// ==========================================
function initializeApp() {
    loadFavorites();
    loadNotes();
    loadTheme();
    renderRecipeCards();
    renderFavorites();
    setupNavigation();
    setupFiltering();
    setupSearch();
    setupTipPinning();
    setupRecipeModal();
    setupFavoriteReordering();
    setupThemeToggle();
}

// ==========================================
// FAVORITES SYSTEM (Universal)
// ==========================================
function loadFavorites() {
    try {
        const stored = localStorage.getItem('vacuprep_favorites');
        AppState.favorites = stored ? JSON.parse(stored) : [];
    } catch (e) {
        AppState.favorites = [];
    }
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
    if (!grid || typeof recipes === 'undefined') return;

    grid.innerHTML = '';

    recipes.forEach(recipe => {
        const card = document.createElement('div');
        card.className = 'recipe-card show';
        card.dataset.category = recipe.category;
        card.dataset.recipeId = recipe.id;
        card.dataset.name = recipe.name;

        const isFav = isFavorite(recipe.id);

        card.innerHTML = `
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
        `;

        // Click to open modal
        card.addEventListener('click', (e) => {
            if (e.target.classList.contains('recipe-favorite-btn')) return;
            showRecipeDetail(recipe.name);
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

        grid.appendChild(card);
    });
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
function loadNotes() {
    try {
        const stored = localStorage.getItem('vacuprep_notes');
        AppState.notes = stored ? JSON.parse(stored) : {};
    } catch (e) {
        AppState.notes = {};
    }
}

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

