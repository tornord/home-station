"use strict";

const fs = require("fs");
const http = require("http");
const express = require("express");
const path = require("path");
const parseArgs = require("minimist");
const bodyParser = require("body-parser");
const moment = require("moment");
const { Switch } = require("../commonjs/src/Switch");
const { ArduinoCommunicator } = require("../ArduinoCommunicator");
const cors = require("cors");

var argv = parseArgs(process.argv.slice(2));
var webport = 8080;
if (argv.webport) {
    webport = argv.webport;
}
var usbportname = "/dev/ttyACM0";
if (argv.usbportname) {
    usbportname = argv.usbportname;
}

var minute;
var switchStates;
var comm = new ArduinoCommunicator(usbportname);

var dataPath = path.join(__dirname, "..", "data");
var config = JSON.parse(fs.readFileSync(path.join(dataPath, "config.json")));
// config.latitude = 36;
// config.longitude = 139;

function minuteTick(now) {
    var m = Switch.dateToMinutes(now);
    if (!switchStates || switchStates.length != config.switches.length) {
        switchStates = config.switches.map((d) => null);
    }
    var log = "minuteTick " + moment(new Date(now)).format("HH:mm") + " " + m;
    config.switches.forEach((d, i) => {
        var s = new Switch(d.name, d.house, d.group, d.wakeUp, d.goToBed, d.weekendWakeUp, d.weekendGoToBed, config.latitude, config.longitude);
        var { sunrise, sunset } = s.getSun(now);
        if (sunset < sunrise) {
            sunset += 24 * 60;
        }
        if (i == 0) {
            log += " " + (m > sunrise && m < sunset ? "day" : "night");
        }
        var state = s.getState(now);
        log += ", " + i + ": " + switchStates[i] + " => " + state;
        if (switchStates[i] === null || switchStates[i] !== state) {
            switchStates[i] = state;
            log += " command " + d.house + " " + d.group + " " + state;
            comm.sendCommand(d.house, d.group, state);
        }
    });
    console.log(log);
}

function tick() {
    var t = new Date().getTime();
    var m = t - (t % (60 * 1000));
    if (!minute || m !== minute) {
        minute = m;
        minuteTick(new Date(m));
    }
}

setInterval(tick, 1000);

var app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "..", "build")));

app.get("/config", function(req, res) {
    res.json(config);
});

app.put("/config", function(req, res) {
    console.log("PUT /config");
    delete req.body.schema;
    delete req.body.uiSchema;
    delete req.body.idSchema;
    delete req.body.formData;
    delete req.body.edit;
    delete req.body.errors;
    delete req.body.errorSchema;
    delete req.body.status;
    console.log(req.body);
    config = { ...config, ...req.body };
    fs.writeFileSync(path.join(dataPath, "config.json"), JSON.stringify(config, null, 2));
    minute = null;
    switchStates = null;
    minuteTick(new Date());
    res.json(config);
});

app.get("/*", function(req, res) {
    res.sendFile(path.join(__dirname, "..", "build", "index.html"));
});

var webServer = http.createServer(app);
webServer.listen(webport);
console.log("Running on port " + webport);
