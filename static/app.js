$(document).ready(function() {

    var connected, subscription;

    function record(r) {
        return $.hiccup(
          "p.utterance",
            ["span.time", "[", r.datetime.substring(11, 16), "]"],
            r.type === "message" ?
              ["span.is_message",
                ["span.sender", " &lt;", r.sender, "&gt; "],
                ["span.message", r.message]] :
              ["span.is_action", " * ",
                ["span.sender", " ", r.sender, " "],
                ["span.action", r.action]]);
    }

    function receive(msg) {
        var atBottom = $(document).height() - $(window).scrollTop() == $(window).height();
        $('div#content').append(record(msg.data));
        // scroll to new element if we're at the bottom of the page
        if (atBottom) {
            $('html, body').animate({scrollTop: $(window).scrollTop() + 50});
        }
    }

    $.cometd.configure({
        url: location.protocol + "//" + location.host + "/cometd",
        logLevel: 'warn'
    });

    $.cometd.addListener('/meta/connect', function(msg) {
        if (!connected && msg.successful) {
            connected = true;
            $.cometd.batch(function() {
                subscription = $.cometd.subscribe('/irc', receive);
            });
        } else if (!msg.successful) {
            connected = false;
        }
    });

    $.cometd.handshake();
});
