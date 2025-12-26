const fs = require('fs');
const path = require('path');

// Configuration
const ROOT_DIR = path.join(__dirname, '..');
const BUILD_DIR = path.join(ROOT_DIR, 'mobile-build');
const ASSETS_DIR = path.join(BUILD_DIR, 'assets');

// Files to copy directly
const FILES_TO_COPY = [
    'main.js',
    'recipes.js',
    'Project_Standards.md' // Optional, but good for reference
];

// PWA Configuration
const APP_NAME = "Vacuum Guide";
const APP_SHORT_NAME = "VacuumGuide";
const THEME_COLOR = "#7c3aed"; // Purple from the design
const BG_COLOR = "#1a1a2e"; // Dark bg

async function main() {
    console.log('📱 Starting Mobile Build Process...');

    // 1. Clean/Create Build Directory
    if (fs.existsSync(BUILD_DIR)) {
        // We don't want to delete the screenshots we just took!
        // So we only clean specific files or skip cleaning if it exists
        // Better: Ensure directories exist
    } else {
        fs.mkdirSync(BUILD_DIR);
    }

    if (!fs.existsSync(ASSETS_DIR)) {
        fs.mkdirSync(ASSETS_DIR);
    }

    // 2. Copy Core Files
    FILES_TO_COPY.forEach(file => {
        const src = path.join(ROOT_DIR, file);
        const dest = path.join(BUILD_DIR, file);
        if (fs.existsSync(src)) {
            fs.copyFileSync(src, dest);
            console.log(`✅ Copied ${file}`);
        } else {
            console.warn(`⚠️ Missing source file: ${file}`);
        }
    });

    // 3. Process and Copy index.html
    processIndexHtml();

    // 4. Generate manifest.json
    generateManifest();

    // 5. Generate service-worker.js
    generateServiceWorker();

    console.log('ℹ️  Note: App icon needs to be placed in mobile-build/assets/icon.png');
    console.log('🚀 Mobile build complete! Files are in /mobile-build');
}

function processIndexHtml() {
    const src = path.join(ROOT_DIR, 'index.html');
    const dest = path.join(BUILD_DIR, 'index.html');

    let content = fs.readFileSync(src, 'utf8');

    // Inject PWA Meta Tags & Manifest Link
    const pwaHead = `
    <!-- PWA Meta Tags -->
    <link rel="manifest" href="manifest.json">
    <meta name="theme-color" content="${THEME_COLOR}">
    <link rel="apple-touch-icon" href="assets/icon.png">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    `;

    // Inject Service Worker Registration
    const swScript = `
    <script>
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('service-worker.js')
                    .then(reg => console.log('ServiceWorker registered'))
                    .catch(err => console.log('ServiceWorker registration failed: ', err));
            });
        }
    </script>
    </body>`;

    content = content.replace('</head>', `${pwaHead}\n</head>`);
    content = content.replace('</body>', `${swScript}`);

    fs.writeFileSync(dest, content);
    console.log('✅ Processed index.html with PWA tags');
}

function generateManifest() {
    const manifest = {
        name: APP_NAME,
        short_name: APP_SHORT_NAME,
        start_url: "./index.html",
        display: "standalone",
        background_color: BG_COLOR,
        theme_color: THEME_COLOR,
        icons: [
            {
                src: "assets/icon.png",
                sizes: "512x512",
                type: "image/png"
            },
            {
                src: "assets/icon.png",
                sizes: "192x192",
                type: "image/png"
            }
        ],
        screenshots: [
            {
                src: "assets/screenshots/screen_home.png",
                sizes: "375x812",
                type: "image/png",
                form_factor: "narrow",
                label: "Home Screen"
            },
            {
                src: "assets/screenshots/screen_recipes.png",
                sizes: "375x812",
                type: "image/png",
                form_factor: "narrow",
                label: "Recipe Collection"
            },
            {
                src: "assets/screenshots/screen_detail.png",
                sizes: "375x812",
                type: "image/png",
                form_factor: "narrow",
                label: "Recipe Detail"
            }
        ]
    };

    fs.writeFileSync(path.join(BUILD_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
    console.log('✅ Generated manifest.json');
}

function generateServiceWorker() {
    const swContent = `
const CACHE_NAME = 'vacuum-guide-v1';
const ASSETS = [
    './',
    './index.html',
    './main.js',
    './recipes.js',
    './manifest.json',
    './assets/icon.png'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => response || fetch(e.request))
    );
});
    `;

    fs.writeFileSync(path.join(BUILD_DIR, 'service-worker.js'), swContent);
    console.log('✅ Generated service-worker.js');
}

main();
