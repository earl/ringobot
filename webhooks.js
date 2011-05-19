export('app');

var {botConfig, webhookConfig} = require('./config');
var bot = require('./bot').getBot();

function app(req) {
    var {repositories} = webhookConfig.github;
    try {
        var {repository, commits} = JSON.parse(req.params.payload);
        if (repository.url in repositories) {
            for each (var {id, author, message} in commits) {
                var msg = id.slice(0, 7) + ' ' +
                          author.name + ': ' +
                          message.split('\n')[0].trim();
                bot.sendMessage(repositories[repository.url], msg);
            }
        }
        return {status: 200, headers: {}, body: ['kthxbye']};
    } catch (e if e instanceof SyntaxError) {
        return {status: 400, headers: {}, body: ['gnah!']};
    }
}
