if(( typeof window !== 'undefined' && !window._babelPolyfill) ||
    ( typeof global !== 'undefined' && !global._babelPolyfill)) {
    require('babel-polyfill')
}

if ( !process.env.BROWSER ) {
    require('console-warn');
    require('console-info');
    require('console-error');
}

console.log(""); console.log(""); console.log("");
console.warn("Node WebDollar");
console.log(""); console.log(""); console.log("");

let Main = require('./main.js').default;

let exportObject = Main;



// Export WebDollar
module.exports =  exportObject;

/*
    Export the WebDollar to Browser
 */

//browser minimized script
if ( typeof global.window !== 'undefined')
    global.window.WebDollar = exportObject;

if ( typeof window !== 'undefined')
    window.WebDollar = exportObject;

if ( process && !process.env.BROWSER && process.env.COLLECT_STATS ){
    var Raven = require('raven');

    Raven.config('https://8297738fd29f41af94f624cbc4d353bc@sentry.io/1283203').install();

    // Override console.error
    var console_error = console.error;

    console.error = function() {
      console_error.apply(null, arguments);

      if (arguments.length > 1) {
        var e = arguments[1];

        if (e.stack && e.message) {
          Raven.captureException(e);
        } else {
          Raven.captureMessage(arguments);
        }
      } else {
        Raven.captureMessage(arguments);
      }
    };
}

console.log("Node WebDollar End");

