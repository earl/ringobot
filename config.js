// --- app-specific config ---

exports.logDir = './logs/';

exports.botConfig = {
    server: 'irc.freenode.net',
    channel: '##test',
    name: 'abbot',
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
    './bot',
];
