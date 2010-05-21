export('serverStarted',
       'serverStopped',
       'getBot');

addToClasspath(getResource('./jars/pircbot-1.5.0.jar').path);

require('core/date');
require('core/json');
var fs = require('fs');
var config = require('./config');

function LogBot(dir) {

    // --- private helpers --

    function isodate()      (new Date()).format('yyyy-MM-dd');
    function isodatetime()  (new Date()).format('yyyy-MM-dd HH:mm:ss');
    function logname()      fs.join(dir, isodate() + '.log');

    // --- implement PircBot ---

    var self = new JavaAdapter(org.jibble.pircbot.PircBot, {
        onPrivateMessage: function(sender, login, hostname, message) {
            this.append({type: 'private', sender: sender, message: message});
        },
        onMessage: function(channel, sender, login, hostname, message) {
            this.append({type: 'message', sender: sender, message: message});
        },
        onAction: function(sender, login, hostname, target, action) {
            this.append({type: 'action', sender: sender, action: action});
        },
    });

    // --- public helpers ---

    self.append = function (record) {
        record['datetime'] = isodatetime();
        fs.write(logname(), JSON.stringify(record) + '\n', {append: true});
    };

    return self;
}

var bot;

function getBot() bot;

function serverStarted(server) {
    var {logDir, botConfig} = config;
    var {server, channel, name} = botConfig;

    fs.makeTree(logDir);

    bot = new LogBot(logDir);
    bot.setVerbose(false);
    bot.setName(name);
    bot.setLogin('bot');
    bot.setFinger('at your service!');
    bot.connect(server);
    bot.joinChannel(channel);
}

function serverStopped(server) {
    bot.disconnect();
    bot = null;
}
