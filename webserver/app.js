"use strict";

var fs = require("fs");
var http = require("http");
var express = require("express");
var path = require("path");
var parseArgs = require("minimist");

var argv = parseArgs(process.argv.slice(2));
var port = 80;
if (argv.port) {
	port = argv.port;
}

var app = express();
app.use(express.static(path.join(__dirname, "..", "build")));

app.get("/*", function(req, res) {
	// res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
	// res.header("Expires", "-1");
	// res.header("Pragma", "no-cache");
	res.sendFile(path.join(__dirname, "..", "build", "index.html"));
});

var webServer = http.createServer(app);
webServer.listen(port);
console.log("Running on port " + port);
