const { app, BrowserWindow, ipcMain, Notification, shell } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = new Store({
  encryptionKey: 'socialpilot-secure-key-2024',
});

const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    backgroundColor: '#0a0a0f',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, '../assets/icon.png'),
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC Handlers
ipcMain.handle('store:get', (event, key) => store.get(key));
ipcMain.handle('store:set', (event, key, value) => store.set(key, value));
ipcMain.handle('store:delete', (event, key) => store.delete(key));

ipcMain.handle('notification:send', (event, { title, body }) => {
  if (Notification.isSupported()) {
    new Notification({ title, body }).show();
  }
});

ipcMain.handle('shell:openExternal', (event, url) => {
  shell.openExternal(url);
});

ipcMain.handle('app:getPath', (event, name) => {
  return app.getPath(name);
});
