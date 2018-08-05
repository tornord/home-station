import * as SunCalc from "suncalc";

export class Switch {
	constructor(timestamp, state) {
		this.timestamp = timestamp;
		this.state = state;
	}
}

export class Lamp {
	constructor(house, unit, wakeUp, goToBed, weekendWakeUp, weekendGoToBed, lat, lon) {
        this.house = house;
        this.unit = unit;
        this.wakeUp = wakeUp;
        this.goToBed = goToBed;
        this.weekendWakeUp = weekendWakeUp;
        this.weekendGoToBed = weekendGoToBed;
        this.lat = lat;
        this.lon = lon;
	}

	static totalHours(d) {
 		var r = d.getHours() + d.getMinutes() / 60;
		return (r < 0) ? r+24 : ((r > 24) ? r-24 : r);
    }

	static hourToString(d) {
        var f = function (r) { var s = r.toFixed(0); return ((s.length === 1) ? "0" : "") + s; };
        var h = Math.floor(d);
        return f(h) + ":" + f(60 * (d - h));
	}

	toString() {
        return Lamp.hourToString(this.wakeUp) + "-" + Lamp.hourToString(this.goToBed) + " (" +
            Lamp.hourToString(this.weekendWakeUp) + "-" + Lamp.hourToString(this.weekendGoToBed) + ")";
	}

	getSun(d) {
		var sun = SunCalc.getTimes(d, this.lat, this.lon);
		return { sunrise: Lamp.totalHours(sun.sunriseEnd), sunset: Lamp.totalHours(sun.sunsetStart) };
	}

	getState(w, t, sun) {
        var { wakeUp, goToBed } = this;
        var midday = 12.0;
        if ((w === 6) || (w === 0))
            wakeUp = this.weekendWakeUp;
        if (t < midday) {
            if ((w === 6) || (w === 0))
                goToBed = this.weekendGoToBed;
        }
        else if ((w === 5) || (w === 6))
            goToBed = this.weekendGoToBed;
        if ((t <= sun.sunrise) || (t >= sun.sunset)) {
            if (goToBed === wakeUp)
                return true;
            if (goToBed < midday)
                if ((t < goToBed) || (t >= wakeUp))
                    return true;
            if ((t < goToBed) && (t >= wakeUp))
                return true;
        }
        return false;
	}

	nextSwitch(d) {
		var sun = this.getSun(d);
		var w0 = d.getDay();
		var t0 = Lamp.totalHours(d);
		var s0 = this.getState(w0, t0, sun);
		for (let i=1; i<=(24 * 60); i++) {
			let t = t0 + i/60;
			let w = w0;
			if (t >= 24) {
				t -=24;
				w = (w+1) % 7;
			}
			var s = this.getState(w, t, sun);
            if (s !== s0) {
				return new Switch(new Date(d.getTime() + i*Lamp.msPerMinute), s);
			}
		}
		return new Switch(new Date(d.getTime() + Lamp.msPerDay), s0);
	}

	static msPerMinute = 60 * 1000;
	static msPerHour = 60 * Lamp.msPerMinute;
	static msPerDay = 24 * Lamp.msPerHour;

	static dayOfYear(d) {		
		var start = new Date(Date.UTC(d.getFullYear(), 0, 0));
		return Math.floor((d - start) / Lamp.msPerDay);
	}	

	setRandomHours(d) {
        var y = Lamp.dayOfYear(d);
        var h1 = 22 + ((237 * y + 151) % 180) / 60;
        if (h1 >= 24)
            h1 -= 24;
        var h2 = 6 + ((219 * y + 191) % 180) / 60;
        this.goToBed = h1;
        this.wakeUp = h2;
        this.weekendGoToBed = h1 + ((h1 > 23) ? -23 : 1);
        this.weekendWakeUp = h2 + 1;
	}

	getControlString(d) {
        var s = this.getState(d);
        var n = this.nextSwitch(d);
        return d.toUnixTime() + " " + this.house + " " + this.unit + " " + s + "\r\n" +
            n[0].toUnixTime() + " " + this.house + " " + this.unit + " " + n[1] + "\r\n";
    }
}
