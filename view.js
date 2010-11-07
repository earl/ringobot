var {html4, html, css} = require("static/hiccup");

exports.page = function(day, records) {
    return html4(
      ["head",
        ["title", "RingoBot IRC Logs"],
        ["link", {rel: "stylesheet", type: "text/css", href: "/static/style.css"}],
        ["script", {type:"text/javascript", src: "/static/org/cometd.js"}],
        ["script", {type:"text/javascript", src: "/static/jquery/jquery-1.3.2.js"}],
        ["script", {type:"text/javascript", src: "/static/jquery/jquery.json-2.2.js"}],
        ["script", {type:"text/javascript", src: "/static/jquery/jquery.cometd.js"}],
        ["script", {type:"text/javascript", src: "/static/hiccup.js"}],
        ["script", {type:"text/javascript", src: "/static/app.js"}],
        ["style",  {type: "text/css"},
            css("p.utterance", {margin: 0},
                "span.is_action", {fontStyle: "italic"})]
      ],
      ["body",
        ["p", "Logs for the ",
          ["a", {href: "irc://irc.freenode.net/ringojs"}, "RingoJS IRC channel"],
          ", as logged by ",
          ["a", {href: "http://github.com/earl/ringobot"}, ["code", "ringostarr"]]],
        ["h1", day],
          ["div#content", records.map(record)]]);
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
