/**
 * ColorTouch CRM - Desktop App Builder
 * Creates a complete offline desktop application
 * Supports: Windows x86, x64 (Windows 7, 8, 10, 11)
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const https = require('https');
const http = require('http');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'ColorTouch-Desktop');
const TEMP = path.join(ROOT, '.build-temp');

const CONFIG = {
    // Node 18 LTS has better compatibility with older Windows
    nodeVersionX64: '18.19.0',
    nodeVersionX86: '18.19.0',
    appName: 'ColorTouch CRM',
    appVersion: '1.0.0'
};

// Architecture detection
const getArch = () => process.arch === 'ia32' ? 'x86' : 'x64';

const log = (msg) => console.log(`[BUILD] ${msg}`);

// Download helper with better redirect handling
function download(url, dest) {
    return new Promise((resolve, reject) => {
        log(`Downloading: ${path.basename(dest)}`);
        const file = fs.createWriteStream(dest);
        
        const request = (url, redirectCount = 0) => {
            if (redirectCount > 5) {
                reject(new Error('Too many redirects'));
                return;
            }
            
            const protocol = url.startsWith('https') ? https : http;
            protocol.get(url, (res) => {
                if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307) {
                    file.close();
                    fs.unlinkSync(dest);
                    fs.createWriteStream(dest);
                    request(res.headers.location, redirectCount + 1);
                    return;
                }
                if (res.statusCode !== 200) {
                    reject(new Error(`HTTP ${res.statusCode}`));
                    return;
                }
                res.pipe(file);
                file.on('finish', () => { file.close(); resolve(); });
            }).on('error', reject);
        };
        request(url);
    });
}

// Create VBS launcher that doesn't show console window
function createVBSLauncher(outputPath) {
    const vbsContent = `' ColorTouch CRM Launcher
' Runs the app without showing console window
Set WshShell = CreateObject("WScript.Shell")
currentDir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)

' Check if server is running
On Error Resume Next
Set http = CreateObject("MSXML2.XMLHTTP")
http.Open "GET", "http://localhost:3000", False
http.Send
serverRunning = (http.Status = 200)
On Error GoTo 0

If Not serverRunning Then
    ' Start the server silently
    WshShell.Run """" & currentDir & "\\server\\start-server.bat""", 0, False
    
    ' Wait for server to start (max 30 seconds)
    For i = 1 To 30
        WScript.Sleep 1000
        On Error Resume Next
        Set http = CreateObject("MSXML2.XMLHTTP")
        http.Open "GET", "http://localhost:3000", False
        http.Send
        If http.Status = 200 Then Exit For
        On Error GoTo 0
    Next
End If

' Open in default browser
WshShell.Run "http://localhost:3000"
`;
    fs.writeFileSync(path.join(outputPath, 'ColorTouch CRM.vbs'), vbsContent);
}

// Create server start script
function createServerScript(outputPath) {
    // Server start batch (hidden)
    const serverBat = `@echo off
cd /d "%~dp0app"
set NODE_ENV=production
set PORT=3000

:: Check which node to use based on architecture
if exist "..\\node\\x64\\node.exe" (
    set NODE_PATH=..\\node\\x64\\node.exe
) else if exist "..\\node\\x86\\node.exe" (
    set NODE_PATH=..\\node\\x86\\node.exe
) else if exist "..\\node\\node.exe" (
    set NODE_PATH=..\\node\\node.exe
) else (
    :: Try system Node
    where node >nul 2>&1
    if %errorlevel%==0 (
        set NODE_PATH=node
    ) else (
        echo Node.js not found!
        pause
        exit /b 1
    )
)

:: Run database migrations
"%NODE_PATH%" ../node_modules/prisma/build/index.js migrate deploy 2>nul

:: Start server
"%NODE_PATH%" server.js
`;
    fs.ensureDirSync(path.join(outputPath, 'server'));
    fs.writeFileSync(path.join(outputPath, 'server', 'start-server.bat'), serverBat);
}

async function build() {
    console.log('\n========================================');
    console.log('  ColorTouch CRM - Desktop App Builder');
    console.log('  Multi-Architecture (x86 + x64)');
    console.log('========================================\n');
    
    // Step 1: Clean
    log('Cleaning previous builds...');
    fs.removeSync(OUTPUT);
    fs.removeSync(TEMP);
    fs.ensureDirSync(OUTPUT);
    fs.ensureDirSync(TEMP);
    fs.ensureDirSync(path.join(OUTPUT, 'resources', 'js'));
    fs.ensureDirSync(path.join(OUTPUT, 'resources', 'icons'));
    fs.ensureDirSync(path.join(OUTPUT, 'server'));
    fs.ensureDirSync(path.join(OUTPUT, 'server', 'node', 'x64'));
    fs.ensureDirSync(path.join(OUTPUT, 'server', 'node', 'x86'));
    
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
    
    // Copy prisma client to node_modules for migrations
    const prismaClient = path.join(ROOT, 'node_modules', 'prisma');
    if (fs.existsSync(prismaClient)) {
        fs.copySync(prismaClient, path.join(OUTPUT, 'server', 'node_modules', 'prisma'));
    }
    const prismaEngines = path.join(ROOT, 'node_modules', '@prisma');
    if (fs.existsSync(prismaEngines)) {
        fs.copySync(prismaEngines, path.join(OUTPUT, 'server', 'node_modules', '@prisma'));
    }
    
    // Step 4: Create .env for desktop (marks this as desktop mode)
    log('Creating desktop configuration...');
    const envContent = `NODE_ENV=production
PORT=3000
DATABASE_URL=file:./prisma/colortouch.db
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=colortouch-offline-desktop-${Date.now()}
ADMIN_EMAIL=admin@colortouch.app
DESKTOP_MODE=true
`;
    fs.writeFileSync(path.join(OUTPUT, 'server', 'app', '.env'), envContent);
    
    // Remove .env.production if exists
    const envProd = path.join(OUTPUT, 'server', 'app', '.env.production');
    if (fs.existsSync(envProd)) fs.removeSync(envProd);
    
    // Step 5: Download Node.js for BOTH architectures (x86 and x64)
    log('Downloading Node.js for x64 (64-bit Windows)...');
    const nodeZipX64 = path.join(TEMP, 'node-x64.zip');
    await download(
        `https://nodejs.org/dist/v${CONFIG.nodeVersionX64}/node-v${CONFIG.nodeVersionX64}-win-x64.zip`,
        nodeZipX64
    );
    
    log('Downloading Node.js for x86 (32-bit Windows)...');
    const nodeZipX86 = path.join(TEMP, 'node-x86.zip');
    await download(
        `https://nodejs.org/dist/v${CONFIG.nodeVersionX86}/node-v${CONFIG.nodeVersionX86}-win-x86.zip`,
        nodeZipX86
    );
    
    log('Extracting Node.js binaries...');
    // Extract x64
    execSync(`powershell -Command "Expand-Archive -Path '${nodeZipX64}' -DestinationPath '${TEMP}/node-x64' -Force"`, { stdio: 'inherit' });
    const nodeExtractedX64 = fs.readdirSync(path.join(TEMP, 'node-x64')).find(f => f.startsWith('node-v'));
    fs.copySync(
        path.join(TEMP, 'node-x64', nodeExtractedX64, 'node.exe'),
        path.join(OUTPUT, 'server', 'node', 'x64', 'node.exe')
    );
    
    // Extract x86
    execSync(`powershell -Command "Expand-Archive -Path '${nodeZipX86}' -DestinationPath '${TEMP}/node-x86' -Force"`, { stdio: 'inherit' });
    const nodeExtractedX86 = fs.readdirSync(path.join(TEMP, 'node-x86')).find(f => f.startsWith('node-v'));
    fs.copySync(
        path.join(TEMP, 'node-x86', nodeExtractedX86, 'node.exe'),
        path.join(OUTPUT, 'server', 'node', 'x86', 'node.exe')
    );
    
    // Step 6: Create launcher scripts
    log('Creating launcher scripts...');
    createVBSLauncher(OUTPUT);
    createServerScript(OUTPUT);
    
    // Step 7: Copy icons
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
    
    // Step 8: Create main launcher BAT (user-visible)
    const launcherBat = `@echo off
title ColorTouch CRM
cd /d "%~dp0"

echo.
echo  ====================================
echo    ColorTouch CRM - Starting...
echo  ====================================
echo.

:: Detect architecture
if "%PROCESSOR_ARCHITECTURE%"=="AMD64" (
    set ARCH=x64
) else if "%PROCESSOR_ARCHITEW6432%"=="AMD64" (
    set ARCH=x64
) else (
    set ARCH=x86
)

echo Detected: %ARCH% architecture

:: Check if already running
netstat -an 2>nul | findstr ":3000" | findstr "LISTENING" >nul
if %errorlevel%==0 (
    echo Server already running...
    start "" "http://localhost:3000"
    exit /b 0
)

:: Set Node path based on architecture
if exist "server\\node\\%ARCH%\\node.exe" (
    set NODE_PATH=server\\node\\%ARCH%\\node.exe
) else if exist "server\\node\\x86\\node.exe" (
    set NODE_PATH=server\\node\\x86\\node.exe
) else (
    echo ERROR: Node.js not found!
    pause
    exit /b 1
)

echo Starting server with %NODE_PATH%...

:: Start server in background
start /min "ColorTouch Server" cmd /c "cd /d "%~dp0server\\app" && "..\\..\\%NODE_PATH%" server.js"

:: Wait for server
echo Waiting for server to start...
set /a n=0
:wait
set /a n+=1
if %n% gtr 30 goto timeout
timeout /t 1 /nobreak >nul
netstat -an 2>nul | findstr ":3000" | findstr "LISTENING" >nul
if %errorlevel% neq 0 goto wait

echo Server ready!
echo.
echo Opening ColorTouch CRM in your browser...
start "" "http://localhost:3000"
exit /b 0

:timeout
echo Server failed to start within 30 seconds.
echo Check server\\app folder for errors.
pause
exit /b 1
`;
    fs.writeFileSync(path.join(OUTPUT, 'Start ColorTouch CRM.bat'), launcherBat);
    
    // Stop server BAT
    const stopBat = `@echo off
echo Stopping ColorTouch CRM...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1
echo Done!
timeout /t 2 >nul
`;
    fs.writeFileSync(path.join(OUTPUT, 'Stop Server.bat'), stopBat);
    
    // README
    const readme = `
=====================================
    ColorTouch CRM - Desktop App
    Version ${CONFIG.appVersion}
=====================================

QUICK START:
  Double-click "ColorTouch CRM.vbs" (recommended)
  OR double-click "Start ColorTouch CRM.bat"

DEFAULT LOGIN:
  Email: admin@colortouch.app
  Password: Admin@123!

COMPATIBILITY:
  - Windows 7, 8, 10, 11
  - Both 32-bit (x86) and 64-bit (x64)
  - No internet required (offline mode)

FILES:
  - ColorTouch CRM.vbs        = Silent launcher (no console window)
  - Start ColorTouch CRM.bat  = Launcher with console (for debugging)
  - Stop Server.bat           = Stop the server
  - server/                   = Backend server files
  - resources/                = App resources

SYNC:
  When internet is available, your data will automatically
  sync with the online version of ColorTouch CRM.

TROUBLESHOOTING:
  1. If app doesn't start, run "Stop Server.bat" first
  2. Then try "Start ColorTouch CRM.bat" again
  3. Check if port 3000 is blocked by firewall

URL: http://localhost:3000
`;
    fs.writeFileSync(path.join(OUTPUT, 'README.txt'), readme);

    // Step 9: Update Installer Script
    log('Updating installer script...');
    const installerScript = `; ColorTouch CRM Installer Script
; Inno Setup 6.x - Multi-Architecture Support
; Supports: Windows 7, 8, 10, 11 (x86 and x64)

#define MyAppName "ColorTouch CRM"
#define MyAppVersion "${CONFIG.appVersion}"
#define MyAppPublisher "ColorTouch"
#define MyAppExeName "ColorTouch CRM.vbs"

[Setup]
AppId={{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\\{#MyAppName}
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
OutputDir=installer-output
OutputBaseFilename=ColorTouch-CRM-Setup
SetupIconFile=icon.ico
UninstallDisplayIcon={app}\\resources\\icons\\icon.ico
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=lowest
DisableProgramGroupPage=yes
; Support older Windows versions
MinVersion=6.1
ArchitecturesAllowed=x86 x64
ArchitecturesInstallIn64BitMode=x64

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Files]
; Main launcher files
Source: "ColorTouch CRM.vbs"; DestDir: "{app}"; Flags: ignoreversion
Source: "Start ColorTouch CRM.bat"; DestDir: "{app}"; Flags: ignoreversion
Source: "Stop Server.bat"; DestDir: "{app}"; Flags: ignoreversion
Source: "README.txt"; DestDir: "{app}"; Flags: ignoreversion
Source: "icon.ico"; DestDir: "{app}"; Flags: ignoreversion

; Resources
Source: "resources\\*"; DestDir: "{app}\\resources"; Flags: ignoreversion recursesubdirs createallsubdirs

; Server files (includes both x86 and x64 Node.js)
Source: "server\\*"; DestDir: "{app}\\server"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
; Desktop shortcut with proper icon
Name: "{autodesktop}\\{#MyAppName}"; Filename: "wscript.exe"; Parameters: """{app}\\{#MyAppExeName}"""; WorkingDir: "{app}"; IconFilename: "{app}\\icon.ico"

; Start Menu shortcut with proper icon  
Name: "{autoprograms}\\{#MyAppName}"; Filename: "wscript.exe"; Parameters: """{app}\\{#MyAppExeName}"""; WorkingDir: "{app}"; IconFilename: "{app}\\icon.ico"

[Run]
; Option to launch after install
Filename: "wscript.exe"; Parameters: """{app}\\{#MyAppExeName}"""; Description: "Launch {#MyAppName}"; Flags: nowait postinstall skipifsilent

[UninstallRun]
; Stop the server when uninstalling
Filename: "taskkill"; Parameters: "/f /im node.exe"; Flags: runhidden; RunOnceId: "StopNode"

[Code]
// Stop server before uninstall
procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
var
  ResultCode: Integer;
begin
  if CurUninstallStep = usUninstall then
  begin
    Exec('taskkill', '/f /im node.exe', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  end;
end;
`;
    fs.writeFileSync(path.join(OUTPUT, 'ColorTouch-Installer.iss'), installerScript);
    
    // Step 10: Cleanup
    log('Cleaning up temporary files...');
    fs.removeSync(TEMP);
    
    // Done
    console.log('\n========================================');
    console.log('  BUILD COMPLETE!');
    console.log('========================================');
    console.log(`\nOutput: ${OUTPUT}`);
    console.log('\nSupported Systems:');
    console.log('  - Windows 7, 8, 10, 11');
    console.log('  - Both 32-bit (x86) and 64-bit (x64)');
    console.log('\nTo create installer:');
    console.log('  1. Install Inno Setup from https://jrsoftware.org/isinfo.php');
    console.log('  2. Open ColorTouch-Desktop/ColorTouch-Installer.iss');
    console.log('  3. Click Build > Compile');
    console.log('  4. Find installer in ColorTouch-Desktop/installer-output/');
    console.log('');
}

build().catch(err => {
    console.error('Build failed:', err);
    process.exit(1);
});
