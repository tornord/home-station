"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Switch = exports.Event = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _suncalc = require("suncalc");

var SunCalc = _interopRequireWildcard(_suncalc);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Event = exports.Event = function Event(timestamp, state) {
  _classCallCheck(this, Event);

  this.timestamp = timestamp;
  this.state = state;
};

var Switch = exports.Switch = function () {
  function Switch(name, house, group, wakeUp, goToBed, weekendWakeUp, weekendGoToBed, latitude, longitude) {
    _classCallCheck(this, Switch);

    this.name = name;
    this.house = house;
    this.group = group;
    this.wakeUp = wakeUp;
    this.goToBed = goToBed;
    this.weekendWakeUp = weekendWakeUp;
    this.weekendGoToBed = weekendGoToBed;
    this.latitude = latitude;
    this.longitude = longitude;
  }

  _createClass(Switch, [{
    key: "toMinutes",
    value: function toMinutes() {
      var _this = this;

      return ["wakeUp", "goToBed", "weekendWakeUp", "weekendGoToBed"].reduce(function (p, c) {
        p[c] = Switch.parseMinutes(_this[c]);
        return p;
      }, {});
    }
  }, {
    key: "toString",
    value: function toString() {
      return this.name + ": " + this.wakeUp + "-" + this.goToBed + " (" + this.weekendWakeUp + "-" + this.weekendGoToBed + ")";
    }
  }, {
    key: "getSun",
    value: function getSun(d) {
      var midday = new Date(d.getTime()).setHours(12, 0, 0, 0);
      var sun = SunCalc.getTimes(new Date(midday), this.latitude, this.longitude);
      return { sunrise: Switch.dateToMinutes(sun.sunriseEnd), sunset: Switch.dateToMinutes(sun.sunsetStart) };
    }
  }, {
    key: "nextEvent",
    value: function nextEvent(d) {
      var minPerDay = 24 * 60;
      var mins = this.toMinutes();
      var sun = this.getSun(d);
      var w = d.getDay();
      var m = Switch.dateToMinutes(d);
      var s0 = Switch.getState(w, m, sun, mins);
      for (var i = 1; i <= minPerDay; i++) {
        if (++m >= minPerDay) {
          m -= minPerDay;
          w = (w + 1) % 7;
        }
        var s = Switch.getState(w, m, sun, mins);
        if (s !== s0) {
          return new Event(new Date(d.getTime() + i * Switch.msPerMinute), s);
        }
      }
      return new Event(new Date(d.getTime() + Switch.msPerDay), s0);
    }

    // static dayOfYear(d) {		
    // 	var start = new Date(Date.UTC(d.getFullYear(), 0, 0));
    // 	return Math.floor((d - start) / Lamp.msPerDay);
    // }	

    // setRandomHours(d) {
    //     var y = Lamp.dayOfYear(d);
    //     var h1 = 22 + ((237 * y + 151) % 180) / 60;
    //     if (h1 >= 24)
    //         h1 -= 24;
    //     var h2 = 6 + ((219 * y + 191) % 180) / 60;
    //     this.goToBed = h1;
    //     this.wakeUp = h2;
    //     this.weekendGoToBed = h1 + ((h1 > 23) ? -23 : 1);
    //     this.weekendWakeUp = h2 + 1;
    // }

    // getControlString(d) {
    //     var s = this.getState(d);
    //     var n = this.nextEvent(d);
    //     return d.toUnixTime() + " " + this.house + " " + this.group + " " + s + "\r\n" +
    //         n[0].toUnixTime() + " " + this.house + " " + this.group + " " + n[1] + "\r\n";
    // }

  }], [{
    key: "parseMinutes",


    // static totalHours(d) {
    // 	var r = d.getHours() + d.getMinutes() / 60;
    // 	return (r < 0) ? r+24 : ((r > 24) ? r-24 : r);
    // }

    // static hourToString(d) {
    //     var f = function (r) { var s = r.toFixed(0); return ((s.length === 1) ? "0" : "") + s; };
    //     var h = Math.floor(d);
    //     return f(h) + ":" + f(60 * (d - h));
    // }

    value: function parseMinutes(s) {
      return 60 * Number(s.substring(0, 2)) + Number(s.substring(3, 5));
    }
  }, {
    key: "dateToMinutes",
    value: function dateToMinutes(d) {
      var t1 = d.getTime();
      var t0 = new Date(d.getTime()).setHours(0, 0, 0, 0);
      return (t1 - t0) / Switch.msPerMinute;
    }
  }, {
    key: "getState",
    value: function getState(w, m, sun, minutes) {
      var wakeUp = minutes.wakeUp,
          goToBed = minutes.goToBed;

      var midday = 12 * 60;
      if (w === 6 || w === 0) wakeUp = minutes.weekendWakeUp;
      if (m < midday) {
        if (w === 6 || w === 0) goToBed = minutes.weekendGoToBed;
      } else if (w === 5 || w === 6) goToBed = minutes.weekendGoToBed;
      if (m <= sun.sunrise || m >= sun.sunset) {
        if (goToBed === wakeUp) return true;
        if (goToBed < midday) if (m < goToBed || m >= wakeUp) return true;
        if (m < goToBed && m >= wakeUp) return true;
      }
      return false;
    }
  }]);

  return Switch;
}();

Switch.msPerMinute = 60 * 1000;
Switch.msPerHour = 60 * Switch.msPerMinute;
Switch.msPerDay = 24 * Switch.msPerHour;