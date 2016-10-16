const textStats = require('text-statistics')
const activeWin = require('active-win')
const utils = require('./utils')

const koa = require('koa')
const parse = require('co-body')

const koaApp = module.exports = koa()

const electron = require('electron')
const app = electron.app
const Menu = electron.Menu
const Tray = electron.Tray
const ipcMain = require('electron').ipcMain

const path = require('path')
const menubar = require('menubar')
const notifier = require('node-notifier')

const icon = path.join(__dirname, 'icon.png')
const iconGreen = path.join(__dirname, 'iconGreen.png')
const iconYellow = path.join(__dirname, 'iconYellow.png')

var mb = menubar({
  icon: icon,
  preloadWindow: true,
  width: 700,
  height: 500,
  transparent: true,
  resizable: false,
  index: 'file://' + path.join(__dirname, 'client', 'index.html'),
})

var settings = {
  shock: true,
  alert: true,
}

var data = {};

mb.on('ready', () => {
  mb.tray.setToolTip('Electric Boogaloo')

  mb.tray.on('right-click', function(){
    var contextMenu = Menu.buildFromTemplate([
      {label: 'Shock when distracted', type: 'checkbox', checked: settings.shock, click: () => {settings.shock = !settings.shock}},
      {label: 'Alert when distracted', type: 'checkbox', checked: settings.alert, click: () => {settings.alert = !settings.alert}},
      {type: 'separator'},
      {label: 'Exit', click: () => {app.quit()}},
    ])
    mb.tray.popUpContextMenu(contextMenu)
  })

  setInterval(() => {
    activeWin().then(window => {
      data.app = window.app.toLowerCase()
      data.chrome = data.app.includes('chrome')

      data.productivity = 0;
      if (utils.windowBlacklist.some(blacklisted => data.app.includes(blacklisted))) {
        data.productivity = -1;
      } else if (utils.windowWhitelist.some(whitelisted => data.app.includes(whitelisted))) {
        data.productivity = 1;
      }
    });

    if (data.productivity == -1) {
      mb.tray.setImage(iconYellow)

      if (settings.alert) {
        utils.alert('ELECTRIC BOOGALOO', 'BACK TO WORK!', iconYellow)
      }
    } else if (data.productivity == 0) {
      mb.tray.setImage(icon)
    } else {
      mb.tray.setImage(iconGreen)
    }
    // send to ipc
  }, 1000);
})

koaApp.use(function *(next){
  if (!data.chrome || this.method !== 'POST') {
    return yield next
  }

  try {

    var body = yield parse(this, { limit: '3000kb' })
    data.url = body.url;

    var stats = textStats(body.text)
    data.combinedStats = (stats.colemanLiauIndex() + stats.fleschKincaidGradeLevel()) / 2

    data.productivity = 0;
    if (utils.urlBlacklist.some(blacklisted => body.url.toLowerCase().includes(blacklisted))) {
      data.productivity = -1;
    } else if (utils.urlWhitelist.some(whitelisted => body.url.toLowerCase().includes(whitelisted))){
      data.productivity = 1;
    }

    mb.window.webContents.send('data', data);
  } catch (e) {
    console.log(e)
  }
})

koaApp.listen(process.env.PORT || 3000)
