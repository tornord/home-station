const { Switch } = require("../commonjs/src/Switch");
const moment = require("moment");

const timeFormat = "HH:mm";

function switchStateToString(sw, tstr) {
    var t = new Date(tstr);
    var stateToString = (s) => (s ? "on" : "off");
    let state = sw.getState(t);
    let nextEvent = sw.nextEvent(t);
    let nextNextEvent = sw.nextEvent(nextEvent.timestamp);
    return (
        moment(t).format(timeFormat) +
        " " +
        stateToString(state) +
        " => " +
        moment(nextEvent.timestamp).format(timeFormat) +
        " " +
        stateToString(nextEvent.state) +
        " => " +
        moment(nextNextEvent.timestamp).format(timeFormat) +
        " " +
        stateToString(nextNextEvent.state)
    );
}

test("State calc", () => {
    var sw1 = new Switch("test", "12345678", 0, "07:00", "23:00", "08:00", "01:15", 59.33, 17.97);
    expect(JSON.stringify(sw1.getSun(new Date("2018-08-10T15:00+0200")))).toBe('{"sunrise":299,"sunset":1250}');
    expect(switchStateToString(sw1, "2018-08-10T15:00+0200")).toBe("15:00 off => 20:50 on => 01:15 off");
    expect(switchStateToString(sw1, "2018-08-10T20:50+0200")).toBe("20:50 on => 01:15 off => 20:47 on");
    expect(switchStateToString(sw1, "2018-08-10T00:30+0200")).toBe("00:30 off => 20:50 on => 01:15 off");
    expect(switchStateToString(sw1, "2018-08-12T14:30+0200")).toBe("14:30 off => 20:44 on => 23:00 off");
    var sw2 = new Switch("test", "12345678", 0, "04:00", "23:00", "08:00", "01:00", 59.33, 17.97);
    expect(switchStateToString(sw2, "2018-08-10T00:00+0200")).toBe("00:00 off => 04:00 on => 05:00 off");
    expect(switchStateToString(sw2, "2018-08-10T04:30+0200")).toBe("04:30 on => 05:00 off => 20:50 on");
    var sw3 = new Switch("test", "12345678", 0, "07:00", "23:00", "08:00", "00:45", 59.33, 17.97);
    expect(switchStateToString(sw3, "2018-12-20T12:00+0100")).toBe("12:00 off => 14:42 on => 23:00 off");
    expect(switchStateToString(sw3, "2018-12-21T01:00+0100")).toBe("01:00 off => 07:00 on => 08:52 off");
    expect(switchStateToString(sw3, "2018-12-21T13:00+0100")).toBe("13:00 off => 14:43 on => 00:45 off");
    var sw4 = new Switch("test", "12345678", 0, "07:00", "23:00", "08:00", "01:30", 57.945, 11.54);
    expect(switchStateToString(sw4, "2018-08-10T15:00+0200")).toBe("15:00 off => 21:09 on => 01:30 off");
});
