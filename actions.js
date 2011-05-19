var config = require('./config');
var fs = require('fs');
var dates = require('ringo/utils/dates');
var {response} = require('ringo/jsgi/response');
var view = require('./view');
var utils = require('./shared/utils');
var {Application} = require('stick');

var app = exports.app = Application();
app.configure('route', 'render');
app.render.base = module.resolve('templates');
app.render.master = 'base.html';
app.render.helpers = {
    baseUrl: function() app.base
}

function showDay(req, day) {
    var context = {
        title: "IRC Log",
        day: day,
        records: function() {
            return readDay(day).map(view.record);
        },
        days: function() {
            return view.menu(listDays());
        },
        head: function() {
            return app.renderPart("head.html", context);
        },
        menu: function() {
            return app.renderPart("menu.html", context);
        }
    };
    return app.render('day.html', context);
}

app.get('/:day', showDay);

app.get('/', function(req) {
    return showDay(req, today());
});

// -- helpers --

function today()        dates.format(new Date(), 'yyyy-MM-dd');
function fileToDay(log) log.slice(0, 10);
function dayToPath(day) fs.join(config.logDir, day + '.log');
function listDays()     fs.list(config.logDir).map(fileToDay).sort().reverse();

function readDay(day) {
    try {
        return fs.read(dayToPath(day)).trim().split('\n').map(
                function (line) {
                    var rec = JSON.parse(line);
                    rec[rec.type] = utils.formatMessage(rec[rec.type]);
                    var fld = "is_" + rec.type;
                    rec[fld] = true;
                    return rec;
                });
    } catch (e if e.javaException instanceof java.io.FileNotFoundException) {
        return [];
    }
}
