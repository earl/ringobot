// --- app-specific config ---

exports.logDir = './db/bot/';

exports.botConfig = {
    server: 'irc.freenode.net',
    channel: '##hensotest',
    name: 'abbot',
};

exports.webhookConfig = {
    github: {repositories: {'http://github.com/user/repo': '##test'}},
};

// --- general webapp config ---

exports.httpConfig = {
    staticDir: 'static'
};

exports.urls = [
    ['/webhook/', './webhooks'],
    ['/(\\d\\d\\d\\d-\\d\\d-\\d\\d)', './actions', 'showDay'],
    ['/', './actions'],
];

exports.middleware = [
    'ringo/middleware/etag',
    'ringo/middleware/responselog',
    'ringo/middleware/error',
    'ringo/middleware/notfound',
];

exports.app = require('ringo/webapp').handleRequest;

exports.macros = [
    'ringo/skin/macros',
    'ringo/skin/filters',
];

exports.charset = 'UTF-8';
exports.contentType = 'text/html';

exports.extensions = [
    'ringo/cometd',
    './bot',
];

