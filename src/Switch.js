import * as SunCalc from "suncalc";

export class Event {
    constructor(timestamp, state) {
        this.timestamp = timestamp;
        this.state = state;
    }
}

export class Switch {
    constructor(name, house, group, wakeUp, goToBed, weekendWakeUp, weekendGoToBed, latitude, longitude) {
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

    static msPerMinute = 60 * 1000;
    static msPerHour = 60 * Switch.msPerMinute;
    static msPerDay = 24 * Switch.msPerHour;

    // static totalHours(d) {
    // 	var r = d.getHours() + d.getMinutes() / 60;
    // 	return (r < 0) ? r+24 : ((r > 24) ? r-24 : r);
    // }

    // static hourToString(d) {
    //     var f = function (r) { var s = r.toFixed(0); return ((s.length === 1) ? "0" : "") + s; };
    //     var h = Math.floor(d);
    //     return f(h) + ":" + f(60 * (d - h));
    // }

    static parseMinutes(s) {
        return 60 * Number(s.substring(0, 2)) + Number(s.substring(3, 5));
    }

    static dateToMinutes(d) {
        var t1 = d.getTime();
        t1 = t1 - (t1 % (60 * 1000));
        var t0 = new Date(d.getTime()).setHours(0, 0, 0, 0);
        return (t1 - t0) / Switch.msPerMinute;
    }

    toMinutes() {
        return ["wakeUp", "goToBed", "weekendWakeUp", "weekendGoToBed"].reduce((p, c) => {
            p[c] = Switch.parseMinutes(this[c]);
            return p;
        }, {});
    }

    toString() {
        return this.name + ": " + this.wakeUp + "-" + this.goToBed + " (" + this.weekendWakeUp + "-" + this.weekendGoToBed + ")";
    }

    getSun(d) {
        var midday = new Date(d.getTime()).setHours(12, 0, 0, 0);
        var sun = SunCalc.getTimes(new Date(midday), this.latitude, this.longitude);
        return { sunrise: Switch.dateToMinutes(sun.sunriseEnd), sunset: Switch.dateToMinutes(sun.sunsetStart) };
    }

    getState(now) {
        return Switch.getStateInternal(now.getDay(), Switch.dateToMinutes(now), this.getSun(now), this.toMinutes(now));
    }

    static getStateInternal(w, m, sun, minutes) {
        var { wakeUp, goToBed } = minutes;
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

    nextEvent(d) {
        const minPerDay = 24 * 60;
        var mins = this.toMinutes();
        var sun = this.getSun(d);
        var w = d.getDay();
        var m = Switch.dateToMinutes(d);
        var s0 = Switch.getStateInternal(w, m, sun, mins);
        for (let i = 1; i <= minPerDay; i++) {
            if (++m >= minPerDay) {
                m -= minPerDay;
                w = (w + 1) % 7;
            }
            var s = Switch.getStateInternal(w, m, sun, mins);
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
}
