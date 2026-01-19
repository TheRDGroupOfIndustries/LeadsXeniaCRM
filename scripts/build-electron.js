/**
 * XeniaCRM CRM - Electron Desktop App Builder
 * Creates a NATIVE desktop application (not browser!)
 */

const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const https = require('https');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'XeniaCRM-Desktop');
const TEMP = path.join(ROOT, '.build-temp');

const CONFIG = {
    appVersion: '1.0.0',
    nodeVersionX64: '20.10.0',
    nodeVersionX86: '20.10.0',
};

const log = (msg) => console.log(`[BUILD] ${msg}`);

// Download helper
function download(url, dest) {
    return new Promise((resolve, reject) => {
        log(`Downloading: ${path.basename(dest)}`);
        const file = fs.createWriteStream(dest);
        
        const request = (downloadUrl, redirectCount = 0) => {
            if (redirectCount > 5) {
                reject(new Error('Too many redirects'));
                return;
            }
            
            https.get(downloadUrl, (res) => {
                if (res.statusCode === 301 || res.statusCode === 302) {
                    file.close();
                    if (fs.existsSync(dest)) fs.unlinkSync(dest);
                    const newFile = fs.createWriteStream(dest);
                    request(res.headers.location, redirectCount + 1);
                    return;
                }
                res.pipe(file);
                file.on('finish', () => { file.close(); resolve(); });
            }).on('error', (err) => {
                if (fs.existsSync(dest)) fs.unlinkSync(dest);
                reject(err);
            });
        };
        request(url);
    });
}

async function build() {
    console.log('\n========================================');
    console.log('  XeniaCRM CRM - Electron App Builder');
    console.log('  Creates NATIVE Desktop App Window');
    console.log('========================================\n');
    
    // Step 1: Clean
    log('Cleaning previous builds...');
    fs.removeSync(OUTPUT);
    fs.removeSync(TEMP);
    fs.ensureDirSync(OUTPUT);
    fs.ensureDirSync(TEMP);
    fs.ensureDirSync(path.join(OUTPUT, 'server'));
    fs.ensureDirSync(path.join(OUTPUT, 'server', 'node', 'x64'));
    fs.ensureDirSync(path.join(OUTPUT, 'server', 'node', 'x86'));
    fs.ensureDirSync(path.join(OUTPUT, 'resources', 'icons'));
    
    // Step 2: Build Next.js
    log('Building Next.js application...');
    execSync('npm run build', { stdio: 'inherit', cwd: ROOT });
    
    // Step 3: Copy standalone server
    log('Copying Next.js standalone server...');
    const standalone = path.join(ROOT, '.next', 'standalone');
    fs.copySync(standalone, path.join(OUTPUT, 'server', 'app'));
    
    // Copy static files
    const staticDir = path.join(ROOT, '.next', 'static');
    if (fs.existsSync(staticDir)) {
        fs.copySync(staticDir, path.join(OUTPUT, 'server', 'app', '.next', 'static'));
    }
    
    // Copy public folder
    const publicDir = path.join(ROOT, 'public');
    if (fs.existsSync(publicDir)) {
        fs.copySync(publicDir, path.join(OUTPUT, 'server', 'app', 'public'));
    }
    
    // Copy prisma
    const prismaDir = path.join(ROOT, 'prisma');
    if (fs.existsSync(prismaDir)) {
        fs.copySync(prismaDir, path.join(OUTPUT, 'server', 'app', 'prisma'));
    }
    
    // Step 4: Create .env for desktop
    log('Creating desktop configuration...');
    const envContent = `NODE_ENV=production
PORT=3000
DATABASE_URL=file:./prisma/xeniacrm.db
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=xeniacrm-offline-desktop-${Date.now()}
ADMIN_EMAIL=admin@xeniacrm.app
DESKTOP_MODE=true
OFFLINE_MODE=true
`;
    fs.writeFileSync(path.join(OUTPUT, 'server', 'app', '.env'), envContent);
    
    // Step 5: Download Node.js for BOTH architectures
    log('Downloading Node.js for x64...');
    const nodeZipX64 = path.join(TEMP, 'node-x64.zip');
    await download(
        `https://nodejs.org/dist/v${CONFIG.nodeVersionX64}/node-v${CONFIG.nodeVersionX64}-win-x64.zip`,
        nodeZipX64
    );
    
    log('Downloading Node.js for x86...');
    const nodeZipX86 = path.join(TEMP, 'node-x86.zip');
    await download(
        `https://nodejs.org/dist/v${CONFIG.nodeVersionX86}/node-v${CONFIG.nodeVersionX86}-win-x86.zip`,
        nodeZipX86
    );
    
    log('Extracting Node.js binaries...');
    execSync(`powershell -Command "Expand-Archive -Path '${nodeZipX64}' -DestinationPath '${TEMP}/node-x64' -Force"`, { stdio: 'inherit' });
    const nodeExtractedX64 = fs.readdirSync(path.join(TEMP, 'node-x64')).find(f => f.startsWith('node-v'));
    fs.copySync(
        path.join(TEMP, 'node-x64', nodeExtractedX64, 'node.exe'),
        path.join(OUTPUT, 'server', 'node', 'x64', 'node.exe')
    );
    
    execSync(`powershell -Command "Expand-Archive -Path '${nodeZipX86}' -DestinationPath '${TEMP}/node-x86' -Force"`, { stdio: 'inherit' });
    const nodeExtractedX86 = fs.readdirSync(path.join(TEMP, 'node-x86')).find(f => f.startsWith('node-v'));
    fs.copySync(
        path.join(TEMP, 'node-x86', nodeExtractedX86, 'node.exe'),
        path.join(OUTPUT, 'server', 'node', 'x86', 'node.exe')
    );
    
    // Step 6: Copy icons
    log('Copying application icons...');
    const iconIco = path.join(ROOT, 'build', 'icons', 'icons', 'win', 'icon.ico');
    const iconPng = path.join(ROOT, 'build', 'icons', 'icons', 'png', '256x256.png');
    
    if (fs.existsSync(iconIco)) {
        fs.copySync(iconIco, path.join(OUTPUT, 'resources', 'icons', 'icon.ico'));
        fs.copySync(iconIco, path.join(OUTPUT, 'icon.ico'));
    }
    if (fs.existsSync(iconPng)) {
        fs.copySync(iconPng, path.join(OUTPUT, 'resources', 'icons', 'icon.png'));
    }
    
    // Step 7: Cleanup temp
    log('Cleaning up temporary files...');
    fs.removeSync(TEMP);
    
    console.log('\n========================================');
    console.log('  NEXT.JS BUILD COMPLETE!');
    console.log('========================================');
    console.log(`\nServer files ready in: ${OUTPUT}`);
    console.log('\nNow building Electron app...\n');
    
    // Step 8: Build Electron app
    log('Building Electron installer...');
    try {
        execSync('npx electron-builder --config electron-builder.json --win', { 
            stdio: 'inherit', 
            cwd: ROOT 
        });
        
        console.log('\n========================================');
        console.log('  ✅ BUILD COMPLETE!');
        console.log('========================================');
        console.log('\n📦 Installer location:');
        console.log(`   ${path.join(OUTPUT, 'installer-output')}`);
        console.log('\n🎉 The app will now open as a NATIVE WINDOW, not in browser!');
        console.log('');
    } catch (err) {
        console.error('\n❌ Electron build failed:', err.message);
        console.log('\nYou can manually build by running:');
        console.log('   npx electron-builder --config electron-builder.json --win');
    }
}

build().catch(err => {
    console.error('Build failed:', err);
    process.exit(1);
});
