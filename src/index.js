if((typeof window !== 'undefined' && !window._babelPolyfill) ||
    (typeof global !== 'undefined' && !global._babelPolyfill)) {
    require('babel-polyfill')
}

console.log(""); console.log(""); console.log("");
console.log("Node WebDollar");
console.log(process.env);
console.log(""); console.log(""); console.log("");

//fixing string parameters...
if (process.env !== 'undefined' && process.env !== null)
    for (let i=0; i<process.env.length; i++)
        if (typeof process.env[i]  === 'string')
            if (process.env[i].toLowerCase() === 'true') process.env[i] = true;
            else if (process.env[i].toLowerCase() === 'false') process.env[i] = false;


let Node = require('node/Node.js');

exports.helloWord = function() {
    console.log("This is a message from the demo package");
};

let exportObject = {
    NodeServer : Node.NodeServer,
    NodeClientsService : Node.NodeClientsService,
    NodeWebPeersService : Node.NodeWebPeersService,
    NodesStats : Node.NodesStats,
    NodesList : Node.NodesList,
    NetworkMap : Node.NetworkMap,

    TestingMocha: Node.TestingMocha,
};

module.exports =  exportObject;

//browser minimized script
if (typeof global.window !== 'undefined')
    global.window.NodeWebDollar = exportObject;

if (typeof window !== 'undefined')
    window.NodeWebDollar = exportObject;


console.log("Node WebDollar End");

