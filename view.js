var {html4, html, css} = require("static/hiccup");

var scripts = [
    "/static/org/cometd.js",
    "/static/jquery/jquery-1.3.2.js",
    "/static/jquery/jquery.json-2.2.js",
    "/static/jquery/jquery.cometd.js",
    "/static/hiccup.js",
    "/static/app.js"
].map(function(script) {
    return ["script", {type:"text/javascript", src: script}];
});

exports.page = function(day, records, days) {
    return html4(
      ["head",
        ["title", "RingoBot IRC Logs"],
        ["link", {rel: "stylesheet", type: "text/css", href: "/static/style.css"}],
        scripts,
        ["style",  {type: "text/css"},
            css("p.utterance", {margin: 0},
                "span.is_action", {fontStyle: "italic"})]
      ],
      ["body",
        ["div#content",
          ["p", "Logs for the ",
            ["a", {href: "irc://irc.freenode.net/ringojs"}, "RingoJS IRC channel"],
            ", as logged by ",
            ["a", {href: "http://github.com/earl/ringobot"}, ["code", "ringostarr"]]],
          ["h1", day],
          records.map(record)],
        ["div#menu", menu(days)]]);
};

var record = exports.record = function(r) {
    return html(
      "p.utterance",
        ["span.time", "[", r.datetime.substring(11, 16), "]"],
        r.is_message ?
          ["span.is_message",
            ["span.sender", " &lt;", r.sender, "&gt; "],
            ["span.message", r.message]] :
          ["span.is_action", " * ",
            ["span.sender", " ", r.sender, " "],
            ["span.action", r.action]]);
};

var menu = exports.menu = function(days) {
    return html(
      "div.navigation",
        ["h3", "Log Archive"],
        ["ul", days.map(function(day) {
            return ["li", ["a", {href: day}, day]];
        })]
    );
}
