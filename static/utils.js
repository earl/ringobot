if (typeof exports === "undefined" || !exports) {
    var utils = {};
}

(function(exports) {

    exports.formatMessage = function(text) {
        return linkify(escapeHtml(text));
    }

    function linkify(text) {
        if (!text) return "";
        return text.replace(
            /((https?\:\/\/)|(www\.))(\S+)(\w{2,4})(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/gi,
            function(url) {
                var fullUrl = url;
                if (!fullUrl.match('^https?:\/\/')) {
                    fullUrl = 'http://' + fullUrl;
                }
                return '<a href="' + fullUrl + '">' + url + '</a>';
            }
        );
    };

    function escapeHtml(str) {
        return str.replace(/&/g, '&amp;')
                  .replace(/"/g, '&quot;')
                  .replace(/>/g, '&gt;')
                  .replace(/</g, '&lt;');
    };

})(utils || exports);
