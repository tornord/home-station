var SerialPort = require('serialport');

//var comName = "COM5";
//var comName = "/dev/ttyAMA0";

class ArduinoCommunicator {
	constructor(comName) {
		this.port = new SerialPort(comName, {
			baudRate: 9600,
			parity: "none",
			dataBits: 8,
			stopBits: 1
		});

		this.port.on('open', function() {
			console.log('Port open');
		});

		this.buffer = "";
		this.messQueue = [];
		this.canSendTime = false;

		setInterval(() => this.checkMessageQueue(this), 50);
		this.port.on('data', (data) => this.onData(this, data));
	}

	sendCommand(timestamp, house, group, onoff) {
		this.messQueue.push([Math.round(timestamp.getTime()/1000).toFixed(0),
			house, group.toFixed(0), onoff ? "1" : "0"].join(" "));
	}

	checkMessageQueue(_this) {
		if (_this.messQueue.length === 0) {
			return;
		}
		_this.port.write(_this.messQueue[0] + "\r\n");
		_this.messQueue.splice(0, 1);	
	}

	onData(_this, data) {
		_this.buffer += data.toString('ascii');
		let mess = null;
		while (true) {
			let idx = _this.buffer.indexOf("\r\n");
			if (idx<0) {
				break;
			}
			mess = _this.buffer.substring(0, idx);
			_this.buffer = _this.buffer.substring(idx+2);
			if (mess.match(/R?eady/)) {
				_this.canSendTime = true;
			}
			var m = mess.match(/checkTimers\(([0-9]+)\)/);
			if (m) {
				var t = Number(m[1]);
				var diff = 1000*t - new Date().getTime();
				console.log("Heartbeat, diff ms = " + diff.toFixed(0));
				if (_this.canSendTime && (Math.abs(diff) > 1000)) {
					_this.canSendTime = false;
					let t = new Date().getTime();
					let ms = t % 1000;
					let s = (t - ms) / 1000;
					let delay = -120-ms;
					while (delay<0) {
						s++;
						delay += 1000;
					}
					setTimeout(() => {
						console.log("Sending time: " + s.toFixed(0));
						_this.port.write(s.toFixed(0) + "\r\n");
						_this.canSendTime = true;
					}, delay);
				}
			}
			else {
				console.log(mess);
			}
		}
	}
}

module.exports = { ArduinoCommunicator };
