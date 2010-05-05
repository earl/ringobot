// earl, 2010-03-28

addToClasspath(getResource('./jars/pircbot-1.5.0.jar').path);

require('core/date');
require('core/json');
import('fs');

function LogBot(logdir) {
    function isodate()      (new Date()).format('yyyy-MM-dd');
    function isodatetime()  (new Date()).format('yyyy-MM-dd HH:mm:ss');
    function logname()      fs.join(logdir, isodate() + '.log');

    function append(record) {
        record['datetime'] = isodatetime();
        fs.write(logname(), JSON.stringify(record), {append: true});
    }

    return new JavaAdapter(org.jibble.pircbot.PircBot, {
        onPrivateMessage: function(sender, login, hostname, message) {
            append({type: 'private', sender: sender, message: message});
        },
        onMessage: function(channel, sender, login, hostname, message) {
            append({type: 'message', sender: sender, message: message});
        },
        onAction: function(sender, login, hostname, target, action) {
            append({type: 'action', sender: sender, action: action});
        },
    });
}

function startBot(logdir, server, channel, name) {
    var bot = new LogBot(logdir);
    bot.setVerbose(false);
    bot.setName(name);
    bot.setLogin('bot');
    bot.setFinger('at your service!');
    bot.connect(server);
    bot.joinChannel(channel);
}

function main(args) {
    var [_, logdir, server, channel, name] = args;
    fs.makeTree(logdir);
    startBot(logdir, server, channel, name);
}

if (require.main == module) {
    require('system');
    main(system.args);
}
