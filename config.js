// --- app-specific config ---

exports.logDir = 'db/bot/';

exports.botConfig = {
    server: 'irc.freenode.net',
    channel: '##ringobot',
    name: 'ringostarr'
};

exports.webhookConfig = {
    github: {repositories: {'https://github.com/ringo/ringojs': '#ringojs'}},
};

exports.start = function(server) {
    require("ringo-cometd").start(server);
    require("./bot").start(server);
}

exports.stop = function(server) {
    require("./bot").stop(server);
    require("ringo-cometd").stop(server);
}

// --- general webapp config ---

var {Application} = require("stick");
var app = exports.app = Application();
app.configure("static", "mount", "notfound");
app.static(module.resolve("public"));
app.mount("/webhook", module.resolve("webhooks"));
app.mount("", module.resolve("actions"));


