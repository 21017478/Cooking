const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const ROOT_DIR = path.join(__dirname, '..');
const PROJECT_DIR = path.join(ROOT_DIR, 'apk-project');
const WWW_DIR = path.join(PROJECT_DIR, 'www');

// Files to copy
const FILES_TO_COPY = [
    'main.js',
    'recipes.js',
    'Project_Standards.md'
];

async function main() {
    console.log('🤖 Starting Android Project Setup...');

    // 1. Clean/Create Project Directory
    if (fs.existsSync(PROJECT_DIR)) {
        fs.rmSync(PROJECT_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(PROJECT_DIR);
    fs.mkdirSync(WWW_DIR);
    fs.mkdirSync(path.join(WWW_DIR, 'assets'));
    console.log('✅ Clean project directory created');

    // 2. Copy Core Files to WWW
    FILES_TO_COPY.forEach(file => {
        const src = path.join(ROOT_DIR, file);
        const dest = path.join(WWW_DIR, file);
        if (fs.existsSync(src)) {
            fs.copyFileSync(src, dest);
            console.log(`✅ Copied ${file}`);
        }
    });

    // 3. Copy Icon
    const iconSrc = path.join(ROOT_DIR, 'mobile-build', 'assets', 'icon.png');
    if (fs.existsSync(iconSrc)) {
        fs.copyFileSync(iconSrc, path.join(WWW_DIR, 'assets', 'icon.png'));
        console.log('✅ Copied app icon');
    }

    // 4. Process index.html (Adjust paths for Capacitor if needed)
    // Capacitor serves from local, so ./ paths work fine.
    // We just need to ensure the icon path is correct.
    const indexSrc = path.join(ROOT_DIR, 'index.html');
    let indexContent = fs.readFileSync(indexSrc, 'utf8');

    // Inject Capacitor specific meta tags if needed, but standard mobile tags work.
    // We'll just ensure it points to the local icon.
    // (The PWA script added tags, but we are copying from ROOT, so it's clean)

    fs.writeFileSync(path.join(WWW_DIR, 'index.html'), indexContent);
    console.log('✅ Copied index.html');

    // 5. Create package.json
    const packageJson = {
        name: "vacuum-guide-app",
        version: "1.0.0",
        description: "Vacuum Sealer Guide Android App",
        scripts: {
            "build": "echo 'No build step needed for vanilla JS'",
            "cap": "capacitor"
        },
        dependencies: {
            "@capacitor/android": "^6.0.0",
            "@capacitor/core": "^6.0.0",
            "@capacitor/cli": "^6.0.0"
        }
    };
    fs.writeFileSync(path.join(PROJECT_DIR, 'package.json'), JSON.stringify(packageJson, null, 2));
    console.log('✅ Created package.json');

    // 6. Create capacitor.config.json
    const capConfig = {
        appId: "com.vacuumguide.app",
        appName: "Vacuum Guide",
        webDir: "www",
        bundledWebRuntime: false
    };
    fs.writeFileSync(path.join(PROJECT_DIR, 'capacitor.config.json'), JSON.stringify(capConfig, null, 2));
    console.log('✅ Created capacitor.config.json');

    console.log('🚀 Project structure ready! Now running npm install...');

    try {
        execSync('npm install', { cwd: PROJECT_DIR, stdio: 'inherit' });
        console.log('✅ Dependencies installed');

        console.log('🤖 Initializing Android platform...');
        execSync('npx cap add android', { cwd: PROJECT_DIR, stdio: 'inherit' });
        console.log('✅ Android platform added');

    } catch (error) {
        console.error('❌ Error during setup:', error.message);
        console.log('⚠️  Note: You may need to install Android Studio to fully build the APK.');
    }
}

main();
