'use strict';

var { ArduinoCommunicator } = require("./ArduinoCommunicator");

var comm = new ArduinoCommunicator("COM5");
var house = "4107678";
var onoff = false;
var n = 0;

var sendCommand = () => {
	var tme = new Date(new Date().getTime() + 5000 + Math.floor(10000*Math.random()));
	comm.sendCommand(tme, house, 0, onoff);
	onoff = !onoff;	
	if (n++<10) {
		setTimeout(() => {
			sendCommand();
		}, 5000 + Math.floor(10000*Math.random()));	 
	}
};
sendCommand();

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