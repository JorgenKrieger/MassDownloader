// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

// Required components
const fs = require('fs')
const http = require('http')
const https = require('https')
const shell = require('electron').shell
const ipcRenderer = require('electron').ipcRenderer

// Query Selectors
const button       = document.querySelector('button#download')
const reset        = document.querySelector('button#reset')
const main         = document.querySelector('main');
const screenSplash = document.querySelector('.main.splash')
const screenDrop   = document.querySelector('.main.drop')
const screenList   = document.querySelector('.main.list')

// Variables
const buttonDefaultText = button.innerText
const screenSwitchDelay = 2500

const txt = {
  splash: "Paste URLs or upload a .txt file with URLs.",
  dragdrop: "Drop your file list now :D",
  error: "File type not supported yet!"
}

let downloadList = []
let filePickerOpen = false



// Open _blank links in OS browser
document.addEventListener('click', (e) => {
  if (e.target.target != "_blank") return

  e.preventDefault()
  shell.openExternal(e.target.href)
})


// Paste event handler
addEventListener('paste', (e) => {
  let paste = (e.clipboardData || window.clipboardData).getData('text')
  urlHandler(paste)
})

// Drag & drop event handler
let dragArea = document.querySelector('main')
dragArea.ondragover = () => { toDragDrop(); return false; }
dragArea.ondragleave = () => { toSplash(); return false; }
dragArea.ondragend = () => { toSplash(); return false; }

dragArea.ondrop = (e) => {
  e.preventDefault()
  for (let f of e.dataTransfer.files) { fileHandler(f) }
}



// Main states
function toSplash(){
  if (!main.classList.contains('center')) main.classList.add('center')
  if (main.classList.contains('list')) main.classList.remove('list')
  main.innerHTML = `<p>${txt.splash}</p>`
}

function toDragDrop(){
  if (!main.classList.contains('center')) main.classList.add('center')
  if (main.classList.contains('list')) main.classList.remove('list')
  main.innerHTML = `<p>${txt.dragdrop}</p>`
}

function toFileList(){
  if (main.classList.contains('center')) main.classList.remove('center')
  if (!main.classList.contains('list')) main.classList.add('list')

  let files = "";

  downloadList.forEach((file, index) => {
    files += `<li><a href="${file}" target="_blank">${file}</a></li>`
  });
  
  main.innerHTML = `<strong>Download list</strong><ul>${files}</ul>`
}

function toFileError(){
  if (!main.classList.contains('center')) main.classList.add('center')
  if (main.classList.contains('list')) main.classList.remove('list')
  main.innerHTML = `<p>${txt.error}</p>`

  if (downloadList.length === 0)
    setTimeout(toSplash, screenSwitchDelay)
  else
    setTimeout(toFileList, screenSwitchDelay)
}

function toSuccess(){
  if (!main.classList.contains('center')) main.classList.add('center')
  if (main.classList.contains('list')) main.classList.remove('list')
  main.innerHTML = "<p>Your files are downloading</p>"

  setTimeout(() => { 
    toSplash()
    disableButton()
    downloadList = []
  }, screenSwitchDelay)
}



// Handle files
function fileHandler(file){
  // If: .txt
  if (file.path.includes('.txt')){
    fs.readFile(file.path, 'utf-8', (error, data) => {
      if (error) throw error
      urlHandler(data)
    })
    return
  }

  // If extension not supported
  toFileError()
  return
}

// Handle URLs
function urlHandler(input){
  // Add URLs to download list
  let urls = input.split("\n").filter(el => { return el != '' })
  urls.forEach(url => {
    downloadList.push(url)
  })
  
  // Enable and update the download button
  if (downloadList.length > 0) {
    enableButton()
    button.innerText = `Download ${downloadList.length} files`
  }

  // Display download list
  toFileList()
}


reset.addEventListener('click', () => {
  if (reset.disabled) return

  toSplash()
  disableButton()
  downloadList = []
})



// 2. Make button available
function enableButton() {
  if (button.disabled && reset.disabled){
    button.disabled = false
    reset.disabled = false
  }
}

function disableButton() {
  if (!button.disabled && !reset.disabled) {
    button.disabled = true
    reset.disabled = true
  } 
  button.innerText = buttonDefaultText
}



// 3. Select a folder
button.addEventListener('click', _ => { 
  if (button.disabled) return
  if (filePickerOpen) return

  filePickerOpen = true
  ipcRenderer.send('selectDirectory')
});



// 4. Download when folder selected
ipcRenderer.on('output-path', (event, path) => { 
  downloadList.forEach(url => {
    let fileName = url.replace(/^.*[\\\\/]/, '')
    let newFile = fs.createWriteStream(`${path}/${fileName}`)

    if (url.startsWith("http://")){
      let request = http.get(url, (response) => { response.pipe(newFile) })
    } else if (url.startsWith("https://")) {
      let request = https.get(url, (response) => { response.pipe(newFile) })
    }
  })

  shell.openItem(path)
  filePickerOpen = false
  toSuccess()
})