// modulr (c) 2010 codespeaks sàrl
// Freely distributable under the terms of the MIT license.
// For details, see:
//   http://github.com/codespeaks/modulr/blob/master/LICENSE

var modulr = (function(global) {
  var _dependencyGraph = {},
      _loadingFactories = {},
      _incompleteFactories = {},
      _factories = {},
      _modules = {},
      _exports = {},
      _handlers = [],
      _dirStack = [''],
      PREFIX = '__module__', // Prefix identifiers to avoid issues in IE.
      RELATIVE_IDENTIFIER_PATTERN = /^\.\.?\//,
      _forEach,
      _indexOf;
      
  _forEach = (function() {
    var hasOwnProp = Object.prototype.hasOwnProperty,
        DONT_ENUM_PROPERTIES = [
          'constructor', 'toString', 'toLocaleString', 'valueOf',
          'hasOwnProperty','isPrototypeOf', 'propertyIsEnumerable'
        ],
        LENGTH = DONT_ENUM_PROPERTIES.length,
        DONT_ENUM_BUG = true;
    
    function _forEach(obj, callback) {
      for(var prop in obj) {
        if (hasOwnProp.call(obj, prop)) {
          callback(prop, obj[prop]);
        }
      }
    }
    
    for(var prop in { toString: true }) {
      DONT_ENUM_BUG = false
    }
    
    if (DONT_ENUM_BUG) {
      return function(obj, callback) {
         _forEach(obj, callback);
         for (var i = 0; i < LENGTH; i++) {
           var prop = DONT_ENUM_PROPERTIES[i];
           if (hasOwnProp.call(obj, prop)) {
             callback(prop, obj[prop]);
           }
         }
       }
    }
    
    return _forEach;
  })();
  
  _indexOf = (function() {
    var nativeIndexOf = Array.prototype.indexOf;
    if (typeof nativeIndexOf === 'function') {
      return function(array, item) {
        return nativeIndexOf.call(array, item);
      }
    }
    
    return function(array, item) {
      for (var i = 0, length = array.length; i < length; i++) {
        if (item === array[i]) { return i; }
      }
      return -1;
    }
  })();
  
  function require(identifier) {
    var fn, mod,
        id = resolveIdentifier(identifier),
        key = PREFIX + id,
        expts = _exports[key];
    
    if (!expts) {
      _exports[key] = expts = {};
      _modules[key] = mod = { id: id };
      
      fn = _factories[key];
      _dirStack.push(id.substring(0, id.lastIndexOf('/') + 1))
      try {
        if (!fn) { throw 'Can\'t find module "' + identifier + '".'; }
        if (typeof fn === 'string') {
          fn = new Function('require', 'exports', 'module', fn);
        }
        fn(require, expts, mod);
        _dirStack.pop();
      } catch(e) {
        _dirStack.pop();
        // We'd use a finally statement here if it wasn't for IE.
        throw e;
      }
    }
    return expts;
  }
  
  function resolveIdentifier(identifier) {
    var dir, parts, part, path;
    
    if (!RELATIVE_IDENTIFIER_PATTERN.test(identifier)) {
      return identifier;
    }
    dir = _dirStack[_dirStack.length - 1];
    parts = (dir + identifier).split('/');
    path = [];
    for (var i = 0, length = parts.length; i < length; i++) {
      part = parts[i];
      switch (part) {
        case '':
        case '.':
          continue;
        case '..':
          path.pop();
          break;
        default:
          path.push(part);
      }
    }
    return path.join('/');
  }
  
  function define(descriptors, dependencies) {
    var missingDependencies;
    if (dependencies) {
      // Check to see if any of the required dependencies 
      // weren't previously loaded.
      // Build an array of missing dependencies with those which weren't.
      for (var i = 0, length = dependencies.length; i < length; i++) {
        var key = PREFIX + dependencies[i];
        if (!(key in _factories) && !(key in _incompleteFactories)) {
          missingDependencies = missingDependencies || [];
          missingDependencies.push(key);
        }
      }
    }
    
    if (missingDependencies) {
      // Add each newly defined descriptor to our list of
      // factories missing dependencies.
      // Build a dependency graph so we can handle subsequent 
      // require.define calls easily.
      _forEach(descriptors, function(id, factory) {
        var key = PREFIX + id;
        _dependencyGraph[key] = missingDependencies; // TODO clone?
        _incompleteFactories[key] = factory;
      });
      // load the missing modules.
      loadModules(missingDependencies);
    } else {
      // There aren't any missing dependencies in the factories
      // which were just defined. Lets move them to a list of
      // synchronously requirable factories.
      prepare(descriptors);
      // While we're at it, let's call all async handlers whose
      // dependencies are now available.
      callRipeHandlers();
    }
  }
  
  function prepare(descriptors) {
    // Handles factories for which all dependencies are
    // available.
    _forEach(descriptors, function(id, factory) {
      var key = PREFIX + id;
      // Move the factory from the list of factories missing
      // dependencies to the list of synchronously requirable
      // factories.
      _factories[key] = factory;
      delete _incompleteFactories[key];
      // Go through the dependency graph and remove the factory
      // from all of the missing dependencies lists.
      _forEach(_dependencyGraph, function(unused, dependencies) {
        var i = _indexOf(i, key);
        if (i > -1) { dependencies.splice(i, 1); }
      });
    });
    
    // Find all the factories which no longer have missing dependencies.
    var newFactories;
    _forEach(_dependencyGraph, function(key, dependencies) {
      if (dependencies.length === 0) {
        newFactories = newFactories || {};
        newFactories[key] = _incompleteFactories[key];
        delete _dependencyGraph[key];
      }
    });
    // recurse!
    if (newFactories) { prepare(newFactories); }
  }
  
  function ensure(dependencies, callback, errorCallback) {
    // Cache this new handler.
    _handlers.push({
      dependencies: dependencies,
      callback: callback,
      errorCallback: errorCallback
    });
    
    // Immediately callRipeHandlers(): you never know,
    // all of the required dependencies might be already
    // available.
    callRipeHandlers();
  }
  
  function callRipeHandlers() {
    var missingFactories;
    
    for (var i = 0, length = _handlers.length; i < length; i++) {
      // Go through all of the stored handlers.
      var handler = _handlers[i],
          dependencies = handler.dependencies,
          isRipe = true;
      for (var j = 0, reqLength = dependencies.length; j < reqLength; j++) {
        var id = dependencies[j];
        // If any dependency is missing, the handler isn't ready to be called.
        // Store those missing so we can later inform the loader.
        if (!_factories[PREFIX + id]) {
          missingFactories = missingFactories || [];
          if (_indexOf(missingFactories, id) < 0) {
            missingFactories.push(id);
          }
          isRipe = false;
        }
      }
      
      if (isRipe) {
        handler.callback(); // TODO error handling
      }
    }
    
    if (missingFactories) {
      loadModules(missingFactories);
    }
  }
  
  function loadModules(factories) {
    var missingFactories;
    for (var i = 0, length = factories.length; i < length; i++) {
      var factory = factories[i];
      if (!(factory in _loadingFactories)) {
        missingFactories = missingFactories || [];
        missingFactories.push(factory);
      }
    }
    if (missingFactories) {
      console.log(missingFactories);
    }
  }
  
  require.define = define;
  require.ensure = ensure;
  require.main = {};
  
  return {
    require: require
  };
})(this);

(function(require, module) { require.define({
'app': function(require, exports, module) {

$(document).ready(function() {

    var hiccup = require("./hiccup");
    var utils = require("./utils");

    var connected, subscription;

    function record(r) {
        return hiccup.html(
          "p.utterance",
            ["span.time", "[", r.datetime.substring(11, 16), "]"],
            r.type === "message" ?
              ["span.is_message",
                ["span.sender", " &lt;", r.sender, "&gt; "],
                ["span.message", utils.formatMessage(r.message)]] :
              ["span.is_action", " * ",
                ["span.sender", " ", r.sender, " "],
                ["span.action", utils.formatMessage(r.action)]]);
    }

    function receive(msg) {
        var atBottom = $(document).height() - $(window).scrollTop() == $(window).height();
        $('div#main').append(record(msg.data));
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

},
'hiccup': function(require, exports, module) {

// list of elements that need explicit close tag
var containerTags = {"a":1, "b":1, "body":1, "dd":1, "div":1, "dl":1, "dt":1,
    "em":1, "fieldset":1, "form":1, "h1":1, "h2":1, "h3":1, "h4":1, "h5":1, "h6":1,
    "head":1, "html":1, "i":1, "label":1, "li":1, "ol":1, "pre":1, "script":1,
    "span":1, "strong":1, "style":1, "textarea":1, "ul":1, "option":1};

var html4 = '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN"\n' +
            '   "http://www.w3.org/TR/html4/strict.dtd">\n',
    xhtmlStrict =
            '<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Strict//EN\"\n' +
            '   "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">\n',
    xhtmlTransitional =
            '<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Transitional//EN\"\n' +
            '   "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">\n',
    html5 = '<!DOCTYPE html>\n';

var html = function(list, buffer) {
    buildHtml(list, buffer);
    return buffer.join("");
};

exports.html = function() {
    return html(toArray(arguments), []);
};

exports.html4 = function() {
    return html(["html", toArray(arguments)], [html4]);
};

exports.xhtmlStrict = function() {
    return html(["html", toArray(arguments)], [xhtmlStrict]);
};

exports.xhtmlTransitional = function() {
    return html(["html", toArray(arguments)], [xhtmlTransitional]);
};

exports.html5 = function() {
    return html(["html", toArray(arguments)], [html5]);
};

exports.css = function() {
    var buffer = [];
    buildCss(arguments, buffer);
    return buffer.join("");
};

// if jQuery is available create $.hiccup() returning
// a jQuery selector with the rendered HTML
if (typeof jQuery === "function") {
    jQuery.hiccup = function() {
        return jQuery(html.call(null, toArray(arguments), []));
    };
}

function buildHtml(list, buffer) {
    var pos = 1;
    if (typeof list[0] === "string") {
        var tag = list[0];
        if (tag[0] === "<") {
            // first element is already a tag
            writeContent(list, 0, buffer);
            return;
        }
        tag = splitTag(tag);
        var attr = tag[1];
        tag = tag[0];
        if (isObject(list[1])) {
            mergeAttributes(attr, list[1]);
            pos = 2;
        }
        buffer.push("<", tag);
        for (var key in attr) {
            writeAttribute(key, attr[key], buffer);
        }
        if (pos === list.length) {
            if (tag in containerTags) {
                buffer.push("></", tag, ">");
            } else {
                buffer.push(" />");
            }
        } else {
            buffer.push(">");
            writeContent(list, pos, buffer);
            buffer.push("</", tag, ">");
        }
    } else {
        writeContent(list, 0, buffer);
    }
}

function buildCss(list, buffer) {
    var length = list.length;
    var selector;
    for (var i = 0; i < length; i++) {
        var item = list[i];
        if (typeof item === "string") {
            selector = selector ?
                    selector + ", " + item : item;
        } else if (item && typeof item === "object") {
            if (selector != null) {
                buffer.push(selector);
                writeStyle(item, buffer);
                selector = null;
            }
        }
    }
}

function writeContent(list, pos, buffer) {
    var length = list.length;
    while (pos < length) {
        var item = list[pos++];
        if (isArray(item)) {
            buildHtml(item, buffer);
        } else {
            buffer.push(String(item));
        }
    }
}

function writeAttribute(key, value, buffer) {
    if (typeof value === "boolean") {
        if (value) {
            buffer.push(" ", key, "=\"", key, "\"");
        }
    } else if (value != null) {
        buffer.push(" ", key, "=\"", escape(String(value)), "\"");
    }
}

function writeStyle(item, buffer) {
    buffer.push(" {");
    for (var key in item) {
        buffer.push(toDash(key), ":", item[key], ";");
    }
    buffer.push("}\n");
}

function isObject(item) {
    return item && typeof item === "object" && !isArray(item);
}

// use native ES5 Array.isArray if available
var isArray = Array.isArray || function(item) {
    return item && item.constructor === Array;
}

// convert arguments object to proper array
function toArray(args) {
    return Array.prototype.slice.call(args);
}

function escape(str) {
    return str.replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/>/g, '&gt;')
            .replace(/</g, '&lt;');
}

// convert camelCase to dash-notation
function toDash(str) {
    return str.replace(/([A-Z])/g, function($1){
        return "-" + $1.toLowerCase();
    });
}

function mergeAttributes(attr1, attr2) {
    for (var key in attr2) {
        if (!attr1.hasOwnProperty(key)) {
            attr1[key] = attr2[key];
        } else if (key === "class") {
            attr1[key] += " " + attr2[key];
        }
    }
}

function splitTag(tag) {
    var attr = {};
    var c = tag.split(".");
    var t = c[0].split("#");
    if (t[1]) attr.id = t[1];
    if (c.length > 1) attr["class"] = c.slice(1).join(" ");
    return [t[0], attr];
}

},
'utils': function(require, exports, module) {

exports.formatMessage = function(text) {
    return linkify(escapeHtml(text));
};

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
}

function escapeHtml(str) {
    return str.replace(/&/g, '&amp;')
              .replace(/"/g, '&quot;')
              .replace(/>/g, '&gt;')
              .replace(/</g, '&lt;');
}

},
});
require.ensure(["app","hiccup","utils"], function() {
require('app');
});
})(modulr.require, modulr.require.main);
