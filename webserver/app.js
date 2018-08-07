"use strict";

const fs = require("fs");
const http = require("http");
const express = require("express");
const path = require("path");
const parseArgs = require("minimist");
const bodyParser = require('body-parser');
const moment = require('moment');

var argv = parseArgs(process.argv.slice(2));
var webport = 8080;
if (argv.webport) {
	webport = argv.webport;
}
var usbportname = "/dev/ttyACM0";
if (argv.usbportname) {
	usbportname = argv.usbportname;
}

var dataPath = path.join(__dirname, "..", "data");
var config = JSON.parse(fs.readFileSync(path.join(dataPath, "config.json")));

var app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "..", "build")));

app.get("/config", function(req, res) {
	res.json(config);
});

app.put("/config", function(req, res) {
	console.log("PUT /config");
	console.log(req.body);
	config = { ...config, ...req.body };
	fs.writeFileSync(path.join(dataPath, "config.json"), JSON.stringify(config, null, 2));
	res.json(config);
});

app.get("/*", function(req, res) {
	res.sendFile(path.join(__dirname, "..", "build", "index.html"));
});

var webServer = http.createServer(app);
webServer.listen(webport);
console.log("Running on port " + webport);
