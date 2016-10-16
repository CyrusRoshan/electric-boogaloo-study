const SerialPort = require('serialport');
const port = new SerialPort('/dev/tty.usbmodem1411');

port.on('open', function() {
  // setInterval(() => {
    // if (data.windowProductivity == -1 || data.chromeProductivity == -1) {
      port.write('Y', (e) => {
        console.log(e);
      })
    // } else {
      // port.write('N')
    // }
  // }, 1000)
});
