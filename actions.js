export('index',
       'showDay');

var config = require('./config');
var fs = require('fs');
var dates = require('ringo/utils/dates');
var {Response} = require('ringo/webapp/response');
var view = require('./view');
var utils = require('./shared/utils');

function index(req) {
    return showDay(req, today());
}

function showDay(req, day) {
    // day is expected to be sanitized by url routing pattern in config
    return Response.skin(module.resolve('./skins/day.html'), {
        title: "IRC Log",
        day: day,
        records: function() {
            return readDay(day).map(view.record);
        },
        days: function() {
            return view.menu(listDays());
        }
    });
    // return Response(view.page(day, readDay(day), listDays()));
}

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
