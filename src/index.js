if((typeof window !== 'undefined' && !window._babelPolyfill) ||
    (typeof global !== 'undefined' && !global._babelPolyfill)) {
    require('babel-polyfill')
}

console.log(""); console.log(""); console.log("");
console.log("Node WebDollar");
console.log(""); console.log(""); console.log("");

let Node = require('./node/Node.js');

exports.NodeServer = Node.NodeServer;
exports.NodeClientsService = Node.NodeClientsService;

exports.helloWord = function() {
    console.log("This is a message from the demo package");
};


// var mymodule = (function() { console.log("This is a message from the demo package"); })();
//
// if (module && module.exports) {
//     module.exports = mymodule;
// } else {
//     window.mymodule = mymodule;
// }

console.log("Node WebDollar End");