/**
 * Vacuum Sealer Guide - Main Application Logic
 * Handles Navigation, Filtering, Favorites, and Recipe Details
 */

document.addEventListener('DOMContentLoaded', function () {
    initializeApp();
});

function initializeApp() {
    renderMealCards(); // NEW: Render cards from recipes.js
    setupNavigation();
    setupFiltering();
    setupFavoritesSystem();
    setupRecipeModal();
}

// ==========================================
// DYNAMIC MEAL CARD RENDERING
// ==========================================
function renderMealCards() {
    const mealGrid = document.querySelector('.meal-grid');
    if (!mealGrid || typeof recipes === 'undefined') return;

    // Clear existing cards
    mealGrid.innerHTML = '';

    // Render cards from recipes.js
    recipes.forEach(recipe => {
        const card = document.createElement('div');
        card.className = 'meal-card show';
        card.dataset.category = recipe.category;

        card.innerHTML = `
            <span class="meal-category">${recipe.category.charAt(0).toUpperCase() + recipe.category.slice(1)}</span>
            <h5>${recipe.image} ${recipe.name}</h5>
            <p>${recipe.description}</p>
            <div class="meal-meta">
                <span>⏱️ ${recipe.prepTime || 'Varies'}</span>
                <span>❄️ ${recipe.totalTime || 'See recipe'}</span>
            </div>
        `;

        mealGrid.appendChild(card);
    });
}

// ==========================================
// NAVIGATION SYSTEM
// ==========================================
function setupNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.section');

    // Add click handlers to existing buttons
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => handleNavClick(btn, navBtns, sections));
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) target.scrollIntoView({ behavior: 'smooth' });
        });
    });
}

function handleNavClick(clickedBtn, allBtns, allSections) {
    const targetSectionId = clickedBtn.dataset.section;

    // Update active button
    allBtns.forEach(b => b.classList.remove('active'));
    clickedBtn.classList.add('active');

    // Update active section
    allSections.forEach(section => {
        section.classList.remove('active');
        if (section.id === targetSectionId) {
            section.classList.add('active');
        }
    });

    // Special handling for Favorites section
    if (targetSectionId === 'favorites') {
        renderFavorites();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================
// FILTERING SYSTEM
// ==========================================
function setupFiltering() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const mealCards = document.querySelectorAll('.meal-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.dataset.category;

            // Update active filter button
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Filter meal cards
            mealCards.forEach(card => {
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
// FAVORITES SYSTEM
// ==========================================
const FAVORITES_KEY = 'vacuumSealer_favorites';

function setupFavoritesSystem() {
    // 1. Inject "My Favorites" Nav Button
    const nav = document.querySelector('nav');
    if (nav && !document.querySelector('[data-section="favorites"]')) {
        const favBtn = document.createElement('button');
        favBtn.className = 'nav-btn';
        favBtn.dataset.section = 'favorites';
        favBtn.innerHTML = '⭐ My Favorites';
        favBtn.addEventListener('click', () => handleNavClick(favBtn, document.querySelectorAll('.nav-btn'), document.querySelectorAll('.section')));
        nav.appendChild(favBtn);
    }

    // 2. Inject Favorites Section
    const main = document.querySelector('main');
    if (main && !document.getElementById('favorites')) {
        const favSection = document.createElement('section');
        favSection.id = 'favorites';
        favSection.className = 'section';
        favSection.innerHTML = `
            <h3>⭐ My Favorite Recipes</h3>
            <div id="favorites-content">
                <!-- Content populated dynamically -->
            </div>
        `;
        main.appendChild(favSection);
    }

    // 3. Inject Favorite Buttons into Cards
    document.querySelectorAll('.meal-card').forEach(card => {
        if (!card.querySelector('.favorite-btn')) {
            const btn = document.createElement('button');
            btn.className = 'favorite-btn';
            btn.innerHTML = '☆';
            btn.title = 'Add to Favorites';

            // Get recipe name to use as ID (since we don't have data-ids on all cards yet)
            const recipeName = card.querySelector('h5').textContent.trim();
            btn.dataset.recipeName = recipeName;

            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent modal opening
                toggleFavorite(recipeName, btn);
            });

            card.appendChild(btn);
        }
    });

    updateFavoriteButtons();
}

function getFavorites() {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
}

function saveFavorites(favorites) {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

function toggleFavorite(recipeName, btn) {
    let favorites = getFavorites();
    const index = favorites.indexOf(recipeName);

    if (index > -1) {
        favorites.splice(index, 1);
        btn.classList.remove('active');
        btn.textContent = '☆';
    } else {
        favorites.push(recipeName);
        btn.classList.add('active');
        btn.textContent = '★';
    }

    saveFavorites(favorites);

    // If we are in the favorites view, re-render
    if (document.getElementById('favorites').classList.contains('active')) {
        renderFavorites();
    }
}

function updateFavoriteButtons() {
    const favorites = getFavorites();
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        const name = btn.dataset.recipeName;
        if (favorites.includes(name)) {
            btn.classList.add('active');
            btn.textContent = '★';
        } else {
            btn.classList.remove('active');
            btn.textContent = '☆';
        }
    });
}

function renderFavorites() {
    const container = document.getElementById('favorites-content');
    const favorites = getFavorites();

    if (favorites.length === 0) {
        container.innerHTML = `
            <div class="glass-card" style="text-align: center; padding: 3rem;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">⭐</div>
                <h4>No Favorites Yet</h4>
                <p style="color: var(--text-secondary);">Click the star icon on any recipe card to add it to your favorites!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '<div class="meal-grid"></div>';
    const grid = container.querySelector('.meal-grid');

    // Find original cards to clone
    const allCards = document.querySelectorAll('.meal-card'); // Includes originals only

    favorites.forEach(favName => {
        // Find card by name
        let originalCard = null;
        allCards.forEach(card => {
            if (card.querySelector('h5').textContent.trim() === favName) {
                originalCard = card;
            }
        });

        if (originalCard) {
            const clone = originalCard.cloneNode(true);
            clone.classList.add('show');
            clone.style.display = 'block';

            // Re-attach events
            const favBtn = clone.querySelector('.favorite-btn');
            favBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleFavorite(favName, favBtn);
                // Remove from view immediately if unfavorited in favorites view
                clone.remove();
                if (getFavorites().length === 0) renderFavorites();
            });

            clone.addEventListener('click', () => {
                showRecipeDetail(favName);
            });

            grid.appendChild(clone);
        }
    });
}

// ==========================================
// RECIPE MODAL SYSTEM
// ==========================================
function setupRecipeModal() {
    // Inject Modal HTML
    if (!document.getElementById('recipeModal')) {
        const modalHTML = `
            <div id="recipeModal" class="recipe-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 id="modalTitle"></h2>
                        <button class="modal-close" onclick="closeRecipeModal()">&times;</button>
                    </div>
                    <div class="modal-body" id="modalBody"></div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // Add click handlers to cards
    document.querySelectorAll('.meal-card').forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', function () {
            // Don't trigger if clicking favorite button (handled by stopPropagation, but good to be safe)
            const recipeName = card.querySelector('h5').textContent.trim();
            showRecipeDetail(recipeName);
        });
    });

    // Close handlers
    document.addEventListener('click', (e) => {
        const modal = document.getElementById('recipeModal');
        if (e.target === modal) closeRecipeModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeRecipeModal();
    });
}

function showRecipeDetail(recipeName) {
    const modal = document.getElementById('recipeModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    // Clean up name for matching (remove emojis if needed, though recipes.js names don't have emojis in the name property usually)
    // Actually, the h5 text includes the emoji in index.html (e.g., "🍔 Seasoned Smash Burger Patties")
    // But recipes.js names are just text "Seasoned Smash Burger Patties"
    // We need to strip the emoji to match.

    const cleanName = recipeName.replace(/^[\p{Emoji}\u200d\uFE0F]+\s+/u, '').trim();

    modalTitle.textContent = cleanName;

    // Find recipe data
    // Check if 'recipes' global exists (from recipes.js)
    let recipeData = null;
    if (typeof recipes !== 'undefined') {
        recipeData = recipes.find(r => r.name === cleanName || r.name === recipeName);
    }

    if (recipeData && recipeData.content) {
        modalBody.innerHTML = recipeData.content;
    } else {
        // Fallback content
        modalBody.innerHTML = `
            <div style="text-align: center; padding: 3rem;">
                <h3 style="color: var(--warning);">Recipe Details Not Found</h3>
                <p>We couldn't find the full details for "${cleanName}".</p>
                <p style="font-size: 0.9rem; color: var(--text-muted); margin-top: 1rem;">
                    (Debug: Checked against ${typeof recipes !== 'undefined' ? recipes.length : 0} recipes)
                </p>
            </div>
        `;
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeRecipeModal() {
    const modal = document.getElementById('recipeModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Expose close function globally for the button onclick
window.closeRecipeModal = closeRecipeModal;
