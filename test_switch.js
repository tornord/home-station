const moment = require('moment');
const { Switch } = require("./commonjs/src/Switch");

var s = new Switch("Hello", "123", 0, "06:15", "23.15", "07:30", "00:30", 59.32, 17.95);

console.log(s.toMinutes(new Date()));

var now = moment("22:00", "HH:mm").toDate();
var state = Switch.getState(now.getDay(), Switch.dateToMinutes(now), s.getSun(now), s.toMinutes(now));
var nextEvent = s.nextEvent(now);
var nextNextEvent = s.nextEvent(nextEvent.timestamp);
