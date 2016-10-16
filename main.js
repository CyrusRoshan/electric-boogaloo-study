const exec = require('child_process').exec;

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
  width: 630,
  height: 200,
  transparent: false,
  resizable: false,
  index: 'file://' + path.join(__dirname, 'client', 'index.html'),
})

var settings = {
  shock: true,
  alert: true,
}

var data = {};
var dataArray = [];

mb.on('ready', () => {
  mb.tray.setToolTip('Electric Boogaloo')

  mb.tray.on('right-click', function(){
    var contextMenu = Menu.buildFromTemplate([
      {label: 'Shock when distracted', type: 'checkbox', checked: settings.shock, click: () => {settings.shock = !settings.shock}},
      {label: 'Alert when distracted', type: 'checkbox', checked: settings.alert, click: () => {settings.alert = !settings.alert}},
      {type: 'separator'},
      {label: 'Reset Data', click: () => {dataArray = []}},
      {type: 'separator'},
      {label: 'Exit', click: () => {app.quit()}},
    ])
    mb.tray.popUpContextMenu(contextMenu)
  })

  setInterval(() => {
    activeWin().then(window => {
      data.app = window.app.toLowerCase()
      data.chrome = data.app.includes('chrome')

      data.windowProductivity = 0;
      if (utils.windowBlacklist.some(blacklisted => data.app.includes(blacklisted))) {
        data.windowProductivity = -1;
      } else if (utils.windowWhitelist.some(whitelisted => data.app.includes(whitelisted))) {
        data.windowProductivity = 1;
      }
    });

    var cmd;
    if ((!data.chrome && data.windowProductivity == -1) || (data.chrome && data.chromeProductivity == -1)) {
      cmd = `echo 'Y' > /dev/cu.usbmodem1411`
      mb.tray.setImage(iconYellow)

      if (settings.alert) {
        utils.alert('ELECTRIC BOOGALOO', 'BACK TO WORK!', iconYellow)
      }
    } else if ((!data.chrome && data.windowProductivity == 0) || (data.chrome && data.chromeProductivity == 0)) {
      cmd = `echo 'N' > /dev/cu.usbmodem1411`
      mb.tray.setImage(icon)
    } else {
      cmd = `echo 'N' > /dev/cu.usbmodem1411`
      mb.tray.setImage(iconGreen)
    }

    exec(cmd, function(error, stdout, stderr) {
      // console.log(error, stdout, stderr);
    });

    dataArray.push(JSON.stringify(data));
    console.log(data);
    mb.window.webContents.send('data', dataArray);
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

    data.chromeProductivity = 0;
    if (utils.urlBlacklist.some(blacklisted => body.url.toLowerCase().includes(blacklisted))) {
      data.chromeProductivity = -1;
    } else if (utils.urlWhitelist.some(whitelisted => body.url.toLowerCase().includes(whitelisted))){
      data.chromeProductivity = 1;
    }
  } catch (e) {
    console.log(e)
  }
})

koaApp.listen(process.env.PORT || 3000)
