console.log('Loading electron...');
try {
  const electron = require('electron');
  console.log('Electron type:', typeof electron);
  console.log('Electron:', electron);

  if (typeof electron === 'string') {
    console.log('ERROR: Electron is a string (path), not an object!');
    console.log('This means we are NOT running inside Electron context');
    process.exit(1);
  }

  const { app } = electron;
  console.log('app:', app);

  app.whenReady().then(() => {
    console.log('Electron is ready!');
    process.exit(0);
  });
} catch (err) {
  console.error('Error loading electron:', err);
  process.exit(1);
}
