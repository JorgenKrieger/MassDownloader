// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain, dialog, Menu} = require('electron')
const path = require('path')

const isMac = process.platform === 'darwin'

const template = [
  // { role: 'appMenu' }
  ...(isMac ? [{
    label: app.name,
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      { role: 'services' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideothers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' }
    ]
  }] : []),
  // { role: 'fileMenu' }
  {
    label: 'File',
    submenu: [
      isMac ? { role: 'close' } : { role: 'quit' }
    ]
  },
  // { role: 'editMenu' }
  {
    label: 'Edit',
    submenu: [
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' }
    ]
  },
  // { role: 'viewMenu' },
  // { role: 'windowMenu' },
  {
    label: 'Window',
    submenu: [
      { role: 'minimize' },
      { role: 'zoom' },
      ...(isMac ? [
        { type: 'separator' },
        { role: 'front' },
        { type: 'separator' },
        { role: 'window' }
      ] : [
        { role: 'close' }
      ])
    ]
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'Report an issue...',
        click: async () => {
          const { shell } = require('electron')
          await shell.openExternal('https://github.com/JorgenKrieger/MassDownloader/issues')
        }
      },
      { type: 'separator' },
      {
        label: 'More apps by noir',
        click: async () => {
          const { shell } = require('electron')
          await shell.openExternal('https://apps.labelnoir.me')
        }
      },
      ...(!isMac ? [
        { type: 'separator' },
        { role: 'about' }
      ] : [])
    ]
  }
]

const menu = Menu.buildFromTemplate(template)

let mainWindow

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 940,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      experimentalFeatures: true,
      nodeIntegration: true,
      //devTools: false
    },
    titleBarStyle: 'hidden',
    icon: path.join(__dirname, 'assets/img/icon.png')
  })
  
  // and load the index.html of the app.
  mainWindow.loadFile('index.html')
  
  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
  
  mainWindow.setMenu(null)
}


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  createWindow()
  Menu.setApplicationMenu(menu)
})

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
// exports.selectDirectory = function () {
//   dialog.showOpenDialog(mainWindow, { 
//     properties: ['openDirectory']
//   })
// }

let options = {
  title: "Download location",
  properties: ['openDirectory', 'createDirectory']
}


ipcMain.on('selectDirectory', (event) => {
  dialog.showOpenDialog(options, (dir) => { 
    if (!dir[0]) return
    event.sender.send('output-path', dir[0]);
  });
})