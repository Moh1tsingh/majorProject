import { app, BrowserWindow, ipcMain, dialog } from 'electron'
// import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from "fs"
import { exec } from "node:child_process"

let openedFilePath = ""

// const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      devTools: true
    },
  })

  win.maximize()
  win.webContents.openDevTools()

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())

    ipcMain.handle("saveFile", saveFile)
    ipcMain.handle("openFile", (e) => openFile(e, win))
    ipcMain.handle("compileAndRun", (e, file_content) => {
      console.log(file_content)
      compileAndRun(e, win, file_content)})
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

const saveFile = (_: any, fileContent: any) => {
  dialog.showSaveDialog({
    filters: [
      { name: "Eminem Files", extensions: ["mnm"] },
      { name: "All Files", extensions: ["*"] },
    ]
  }).then((res) => {
    fs.writeFile(res.filePath, fileContent, (err) => {
      if (err != null) {
        console.log(err)
      }
    })
  })
}

const openFile = (_: any, win: any) => {
  dialog.showOpenDialog({
    filters: [
      { name: "Eminem Files", extensions: ["mnm"] },
      { name: "All Files", extensions: ["*"] },
    ]
  }).then((res) => {
    if (res.filePaths[0] == undefined) {
      return
    }
    openedFilePath = res.filePaths[0]
    fs.readFile(res.filePaths[0], "utf-8", (_, fileContent) => {
      win.webContents.send("openedFile", {fileContent, openedFilePath})
    })
  })
}

const compileAndRun = (_: any, win: any, file_content: any) => {
  console.log(process.platform)
  if (process.platform == "win32") {
    console.log(file_content)
    fs.writeFileSync(openedFilePath, file_content)
    exec(" ..\\compiler\\build\\compiler.exe " + openedFilePath, (err, stdout, stderr) => {
      console.log(stdout)
      win.webContents.send("compiledAndRun", stdout + stderr + err?.code)
    })
  } else {
    console.log(file_content)
    fs.writeFileSync(openedFilePath, file_content)
    exec(" ../compiler/build/compiler " + openedFilePath, (err, stdout, stderr) => {
      console.log(stdout)
      win.webContents.send("compiledAndRun", stdout + stderr + err?.code)
    })
  }
}

app.whenReady().then(createWindow)
