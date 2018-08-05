'use strict';
var SerialPort = require('serialport');

var port = new SerialPort('COM3', {
	baudRate: 9600,
	parity: "none",
	dataBits: 8,
	stopBits: 1
});

port.on('open', function() {
	console.log('Port open');
});

var buf = "";
var messQueue = [];

setInterval(() => { 
	if (messQueue.length === 0) {
		return;
	}
	port.write(messQueue[0] + "\r\n");
	messQueue.splice(0, 1);
}, 100);

port.on('data', function(data) {
	buf += data.toString('ascii');
	let mess = null;
	while (true) {
		let idx = buf.indexOf("\r\n");
		if (idx<0) {
			break;
		}
		mess = buf.substring(0, idx);
		buf = buf.substring(idx+2);
		if (mess.match(/R?eady/)) {
			var now = Math.round(new Date().getTime()/1000);
			messQueue.push(now);
			for (let i=1; i<=4; i++) {
				messQueue.push((now+2*i) + " 4107678 0 " + (i%2));
			}
		}
		if (mess.match(/checkTimers\([0-9]{10}\)/)) {
			var t = Number(mess.substring(12,22));
			console.log("heartbeat, diff ms = " + (1000*t - new Date().getTime()).toFixed(0));
		}
		else {
			console.log(mess);
		}
	}
});
/*
1473886559
1473886559 4107678 0 0
1473886559 4107678 1 0
1473886559 4107678 2 0
1473886563 4107678 0 1
1473886567 4107678 1 1
1473886571 4107678 0 0
1473886575 4107678 2 1
1473886579 4107678 0 1
1473886583 4107678 1 0
1473886587 4107678 0 0
1473886591 4107678 2 0
*/