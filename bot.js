export('serverStarted',
       'serverStopped',
       'getBot');

addToClasspath(getResource('./jars/pircbot-1.5.0.jar').path);

require('core/date');
require('core/json');
var fs = require('fs');
var config = require('./config');

function LogBot(dir, server, channel, name) {

    // --- private helpers --

    function isodate()      (new Date()).format('yyyy-MM-dd');
    function isodatetime()  (new Date()).format('yyyy-MM-dd HH:mm:ss');
    function logname()      fs.join(dir, isodate() + '.log');

    // --- implement PircBot ---

    var self = new JavaAdapter(org.jibble.pircbot.PircBot, {
        onMessage: function(channel, sender, login, hostname, message) {
            this.append({type: 'message', sender: sender, message: message});
        },
        onAction: function(sender, login, hostname, target, action) {
            this.append({type: 'action', sender: sender, action: action});
        },

        // A custom zero-argument connect method, which automatically joins the
        // channel, after connecting to the server.
        connect: function () {
            log.info('Connecting');
            this.connect(server);
            this.joinChannel(channel);
        },
    });

    // --- public helpers ---

    self.append = function (record) {
        record['datetime'] = isodatetime();
        fs.write(logname(), JSON.stringify(record) + '\n', {append: true});
    };

    self.setVerbose(false);
    self.setName(name);
    self.setAutoNickChange(true);
    self.setLogin('bot');
    self.setVersion('RingoBot');
    self.setFinger('at your service!');

    return self;
}

var bot;

function getBot() bot;

function serverStarted(server) {
    var {logDir, botConfig} = config;
    var {server, channel, name} = botConfig;

    fs.makeTree(logDir);

    bot = new LogBot(logDir, server, channel, name);
    bot.connect();
}

function serverStopped(server) {
    bot.disconnect();
    bot = null;
}
