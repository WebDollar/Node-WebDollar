if(( typeof window !== 'undefined' && !window._babelPolyfill) ||
    ( typeof global !== 'undefined' && !global._babelPolyfill)) {
    require('babel-polyfill')
}

console.log(""); console.log(""); console.log("");
console.log("Node WebDollar");
console.log(""); console.log(""); console.log("");

//fixing string parameters...
if (process.env !== undefined && process.env !== null)
    for (let i=0; i<process.env.length; i++)
        if (typeof process.env[i]  === 'string')
            if (process.env[i].toLowerCase() === 'true') process.env[i] = true;
            else if (process.env[i].toLowerCase() === 'false') process.env[i] = false;


let Main = require('./main.js').default;

let exportObject = Main;

module.exports =  exportObject;

//browser minimized script
if ( typeof global.window !== 'undefined')
    global.window.WebDollar = exportObject;

if ( typeof window !== 'undefined')
    window.WebDollar = exportObject;


console.log("Node WebDollar End");

