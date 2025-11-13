const { app, BrowserWindow } = require('electron');

app.whenReady().then(() => {
  console.log('Electron app is ready!');

  const win = new BrowserWindow({
    width: 800,
    height: 600
  });

  win.loadURL('https://electronjs.org');
});

app.on('window-all-closed', () => {
  app.quit();
});
