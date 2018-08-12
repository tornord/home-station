var SerialPort = require('serialport');
var port = new SerialPort('COM8', {
  baudRate: 19200
});

port.on('readable', function () {
	console.log('Data:', port.read());
  });