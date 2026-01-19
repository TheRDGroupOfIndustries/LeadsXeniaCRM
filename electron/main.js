/**
 * XeniaCRM CRM - Electron Main Process
 * Creates a native desktop window (NOT browser!)
 */

const { app, BrowserWindow, shell, Menu, Tray, nativeImage } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');
const fs = require('fs');

// Configuration
const SERVER_PORT = 3000;
const SERVER_URL = `http://localhost:${SERVER_PORT}`;
const APP_NAME = 'XeniaCRM CRM';

let mainWindow = null;
let serverProcess = null;
let tray = null;
let isQuitting = false;

// Get resource paths
function getResourcePath(...paths) {
    // In production (packaged), resources are in resources folder
    if (app.isPackaged) {
        return path.join(process.resourcesPath, ...paths);
    }
    // In development
    return path.join(__dirname, '..', ...paths);
}

// Find Node.js executable
function getNodePath() {
    const arch = process.arch === 'x64' ? 'x64' : 'x86';
    
    // Try architecture-specific first
    let nodePath = getResourcePath('server', 'node', arch, 'node.exe');
    if (fs.existsSync(nodePath)) return nodePath;
    
    // Fallback to x86
    nodePath = getResourcePath('server', 'node', 'x86', 'node.exe');
    if (fs.existsSync(nodePath)) return nodePath;
    
    // Fallback to bundled node (if using electron's node)
    return process.execPath;
}

// Check if server is running
function checkServer() {
    return new Promise((resolve) => {
        const req = http.get(SERVER_URL, (res) => {
            resolve(res.statusCode === 200 || res.statusCode === 302);
        });
        req.on('error', () => resolve(false));
        req.setTimeout(2000, () => {
            req.destroy();
            resolve(false);
        });
    });
}

// Start the Next.js server
async function startServer() {
    const isRunning = await checkServer();
    if (isRunning) {
        console.log('Server already running');
        return true;
    }

    console.log('Starting Next.js server...');
    
    const serverPath = getResourcePath('server', 'app', 'server.js');
    const serverDir = path.dirname(serverPath);
    const nodePath = getNodePath();
    
    console.log('Node path:', nodePath);
    console.log('Server path:', serverPath);
    
    if (!fs.existsSync(serverPath)) {
        console.error('Server file not found:', serverPath);
        return false;
    }

    return new Promise((resolve) => {
        serverProcess = spawn(nodePath, ['server.js'], {
            cwd: serverDir,
            env: {
                ...process.env,
                NODE_ENV: 'production',
                PORT: SERVER_PORT.toString(),
            },
            stdio: ['ignore', 'pipe', 'pipe'],
            windowsHide: true
        });

        serverProcess.stdout.on('data', (data) => {
            console.log(`Server: ${data}`);
        });

        serverProcess.stderr.on('data', (data) => {
            console.error(`Server Error: ${data}`);
        });

        serverProcess.on('error', (err) => {
            console.error('Failed to start server:', err);
            resolve(false);
        });

        // Wait for server to be ready
        let attempts = 0;
        const maxAttempts = 30;
        
        const checkInterval = setInterval(async () => {
            attempts++;
            const running = await checkServer();
            
            if (running) {
                clearInterval(checkInterval);
                console.log('Server started successfully');
                resolve(true);
            } else if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
                console.error('Server failed to start within timeout');
                resolve(false);
            }
        }, 1000);
    });
}

// Stop the server
function stopServer() {
    if (serverProcess) {
        console.log('Stopping server...');
        serverProcess.kill('SIGTERM');
        serverProcess = null;
    }
}

// Create the main window
function createWindow() {
    // Get icon path
    let iconPath = getResourcePath('resources', 'icons', 'icon.png');
    if (!fs.existsSync(iconPath)) {
        iconPath = getResourcePath('icon.ico');
    }

    mainWindow = new BrowserWindow({
        width: 1280,
        height: 850,
        minWidth: 900,
        minHeight: 600,
        title: APP_NAME,
        icon: iconPath,
        backgroundColor: '#0f172a', // Dark background matching app theme
        show: false, // Don't show until ready
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: true,
        },
        autoHideMenuBar: true, // Hide menu bar for cleaner look
    });

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.focus();
    });

    // Load the app
    mainWindow.loadURL(SERVER_URL);

    // Handle external links - open in default browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('http') && !url.includes('localhost')) {
            shell.openExternal(url);
            return { action: 'deny' };
        }
        return { action: 'allow' };
    });

    // Handle window close - minimize to tray instead
    mainWindow.on('close', (event) => {
        if (!isQuitting) {
            event.preventDefault();
            mainWindow.hide();
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Remove default menu
    Menu.setApplicationMenu(null);
}

// Create system tray
function createTray() {
    let iconPath = getResourcePath('resources', 'icons', 'icon.png');
    if (!fs.existsSync(iconPath)) {
        iconPath = getResourcePath('icon.ico');
    }
    
    const icon = nativeImage.createFromPath(iconPath);
    tray = new Tray(icon.resize({ width: 16, height: 16 }));
    
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Open XeniaCRM CRM',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.focus();
                }
            }
        },
        { type: 'separator' },
        {
            label: 'Quit',
            click: () => {
                isQuitting = true;
                app.quit();
            }
        }
    ]);
    
    tray.setToolTip(APP_NAME);
    tray.setContextMenu(contextMenu);
    
    tray.on('click', () => {
        if (mainWindow) {
            if (mainWindow.isVisible()) {
                mainWindow.focus();
            } else {
                mainWindow.show();
            }
        }
    });
}

// Show loading window while server starts
function createLoadingWindow() {
    const loadingWindow = new BrowserWindow({
        width: 400,
        height: 300,
        frame: false,
        transparent: false,
        backgroundColor: '#667eea',
        resizable: false,
        center: true,
        webPreferences: {
            nodeIntegration: false,
        }
    });
    
    loadingWindow.loadURL(`data:text/html;charset=utf-8,
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    -webkit-app-region: drag;
                }
                .container { text-align: center; }
                h1 { font-size: 24px; margin-bottom: 8px; }
                p { opacity: 0.9; font-size: 14px; margin-bottom: 30px; }
                .spinner {
                    width: 40px; height: 40px;
                    border: 3px solid rgba(255,255,255,0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto;
                }
                @keyframes spin { to { transform: rotate(360deg); } }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>XeniaCRM CRM</h1>
                <p>Starting application...</p>
                <div class="spinner"></div>
            </div>
        </body>
        </html>
    `);
    
    return loadingWindow;
}

// App ready
app.whenReady().then(async () => {
    // Show loading screen
    const loadingWindow = createLoadingWindow();
    
    // Start server
    const serverStarted = await startServer();
    
    // Close loading window
    loadingWindow.close();
    
    if (!serverStarted) {
        const { dialog } = require('electron');
        dialog.showErrorBox('Error', 'Failed to start the application server. Please try again.');
        app.quit();
        return;
    }
    
    // Create main window and tray
    createWindow();
    createTray();
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        isQuitting = true;
        app.quit();
    }
});

// Cleanup on quit
app.on('before-quit', () => {
    isQuitting = true;
    stopServer();
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
});
