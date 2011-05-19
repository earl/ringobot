export('start',
       'stop',
       'getBot');

addToClasspath(getResource('./jars/pircbot-1.5.0.jar').path);

var config = require('./config');
var fs = require('fs');
var scheduler = require('ringo/scheduler');
var config = require('./config');
var cometd = require('ringo-cometd');
var dates = require('ringo/utils/dates');

var log = require('ringo/logging').getLogger(module.id);

function LogBot(dir, server, channel, name) {
    var RECONNECT_DELAY = 10000; // 10 seconds

    // --- private helpers --

    function isodate()      dates.format(new Date(), 'yyyy-MM-dd');
    function isodatetime()  dates.format(new Date(), 'yyyy-MM-dd HH:mm:ss');
    function logname()      fs.join(dir, isodate() + '.log');

    // --- implement PircBot ---

    var self = new JavaAdapter(org.jibble.pircbot.PircBot, {
        onMessage: function(channel, sender, login, hostname, message) {
            this.append({type: 'message', sender: sender, message: message});
        },
        onAction: function(sender, login, hostname, target, action) {
            this.append({type: 'action', sender: sender, action: action});
        },

        onConnect: function () {
            log.info('Connected');
        },
        onDisconnect: function () {
            log.info('Disconnected');
            this.reconnectLater();
        },

        // A custom zero-argument connect method, which automatically joins the
        // channel, after connecting to the server.
        connect: function () {
            log.info('Connecting');
            try {
                this.connect(server);
                this.joinChannel(channel);
            } catch (e if e instanceof java.io.IOException) {
                log.error(e);
                this.reconnectLater();
            }
        },
    });

    // --- public helpers ---

    self.append = function (record) {
        record['datetime'] = isodatetime();
        fs.write(logname(), JSON.stringify(record) + '\n', {append: true});
        cometd.publish('/irc', null, record);
    };

    self.reconnectLater = function () {
        log.info('Scheduling reconnect');
        scheduler.setTimeout(function () {self.connect()}, RECONNECT_DELAY);
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

function start(server) {
    var {logDir, botConfig} = config;
    var {server, channel, name} = botConfig;

    fs.makeTree(logDir);

    cometd.createChannel("/irc");
    cometd.getBayeux().setSecurityPolicy(new org.cometd.SecurityPolicy({
        canCreate: function() {
            return false;
        },
        canHandshake: function() {
            return true;
        },
        canPublish: function() {
            return false;
        },
        canSubscribe: function(client, channel) {
            return channel == "/irc";
        }
    }));


    bot = new LogBot(logDir, server, channel, name);
    bot.connect();
}

function stop(server) {
    bot.disconnect();
    bot = null;
}

